package model

import (
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
	Trace_id        uuid.UUID `db:"trace_id"`
	Envolope_id     uuid.UUID `db:"envelope_id"`
	Tenant_id       uuid.UUID `db:"tenant_id"`
	Source          string    `db:"source"`
	SourceSystem    string    `db:"source_system"`
	IdempotencyKey  string    `db:"idempotency_key"`
	PayloadHash     string    `db:"payload_hash"`     //need to pass it letter
	ObjectRef       string    `db:"object_ref"`       //need to pass it letter
	ParseStatus     string    `db:"parse_status"`     //need to pass it letter
	SignatureStatus *string   `db:"signature_status"` // nullable need to pass it letter
	AmountValue     string    `db:"amount_value"`
	AmountCurrency  string    `db:"amount_currency"`
	ReceivedAt      time.Time `db:"received_at"`
}
