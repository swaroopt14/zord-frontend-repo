package validator

import (
	"context"
	"encoding/json"
	"time"

	"zord-intent-engine/internal/models"
	"zord-intent-engine/internal/persistence"
)

type Validator struct {
	dlqRepo persistence.DLQRepository
}

func NewValidator(dlqRepo persistence.DLQRepository) *Validator {
	return &Validator{dlqRepo: dlqRepo}
}

// Validate executes phase-1 validation strictly.
// Any validation failure → DLQ entry (persisted) + immediate rejection.
func (v *Validator) Validate(
	ctx context.Context,
	tenantID string,
	envelopeID string,
	payload []byte,
) (*models.IncomingIntent, *models.DLQEntry, error) {

	// STEP 1 — JSON parse
	var intent models.IncomingIntent
	if err := json.Unmarshal(payload, &intent); err != nil {
		dlq, perr := v.persistDLQ(
			ctx,
			tenantID,
			envelopeID,
			"STRUCTURAL_VALIDATION",
			schemaError("invalid JSON payload"),
			false,
		)
		if perr != nil {
			return nil, nil, perr // system failure
		}
		return nil, dlq, nil
	}

	// STEP 2 — STRUCTURAL validation
	if err := StructuralValidate(intent); err != nil {
		dlq, _ := v.persistDLQ(
			ctx,
			tenantID,
			envelopeID,
			"STRUCTURAL_VALIDATION",
			err,
			false,
		)
		return nil, dlq, err
	}

	// STEP 3 — SEMANTIC validation
	if err := SemanticValidate(intent); err != nil {
		dlq, perr := v.persistDLQ(
			ctx,
			tenantID,
			envelopeID,
			"SEMANTIC_VALIDATION",
			err,
			false,
		)
		if perr != nil {
			return nil, nil, perr
		}
		return nil, dlq, nil
	}

	// VALID — safe to proceed
	return &intent, nil, nil
}

// persistDLQ writes a DLQ entry durably.
// If this fails, caller must treat it as system failure (HTTP 500).
func (v *Validator) persistDLQ(
	ctx context.Context,
	tenantID string,
	envelopeID string,
	stage string,
	err error,
	replayable bool,
) (*models.DLQEntry, error) {

	ve, ok := err.(ValidationError)
	if !ok {
		ve = ValidationError{
			Code: "VALIDATION_FAILED",
			Msg:  err.Error(),
		}
	}

	entry := models.DLQEntry{
		TenantID:   tenantID,
		EnvelopeID: envelopeID,

		Stage:       stage,
		ReasonCode:  ve.Code,
		ErrorDetail: ve.Msg,
		Replayable:  replayable,

		CreatedAt: time.Now().UTC(),
	}

	saved, err := v.dlqRepo.Save(ctx, entry)
	if err != nil {
		return nil, err
	}

	return &saved, nil
}
