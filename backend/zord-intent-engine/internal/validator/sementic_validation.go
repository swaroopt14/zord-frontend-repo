package validator

import (
	"math/big"
	"regexp"
	"strings"
	"time"

	"zord-intent-engine/internal/models"
)

var ifscRegex = regexp.MustCompile(`^[A-Z]{4}0[A-Z0-9]{6}$`)

func SemanticValidate(intent models.IncomingIntent) error {
	if err := validateAmount(intent.Amount.Value); err != nil {
		return err
	}

	if err := validateCurrency(intent.Amount.Currency); err != nil {
		return err
	}

	if err := validateDeadline(intent.Constraints); err != nil {
		return err
	}

	if err := validateInstrument(intent); err != nil {
		return err
	}

	return nil
}

/* ---------- Semantic rules ---------- */

func validateAmount(value string) error {
	amt, ok := new(big.Rat).SetString(value)
	if !ok {
		return semanticError("amount must be a valid decimal")
	}
	if amt.Sign() <= 0 {
		return semanticError("amount must be greater than zero")
	}
	return nil
}

func validateCurrency(code string) error {
	code = strings.ToUpper(code)

	switch code {
	case "INR", "USD", "GBP", "EUR":
		return nil
	default:
		return semanticError("currency must be ISO-4217 compliant")
	}
}

func validateDeadline(constraints map[string]any) error {
	raw, ok := constraints["deadline_at"]
	if !ok {
		return nil // optional field
	}

	deadlineStr, ok := raw.(string)
	if !ok {
		return semanticError("deadline_at must be a string in ISO-8601 format")
	}

	t, err := time.Parse(time.RFC3339, deadlineStr)
	if err != nil {
		return semanticError("deadline_at must be ISO-8601 (RFC3339)")
	}

	if t.Before(time.Now().UTC()) {
		return semanticError("deadline_at must not be in the past")
	}

	return nil
}

/* ---------- Instrument rules ---------- */

func validateInstrument(intent models.IncomingIntent) error {
	switch intent.Beneficiary.Instrument.Kind {
	case "BANK":
		if strings.TrimSpace(intent.AccountNumber) == "" {
			return semanticError("account_number required for BANK instrument")
		}
		if !ifscRegex.MatchString(intent.Beneficiary.Instrument.IFSC) {
			return semanticError("invalid IFSC format")
		}

	case "UPI":
		if !strings.Contains(intent.Beneficiary.Instrument.VPA, "@") {
			return semanticError("invalid UPI VPA")
		}

	case "WALLET", "CARD":
		return nil

	default:
		return semanticError("unsupported instrument kind")
	}

	return nil
}
