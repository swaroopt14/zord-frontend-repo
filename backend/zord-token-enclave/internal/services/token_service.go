package services

import (
	"context"

	"zord-token-enclave/internal/crypto"
	"zord-token-enclave/internal/models"
	"zord-token-enclave/internal/repository"

	"github.com/google/uuid"
)

type TokenService struct {
	crypto *crypto.Crypto
	repo   *repository.TokenRepository
}

func NewTokenService(c *crypto.Crypto, r *repository.TokenRepository) *TokenService {
	return &TokenService{crypto: c, repo: r}
}

func (s *TokenService) Tokenize(ctx context.Context, tenantID, kind string, plaintext []byte) (string, error) {
	ciphertext, nonce, err := s.crypto.Encrypt(plaintext)
	if err != nil {
		return "", err
	}

	tokenID := uuid.New().String()

	rec := models.TokenRecord{
		TokenID:    tokenID,
		TenantID:   tenantID,
		Kind:       kind,
		Ciphertext: ciphertext,
		Nonce:      nonce,
		KeyVersion: 1,
		Status:     "ACTIVE",
	}

	if err := s.repo.Insert(ctx, rec); err != nil {
		return "", err
	}

	return tokenID, nil
}

func (s *TokenService) Detokenize(ctx context.Context, tokenID string) ([]byte, error) {
	rec, err := s.repo.Get(ctx, tokenID)
	if err != nil {
		return nil, err
	}

	return s.crypto.Decrypt(rec.Ciphertext, rec.Nonce)
}
