
package model

import "time"

type DispatchCreated struct {
	EventID    string    `json:"event_id"`
	EventType  string    `json:"event_type"`
	TenantID   string    `json:"tenant_id"`
	IntentID   string    `json:"intent_id"`
	ContractID string    `json:"contract_id"`
	TraceID    string    `json:"trace_id"`
	CreatedAt  time.Time `json:"created_at"`
	Payload    struct {
		DispatchID  string `json:"dispatch_id"`
		ConnectorID string `json:"connector_id"`
		CorridorID  string `json:"corridor_id"`
		AttemptCount int    `json:"attempt_count"`
	} `json:"payload"`
}

type AttemptSent struct {
	EventID    string    `json:"event_id"`
	EventType  string    `json:"event_type"`
	TenantID   string    `json:"tenant_id"`
	IntentID   string    `json:"intent_id"`
	ContractID string    `json:"contract_id"`
	TraceID    string    `json:"trace_id"`
	CreatedAt  time.Time `json:"created_at"`
	Payload    struct {
		DispatchID         string `json:"dispatch_id"`
		ConnectorID        string `json:"connector_id"`
		CorridorID         string `json:"corridor_id"`
		AttemptCount       int    `json:"attempt_count"`
		CorrelationCarriers map[string]interface{} `json:"correlation_carriers"`
	} `json:"payload"`
}

type ProviderAcked struct {
	EventID    string    `json:"event_id"`
	EventType  string    `json:"event_type"`
	TenantID   string    `json:"tenant_id"`
	IntentID   string    `json:"intent_id"`
	ContractID string    `json:"contract_id"`
	TraceID    string    `json:"trace_id"`
	CreatedAt  time.Time `json:"created_at"`
	Payload    struct {
		DispatchID       string `json:"dispatch_id"`
		ProviderAttemptID string `json:"provider_attempt_id"`
		Status           string `json:"status"`
	} `json:"payload"`
}
