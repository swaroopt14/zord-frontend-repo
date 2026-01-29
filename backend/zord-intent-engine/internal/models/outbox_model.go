package models

import (
	"encoding/json"
	"time"

	"github.com/google/uuid"
)

type OutboxEvent struct {
	EnvelopeID    string          `db:"envelope_id"`
	TraceID       string          `db:"trace_id"`
	TenantID      string          `db:"tenant_id"`
	AggregateType string          `db:"aggregate_type"`
	AggregateID   uuid.UUID       `db:"aggregate_id"`
	EventType     string          `db:"event_type"`
	Payload       json.RawMessage `db:"payload"`
	Status        string          `db:"status"`
	CreatedAt     time.Time       `db:"created_at"`
}
