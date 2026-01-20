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
	}
	log.Println("Tenant Table Created")
	return nil

}
