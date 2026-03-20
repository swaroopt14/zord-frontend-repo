package services

import (
	"context"

	"zord-token-enclave/internal/crypto"
)

type TokenService struct {
	crypto *crypto.Crypto
}

// ✅ Constructor (no repo)
func NewTokenService(c *crypto.Crypto) *TokenService {
	return &TokenService{crypto: c}
}

// ✅ Single field tokenize (stateless)
func (s *TokenService) Tokenize(
	ctx context.Context,
	tenantID,
	kind string,
	plaintext []byte,
) (string, error) {

	// tenantID & kind kept for compatibility (can be used later)
	return s.crypto.EncryptToToken(plaintext)
}

// ✅ Bulk tokenize (UNCHANGED logic)
func (s *TokenService) TokenizePII(
	ctx context.Context,
	tenantID string,
	traceID string,
	pii map[string]string,
) (map[string]string, error) {

	result := make(map[string]string)

	for field, value := range pii {

		if value == "" {
			continue
		}

		token, err := s.Tokenize(ctx, tenantID, field, []byte(value))
		if err != nil {
			return nil, err
		}

		result[field] = token
	}

	return result, nil
}

// ✅ Bulk detokenize (stateless)
func (s *TokenService) DetokenizeFields(
	tokens map[string]string,
) (map[string]string, error) {

	result := make(map[string]string)

	for field, token := range tokens {

		if token == "" {
			continue
		}

		plain, err := s.crypto.DecryptFromToken(token)
		if err != nil {
			return nil, err
		}

		result[field] = string(plain)
	}

	return result, nil
}
