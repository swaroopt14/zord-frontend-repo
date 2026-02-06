package models

import (
	"encoding/json"
	"time"
)

type CanonicalIntent struct {
	IntentID   string `json:"intent_id"`
	EnvelopeID string `json:"envelope_id"`
	TenantID   string `json:"tenant_id"`

	// ✅ ADD THESE
	TraceID        string `json:"trace_id" db:"trace_id"`
	IdempotencyKey string `json:"idempotency_key" db:"idempotency_key"`
	SalientHash    string `json:"salient_hash" db:"salient_hash"`

	IntentType       string `json:"intent_type"`
	CanonicalVersion string `json:"canonical_version"`
	SchemaVersion    string `json:"schema_version"`

	Amount     float64    `json:"amount"`
	Currency   string     `json:"currency"`
	DeadlineAt *time.Time `json:"deadline_at,omitempty"`

	Constraints json.RawMessage `json:"constraints,omitempty"`

	BeneficiaryType string          `json:"beneficiary_type"`
	PIITokens       json.RawMessage `json:"pii_tokens,omitempty"`
	Beneficiary     json.RawMessage `json:"beneficiary,omitempty"`

	Status          string   `json:"status"`
	ConfidenceScore *float64 `json:"confidence_score,omitempty"`

	CreatedAt time.Time `json:"created_at"`

	// 🆕 WORM fields
	CanonicalRef  string `db:"canonical_ref"`
	CanonicalHash string `db:"canonical_hash"`
	PrevHash      string `db:"prev_hash"`
}
