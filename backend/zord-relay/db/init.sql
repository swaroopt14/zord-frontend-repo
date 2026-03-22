-- dispatches: tracks every PSP dispatch attempt for a contract.
-- One row per (contract_id, attempt_count)  enforced by unique index.
-- dispatch_id is the idempotency key sent to the PSP as reference_id.
-- It is minted once and never re-minted on retry for the same attempt.
CREATE TABLE IF NOT EXISTS dispatches (
    dispatch_id          TEXT        NOT NULL,
    contract_id          TEXT        NOT NULL,
    intent_id            TEXT        NOT NULL,
    tenant_id            TEXT        NOT NULL,
    trace_id             TEXT        NOT NULL,
    connector_id         TEXT        NOT NULL,
    corridor_id          TEXT        NOT NULL,
    attempt_count        INTEGER     NOT NULL DEFAULT 1,
    status               TEXT        NOT NULL DEFAULT 'PENDING',
    -- status values: PENDING | SENT | PROVIDER_ACKED | FAILED
    provider_attempt_id  TEXT,        -- PSP's payout ID (e.g. rp_payout_555)
    provider_reference   TEXT,        -- UTR — null until outcome arrives via Service 5
    created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
    sent_at              TIMESTAMPTZ,
    acked_at             TIMESTAMPTZ,

    PRIMARY KEY (dispatch_id)
);

-- Unique constraint: one dispatch row per (contract, attempt).
-- This enforces the idempotency invariant at the DB level.
-- If two relay instances race to insert the same (contract_id, attempt_count),
-- one will get a unique violation — the winner proceeds, the loser backs off.
CREATE UNIQUE INDEX IF NOT EXISTS idx_dispatches_contract_attempt
    ON dispatches (contract_id, attempt_count);

-- Supporting indexes for lookups.
CREATE INDEX IF NOT EXISTS idx_dispatches_intent_id
    ON dispatches (intent_id);

CREATE INDEX IF NOT EXISTS idx_dispatches_status
    ON dispatches (status)
    WHERE status IN ('PENDING', 'SENT');

-- relay_outbox: Service 4's own event durability table.
-- Events are written here atomically with dispatch state changes,
-- then published to Kafka by the relay loop independently.
-- Kafka downtime does not block dispatching.
-- No PII is ever stored in this table.
CREATE TABLE IF NOT EXISTS relay_outbox (
    event_id     TEXT        NOT NULL PRIMARY KEY,
    event_type   TEXT        NOT NULL,
    -- event_type values: DispatchCreated | AttemptSent | ProviderAcked | DispatchFailed
    dispatch_id  TEXT        NOT NULL,
    contract_id  TEXT        NOT NULL,
    intent_id    TEXT        NOT NULL,
    tenant_id    TEXT        NOT NULL,
    trace_id     TEXT        NOT NULL,
    payload      JSONB       NOT NULL, -- no PII ever
    status       TEXT        NOT NULL DEFAULT 'PENDING',
    -- status values: PENDING | PUBLISHED
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    published_at TIMESTAMPTZ
);

-- Partial index: only PENDING rows are ever queried by the relay loop.
-- As rows transition to PUBLISHED, they fall out of this index automatically.
-- This keeps the index small and the relay loop query fast even at high volume.
CREATE INDEX IF NOT EXISTS idx_relay_outbox_pending
    ON relay_outbox (created_at ASC)
    WHERE status = 'PENDING';

-- Supporting index for lookups by dispatch_id (debugging, reconciliation).
CREATE INDEX IF NOT EXISTS idx_relay_outbox_dispatch_id
    ON relay_outbox (dispatch_id);
