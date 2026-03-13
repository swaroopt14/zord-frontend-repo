package services

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"strings"

	"zord-prompt-layer/client"
	"zord-prompt-layer/dto"
)

type TextToSQLService struct {
	gemini   *client.GeminiClient
	edgeDB   *sql.DB
	intentDB *sql.DB
	relayDB  *sql.DB
}

func NewTextToSQLService(g *client.GeminiClient, edge, intent, relay *sql.DB) *TextToSQLService {
	return &TextToSQLService{
		gemini:   g,
		edgeDB:   edge,
		intentDB: intent,
		relayDB:  relay,
	}
}

// SQLGenerationResult models the structured JSON from the first LLM call
type SQLGenerationResult struct {
	Database string `json:"database"` // "edge", "intent", or "relay"
	Query    string `json:"query"`
	Reason   string `json:"reason"`
}

func (s *TextToSQLService) GenerateAndExecuteSQL(req dto.QueryRequest) ([]dto.Citation, error) {
	if req.TenantID == "" {
		return nil, fmt.Errorf("tenant_id is strictly required for dynamic SQL execution")
	}

	// 1. Prompt Gemini to generate SQL
	sqlResult, err := s.generateSQL(req.Query, req.TenantID, req.TopK)
	if err != nil {
		return nil, fmt.Errorf("failed to generate SQL: %w", err)
	}

	log.Printf("[TextToSQL] Generated Query for %s DB: %s (Reason: %s)", sqlResult.Database, sqlResult.Query, sqlResult.Reason)

	// 2. Execute SQL against the LLM-chosen DB
	rows, err := s.executeSQL(sqlResult.Database, sqlResult.Query)
	if err != nil {
		return nil, fmt.Errorf("failed to execute generated SQL: %w", err)
	}

	// 3. If the primary DB returned nothing, fall back across all DBs in order:
	//    edge (ingress_envelopes) → intent (payment_intents/dlq_items) → relay (payout_contracts)
	if len(rows) == 0 {
		fallbackOrder := []string{"edge", "intent", "relay"}
		for _, dbName := range fallbackOrder {
			if dbName == sqlResult.Database {
				continue // already tried this one
			}
			fallbackSQL, err := s.generateSQL(
				fmt.Sprintf("%s\n\n[FALLBACK: primary search in '%s' returned no results, search '%s' instead]",
					req.Query, sqlResult.Database, dbName),
				req.TenantID, req.TopK)
			if err != nil {
				log.Printf("[TextToSQL] Fallback SQL generation for %s failed: %v", dbName, err)
				continue
			}
			// Only use this fallback result if the LLM actually targeted the right DB
			if fallbackSQL.Database != dbName {
				fallbackSQL.Database = dbName
			}
			log.Printf("[TextToSQL] Fallback Query for %s DB: %s (Reason: %s)", fallbackSQL.Database, fallbackSQL.Query, fallbackSQL.Reason)
			fallbackRows, err := s.executeSQL(fallbackSQL.Database, fallbackSQL.Query)
			if err != nil {
				log.Printf("[TextToSQL] Fallback execution on %s failed: %v", dbName, err)
				continue
			}
			if len(fallbackRows) > 0 {
				rows = fallbackRows
				log.Printf("[TextToSQL] Found %d row(s) via fallback on %s DB", len(rows), dbName)
				break
			}
		}
	}

	// 4. Format as Citations for the next layer
	citations := make([]dto.Citation, 0, len(rows))
	for i, row := range rows {
		rowBytes, _ := json.Marshal(row)
		citations = append(citations, dto.Citation{
			SourceType: fmt.Sprintf("%s_db_dynamic", sqlResult.Database),
			RecordID:   fmt.Sprintf("row_%d", i),
			ChunkID:    fmt.Sprintf("sql_result_%d", i),
			Snippet:    string(rowBytes),
			Score:      1.0,
		})
	}

	return citations, nil
}

func (s *TextToSQLService) generateSQL(userQuery, tenantID string, limit int) (*SQLGenerationResult, error) {
	if limit <= 0 {
		limit = 20
	} else if limit > 50 {
		limit = 50 // hard cap
	}

	schemaDef := `
You are an expert PostgreSQL assistant. Generate a strict JSON object with three keys:
1. "database": Must be exactly one of: "edge", "intent", or "relay".
2. "query": The PostgreSQL query.
3. "reason": A short reason for your choice.

RULES:
- You MUST include "WHERE tenant_id = '%s'" in EVERY query to restrict data access.
- You MUST append "LIMIT %d" to the end of your query.
- NEVER SELECT * or return raw payload/PII columns.
- DO NOT wrap the JSON in Markdown code blocks. Just output raw JSON.
- RECENT & TROUBLESHOOTING: If the user asks about "recent" items, "what happened", or "failed/error" requests, PRIORITIZE "ingress_envelopes" (edge db) or "dlq_items" (intent db).
- PAYOUTS: Payouts start as "ingress_envelopes". They only reach "payout_contracts" (relay db) if successful. If you can't find a payout in relay, check edge/intent dbs.
- Do NOT assume a record is successful. Start your search at the EARLIEST stage (edge.ingress_envelopes) if the user is asking "where is my request".

DATABASE SCHEMAS:

1. EDGE DATABASE ("edge")
Table: ingress_envelopes (CRITICAL: Every request enters here FIRST. Check this for ALL "recent" or "status" queries to confirm receipt and see initial status.)
Columns: trace_id (UUID), envelope_id (UUID), tenant_id (UUID), source (TEXT), source_system (TEXT), content_type (TEXT), idempotency_key (TEXT), payload_size (INT), vault_object_ref (TEXT), received_at (TIMESTAMPTZ), status (TEXT)

2. INTENT DATABASE ("intent")
Table: payment_intents (Only successfully validated intents. Do not use for troubleshooting recent/failed requests.)
Columns: intent_id (UUID), trace_id (UUID), envelope_id (UUID), tenant_id (UUID), salient_hash (TEXT), intent_type (TEXT), canonical_version (TEXT), amount (NUMERIC), currency (CHAR(3)), deadline_at (TIMESTAMPTZ), status (TEXT), confidence_score (NUMERIC), created_at (TIMESTAMPTZ)
Table: outbox
Columns: event_id (UUID), tenant_id (UUID), aggregate_type (TEXT), aggregate_id (UUID), event_type (TEXT), amount (NUMERIC), currency (CHAR(3)), status (TEXT), retry_count (INT), created_at (TIMESTAMPTZ), sent_at (TIMESTAMPTZ), trace_id (UUID), envelope_id (UUID)
Table: dlq_items (Failed transactions. Use this if the user mentions "error", "fail", "rejected" or if you suspect a validation issue. Use "created_at" for timing.)
Columns: dlq_id (UUID), tenant_id (UUID), envelope_id (UUID), stage (TEXT), reason_code (TEXT), error_detail (TEXT), replayable (BOOLEAN), created_at (TIMESTAMPTZ)

3. RELAY DATABASE ("relay")
Table: outbox
Columns: id (UUID), topic (TEXT), status (TEXT), attempts (INT), created_at (TIMESTAMPTZ), updated_at (TIMESTAMPTZ)
Table: payout_contracts (Final stage for payouts. ONLY successful payouts appear here.)
Columns: contract_id (UUID), tenant_id (UUID), intent_id (UUID), envelope_id (UUID), status (TEXT), created_at (TIMESTAMPTZ), trace_id (UUID)

USER QUESTION: %s
`

	prompt := fmt.Sprintf(schemaDef, tenantID, limit, userQuery)
	response, err := s.gemini.Generate(prompt)
	if err != nil {
		return nil, err
	}

	// Clean up potential markdown chunks from gemini
	cleanJSON := strings.TrimSpace(response)
	if strings.HasPrefix(cleanJSON, "```json") {
		cleanJSON = strings.TrimPrefix(cleanJSON, "```json")
		cleanJSON = strings.TrimSuffix(cleanJSON, "```")
	} else if strings.HasPrefix(cleanJSON, "```") {
		cleanJSON = strings.TrimPrefix(cleanJSON, "```")
		cleanJSON = strings.TrimSuffix(cleanJSON, "```")
	}

	var parsed SQLGenerationResult
	if err := json.Unmarshal([]byte(cleanJSON), &parsed); err != nil {
		return nil, fmt.Errorf("failed to parse LLM JSON: %w\nResponse was: %s", err, response)
	}

	return &parsed, nil
}

func (s *TextToSQLService) executeSQL(dbName, query string) ([]map[string]interface{}, error) {
	var db *sql.DB
	switch dbName {
	case "edge":
		db = s.edgeDB
	case "intent":
		db = s.intentDB
	case "relay":
		db = s.relayDB
	default:
		return nil, fmt.Errorf("unknown database target: %s", dbName)
	}

	if db == nil {
		return nil, fmt.Errorf("database connection for %s is not initialized", dbName)
	}

	rows, err := db.QueryContext(context.Background(), query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	cols, err := rows.Columns()
	if err != nil {
		return nil, err
	}

	var result []map[string]interface{}

	for rows.Next() {
		columns := make([]interface{}, len(cols))
		columnPointers := make([]interface{}, len(cols))
		for i := range columns {
			columnPointers[i] = &columns[i]
		}

		if err := rows.Scan(columnPointers...); err != nil {
			return nil, err
		}

		rowMap := make(map[string]interface{})
		for i, colName := range cols {
			val := columnPointers[i].(*interface{})
			if *val != nil {
				// Convert byte arrays to strings for easier JSON serialization
				if b, ok := (*val).([]byte); ok {
					rowMap[colName] = string(b)
				} else {
					rowMap[colName] = *val
				}
			} else {
				rowMap[colName] = nil
			}
		}
		result = append(result, rowMap)
	}

	return result, nil
}
