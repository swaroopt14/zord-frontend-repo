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

// ✅ Existing single-field tokenization (UNCHANGED)
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

// ✅ NEW: Bulk PII tokenization
func (s *TokenService) TokenizePII(
	ctx context.Context,
	tenantID string,
	traceID string,
	pii map[string]string,
) (map[string]string, error) {

	result := make(map[string]string)

	for kind, value := range pii {

		if value == "" {
			continue
		}

		// Reuse existing Tokenize logic
		tokenID, err := s.Tokenize(ctx, tenantID, kind, []byte(value))
		if err != nil {
			return nil, err
		}

		result[kind] = tokenID
	}

	return result, nil
}

// ✅ Existing detokenization (UNCHANGED)
func (s *TokenService) Detokenize(ctx context.Context, tokenID string) ([]byte, error) {
	rec, err := s.repo.Get(ctx, tokenID)
	if err != nil {
		return nil, err
	}

	return s.crypto.Decrypt(rec.Ciphertext, rec.Nonce)
}
