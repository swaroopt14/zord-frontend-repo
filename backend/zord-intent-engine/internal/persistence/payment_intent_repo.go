package persistence

import (
	"context"
	"database/sql"

	"main.go/internal/models"
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
		intent_type, canonical_version, schema_version,
		amount, currency, deadline_at,
		constraints, beneficiary_type, pii_tokens, beneficiary,
		status, confidence_score, created_at
	) VALUES (
		$1,$2,$3,
		$4,$5,$6,
		$7,$8,$9,
		$10,$11,$12,$13,
		$14,$15,$16
	)`

	_, err = tx.ExecContext(
		ctx,
		query,
		intent.IntentID,
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
