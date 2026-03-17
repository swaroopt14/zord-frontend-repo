package services

import (
	"context"
	"crypto/sha256"
	"database/sql"
	"fmt"
	"strings"
	"time"
	"zord-outcome-engine/db"
	"zord-outcome-engine/models"
	"zord-outcome-engine/storage"

	"github.com/google/uuid"
)

type RawOutcomeService struct {
	S3 *storage.S3Store
}

func (s *RawOutcomeService) Ingest(ctx context.Context, req models.IngestRequest) (*models.IngestResponse, error) {
	if ctx == nil {
		ctx = context.Background()
	}

	connectorUUID, err := uuid.Parse(req.ConnectorID)
	if err != nil {
		return nil, err
	}

	if req.ReferenceID == nil || strings.TrimSpace(*req.ReferenceID) == "" {
		return nil, fmt.Errorf("reference_id is required (expected dispatch_id)")
	}
	dispatchUUID, err := uuid.Parse(strings.TrimSpace(*req.ReferenceID))
	if err != nil {
		return nil, fmt.Errorf("invalid reference_id (expected uuid dispatch_id): %w", err)
	}

	// Resolve tenant_id and trace_id from dispatch_index using dispatch_id(reference_id) + connector_id.
	// This is the only reliable source for webhook/poll/SFTP because we don't rely on headers.
	var tenantIDStr, traceIDStr, contractIDStr, intentIDStr string
	err = db.DB.QueryRowContext(ctx, `
SELECT tenant_id::text, trace_id::text, contract_id::text, intent_id::text
FROM dispatch_index
WHERE dispatch_id = $1::uuid AND connector_id = $2::uuid
LIMIT 1
`, dispatchUUID, connectorUUID).Scan(&tenantIDStr, &traceIDStr, &contractIDStr, &intentIDStr)
	if err != nil {
		return nil, err
	}

	tenantUUID, err := uuid.Parse(tenantIDStr)
	if err != nil {
		return nil, err
	}
	traceUUID, err := uuid.Parse(traceIDStr)
	if err != nil {
		return nil, err
	}
	contractUUID := parseUUIDPtr(contractIDStr)
	intentUUID := parseUUIDPtr(intentIDStr)

	// Store encrypted payload in S3 (encryption happens inside storage).
	envelopeID, receivedAt, objRef, err := s.S3.StoreRawPayload(ctx, req.Payload, tenantIDStr)
	if err != nil {
		return nil, err
	}

	sum := sha256.Sum256(req.Payload)

	rawEnv := &models.RawOutcomeEnvelope{
		RawOutcomeEnvelopeID: envelopeID,
		TenantID:             tenantUUID,
		TraceID:              traceUUID,
		ConnectorID:          connectorUUID,
		SourceClass:          req.SourceClass,
		ReceivedAt:           receivedAt,
		RawBytesSHA256:       sum[:],
		ObjectStoreRef:       objRef,
		CreatedAt:            time.Now().UTC(),
	}
	// Persist raw_outcome_envelopes row using db.DB directly.
	// Use sha256 + tenant as idempotency key: on conflict, reuse existing row.
	if err := insertOrGetRawEnvelope(ctx, rawEnv); err != nil {
		return nil, err
	}

	// Normalize using the in-memory payload (no S3 read).
	meta := &RawEnvelopeMeta{
		RawOutcomeEnvelopeID: envelopeID,
		TenantID:             tenantUUID,
		TraceID:              traceUUID,
		ConnectorID:          connectorUUID,
		SourceClass:          req.SourceClass,
		ReceivedAt:           receivedAt,
		RawBytesSHA256:       sum[:],
	}
	canonical, err := normalizeAndInsertCanonical(ctx, meta, req.Payload)
	if err != nil {
		return nil, err
	}

	// Correlate: reference_id is the dispatch_id, so we can apply immediately with full confidence.
	res := &correlationResult{
		DispatchID:            &dispatchUUID,
		ContractID:            contractUUID,
		IntentID:              intentUUID,
		TraceID:               &traceUUID,
		CorrelationConfidence: 100,
		Reason:                "dispatch_id",
	}
	if err := applyCorrelationOrEnqueue(ctx, canonical.EventID, canonical.TenantID, canonical.ConnectorID, res); err != nil {
		return nil, err
	}

	out := &models.IngestResponse{
		RawOutcomeEnvelopeID: envelopeID.String(),
		CanonicalEventID:     canonical.EventID.String(),
		ReceivedAt:           receivedAt,
	}

	// We have a dispatch_index row, so contract_id is available (NOT NULL).
	contractStr := contractIDStr
	out.ContractID = &contractStr

	state, err := recomputeFusionAndFinality(ctx, contractStr)
	if err != nil {
		return nil, err
	}
	out.FusedState = &state

	return out, nil
}

// insertOrGetRawEnvelope enforces idempotency on (tenant_id, raw_bytes_sha256).
func insertOrGetRawEnvelope(ctx context.Context, env *models.RawOutcomeEnvelope) error {
	row := db.DB.QueryRowContext(ctx, `
INSERT INTO raw_outcome_envelopes(
	raw_outcome_envelope_id,
	tenant_id,
	trace_id,
	connector_id,
	source_class,
	received_at,
	raw_bytes_sha256,
	object_store_ref
) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
ON CONFLICT (tenant_id, raw_bytes_sha256) DO NOTHING
RETURNING raw_outcome_envelope_id, received_at, object_store_ref
`,
		env.RawOutcomeEnvelopeID,
		env.TenantID,
		env.TraceID,
		env.ConnectorID,
		env.SourceClass,
		env.ReceivedAt,
		env.RawBytesSHA256,
		env.ObjectStoreRef,
	)
	var id uuid.UUID
	var receivedAt time.Time
	var objRef string
	err := row.Scan(&id, &receivedAt, &objRef)
	if err == nil {
		// Fresh insert; keep env as-is.
		return nil
	}
	if err != sql.ErrNoRows {
		return err
	}

	// Conflict path: look up existing envelope by tenant + sha256.
	r := db.DB.QueryRowContext(ctx, `
SELECT raw_outcome_envelope_id, received_at, object_store_ref
FROM raw_outcome_envelopes
WHERE tenant_id = $1 AND raw_bytes_sha256 = $2
LIMIT 1
`,
		env.TenantID,
		env.RawBytesSHA256,
	)
	if err := r.Scan(&id, &receivedAt, &objRef); err != nil {
		return err
	}
	env.RawOutcomeEnvelopeID = id
	env.ReceivedAt = receivedAt
	env.ObjectStoreRef = objRef
	return nil
}
