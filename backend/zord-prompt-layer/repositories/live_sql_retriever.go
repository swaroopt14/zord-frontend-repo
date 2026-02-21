package repositories

import (
	"context"
	"database/sql"
	"fmt"
	"regexp"
	"strings"
	"time"

	"zord-prompt-layer/dto"
	"zord-prompt-layer/model"
)

var uuidRegex = regexp.MustCompile(`(?i)^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$`)

type LiveSQLRetriever struct {
	edgeDB   *sql.DB
	intentDB *sql.DB
	relayDB  *sql.DB
	timeout  time.Duration
}

func NewLiveSQLRetriever(edgeDB, intentDB, relayDB *sql.DB) *LiveSQLRetriever {
	return &LiveSQLRetriever{
		edgeDB:   edgeDB,
		intentDB: intentDB,
		relayDB:  relayDB,
		timeout:  4 * time.Second,
	}
}
func isFailureQuery(q string) bool {
	s := strings.ToLower(q)
	return strings.Contains(s, "fail") ||
		strings.Contains(s, "failed") ||
		strings.Contains(s, "failure") ||
		strings.Contains(s, "error") ||
		strings.Contains(s, "dlq")
}

func (r *LiveSQLRetriever) Retrieve(req dto.QueryRequest, intentID, traceID string, topK int) ([]model.RetrievedChunk, error) {
	tenantID := ""
	if strings.TrimSpace(req.TenantID) != "" {
		resolved, err := r.resolveTenantID(req.TenantID)
		if err != nil {
			return nil, err
		}
		tenantID = resolved
		// If tenant was provided but not found, return empty evidence.
		if tenantID == "" || !uuidRegex.MatchString(tenantID) {
			return []model.RetrievedChunk{}, nil
		}
	}

	failureOnly := isFailureQuery(req.Query)
	chunks := make([]model.RetrievedChunk, 0, topK*4)

	if r.edgeDB != nil {
		c, err := r.fetchFromEdge(tenantID, traceID, topK)
		if err != nil {
			return nil, err
		}
		chunks = append(chunks, c...)
	}
	if r.intentDB != nil {
		c, err := r.fetchFromIntent(tenantID, intentID, traceID, topK, failureOnly)
		if err != nil {
			return nil, err
		}
		chunks = append(chunks, c...)

		d, err := r.fetchFromIntentDLQ(tenantID, topK)
		if err != nil {
			return nil, err
		}
		chunks = append(chunks, d...)
	}
	if r.relayDB != nil {
		c, err := r.fetchFromRelay(tenantID, intentID, traceID, topK, failureOnly)
		if err != nil {
			return nil, err
		}
		chunks = append(chunks, c...)
	}

	if len(chunks) > topK {
		chunks = chunks[:topK]
	}
	return chunks, nil
}

func (r *LiveSQLRetriever) resolveTenantID(input string) (string, error) {
	if uuidRegex.MatchString(input) {
		return strings.ToLower(input), nil
	}
	if r.edgeDB == nil {
		return "", nil
	}
	ctx, cancel := context.WithTimeout(context.Background(), r.timeout)
	defer cancel()

	var tenantID string
	err := r.edgeDB.QueryRowContext(ctx, `
		SELECT tenant_id::text
		FROM tenants
		WHERE tenant_name = $1
		LIMIT 1
	`, input).Scan(&tenantID)
	if err == sql.ErrNoRows {
		return "", nil
	}
	if err != nil {
		return "", fmt.Errorf("tenant resolution failed: %w", err)
	}
	return strings.ToLower(tenantID), nil
}

func (r *LiveSQLRetriever) fetchFromEdge(tenantID, traceID string, topK int) ([]model.RetrievedChunk, error) {
	ctx, cancel := context.WithTimeout(context.Background(), r.timeout)
	defer cancel()

	args := []any{}
	q := `
		SELECT envelope_id::text, trace_id::text, source, source_system,
		       idempotency_key, parse_status, amount_value::text, amount_currency, received_at::text
		FROM ingress_envelopes
		WHERE 1=1
	`
	if tenantID != "" {
		q += fmt.Sprintf(" AND tenant_id::text = $%d", len(args)+1)
		args = append(args, tenantID)
	}
	if traceID != "" && uuidRegex.MatchString(traceID) {
		q += fmt.Sprintf(" AND trace_id::text = $%d", len(args)+1)
		args = append(args, strings.ToLower(traceID))
	}
	q += fmt.Sprintf(" ORDER BY received_at DESC LIMIT %d", topK)

	rows, err := r.edgeDB.QueryContext(ctx, q, args...)
	if err != nil {
		return nil, fmt.Errorf("edge retrieval failed: %w", err)
	}
	defer rows.Close()

	out := make([]model.RetrievedChunk, 0, topK)
	for rows.Next() {
		var envelopeID, tr, source, sourceSystem, idemKey, parseStatus, amountValue, amountCurrency, receivedAt string
		if err := rows.Scan(&envelopeID, &tr, &source, &sourceSystem, &idemKey, &parseStatus, &amountValue, &amountCurrency, &receivedAt); err != nil {
			return nil, err
		}
		out = append(out, model.RetrievedChunk{
			ChunkID:    "edge_" + envelopeID,
			SourceType: "edge_ingress_envelope",
			RecordID:   envelopeID,
			TraceID:    tr,
			TenantID:   tenantID,
			Score:      0.99,
			Text: fmt.Sprintf("Edge ingress envelope %s: source=%s source_system=%s parse_status=%s amount=%s %s idempotency_key=%s received_at=%s trace_id=%s",
				envelopeID, source, sourceSystem, parseStatus, amountValue, amountCurrency, idemKey, receivedAt, tr),
		})
	}
	return out, rows.Err()
}

func (r *LiveSQLRetriever) fetchFromIntent(tenantID, intentID, traceID string, topK int, failureOnly bool) ([]model.RetrievedChunk, error) {
	ctx, cancel := context.WithTimeout(context.Background(), r.timeout)
	defer cancel()

	args := []any{}
	q := `
		SELECT intent_id::text, envelope_id::text, trace_id::text, status, intent_type,
		       amount::text, currency, confidence_score::text, created_at::text
		FROM payment_intents
		WHERE 1=1
	`
	if tenantID != "" {
		q += fmt.Sprintf(" AND tenant_id::text = $%d", len(args)+1)
		args = append(args, tenantID)
	}
	if intentID != "" && uuidRegex.MatchString(intentID) {
		q += fmt.Sprintf(" AND intent_id::text = $%d", len(args)+1)
		args = append(args, strings.ToLower(intentID))
	}
	if traceID != "" && uuidRegex.MatchString(traceID) {
		q += fmt.Sprintf(" AND trace_id::text = $%d", len(args)+1)
		args = append(args, strings.ToLower(traceID))
	}
	if failureOnly {
		q += " AND status ILIKE '%FAIL%'"
	}
	q += fmt.Sprintf(" ORDER BY created_at DESC LIMIT %d", topK)

	rows, err := r.intentDB.QueryContext(ctx, q, args...)
	if err != nil {
		return nil, fmt.Errorf("intent retrieval failed: %w", err)
	}
	defer rows.Close()

	out := make([]model.RetrievedChunk, 0, topK*2)
	for rows.Next() {
		var id, envelopeID, tr, status, intentType, amount, currency, createdAt string
		var confidence sql.NullString

		if err := rows.Scan(&id, &envelopeID, &tr, &status, &intentType, &amount, &currency, &confidence, &createdAt); err != nil {
			return nil, err
		}

		confidenceVal := "null"
		if confidence.Valid {
			confidenceVal = confidence.String
		}

		out = append(out, model.RetrievedChunk{
			ChunkID:    "intent_" + id,
			SourceType: "intent_payment_intents",
			RecordID:   id,
			IntentID:   id,
			TraceID:    tr,
			TenantID:   tenantID,
			Score:      1.0,
			Text: fmt.Sprintf("Intent %s: status=%s type=%s amount=%s %s confidence=%s envelope_id=%s created_at=%s trace_id=%s",
				id, status, intentType, amount, currency, confidenceVal, envelopeID, createdAt, tr),
		})
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}

	args = []any{}
	q = `
		SELECT event_id::text, aggregate_id::text, trace_id::text, event_type, status, retry_count::text, created_at::text, sent_at::text
		FROM outbox
		WHERE 1=1
	`
	if tenantID != "" {
		q += fmt.Sprintf(" AND tenant_id::text = $%d", len(args)+1)
		args = append(args, tenantID)
	}
	if intentID != "" && uuidRegex.MatchString(intentID) {
		q += fmt.Sprintf(" AND aggregate_id::text = $%d", len(args)+1)
		args = append(args, strings.ToLower(intentID))
	}
	if traceID != "" && uuidRegex.MatchString(traceID) {
		q += fmt.Sprintf(" AND trace_id::text = $%d", len(args)+1)
		args = append(args, strings.ToLower(traceID))
	}
	if failureOnly {
		q += " AND status ILIKE '%FAIL%'"
	}
	q += fmt.Sprintf(" ORDER BY created_at DESC LIMIT %d", topK)

	rows2, err := r.intentDB.QueryContext(ctx, q, args...)
	if err != nil {
		return nil, fmt.Errorf("outbox retrieval failed: %w", err)
	}
	defer rows2.Close()

	for rows2.Next() {
		var eventID, aggID, tr, eventType, status, retryCount, createdAt, sentAt sql.NullString
		if err := rows2.Scan(&eventID, &aggID, &tr, &eventType, &status, &retryCount, &createdAt, &sentAt); err != nil {
			return nil, err
		}
		out = append(out, model.RetrievedChunk{
			ChunkID:    "outbox_" + eventID.String,
			SourceType: "intent_outbox",
			RecordID:   eventID.String,
			IntentID:   aggID.String,
			TraceID:    tr.String,
			TenantID:   tenantID,
			Score:      0.95,
			Text: fmt.Sprintf("Outbox event %s: aggregate_id=%s event_type=%s status=%s retry_count=%s created_at=%s sent_at=%s trace_id=%s",
				eventID.String, aggID.String, eventType.String, status.String, retryCount.String, createdAt.String, sentAt.String, tr.String),
		})
	}
	return out, rows2.Err()
}
func (r *LiveSQLRetriever) fetchFromIntentDLQ(tenantID string, topK int) ([]model.RetrievedChunk, error) {
	ctx, cancel := context.WithTimeout(context.Background(), r.timeout)
	defer cancel()

	args := []any{}
	q := `
		SELECT dlq_id::text, tenant_id::text, envelope_id::text, stage, reason_code, error_detail, replayable::text, created_at::text
		FROM dlq_items
		WHERE 1=1
	`
	if tenantID != "" {
		q += fmt.Sprintf(" AND tenant_id::text = $%d", len(args)+1)
		args = append(args, tenantID)
	}
	// dlq_items are already failure records; no extra failureOnly condition needed
	q += fmt.Sprintf(" ORDER BY created_at DESC LIMIT %d", topK)

	rows, err := r.intentDB.QueryContext(ctx, q, args...)
	if err != nil {
		return nil, fmt.Errorf("intent dlq retrieval failed: %w", err)
	}
	defer rows.Close()

	out := make([]model.RetrievedChunk, 0, topK)
	for rows.Next() {
		var dlqID, tID, envelopeID, stage, reasonCode, errorDetail, replayable, createdAt sql.NullString
		if err := rows.Scan(&dlqID, &tID, &envelopeID, &stage, &reasonCode, &errorDetail, &replayable, &createdAt); err != nil {
			return nil, err
		}
		out = append(out, model.RetrievedChunk{
			ChunkID:    "intent_dlq_" + dlqID.String,
			SourceType: "intent_dlq_items",
			RecordID:   dlqID.String,
			TenantID:   tID.String,
			Score:      0.97,
			Text: fmt.Sprintf("DLQ item %s: stage=%s reason_code=%s replayable=%s envelope_id=%s created_at=%s error_detail=%s",
				dlqID.String, stage.String, reasonCode.String, replayable.String, envelopeID.String, createdAt.String, errorDetail.String),
		})
	}
	return out, rows.Err()
}

func (r *LiveSQLRetriever) fetchFromRelay(tenantID, intentID, traceID string, topK int, failureOnly bool) ([]model.RetrievedChunk, error) {
	ctx, cancel := context.WithTimeout(context.Background(), r.timeout)
	defer cancel()

	args := []any{}
	q := `
		SELECT contract_id::text, intent_id::text, envelope_id::text, trace_id, status, created_at::text
		FROM payout_contracts
		WHERE 1=1
	`
	if tenantID != "" {
		q += fmt.Sprintf(" AND tenant_id::text = $%d", len(args)+1)
		args = append(args, tenantID)
	}
	if intentID != "" && uuidRegex.MatchString(intentID) {
		q += fmt.Sprintf(" AND intent_id::text = $%d", len(args)+1)
		args = append(args, strings.ToLower(intentID))
	}
	if traceID != "" {
		q += fmt.Sprintf(" AND trace_id = $%d", len(args)+1)
		args = append(args, traceID)
	}
	if failureOnly {
		q += " AND status ILIKE '%FAIL%'"
	}
	q += fmt.Sprintf(" ORDER BY created_at DESC LIMIT %d", topK)

	rows, err := r.relayDB.QueryContext(ctx, q, args...)
	if err != nil {
		return nil, fmt.Errorf("relay retrieval failed: %w", err)
	}
	defer rows.Close()

	out := make([]model.RetrievedChunk, 0, topK)
	for rows.Next() {
		var contractID, id, envelopeID, tr, status, createdAt string
		if err := rows.Scan(&contractID, &id, &envelopeID, &tr, &status, &createdAt); err != nil {
			return nil, err
		}
		out = append(out, model.RetrievedChunk{
			ChunkID:    "relay_contract_" + contractID,
			SourceType: "relay_payout_contracts",
			RecordID:   contractID,
			IntentID:   id,
			TraceID:    tr,
			TenantID:   tenantID,
			Score:      0.93,
			Text: fmt.Sprintf("Relay contract %s: intent_id=%s envelope_id=%s status=%s created_at=%s trace_id=%s",
				contractID, id, envelopeID, status, createdAt, tr),
		})
	}
	return out, rows.Err()
}
