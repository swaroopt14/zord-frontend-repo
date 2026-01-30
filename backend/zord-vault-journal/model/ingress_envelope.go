package model

import (
	"encoding/json"
	"time"

	"github.com/google/uuid"
)

type ParseStatus string

const (
	ParseStatusReceived  ParseStatus = "RECEIVED"
	ParseStatusInvalid   ParseStatus = "INVALID"
	PareseStatusAccepted ParseStatus = "ACCEPTED"
)

//Signature Part need to update

type IngressEnvolope struct {
	TraceID         uuid.UUID `json:"trace_id" db:"trace_id"`
	EnvelopeID      uuid.UUID `json:"envelope_id" db:"envelope_id"`
	TenantID        uuid.UUID `json:"tenant_id" db:"tenant_id"`
	Source          string    `json:"source" db:"source"`
	SourceSystem    string    `json:"source_system" db:"source_system"`
	IdempotencyKey  string    `json:"idempotency_key" db:"idempotency_key"`
	PayloadHash     string    `json:"payload_hash" db:"payload_hash"`
	ObjectRef       string    `json:"object_ref" db:"object_ref"`
	ParseStatus     string    `json:"parse_status" db:"parse_status"`
	SignatureStatus *string   `json:"signature_status,omitempty" db:"signature_status"`
	AmountValue     string    `json:"amount_value" db:"amount_value"`
	AmountCurrency  string    `json:"amount_currency" db:"amount_currency"`
	ReceivedAt      time.Time `json:"received_at" db:"received_at"`
	Payload         json.RawMessage
}
