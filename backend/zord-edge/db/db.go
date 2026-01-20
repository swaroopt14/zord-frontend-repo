// Package db handles database operations and table creation
package db

import (
	"database/sql"
	"log"
)

// DB is the global database connection instance
var DB *sql.DB

// CreateTable creates the necessary database tables if they don't exist
func CreateTable() error {
	// SQL statement to create the tenants table
	tenant :=
		`CREATE TABLE IF NOT EXISTS "tenants" (
    tenant_id   UUID PRIMARY KEY DEFAULT gen_random_uuid(), -- Unique identifier for each tenant
    tenant_name TEXT NOT NULL UNIQUE,                      -- Human-readable tenant name
    key_prefix  TEXT NOT NULL UNIQUE,                      -- Unique prefix for tenant keys
    key_hash    TEXT NOT NULL,                             -- Hashed version of tenant key
    is_active   BOOLEAN NOT NULL DEFAULT true,             -- Whether tenant is active
    created_at  TIMESTAMPTZ DEFAULT now()                  -- Timestamp of creation
);`

	// Execute the table creation query
	_, err := DB.Exec(tenant)
	if err != nil {
		log.Fatal(err)
	}

	// Log successful table creation
	log.Println("Tenant Table Created")
	return nil
}
