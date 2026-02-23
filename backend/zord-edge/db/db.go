package db

import (
	"database/sql"
	"log"
)

var DB *sql.DB

func CreateTable() error {

	tenant :=
		`CREATE TABLE IF NOT EXISTS "tenants" (
    tenant_id   UUID PRIMARY KEY DEFAULT gen_random_uuid(), -- Unique identifier for each tenant
    tenant_name TEXT NOT NULL UNIQUE,                      -- Human-readable tenant name
    key_prefix  TEXT NOT NULL UNIQUE,                      -- Unique prefix for tenant keys
    key_hash    TEXT NOT NULL,                             -- Hashed version of tenant key
    is_active   BOOLEAN NOT NULL DEFAULT true,             -- Whether tenant is active
    created_at  TIMESTAMPTZ DEFAULT now()                  -- Timestamp of creation
);`
	_, err := DB.Exec(tenant)
	if err != nil {
		log.Fatal(err)
		return err
	}

	ingress_envelope :=

		`CREATE TABLE IF NOT EXISTS "ingress_envelopes"(
			trace_id UUID NOT NULL,
			envelope_id UUID PRIMARY KEY,
			tenant_id UUID NOT NULL,
			source TEXT,
			source_system TEXT,
			idempotency_key TEXT NOT NULL,
			payload_hash TEXT,
			object_ref TEXT,
			parse_status TEXT NOT NULL,
			amount_value NUMERIC(18,6),
			amount_currency CHAR(3),
			signature_status TEXT,
			received_at TIMESTAMPTZ NOT NULL DEFAULT now(),
			CONSTRAINT chk_signature_status
			CHECK ( signature_status IS NULL
    		OR signature_status IN ('VERIFIED', 'FAILED', 'NOT_REQUIRED')),
			CONSTRAINT chk_parse_status
    		CHECK (parse_status IN ('RECEIVED', 'INVALID', 'ACCEPTED')),
			CONSTRAINT uq_tenant_idempotency
       		 UNIQUE (tenant_id, idempotency_key)
	);`

	_, err = DB.Exec(ingress_envelope)
	if err != nil {
		log.Fatal(err)
	}
	return nil

}
