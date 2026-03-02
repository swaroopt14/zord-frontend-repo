package model

import (
	"encoding/json"
	"time"
)

type OutboxEvent struct {
	ID            string          `json:"event_id"`
	EnvelopeID    string          `json:"envelope_id"`
	TraceID       string          `json:"trace_id"`
	TenantID      string          `json:"tenant_id"`
	AggregateType string          `json:"aggregate_type,omitempty"`
	AggregateID   string          `json:"aggregate_id"`
	EventType     string          `json:"event_type"`
	SchemaVersion string          `json:"schema_version,omitempty"`
	Amount        json.RawMessage `json:"amount,omitempty"`
	Currency      string          `json:"currency,omitempty"`
	RetryCount    int             `json:"retry_count"`
	NextRetryAt   *time.Time      `json:"next_attempt_at,omitempty"`
	Payload       json.RawMessage `json:"payload"`
	Status        string          `json:"status"`
	CreatedAt     time.Time       `json:"created_at"`
	LeaseID       string          `json:"lease_id,omitempty"`
	LeasedBy      string          `json:"leased_by,omitempty"`
	LeaseUntil    *time.Time      `json:"lease_until,omitempty"`
}
