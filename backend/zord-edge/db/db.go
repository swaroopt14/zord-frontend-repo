package db

import (
	"database/sql"
	"log"
)

var DB *sql.DB

func CreateTable() error {

	tenant :=
		`CREATE TABLE IF NOT EXISTS "tenants" (
    tenant_id   UUID PRIMARY KEY DEFAULT gen_random_uuid(), 
    tenant_name TEXT NOT NULL UNIQUE,                     
    key_prefix  TEXT NOT NULL UNIQUE,                      
    key_hash    TEXT NOT NULL,                             
    is_active   BOOLEAN NOT NULL DEFAULT true,            
    created_at  TIMESTAMPTZ DEFAULT now()                 
	);`
	_, err := DB.Exec(tenant)
	if err != nil {
		log.Fatal(err)
		return err
	}

	idempotencyKeys :=
		`CREATE TABLE IF NOT EXISTS "idempotency_keys" (
	tenant_id UUID NOT NULL,
	idempotency_key TEXT NOT NULL,
	first_envelope_id  UUID NULL,
	status TEXT NOT NULL DEFAULT 'pending',
	created_at TIMESTAMPTZ DEFAULT now(),
	updated_at TIMESTAMPTZ DEFAULT now(),
	PRIMARY KEY (tenant_id, idempotency_key),
	UNIQUE (tenant_id, idempotency_key)
);`
	_, err = DB.Exec(idempotencyKeys)
	if err != nil {
		log.Fatal(err)
	}

	ingress_envelope :=
		`CREATE TABLE IF NOT EXISTS "ingress_envelopes"(
	trace_id UUID NOT NULL,
	envelope_id UUID PRIMARY KEY,
	tenant_id UUID NOT NULL,
	source TEXT NOT NULL,
	source_system TEXT NOT NULL,
	content_type TEXT NOT NULL,
	idempotency_key TEXT NOT NULL,
	payload_size INT NOT NULL,
	payload_hash BYTEA NOT NULL,
	envelope_hash BYTEA NOT NULL,
	envelope_signature BYTEA NOT NULL,
	vault_object_ref TEXT,
	received_at TIMESTAMPTZ NOT NULL,
	status TEXT NOT NULL DEFAULT 'pending'
	--error_code TEXT,
    --error_detail TEXT
	);`

	_, err = DB.Exec(ingress_envelope)
	if err != nil {
		log.Fatal(err)
	}

	rawEnvelopeIndexes := `
	CREATE INDEX IF NOT EXISTS idx_raw_env_tenant_time
	ON ingress_envelopes (tenant_id, received_at DESC);

	CREATE INDEX IF NOT EXISTS idx_raw_env_status
	ON ingress_envelopes (status, received_at);`

	_, err = DB.Exec(rawEnvelopeIndexes)
	if err != nil {
		log.Fatal(err)
	}
	return nil
}
