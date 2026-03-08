package model

import (
	"encoding/json"
	"time"

	"github.com/google/uuid"
)

type Status string

const (
	StatusReceived      Status = "RECEIVED"
	StatusHandoff       Status = "HANDOFF_OK"
	StatusCanonicalized Status = "CANONICALIZED"
	StatusDLQ           Status = "DLQ"
)

//Signature Part need to update

type IngressEnvelope struct {
	TraceID           uuid.UUID `json:"trace_id" db:"trace_id"`
	EnvelopeID        uuid.UUID `json:"envelope_id" db:"envelope_id"`
	TenantID          uuid.UUID `json:"tenant_id" db:"tenant_id"`
	Source            string    `json:"source" db:"source"`
	SourceSystem      string    `json:"source_system" db:"source_system"`
	ContentType       string    `json:"content_type" db:"content_type"`
	IdempotencyKey    string    `json:"idempotency_key" db:"idempotency_key"`
	PayloadSize       int       `json:"payload_size" db:"payload_size"`
	PayloadHash       []byte    `json:"payload_hash" db:"payload_hash"`
	EnvelopeHash      []byte    `json:"envelope_hash" db:"envelope_hash"`
	EnvelopeSignature string    `json:"envelope_signature" db:"envelope_signature"`
	Status            Status    `json:"status" db:"status"`
	ObjectRef         string    `json:"object_ref" db:"object_ref"`
	ReceivedAt        time.Time `json:"received_at" db:"received_at"`
	Payload           json.RawMessage
}
