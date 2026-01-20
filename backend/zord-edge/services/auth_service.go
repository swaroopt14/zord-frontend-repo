// Package services contains business logic for the Zord Edge service
package services

import (
	"context"
	"crypto/rand"
	"database/sql"
	"encoding/hex"
	"errors"
	"log"
	"strings"

	"github.com/google/uuid"
	"main.go/security" // Security utilities for API key hashing
)

// AuthResult contains the result of API key authentication
type AuthResult struct {
	TenantId uuid.UUID // The authenticated tenant's unique identifier
}

// TenantReg registers a new tenant/merchant in the system
// Generates an API key and stores the tenant credentials in the database
func TenantReg(ctx context.Context, db *sql.DB, merchantName string) {
	var TenantId uuid.UUID

	// Generate a new API key for the merchant
	prefix, ApiKey, err := GenerateApiKey(merchantName)
	if err != nil {
		log.Fatal("Failed to generate API Key")
	}

	// Hash the API key for secure storage
	hashedKey, err := security.HashApiKey(ApiKey)
	if err != nil {
		log.Fatal("Failed to Hash API Key")
	}

	// Insert tenant credentials into database
	query := `INSERT INTO tenant_credentials (
    tenant_name,
    key_prefix,
    key_hash
	)
	VALUES ($1, $2, $3);
	RETURNING tenant_id;`

	// Execute query and get the generated tenant ID
	db.QueryRowContext(ctx, query, merchantName, prefix, hashedKey).Scan(&TenantId)
}

// GenerateApiKey creates a new API key with a prefix and random secret
func GenerateApiKey(prefix string) (string, string, error) {
	// Generate 32 bytes of random data for the secret
	secretbytes := make([]byte, 32)
	_, err := rand.Read(secretbytes)
	if err != nil {
		return " ", " ", err
	}

	// Convert to hex string
	secret := hex.EncodeToString(secretbytes)

	// Create full API key: prefix.secret
	fullkey := prefix + "." + secret
	return prefix, fullkey, nil
}

// splitAPIKey splits an API key into prefix and secret parts
func splitAPIKey(raw string) (string, string, error) {
	parts := strings.SplitN(raw, ".", 2)
	if len(parts) != 2 {
		return "", "", errors.New("Invalid API Key Format")
	}
	return parts[0], parts[1], nil
}

// ValidateApiKey validates an API key against the database
// Returns AuthResult if valid, error if invalid
func ValidateApiKey(ctx context.Context, db *sql.DB, rawapikey string) (*AuthResult, error) {
	// Split the API key into prefix and secret
	prefix, secret, err := splitAPIKey(rawapikey)
	if err != nil {
		return nil, err
	}

	var tenantId uuid.UUID
	var hash string

	// Query database for the tenant ID and stored hash using prefix
	err = db.QueryRowContext(ctx,
		`SELECT tenant_id,key_hash
			 FROM api_keys
			 WHERE key_prefix=$1 AND is_active=true`, prefix,
	).Scan(&tenantId, &hash)
	if err != nil {
		return nil, errors.New("invalid API Key")
	}

	// Compare the provided secret with the stored hash
	err = security.CompareApiKey(hash, secret)
	if err != nil {
		return nil, errors.New("Invalid API Key ")
	}

	// Return successful authentication result
	return &AuthResult{TenantId: tenantId}, nil
}
