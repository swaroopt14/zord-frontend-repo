package db

import (
	"database/sql"
	"log"
)

var DB *sql.DB

func CreateTables() error {

	paymentIntents := `
	CREATE TABLE IF NOT EXISTS payment_intents (
    intent_id UUID PRIMARY KEY,
    envelope_id UUID NOT NULL,
    tenant_id UUID NOT NULL,

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

    -- 🆕 WORM / Tamper-evidence fields
    canonical_hash TEXT NOT NULL,
    prev_hash TEXT,
    canonical_ref TEXT NOT NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);`

	if _, err := DB.Exec(paymentIntents); err != nil {
		return err
	}
	//Outbox (OWNED)
	outbox := `
	CREATE TABLE IF NOT EXISTS outbox (
    outbox_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    tenant_id UUID NOT NULL,

    -- intent-specific outbox
    aggregate_type TEXT NOT NULL DEFAULT 'intent',
    aggregate_id UUID NOT NULL, -- payment_intents.intent_id

    event_type TEXT NOT NULL,   -- intent.created.v1, intent.updated.v1
    payload JSONB NOT NULL,     -- downstream message body (no raw PII)

    status TEXT NOT NULL DEFAULT 'PENDING',
    attempts INT NOT NULL DEFAULT 0,
    next_attempt_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    sent_at TIMESTAMPTZ,

    -- tracing / observability
    trace_id VARCHAR(255),
    envelope_id VARCHAR(255),

    CONSTRAINT fk_outbox_intent
        FOREIGN KEY (aggregate_id)
        REFERENCES payment_intents(intent_id)
        ON DELETE RESTRICT,

    CONSTRAINT chk_outbox_status
        CHECK (status IN ('PENDING', 'SENT', 'FAILED')),

    CONSTRAINT chk_outbox_aggregate_type
        CHECK (aggregate_type = 'intent')
);
`

	if _, err := DB.Exec(outbox); err != nil {
		return err
	}
	// DLQ ITEMS (OWNED)
	dlqItems := `
	CREATE TABLE IF NOT EXISTS dlq_items (
		dlq_id UUID PRIMARY KEY,
		tenant_id UUID NOT NULL,
		envelope_id UUID NOT NULL,

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
