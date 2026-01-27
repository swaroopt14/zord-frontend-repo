package persistence

import (
	"context"
	"database/sql"

	"github.com/google/uuid"
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
	intent models.CanonicalIntent,
) (models.CanonicalIntent, error) {

	intent.IntentID = uuid.NewString()

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

	_, err := r.db.ExecContext(
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

	return intent, err
}
