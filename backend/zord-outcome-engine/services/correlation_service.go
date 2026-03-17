package services

import (
	"context"
	"database/sql"
	"zord-outcome-engine/db"

	"github.com/google/uuid"
)

type correlationResult struct {
	DispatchID            *uuid.UUID
	ContractID            *uuid.UUID
	IntentID              *uuid.UUID
	TraceID               *uuid.UUID
	CorrelationConfidence int
	Reason                string
}

func correlateCanonical(ctx context.Context, referenceID *string, providerRefHash *string) (*correlationResult, error) {
	if referenceID != nil && *referenceID != "" {
		if res, err := findDispatchByReferenceID(ctx, *referenceID); err == nil {
			res.CorrelationConfidence = 100
			res.Reason = "L1:reference_id"
			return res, nil
		} else if err != sql.ErrNoRows {
			return nil, err
		}
	}

	if providerRefHash != nil && *providerRefHash != "" {
		if res, err := findDispatchByProviderRefHash(ctx, *providerRefHash); err == nil {
			res.CorrelationConfidence = 85
			res.Reason = "L2:provider_ref_hash"
			return res, nil
		} else if err != sql.ErrNoRows {
			return nil, err
		}
	}

	return &correlationResult{CorrelationConfidence: 0, Reason: "unmatched"}, nil
}

func findDispatchByReferenceID(ctx context.Context, referenceID string) (*correlationResult, error) {
	var dispatchID, contractID, intentID, traceID string
	q := `
SELECT dispatch_id::text, contract_id::text, intent_id::text, trace_id::text
FROM dispatch_index
WHERE correlation_carriers->>'reference_id' = $1
ORDER BY attempt_count DESC
LIMIT 1
`
	if err := db.DB.QueryRowContext(ctx, q, referenceID).Scan(&dispatchID, &contractID, &intentID, &traceID); err != nil {
		return nil, err
	}
	return &correlationResult{
		DispatchID: parseUUIDPtr(dispatchID),
		ContractID: parseUUIDPtr(contractID),
		IntentID:   parseUUIDPtr(intentID),
		TraceID:    parseUUIDPtr(traceID),
	}, nil
}

func findDispatchByProviderRefHash(ctx context.Context, hash string) (*correlationResult, error) {
	var dispatchID, contractID, intentID, traceID string
	q := `
SELECT dispatch_id::text, contract_id::text, intent_id::text, trace_id::text
FROM dispatch_index
WHERE provider_ref_hashes @> ARRAY[$1]
ORDER BY attempt_count DESC
LIMIT 1
`
	if err := db.DB.QueryRowContext(ctx, q, hash).Scan(&dispatchID, &contractID, &intentID, &traceID); err != nil {
		return nil, err
	}
	return &correlationResult{
		DispatchID: parseUUIDPtr(dispatchID),
		ContractID: parseUUIDPtr(contractID),
		IntentID:   parseUUIDPtr(intentID),
		TraceID:    parseUUIDPtr(traceID),
	}, nil
}

func applyCorrelationOrEnqueue(ctx context.Context, eventID uuid.UUID, tenantID uuid.UUID, connectorID uuid.UUID, res *correlationResult) error {
	if res == nil || res.DispatchID == nil {
		_, err := db.DB.ExecContext(ctx, `
INSERT INTO pending_correlation_queue(
	queue_id, event_id, tenant_id, connector_id, reason, next_attempt_at, attempt_count
) VALUES ($1,$2,$3,$4,$5,NOW() + INTERVAL '30 seconds',0)
`,
			uuid.New(), eventID, tenantID, connectorID, "correlation_failed",
		)
		return err
	}
	_, err := db.DB.ExecContext(ctx, `
UPDATE canonical_outcome_events SET
	contract_id = $1,
	intent_id = $2,
	dispatch_id = $3,
	trace_id = $4,
	correlation_confidence = $5
WHERE event_id = $6
`,
		res.ContractID, res.IntentID, res.DispatchID, res.TraceID, res.CorrelationConfidence, eventID,
	)
	return err
}

func parseUUIDPtr(s string) *uuid.UUID {
	id, err := uuid.Parse(s)
	if err != nil {
		return nil
	}
	return &id
}
