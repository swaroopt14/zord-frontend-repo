package db

import (
	"database/sql"
	"log"
)

var DB *sql.DB

func CreateTables() error {

	// PAYMENT INTENTS (OWNED)
	paymentIntents := `
	CREATE TABLE IF NOT EXISTS payment_intents (
		intent_id UUID PRIMARY KEY,
		envelope_id UUID NOT NULL REFERENCES ingress_envelopes(envelope_id),
		tenant_id UUID NOT NULL REFERENCES tenants(tenant_id),

		intent_type TEXT NOT NULL,
		canonical_version TEXT NOT NULL,
		schema_version TEXT,

		amount NUMERIC(18,2) NOT NULL,
		currency CHAR(3) NOT NULL,
		deadline_at TIMESTAMPTZ,

		constraints JSONB,
		beneficiary_type TEXT,
		pii_tokens JSONB,
		beneficiary JSONB,

		status TEXT NOT NULL,
		confidence_score NUMERIC(5,2),

		created_at TIMESTAMPTZ NOT NULL DEFAULT now()
	);`

	if _, err := DB.Exec(paymentIntents); err != nil {
		return err
	}

	// DLQ ITEMS (OWNED)
	dlqItems := `
	CREATE TABLE IF NOT EXISTS dlq_items (
		dlq_id UUID PRIMARY KEY,
		tenant_id UUID NOT NULL REFERENCES tenants(tenant_id),
		envelope_id UUID NOT NULL REFERENCES ingress_envelopes(envelope_id),

		stage TEXT NOT NULL,
		reason_code TEXT NOT NULL,
		error_detail TEXT,
		replayable BOOLEAN NOT NULL,

		created_at TIMESTAMPTZ NOT NULL DEFAULT now()
	);`

	if _, err := DB.Exec(dlqItems); err != nil {
		return err
	}

	log.Println("✅ Canonical Intent Engine tables ensured")
	return nil
}
