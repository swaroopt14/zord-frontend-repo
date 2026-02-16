package model

import "time"

type PayoutContract struct {
	ContractID      string    `json:"contract_id"`
	TenantID        string    `json:"tenant_id"`
	IntentID        string    `json:"intent_id"`
	EnvelopeID      string    `json:"envelope_id"`
	ContractPayload []byte    `json:"contract_payload"` // or json.RawMessage
	ContractHash    string    `json:"contract_hash"`
	Status          string    `json:"status"`
	CreatedAt       time.Time `json:"created_at"`
	TraceID         *string   `json:"trace_id,omitempty"`
}
