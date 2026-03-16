DROP TABLE IF EXISTS payout_contracts CASCADE;

CREATE TABLE IF NOT EXISTS dispatches (
  dispatch_id          TEXT PRIMARY KEY,
  contract_id          TEXT NOT NULL,
  intent_id            TEXT NOT NULL,
  tenant_id            TEXT NOT NULL,
  trace_id             TEXT NOT NULL,
  connector_id         TEXT NOT NULL,
  corridor_id          TEXT NOT NULL,
  attempt_count        INTEGER NOT NULL DEFAULT 1,
  status               TEXT NOT NULL DEFAULT 'PENDING',
  provider_attempt_id  TEXT,
  provider_reference   TEXT,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  sent_at              TIMESTAMPTZ,
  acked_at             TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_dispatches_intent_id ON dispatches (intent_id);
CREATE INDEX IF NOT EXISTS idx_dispatches_contract_id ON dispatches (contract_id);
CREATE INDEX IF NOT EXISTS idx_dispatches_created_at ON dispatches (created_at);

CREATE TABLE IF NOT EXISTS relay_outbox (
  event_id        TEXT PRIMARY KEY,
  event_type      TEXT NOT NULL,
  dispatch_id     TEXT NOT NULL,
  contract_id     TEXT NOT NULL,
  intent_id       TEXT NOT NULL,
  tenant_id       TEXT NOT NULL,
  trace_id        TEXT NOT NULL,
  payload         JSONB NOT NULL,
  status          TEXT NOT NULL DEFAULT 'PENDING',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  published_at    TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_relay_outbox_status ON relay_outbox (status);
CREATE INDEX IF NOT EXISTS idx_relay_outbox_created_at ON relay_outbox (created_at);
