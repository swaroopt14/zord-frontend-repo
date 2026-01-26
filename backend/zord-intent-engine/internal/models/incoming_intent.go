package models

type IncomingIntent struct {
	SchemaVersion  string         `json:"schema_version"`
	IntentType     string         `json:"intent_type"`
	AccountNumber  string         `json:"account_number"`
	Amount         Amount         `json:"amount"`
	Beneficiary    Beneficiary    `json:"beneficiary"`
	Remitter       map[string]any `json:"remitter,omitempty"`
	Constraints    map[string]any `json:"constraints,omitempty"`
	PurposeCode    string         `json:"purpose_code"`
	IdempotencyKey string         `json:"idempotency_key"`
}

/* ---------- Nested Types ---------- */

type Amount struct {
	Value    string `json:"value"`
	Currency string `json:"currency"`
}

type Beneficiary struct {
	Instrument Instrument `json:"instrument"`
	Country    string     `json:"country,omitempty"`
}

type Instrument struct {
	Kind string `json:"kind"`

	// BANK
	IFSC string `json:"ifsc,omitempty"`

	// UPI
	VPA string `json:"vpa,omitempty"`
}
