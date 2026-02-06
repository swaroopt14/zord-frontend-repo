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
		intent_id,trace_id, envelope_id, tenant_id,
		intent_type, canonical_version, schema_version,
		amount, currency, deadline_at,
		constraints, beneficiary_type, pii_tokens, beneficiary,
		status, confidence_score, created_at
	) VALUES (
		$1,$2,$3,
		$4,$5,$6,
		$7,$8,$9,
		$10,$11,$12,$13,
		$14,$15,$16,$17
	)`

	_, err = tx.ExecContext(
		ctx,
		query,
		intent.IntentID,
		intent.TraceID,
		intent.EnvelopeID,
		intent.TenantID,
		intent.IntentType,
		intent.CanonicalVersion,
		intent.SchemaVersion,
		intent.Amount,
		intent.Currency,
		intent.DeadlineAt,
		intent.Constraints,
		intent.BeneficiaryType,
		intent.PIITokens,
		intent.Beneficiary,
		intent.Status,
		intent.ConfidenceScore,
		intent.CreatedAt,
	)

	if err != nil {
		return intent, err
	}

	outboxQuery := `
	INSERT INTO outbox (
		trace_id,
		envelope_id,
		tenant_id,
		aggregate_type,
		aggregate_id,
		event_type,
		payload,
		status,
		retry_count,
		next_attempt_at,
		created_at
	) VALUES (
		$1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11
	)`

	_, err = tx.ExecContext(
		ctx,
		outboxQuery,
		outbox.TraceID,
		outbox.EnvelopeID,
		outbox.TenantID,
		outbox.AggregateType,
		outbox.AggregateID,
		outbox.EventType,
		outbox.Payload,
		outbox.Status,
		outbox.RetryCount,
		outbox.NextRetryAt,
		outbox.CreatedAt,
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
