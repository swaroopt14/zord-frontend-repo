package services

import (
	"context"
	"crypto/rand"
	"database/sql"
	"encoding/hex"
	"errors"
	"fmt"
	"strings"

	"zord-edge/auth/workspacecode"
	"zord-edge/security"

	"github.com/google/uuid"
)

type AuthResult struct {
	TenantId   uuid.UUID
	TenantName string
}

func TenantReg(ctx context.Context, db *sql.DB, merchantName string) (uuid.UUID, string, error) {
	fullapikey, prefix, secretKey, err := GenerateApiKey(merchantName)
	if err != nil {
		return uuid.Nil, " ", err
	}

	hashedKey, err := security.HashApiKey(secretKey)
	if err != nil {
		return uuid.Nil, " ", err
	}

	tenantID := uuid.New()
	workspaceCode, err := generateAvailableWorkspaceCode(ctx, db, merchantName, tenantID)
	if err != nil {
		return uuid.Nil, "", err
	}

	query := `INSERT INTO tenants (
	tenant_id,
    tenant_name,
	workspace_code,
    key_prefix,
    key_hash
	)
	VALUES ($1, $2, $3, $4, $5)
	RETURNING tenant_id;`
	err = db.QueryRowContext(ctx, query, tenantID, merchantName, workspaceCode, prefix, hashedKey).Scan(&tenantID)
	if err != nil {
		return uuid.Nil, "", err
	}
	return tenantID, fullapikey, nil
}
func GenerateApiKey(prefix string) (string, string, string, error) {
	safePrefix := strings.ToLower(strings.ReplaceAll(prefix, " ", "_"))
	secretbytes := make([]byte, 32)
	_, err := rand.Read(secretbytes)
	if err != nil {
		return " ", " ", " ", err
	}
	secret := hex.EncodeToString(secretbytes)
	fullapikey := safePrefix + "." + secret
	return fullapikey, safePrefix, secret, nil

}

func splitAPIKey(raw string) (string, string, error) {
	parts := strings.SplitN(raw, ".", 2)
	if len(parts) != 2 {
		return "", "", errors.New("Invalid API Key Format")
	}
	return parts[0], parts[1], nil
}

func ValidateApiKey(ctx context.Context, db *sql.DB, rawapikey string) (*AuthResult, error) {
	prefix, secret, err := splitAPIKey(rawapikey)
	if err != nil {
		return nil, err
	}

	var tenantId uuid.UUID
	var hash string
	var tenantName string

	err = db.QueryRowContext(ctx,
		`SELECT tenant_id,key_hash,tenant_name 
			 FROM tenants
			 WHERE key_prefix=$1 AND is_active=true`, prefix,
	).Scan(&tenantId, &hash, &tenantName)
	if err != nil {
		return nil, errors.New("invalid API Key")
	}
	err = security.CompareApiKey(hash, secret)
	if err != nil {
		return nil, errors.New("Invalid API Key ")
	}

	return &AuthResult{TenantId: tenantId,
		TenantName: tenantName}, nil

}

func generateAvailableWorkspaceCode(ctx context.Context, db *sql.DB, merchantName string, tenantID uuid.UUID) (string, error) {
	baseCode := workspacecode.Sanitize(merchantName)
	candidates := []string{
		baseCode,
		workspacecode.WithDeterministicSuffix(baseCode, tenantID.String()),
	}

	for _, candidate := range candidates {
		var count int
		if err := db.QueryRowContext(ctx, `SELECT COUNT(*) FROM tenants WHERE workspace_code = $1`, candidate).Scan(&count); err != nil {
			return "", fmt.Errorf("check workspace code uniqueness: %w", err)
		}
		if count == 0 {
			return candidate, nil
		}
	}

	return "", errors.New("could not generate a unique workspace code")
}
