package validator

import (
	"encoding/json"
	"time"

	"main.go/internal/models"
	"main.go/internal/persistence"
)

type Validator struct {
	dlqRepo persistence.DLQRepository
}

func NewValidator(dlqRepo persistence.DLQRepository) *Validator {
	return &Validator{dlqRepo: dlqRepo}
}

// Validate executes phase-1 validation strictly.
// Any failure → DLQ entry + immediate rejection upstream.
func (v *Validator) Validate(
	envelopeID string,
	payload []byte,
) (*models.IncomingIntent, *models.DLQEntry) {

	// STEP 1 — JSON parse
	var intent models.IncomingIntent
	if err := json.Unmarshal(payload, &intent); err != nil {
		return nil, v.persistDLQ(envelopeID, schemaError("invalid JSON payload"))
	}

	// STEP 2 — STRUCTURAL validation
	if err := StructuralValidate(intent); err != nil {
		return nil, v.persistDLQ(envelopeID, err)
	}

	// STEP 3 — SEMANTIC validation
	if err := SemanticValidate(intent); err != nil {
		return nil, v.persistDLQ(envelopeID, err)
	}

	// VALID — safe to proceed to canonicalization
	return &intent, nil
}

func (v *Validator) persistDLQ(
	envelopeID string,
	err error,
) *models.DLQEntry {

	ve := err.(ValidationError)

	entry := models.DLQEntry{
		EnvelopeID: envelopeID,
		ReasonCode: ve.Code,
		ReasonText: ve.Msg,
		CreatedAt:  time.Now().UTC(),
	}

	saved, _ := v.dlqRepo.Save(entry)
	return &saved
}
