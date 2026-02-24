package db

import "database/sql"

func CreateTables(db *sql.DB) error {
	tokenMap := `
	CREATE TABLE IF NOT EXISTS token_map (
		token_id UUID PRIMARY KEY,
		tenant_id UUID NOT NULL,
		kind TEXT NOT NULL,
		ciphertext BYTEA NOT NULL,
		nonce BYTEA NOT NULL,
		key_version INT NOT NULL,
		status TEXT NOT NULL DEFAULT 'ACTIVE',
		created_at TIMESTAMPTZ NOT NULL DEFAULT now()
	);`

	tokenAudit := `
	CREATE TABLE IF NOT EXISTS token_audit (
		audit_id UUID PRIMARY KEY,
		token_id UUID,
		tenant_id UUID,
		actor TEXT NOT NULL,
		action TEXT NOT NULL,
		purpose TEXT NOT NULL,
		decision TEXT NOT NULL,
		trace_id TEXT,
		created_at TIMESTAMPTZ NOT NULL DEFAULT now()
	);`

	if _, err := db.Exec(tokenMap); err != nil {
		return err
	}
	if _, err := db.Exec(tokenAudit); err != nil {
		return err
	}

	return nil
}
