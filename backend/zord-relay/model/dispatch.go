package model

import "time"

type Dispatch struct {
	DispatchID        string    `json:"dispatch_id"`
	ContractID        string    `json:"contract_id"`
	IntentID          string    `json:"intent_id"`
	TenantID          string    `json:"tenant_id"`
	TraceID           string    `json:"trace_id"`
	ConnectorID       string    `json:"connector_id"`
	CorridorID        string    `json:"corridor_id"`
	AttemptCount      int       `json:"attempt_count"`
	Status            string    `json:"status"`
	ProviderAttemptID *string   `json:"provider_attempt_id,omitempty"`
	ProviderReference *string   `json:"provider_reference,omitempty"`
	CreatedAt         time.Time `json:"created_at"`
	SentAt            *time.Time `json:"sent_at,omitempty"`
	AckedAt           *time.Time `json:"acked_at,omitempty"`
}
