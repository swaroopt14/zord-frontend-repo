package repository

import (
	"context"
	"database/sql"

	"zord-token-enclave/internal/models"
)

type TokenRepository struct {
	db *sql.DB
}

func NewTokenRepository(db *sql.DB) *TokenRepository {
	return &TokenRepository{db: db}
}

func (r *TokenRepository) Insert(ctx context.Context, t models.TokenRecord) error {
	_, err := r.db.ExecContext(ctx, `
		INSERT INTO token_map (token_id, tenant_id, kind, ciphertext, nonce, key_version, status)
		VALUES ($1,$2,$3,$4,$5,$6,$7)
	`, t.TokenID, t.TenantID, t.Kind, t.Ciphertext, t.Nonce, t.KeyVersion, t.Status)
	return err
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
