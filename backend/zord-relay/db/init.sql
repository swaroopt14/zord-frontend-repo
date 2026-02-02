CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS tenants (
    tenant_id UUID PRIMARY KEY
);

CREATE TABLE IF NOT EXISTS payment_intents (
    intent_id UUID PRIMARY KEY
);

CREATE TABLE IF NOT EXISTS ingress_envelopes (
    envelope_id UUID PRIMARY KEY
);

CREATE TABLE IF NOT EXISTS outbox (
    outbox_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    aggregate_type TEXT NOT NULL DEFAULT 'intent',
    aggregate_id UUID NOT NULL,
    event_type TEXT NOT NULL,
    payload JSONB NOT NULL,
    status TEXT NOT NULL DEFAULT 'PENDING',
    attempts INT NOT NULL DEFAULT 0,
    next_attempt_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    sent_at TIMESTAMPTZ,
    trace_id VARCHAR(255),
    envelope_id VARCHAR(255),
    CONSTRAINT fk_outbox_intent FOREIGN KEY (aggregate_id) REFERENCES payment_intents(intent_id) ON DELETE RESTRICT,
    CONSTRAINT chk_outbox_status CHECK (status IN ('PENDING', 'SENT', 'FAILED')),
    CONSTRAINT chk_outbox_aggregate_type CHECK (aggregate_type = 'intent')
);

CREATE INDEX IF NOT EXISTS idx_outbox_status_next_attempt ON outbox (status, next_attempt_at);

CREATE TABLE IF NOT EXISTS dlq_items (
    dlq_id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id),
    envelope_id UUID NOT NULL REFERENCES ingress_envelopes(envelope_id),
    stage TEXT NOT NULL,
    reason_code TEXT NOT NULL,
    error_detail TEXT,
    replayable BOOLEAN NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS payout_contracts (
    contract_id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id),
    intent_id UUID NOT NULL REFERENCES payment_intents(intent_id),
    envelope_id UUID NOT NULL REFERENCES ingress_envelopes(envelope_id),
    contract_payload JSONB NOT NULL,
    contract_hash CHAR(64) NOT NULL,
    status TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    trace_id VARCHAR(255),
    CONSTRAINT uq_contract_intent UNIQUE (intent_id),
    CONSTRAINT chk_contract_status CHECK (status IN ('ISSUED','SUBMITTED','SETTLING','SUCCEEDED','FAILED','CONFLICT','EXPIRED'))
);

CREATE INDEX IF NOT EXISTS idx_payout_contracts_created_at ON payout_contracts (created_at);
