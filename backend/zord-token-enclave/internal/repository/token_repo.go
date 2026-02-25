package repository

import (
	"context"
	"database/sql"
	"time"

	"zord-token-enclave/internal/models"

	"github.com/google/uuid"
)

type TokenRepository struct {
	db *sql.DB
}

func NewTokenRepository(db *sql.DB) *TokenRepository {
	return &TokenRepository{db: db}
}

// ✅ Updated: now also inserts audit record
func (r *TokenRepository) Insert(ctx context.Context, t models.TokenRecord) error {

	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return err
	}
	defer tx.Rollback()

	// Insert token_map
	_, err = tx.ExecContext(ctx, `
		INSERT INTO token_map 
		(token_id, tenant_id, kind, ciphertext, nonce, key_version, status, created_at)
		VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
	`,
		t.TokenID,
		t.TenantID,
		t.Kind,
		t.Ciphertext,
		t.Nonce,
		t.KeyVersion,
		t.Status,
		time.Now().UTC(),
	)
	if err != nil {
		return err
	}

	// Insert token_audit
	_, err = tx.ExecContext(ctx, `
		INSERT INTO token_audit
		(audit_id, token_id, tenant_id, actor, action, purpose, decision, trace_id, created_at)
		VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
	`,
		uuid.New().String(),
		t.TokenID,
		t.TenantID,
		"service-2",         // actor
		"TOKENIZE",          // action
		"INTENT_PROCESSING", // purpose
		"ALLOW",             // decision
		"",                  // trace_id (can upgrade later)
		time.Now().UTC(),
	)
	if err != nil {
		return err
	}

	return tx.Commit()
}

func (r *TokenRepository) Get(ctx context.Context, tokenID string) (*models.TokenRecord, error) {
	row := r.db.QueryRowContext(ctx, `
		SELECT token_id, tenant_id, kind, ciphertext, nonce, key_version, status, created_at
		FROM token_map WHERE token_id=$1
	`, tokenID)

	var t models.TokenRecord
	err := row.Scan(&t.TokenID, &t.TenantID, &t.Kind, &t.Ciphertext, &t.Nonce, &t.KeyVersion, &t.Status, &t.CreatedAt)
	if err != nil {
		return nil, err
	}
	return &t, nil
}
