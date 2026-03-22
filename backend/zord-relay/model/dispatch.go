package model

import "time"

// DispatchStatus represents the lifecycle state of a single dispatch attempt.
type DispatchStatus string

const (
	DispatchStatusPending      DispatchStatus = "PENDING"
	DispatchStatusSent         DispatchStatus = "SENT"
	DispatchStatusProviderAcked DispatchStatus = "PROVIDER_ACKED"
	DispatchStatusFailed       DispatchStatus = "FAILED"
)

// Dispatch tracks a single PSP dispatch attempt for a contract.
// One contract may have multiple Dispatch rows (one per attempt_count).
// dispatch_id is minted by Service 4 and is the idempotency key sent to the PSP
// as reference_id — it must never be re-minted on retry for the same attempt.
type Dispatch struct {
	DispatchID        string         `db:"dispatch_id"`
	ContractID        string         `db:"contract_id"`
	IntentID          string         `db:"intent_id"`
	TenantID          string         `db:"tenant_id"`
	TraceID           string         `db:"trace_id"`
	ConnectorID       string         `db:"connector_id"`
	CorridorID        string         `db:"corridor_id"`
	AttemptCount      int            `db:"attempt_count"`
	Status            DispatchStatus `db:"status"`
	ProviderAttemptID *string        `db:"provider_attempt_id"`
	ProviderReference *string        `db:"provider_reference"`
	CreatedAt         time.Time      `db:"created_at"`
	SentAt            *time.Time     `db:"sent_at"`
	AckedAt           *time.Time     `db:"acked_at"`
}
