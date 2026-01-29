package db

import (
	"database/sql"
	"log"
)

var DB *sql.DB

func CreateTable() error {

	ingress_envelope :=

		`CREATE TABLE IF NOT EXISTS "ingress_envelopes"(
			trace_id UUID NOT NULL,
			envelope_id UUID PRIMARY KEY,
			tenant_id UUID NOT NULL,
			source TEXT NOT NULL,
			source_system TEXT NOT NULL,
			idempotency_key TEXT NOT NULL,
			payload_hash TEXT,
			object_ref TEXT,
			parse_status TEXT NOT NULL,
			amount_value NUMERIC(18,6) NOT NULL,
			amount_currency CHAR(3) NOT NULL,
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

	_, err := DB.Exec(ingress_envelope)
	if err != nil {
		log.Fatal(err)
	}
	return nil
}
