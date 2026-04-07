package security

import (
	"context"
	"crypto/ed25519"
	"testing"
	"time"
)

func TestIssueAndVerifyAccessToken(t *testing.T) {
	publicKey, privateKey, err := ed25519.GenerateKey(nil)
	if err != nil {
		t.Fatalf("GenerateKey returned error: %v", err)
	}

	manager := &TokenManager{
		privateKey: privateKey,
		publicKey:  publicKey,
		issuer:     "zord-edge",
		audience:   "zord-console",
		accessTTL:  15 * time.Minute,
		now: func() time.Time {
			return time.Unix(1_700_000_000, 0).UTC()
		},
	}

	token, claims, err := manager.IssueAccessToken(context.Background(), IssueAccessTokenInput{
		Subject:       "user-123",
		TenantID:      "tenant-123",
		WorkspaceCode: "acme-pay",
		Role:          "ADMIN",
		Email:         "admin@example.com",
		SessionID:     "session-123",
		JWTID:         "jwt-123",
	})
	if err != nil {
		t.Fatalf("IssueAccessToken returned error: %v", err)
	}

	if claims.Role != "ADMIN" {
		t.Fatalf("expected ADMIN role in issued claims, got %s", claims.Role)
	}

	verifiedClaims, err := manager.VerifyAccessToken(token)
	if err != nil {
		t.Fatalf("VerifyAccessToken returned error: %v", err)
	}

	if verifiedClaims.Subject != "user-123" {
		t.Fatalf("expected subject user-123, got %s", verifiedClaims.Subject)
	}
}
