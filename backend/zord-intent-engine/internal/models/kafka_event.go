package models

import (
	"time"

	"github.com/google/uuid"
)

type Event struct {
	TraceID        uuid.UUID
	EnvelopeID     uuid.UUID
	TenantID       uuid.UUID
	ObjectRef      string
	Raw_payload    []byte
	ReceivedAt     time.Time
	Source         string
	IdempotencyKey string
}
