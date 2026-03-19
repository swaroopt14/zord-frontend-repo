package models

import "time"

// ProjectionState represents one row in the projection_state table.
//
// A projection is a computed KPI number derived from Kafka events.
// Examples:
//   - "razorpay.UPI success rate in last 24h = 97%"
//   - "cashfree.IMPS finality p95 in last 24h = 8 minutes"
//   - "tenant tnt_A evidence readiness = 91%"
//
// ZPI computes these numbers continuously as events arrive from Kafka.
// The frontend reads them via GET /v1/intelligence/kpis

type ProjectionState struct {
	ID                int64     `json:"id" db:"id"`
	TenantID          string    `json:"tenant_id" db:"tenant_id"`
	ProjectionKey     string    `json:"projection_key" db:"projection_key"`
	WindowStart       time.Time `json:"window_start" db:"window_start"`
	WindowEnd         time.Time `json:"window_end" db:"window_end"`
	ValueJSON         string    `json:"value_json" db:"value_json"`
	ComputedAt        time.Time `json:"computed_at" db:"computed_at"`
	ProjectionVersion int       `json:"projection_version" db:"projection_version"`
}

// ── Projection Value Types ────────────────────────────────────────────────────
// These are the shapes stored inside ValueJSON above.
// projection_service.go marshals these to JSON before saving.
// kpi_handler.go can unmarshal them to send structured data to frontend.

// SuccessRateValue is stored in ProjectionState.ValueJSON
// for projection_key like "corridor.success_rate.razorpay_UPI"
type SuccessRateValue struct {
	Rate         float64   `json:"rate"`          // 0.0 to 1.0 e.g. 0.97
	SettledCount int       `json:"settled_count"` // how many SETTLED
	TotalCount   int       `json:"total_count"`   // how many total
	UpdatedAt    time.Time `json:"updated_at"`
}

// FinalityLatencyValue is stored in ProjectionState.ValueJSON
// for projection_key like "corridor.finality_p95.razorpay_UPI"
type FinalityLatencyValue struct {
	P50Seconds float64   `json:"p50_seconds"` // median time to finality
	P95Seconds float64   `json:"p95_seconds"` // 95th percentile — the SLA number
	Count      int       `json:"count"`       // how many data points
	UpdatedAt  time.Time `json:"updated_at"`
}

// EvidenceReadinessValue is stored in ProjectionState.ValueJSON
// for projection_key "tenant.evidence_readiness"
type EvidenceReadinessValue struct {
	Rate         float64   `json:"rate"`          // 0.0 to 1.0
	WithEvidence int       `json:"with_evidence"` // contracts that have evidence packs
	TotalSettled int       `json:"total_settled"` // total settled contracts
	UpdatedAt    time.Time `json:"updated_at"`
}

// FailureTaxonomyValue is stored in ProjectionState.ValueJSON
// for projection_key like "corridor.failure_taxonomy.razorpay_UPI"
type FailureTaxonomyValue struct {
	TopReasons []ReasonCount `json:"top_reasons"` // sorted by count, top 5
	TotalFails int           `json:"total_fails"`
	UpdatedAt  time.Time     `json:"updated_at"`
}

// ReasonCount is one entry inside FailureTaxonomyValue.TopReasons
type ReasonCount struct {
	ReasonCode string  `json:"reason_code"` // e.g. "INSUFFICIENT_FUNDS"
	Count      int     `json:"count"`
	Rate       float64 `json:"rate"` // count / total_fails
}

// PendingBacklogValue is stored in ProjectionState.ValueJSON
// for projection_key like "corridor.pending_backlog.razorpay_UPI"
type PendingBacklogValue struct {
	TotalPending  int       `json:"total_pending"`
	Bucket0to10m  int       `json:"bucket_0_10m"`   // pending 0-10 minutes
	Bucket10to60m int       `json:"bucket_10_60m"`  // pending 10-60 minutes
	Bucket1to6h   int       `json:"bucket_1_6h"`    // pending 1-6 hours
	Bucket6hPlus  int       `json:"bucket_6h_plus"` // pending 6+ hours (critical)
	UpdatedAt     time.Time `json:"updated_at"`
}

// SLABreachRateValue is stored in ProjectionState.ValueJSON
// for projection_key "tenant.sla_breach_rate"
//
// Tracks SLA compliance per tenant per day.
// An SLA timer is "breached" when:
//   1. Timer reaches its deadline (created_at + SLA_DURATION)
//   2. But payout is still PENDING (not SETTLED/FAILED/REVERSED)
//   3. We say "the SLA was breached"
//
// Example:
//   tenant_id "tnt_A" on 2024-01-15:
//   - total_processed: 1000 intents that reached finality
//   - breached: 45 (exceeded their SLA deadline)
//   - on_time: 955 (settled before deadline)
//   - breach_rate: 0.045 (45/1000)
//   - avg_breach_seconds: 1200 (average 20 minutes late)
type SLABreachRateValue struct {
	TotalProcessed     int       `json:"total_processed"`      // intents finalized in window
	Breached           int       `json:"breached"`             // exceeded SLA
	OnTime             int       `json:"on_time"`              // met SLA
	BreachRate         float64   `json:"breach_rate"`          // breached / total_processed
	AvgBreachSeconds   float64   `json:"avg_breach_seconds"`   // average late time
	TotalBreachSeconds int64     `json:"total_breach_seconds"` // running sum (for incremental avg)
	UpdatedAt          time.Time `json:"updated_at"`
}
