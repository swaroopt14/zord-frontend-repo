package persistence

import (
	"context"
	"database/sql"

	"zord-intent-engine/internal/models"
)

type PaymentIntentRepo struct {
	db *sql.DB
}

func NewPaymentIntentRepo(db *sql.DB) *PaymentIntentRepo {
	return &PaymentIntentRepo{db: db}
}

func (r *PaymentIntentRepo) Save(
	ctx context.Context,
	intent models.CanonicalIntent, outbox models.OutboxEvent,
) (models.CanonicalIntent, error) {

	// intent.IntentID = uuid.NewString()

	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return intent, err
	}

	defer func() {
		if err != nil {
			_ = tx.Rollback()
		}
	}()

	query := `
	INSERT INTO payment_intents (
    intent_id, envelope_id, tenant_id,
    trace_id, idempotency_key, salient_hash,
    intent_type, canonical_version, schema_version,
    amount, currency, deadline_at,
    constraints, beneficiary_type, pii_tokens, beneficiary,
    status, confidence_score,
    canonical_ref, canonical_hash, prev_hash,
    created_at
)
VALUES (
    $1,$2,$3,
    $4,$5,$6,
    $7,$8,$9,
    $10,$11,$12,
    $13,$14,$15,$16,
    $17,$18,
    $19,$20,$21,
    $22
)`

	_, err = tx.ExecContext(
		ctx,
		query,
		intent.IntentID,   // $1
		intent.EnvelopeID, // $2
		intent.TenantID,   // $3

		intent.TraceID,        // $4  ✅ new
		intent.IdempotencyKey, // $5  ✅ new
		intent.SalientHash,    // $6  ✅ new

		intent.IntentType,       // $7
		intent.CanonicalVersion, // $8
		intent.SchemaVersion,    // $9

		intent.Amount,     // $10
		intent.Currency,   // $11
		intent.DeadlineAt, // $12

		intent.Constraints,     // $13
		intent.BeneficiaryType, // $14
		intent.PIITokens,       // $15
		intent.Beneficiary,     // $16

		intent.Status,          // $17
		intent.ConfidenceScore, // $18

		intent.CanonicalRef,  // $19
		intent.CanonicalHash, // $20
		intent.PrevHash,      // $21

		intent.CreatedAt, // $22
	)

	if err != nil {
		return intent, err
	}

	outboxQuery := `
	INSERT INTO outbox (
		tenant_id,
		aggregate_type,
		aggregate_id,
		event_type,
		payload,
		status,
		created_at,
		envelope_id
	) VALUES (
		$1,$2,$3,$4,$5,$6,$7,$8
	)`

	_, err = tx.ExecContext(
		ctx,
		outboxQuery,
		outbox.TenantID,
		outbox.AggregateType,
		outbox.AggregateID,
		outbox.EventType,
		outbox.Payload,
		outbox.Status,
		outbox.CreatedAt,
		outbox.EnvelopeID,
	)
	if err != nil {
		return intent, err
	}

	err = tx.Commit()
	if err != nil {
		return intent, err
	}

	return intent, nil
}

func (r *PaymentIntentRepo) FindByEnvelope(
	ctx context.Context,
	tenantID string,
	envelopeID string,
) (*models.CanonicalIntent, error) {

	query := `
	SELECT
		intent_id,
		envelope_id,
		tenant_id,
		intent_type,
		canonical_version,
		schema_version,
		amount,
		currency,
		deadline_at,
		constraints,
		beneficiary_type,
		pii_tokens,
		beneficiary,
		status,
		confidence_score,
		created_at
	FROM payment_intents
	WHERE tenant_id = $1
	  AND envelope_id = $2
	LIMIT 1
	`

	var intent models.CanonicalIntent

	err := r.db.QueryRowContext(
		ctx,
		query,
		tenantID,
		envelopeID,
	).Scan(
		&intent.IntentID,
		&intent.EnvelopeID,
		&intent.TenantID,
		&intent.IntentType,
		&intent.CanonicalVersion,
		&intent.SchemaVersion,
		&intent.Amount,
		&intent.Currency,
		&intent.DeadlineAt,
		&intent.Constraints,
		&intent.BeneficiaryType,
		&intent.PIITokens,
		&intent.Beneficiary,
		&intent.Status,
		&intent.ConfidenceScore,
		&intent.CreatedAt,
	)

	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}

	return &intent, nil
}

func (r *PaymentIntentRepo) UpdateCanonicalSnapshotMeta(
	ctx context.Context,
	intentID string,
	objectRef string,
	hash string,
	prevHash string,
) error {
	query := `
	UPDATE payment_intents
	SET canonical_ref = $1,
	    canonical_hash = $2,
	    prev_hash = $3
	WHERE intent_id = $4
	`

	_, err := r.db.ExecContext(ctx, query, objectRef, hash, prevHash, intentID)
	return err
}
