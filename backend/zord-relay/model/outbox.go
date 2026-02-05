package model

import (
	"database/sql"
	"time"
)

type OutboxEvent struct {
	ID          string
	AggregateID string
	EventType   string
	Payload     []byte
	Status      string
	RetryCount  int
	NextRetryAt time.Time
	CreatedAt   time.Time

	TenantID   string
	TraceID     sql.NullString
	EnvelopeID  sql.NullString
}