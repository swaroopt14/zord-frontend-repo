package dto

type IncomingIntentRequestV1 struct {
	SchemaVersion  string                 `json:"schema_version"`
	IntentType     string                 `json:"intent_type" binding:"required"`
	Amount         Amount                 `json:"amount" binding:"required"`
	Beneficiary    Beneficiary            `json:"beneficiary" binding:"required"`
	Remitter       map[string]interface{} `json:"remitter,omitempty"`
	PurposeCode    string                 `json:"purpose_code" binding:"required"`
	Constraints    map[string]interface{} `json:"constraints,omitempty"`
	Metadata       map[string]interface{} `json:"metadata,omitempty"`
	IdempotencyKey string                 `json:"idempotency_key"`
}

type Amount struct {
	Value    string `json:"value" binding:"required"`
	Currency string `json:"currency" binding:"required,len=3"`
}

type Beneficiary struct {
	Type            string     `json:"type,omitempty"`
	Instrument      Instrument `json:"instrument" binding:"required"`
	NameTokenRef    string     `json:"name_token_ref,omitempty"`
	AddressTokenRef string     `json:"address_token_ref,omitempty"`
	Country         string     `json:"country,omitempty" binding:"len=2"`
}

type Instrument struct {
	Kind               string `json:"kind" binding:"required"`
	InstrumentTokenRef string `json:"instrument_token_ref,omitempty"`
}
