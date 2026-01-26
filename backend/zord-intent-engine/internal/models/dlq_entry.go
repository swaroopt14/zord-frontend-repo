package models

import "time"

// DLQEntry represents a failed ingestion/enrichment record
type DLQEntry struct {
	DLQID      string    `json:"dlq_id"`
	EnvelopeID string    `json:"envelope_id"`
	ReasonCode string    `json:"reason_code"`
	ReasonText string    `json:"reason_text"`
	CreatedAt  time.Time `json:"created_at"`
}
