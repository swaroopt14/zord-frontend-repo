package validator

import (
	"strings"

	"zord-intent-engine/internal/models"
)

// StructuralValidate enforces request shape and required fields.
// This replaces JSON Schema for phase-1.
func StructuralValidate(intent models.IncomingIntent) error {
	if strings.TrimSpace(intent.IntentType) == "" {
		return schemaError("intent_type is required")
	}

	if strings.TrimSpace(intent.AccountNumber) == "" {
		return schemaError("account_number is required")
	}

	if strings.TrimSpace(intent.Amount.Value) == "" {
		return schemaError("amount.value is required")
	}

	if strings.TrimSpace(intent.Amount.Currency) == "" {
		return schemaError("amount.currency is required")
	}

	if strings.TrimSpace(intent.Beneficiary.Instrument.Kind) == "" {
		return schemaError("beneficiary.instrument.kind is required")
	}

	if strings.TrimSpace(intent.IdempotencyKey) == "" {
		return schemaError("idempotency_key is required")
	}

	return nil
}
