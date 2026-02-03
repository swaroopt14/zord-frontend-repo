CREATE TABLE IF NOT EXISTS payout_contracts (
    contract_id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    intent_id UUID NOT NULL,
    envelope_id UUID NOT NULL,
    contract_payload JSONB NOT NULL,
    contract_hash CHAR(64) NOT NULL,
    status TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    trace_id VARCHAR(255),
    CONSTRAINT uq_contract_intent UNIQUE (intent_id),
    CONSTRAINT chk_contract_status CHECK (status IN ('ISSUED','SUBMITTED','SETTLING','SUCCEEDED','FAILED','CONFLICT','EXPIRED'))
);

CREATE INDEX IF NOT EXISTS idx_payout_contracts_created_at ON payout_contracts (created_at);
