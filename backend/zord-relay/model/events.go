package model

import "time"

// DispatchCreatedEvent is published to Kafka when Service 4 commits to
// attempting a dispatch. It is the first event in the dispatch lifecycle.
// No PII. Service 5 consumes this to build its dispatch_index.
type DispatchCreatedEvent struct {
	EventID     string                   `json:"event_id"`
	EventType   string                   `json:"event_type"` // "DispatchCreated"
	TenantID    string                   `json:"tenant_id"`
	IntentID    string                   `json:"intent_id"`
	ContractID  string                   `json:"contract_id"`
	DispatchID  string                   `json:"dispatch_id"`
	TraceID     string                   `json:"trace_id"`
	SchemaVersion string                 `json:"schema_version"`
	CreatedAt   time.Time                `json:"created_at"`
	Payload     DispatchCreatedPayload   `json:"payload"`
}

type DispatchCreatedPayload struct {
	DispatchID           string               `json:"dispatch_id"`
	ConnectorID          string               `json:"connector_id"`
	CorridorID           string               `json:"corridor_id"`
	AttemptCount         int                  `json:"attempt_count"`
	CorrelationCarriers  CorrelationCarriers  `json:"correlation_carriers"`
}

// CorrelationCarriers are the two fingerprints embedded in the PSP call.
// L1 (reference_id): echoed back by PSP in webhook and poll responses.
// L2 (narration):    visible on bank statement — last resort for matching.
type CorrelationCarriers struct {
	ReferenceID string `json:"reference_id"` // = dispatch_id
	Narration   string `json:"narration"`    // = "ZRD:" + contract_id
}

// AttemptSentEvent is published just before the HTTP call fires to the PSP.
// It is the crash-recovery anchor: if Service 4 dies after this event but
// before ProviderAcked, we know a PSP call was in-flight for this dispatch_id.
// Service 4 can recover by querying the PSP using reference_id = dispatch_id.
type AttemptSentEvent struct {
	EventID       string           `json:"event_id"`
	EventType     string           `json:"event_type"` // "AttemptSent"
	TenantID      string           `json:"tenant_id"`
	IntentID      string           `json:"intent_id"`
	ContractID    string           `json:"contract_id"`
	DispatchID    string           `json:"dispatch_id"`
	TraceID       string           `json:"trace_id"`
	SchemaVersion string           `json:"schema_version"`
	CreatedAt     time.Time        `json:"created_at"`
	Payload       AttemptSentPayload `json:"payload"`
}

// AttemptSentPayload matches what Service 5 (Outcome Fusion) expects.
// CorrelationCarriers must be present so Service 5 can update dispatch_index
// with the carriers it will use to correlate incoming outcome signals.
type AttemptSentPayload struct {
	DispatchID          string              `json:"dispatch_id"`
	ConnectorID         string              `json:"connector_id"`
	CorridorID          string              `json:"corridor_id"`
	AttemptCount        int                 `json:"attempt_count"`
	SentAt              time.Time           `json:"sent_at"`
	CorrelationCarriers CorrelationCarriers `json:"correlation_carriers"`
}

// ProviderAckedEvent is published after the PSP returns 200 OK.
// status = "pending" at this point — the money has not moved yet.
// provider_reference (UTR) is null until outcome arrives via webhook/statement.
type ProviderAckedEvent struct {
	EventID       string               `json:"event_id"`
	EventType     string               `json:"event_type"` // "ProviderAcked"
	TenantID      string               `json:"tenant_id"`
	IntentID      string               `json:"intent_id"`
	ContractID    string               `json:"contract_id"`
	DispatchID    string               `json:"dispatch_id"`
	TraceID       string               `json:"trace_id"`
	SchemaVersion string               `json:"schema_version"`
	CreatedAt     time.Time            `json:"created_at"`
	Payload       ProviderAckedPayload `json:"payload"`
}

type ProviderAckedPayload struct {
	DispatchID        string  `json:"dispatch_id"`
	ProviderAttemptID string  `json:"provider_attempt_id"` // e.g. rp_payout_555
	ProviderReference *string `json:"provider_reference"`  // UTR — null until outcome
	Status            string  `json:"status"`              // "pending"
	AckedAt           string  `json:"acked_at"`
}

// DispatchFailedEvent is published when the PSP call fails after AttemptSent.
// It carries the failure reason so Service 5 can update dispatch_index.
type DispatchFailedEvent struct {
	EventID      string               `json:"event_id"`
	EventType    string               `json:"event_type"` // "DispatchFailed"
	TenantID     string               `json:"tenant_id"`
	IntentID     string               `json:"intent_id"`
	ContractID   string               `json:"contract_id"`
	DispatchID   string               `json:"dispatch_id"`
	TraceID      string               `json:"trace_id"`
	SchemaVersion string              `json:"schema_version"`
	CreatedAt    time.Time            `json:"created_at"`
	Payload      DispatchFailedPayload `json:"payload"`
}

type DispatchFailedPayload struct {
	DispatchID   string    `json:"dispatch_id"`
	AttemptCount int       `json:"attempt_count"`
	Reason       string    `json:"reason"`
	FailedAt     time.Time `json:"failed_at"`
}
