package security

import (
	"context"
	"crypto/ed25519"
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"strings"
	"time"
)

type TokenManager struct {
	privateKey ed25519.PrivateKey
	publicKey  ed25519.PublicKey
	issuer     string
	audience   string
	accessTTL  time.Duration
	now        func() time.Time
}

type AccessClaims struct {
	Subject       string `json:"sub"`
	TenantID      string `json:"tenant_id"`
	WorkspaceCode string `json:"workspace_code"`
	Role          string `json:"role"`
	Email         string `json:"email"`
	SessionID     string `json:"session_id"`
	Issuer        string `json:"iss"`
	Audience      string `json:"aud"`
	IssuedAt      int64  `json:"iat"`
	ExpiresAt     int64  `json:"exp"`
	JWTID         string `json:"jti"`
	TokenUse      string `json:"token_use"`
}

type IssueAccessTokenInput struct {
	Subject       string
	TenantID      string
	WorkspaceCode string
	Role          string
	Email         string
	SessionID     string
	JWTID         string
}

func NewTokenManager(signingKeyPath string, signingKeyBase64 string, issuer string, audience string, accessTTL time.Duration, allowEphemeral bool) (*TokenManager, error) {
	privateKey, err := LoadEd25519PrivateKey(signingKeyPath, signingKeyBase64, allowEphemeral)
	if err != nil {
		return nil, err
	}

	return &TokenManager{
		privateKey: privateKey,
		publicKey:  privateKey.Public().(ed25519.PublicKey),
		issuer:     issuer,
		audience:   audience,
		accessTTL:  accessTTL,
		now:        time.Now,
	}, nil
}

func (m *TokenManager) IssueAccessToken(_ context.Context, input IssueAccessTokenInput) (string, AccessClaims, error) {
	issuedAt := m.now().UTC()
	expiresAt := issuedAt.Add(m.accessTTL)

	claims := AccessClaims{
		Subject:       input.Subject,
		TenantID:      input.TenantID,
		WorkspaceCode: input.WorkspaceCode,
		Role:          input.Role,
		Email:         input.Email,
		SessionID:     input.SessionID,
		Issuer:        m.issuer,
		Audience:      m.audience,
		IssuedAt:      issuedAt.Unix(),
		ExpiresAt:     expiresAt.Unix(),
		JWTID:         input.JWTID,
		TokenUse:      "access",
	}

	encodedHeader, err := encodeSegment(map[string]string{
		"alg": "EdDSA",
		"typ": "JWT",
	})
	if err != nil {
		return "", AccessClaims{}, err
	}

	encodedClaims, err := encodeSegment(claims)
	if err != nil {
		return "", AccessClaims{}, err
	}

	signingInput := encodedHeader + "." + encodedClaims
	signature := ed25519.Sign(m.privateKey, []byte(signingInput))
	token := signingInput + "." + base64.RawURLEncoding.EncodeToString(signature)
	return token, claims, nil
}

func (m *TokenManager) VerifyAccessToken(token string) (*AccessClaims, error) {
	parts := strings.Split(token, ".")
	if len(parts) != 3 {
		return nil, errors.New("invalid token format")
	}

	signingInput := parts[0] + "." + parts[1]
	signature, err := base64.RawURLEncoding.DecodeString(parts[2])
	if err != nil {
		return nil, fmt.Errorf("decode token signature: %w", err)
	}

	if !ed25519.Verify(m.publicKey, []byte(signingInput), signature) {
		return nil, errors.New("invalid token signature")
	}

	payload, err := base64.RawURLEncoding.DecodeString(parts[1])
	if err != nil {
		return nil, fmt.Errorf("decode token payload: %w", err)
	}

	var claims AccessClaims
	if err := json.Unmarshal(payload, &claims); err != nil {
		return nil, fmt.Errorf("unmarshal token claims: %w", err)
	}

	now := m.now().UTC().Unix()
	if claims.TokenUse != "access" {
		return nil, errors.New("invalid token type")
	}
	if claims.Issuer != m.issuer {
		return nil, errors.New("invalid token issuer")
	}
	if claims.Audience != m.audience {
		return nil, errors.New("invalid token audience")
	}
	if claims.ExpiresAt <= now {
		return nil, errors.New("token expired")
	}

	return &claims, nil
}

func GenerateOpaqueToken() (string, error) {
	raw := make([]byte, 48)
	if _, err := rand.Read(raw); err != nil {
		return "", fmt.Errorf("generate opaque token: %w", err)
	}
	return base64.RawURLEncoding.EncodeToString(raw), nil
}

func HashOpaqueToken(raw string) string {
	sum := sha256.Sum256([]byte(raw))
	return hex.EncodeToString(sum[:])
}

func encodeSegment(value any) (string, error) {
	payload, err := json.Marshal(value)
	if err != nil {
		return "", fmt.Errorf("marshal jwt segment: %w", err)
	}
	return base64.RawURLEncoding.EncodeToString(payload), nil
}
