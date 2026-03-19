package services

import (
	"context"
	"crypto/sha256"
	"database/sql"
	"fmt"
	"log"
	"strings"
	"zord-outcome-engine/db"
)

func recomputeFusionAndFinality(ctx context.Context, contractID string) (string, error) {
	log.Printf("fusion.recompute.start contract_id=%s", contractID)
	q := `
SELECT source_class, status_candidate
FROM canonical_outcome_events
WHERE contract_id = $1::uuid
ORDER BY received_at DESC, created_at DESC
`
	rows, err := db.DB.QueryContext(ctx, q, contractID)
	if err != nil {
		if err == sql.ErrNoRows {
			// No events at all.
		} else {
			log.Printf("fusion.recompute.query_error contract_id=%s err=%v", contractID, err)
			return "", err
		}
	}
	defer rows.Close()

	type rowData struct {
		source string
		status string
	}
	var all []rowData
	for rows.Next() {
		var r rowData
		if err := rows.Scan(&r.source, &r.status); err != nil {
			log.Printf("fusion.recompute.scan_error contract_id=%s err=%v", contractID, err)
			return "", err
		}
		all = append(all, r)
	}

	// Default authority ordering (can be driven by env later).
	authority := map[string]int{
		"S4": 3,
		"S2": 2,
		"S3": 1,
	}

	bestSource := ""
	bestStatus := ""
	bestRank := -1
	bestIsTerminal := false

	for _, r := range all {
		rank := authority[r.source]
		status := strings.ToUpper(r.status)
		isTerminal := isTerminalState(status)

		// Rule 1: terminal beats non-terminal
		if isTerminal && !bestIsTerminal {
			bestIsTerminal = true
			bestRank = rank
			bestSource = r.source
			bestStatus = status
			continue
		}

		// Rule 2: if both terminal or both non-terminal → use authority
		if isTerminal == bestIsTerminal && rank > bestRank {
			bestRank = rank
			bestSource = r.source
			bestStatus = status
		}
	}

	state := "UNKNOWN_DIVERGENT"
	confidence := 0
	basis := "no_events"
	finalState := (*string)(nil)

	if bestSource != "" {
		state = strings.ToUpper(bestStatus)
		confidence = 50
		basis = "authority=" + bestSource
		if isTerminalState(state) {
			finalState = &state
			switch bestSource {
			case "S4":
				confidence = 95
			case "S2":
				confidence = 80
			default:
				confidence = 60
			}
		}
	} else if err != sql.ErrNoRows {
		return "", err
	}

	_, err = db.DB.ExecContext(ctx, `
INSERT INTO fused_outcomes(
	contract_id, current_state, final_state, finality_confidence, finality_basis, rule_version, last_updated_at
) VALUES ($1::uuid,$2,$3,$4,$5,$6,NOW())
ON CONFLICT (contract_id) DO UPDATE SET
	current_state = EXCLUDED.current_state,
	final_state = EXCLUDED.final_state,
	finality_confidence = EXCLUDED.finality_confidence,
	finality_basis = EXCLUDED.finality_basis,
	rule_version = EXCLUDED.rule_version,
	last_updated_at = NOW()
`,
		contractID, state, finalState, confidence, basis, "v1",
	)
	if err != nil {
		log.Printf("fusion.recompute.upsert_error contract_id=%s err=%v", contractID, err)
		return "", err
	}

	if finalState != nil {
		log.Printf("fusion.recompute.final_state contract_id=%s final_state=%s confidence=%d basis=%s", contractID, *finalState, confidence, basis)
		inputHash := computeSimpleInputHash(contractID, *finalState, "v1")
		_, _ = db.DB.ExecContext(ctx, `
INSERT INTO finality_certificates(
	contract_id, final_state, confidence, input_hashes, rule_id, signature, created_at
) VALUES ($1::uuid,$2,$3,$4,$5,$6,NOW())
ON CONFLICT (contract_id) DO NOTHING
`,
			contractID, *finalState, confidence, inputHash, "v1", inputHash,
		)
	}
	log.Printf("fusion.recompute.done contract_id=%s current_state=%s final_state=%s confidence=%d basis=%s", contractID, state, safeStrPtr(finalState), confidence, basis)
	return state, nil
}

func safeStrPtr(s *string) string {
	if s == nil {
		return ""
	}
	return *s
}

func isTerminalState(state string) bool {
	switch state {
	case "SUCCESS", "FAILED", "REVERSED":
		return true
	default:
		return false
	}
}

func computeSimpleInputHash(contractID, finalState, ruleID string) string {
	sum := sha256.Sum256([]byte(fmt.Sprintf("%s:%s:%s", contractID, finalState, ruleID)))
	return fmt.Sprintf("%x", sum[:])
}
