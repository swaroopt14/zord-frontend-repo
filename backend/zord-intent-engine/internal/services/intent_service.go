package services

import (
	"context"
	"encoding/json"
	"errors"
	"math/big"
	"time"

	"main.go/internal/canonicalizer"
	"main.go/internal/models"
	"main.go/internal/pii"
	"main.go/internal/validator"
)

type IntentService struct {
	validator *validator.Validator
	tokenizer *pii.Tokenizer
	repo      CanonicalIntentRepository
}

// Repository abstraction
type CanonicalIntentRepository interface {
	Save(ctx context.Context, intent models.CanonicalIntent) (models.CanonicalIntent, error)
}

func NewIntentService(
	v *validator.Validator,
	t *pii.Tokenizer,
	r CanonicalIntentRepository,
) *IntentService {
	return &IntentService{
		validator: v,
		tokenizer: t,
		repo:      r,
	}
}

/* ---------------- Helpers ---------------- */

func parseAmount(value string) (float64, error) {
	rat, ok := new(big.Rat).SetString(value)
	if !ok {
		return 0, errors.New("invalid amount format")
	}

	f, _ := rat.Float64()
	return f, nil
}

/* ---------------- Pipeline ---------------- */

func (s *IntentService) Process(
	ctx context.Context,
	tenantID string,
	envelopeID string,
	payload []byte,
) (*models.CanonicalIntent, *models.DLQEntry, error) {

	// STEP 1–4: VALIDATION (ctx PASSED CORRECTLY)
	intent, dlq := s.validator.Validate(
		ctx,
		tenantID,
		envelopeID,
		payload,
	)
	if dlq != nil {
		return nil, dlq, nil
	}

	// STEP 5: CANONICALIZATION
	canonicalInput := canonicalizer.CanonicalizeIntent(*intent)

	// STEP 6: TOKENIZATION
	accountTokenRef, err := s.tokenizer.TokenizeAccountNumber(
		canonicalInput.AccountNumber,
	)
	if err != nil {
		return nil, nil, err
	}

	// ---- JSONB PREP ----

	beneficiaryJSON, err := json.Marshal(canonicalInput.Beneficiary)
	if err != nil {
		return nil, nil, err
	}

	piiJSON, err := json.Marshal(map[string]string{
		"account_number": accountTokenRef,
	})
	if err != nil {
		return nil, nil, err
	}

	constraintsJSON, err := json.Marshal(canonicalInput.Constraints)
	if err != nil {
		return nil, nil, err
	}

	amount, err := parseAmount(canonicalInput.Amount.Value)
	if err != nil {
		return nil, nil, err
	}

	// ---- BUILD CANONICAL INTENT ----
	canonical := models.CanonicalIntent{
		IntentID:   "",
		EnvelopeID: envelopeID,
		TenantID:   tenantID,

		IntentType:       canonicalInput.IntentType,
		CanonicalVersion: "v1",
		SchemaVersion:    canonicalInput.SchemaVersion,

		Amount:   amount,
		Currency: canonicalInput.Amount.Currency,

		Constraints: constraintsJSON,

		BeneficiaryType: canonicalInput.Beneficiary.Instrument.Kind,
		PIITokens:       piiJSON,
		Beneficiary:     beneficiaryJSON,

		Status:    "CREATED",
		CreatedAt: time.Now().UTC(),
	}

	// STEP 7 — PERSIST
	saved, err := s.repo.Save(ctx, canonical)
	if err != nil {
		return nil, nil, err
	}

	return &saved, nil, nil
}
