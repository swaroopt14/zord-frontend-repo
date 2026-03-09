package middleware

import (
	"bytes"
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"io"
	"log"
	"net/http"
	"os"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
)

// Mock secret store - in production this should come from DB/Vault
func getWebhookSecret(provider string, tenantID string) (string, error) {
	// For MVP/Demo, we use env var or hardcoded default
	// In reality, this would look up the secret for the specific tenant + provider
	secret := os.Getenv("WEBHOOK_SECRET_" + provider)
	if secret == "" {
		// Fallback for development/demo if .env is missing
		if provider == "razorpay" {
			return "b4201882d7764fabbe0494a61f43e4c5dc80a9c0c1e71a2ca40594338a95ccff", nil
		}
		return "test_secret", nil
	}
	return secret, nil
}

func resolveTenantID(c *gin.Context, provider string) string {
	if tenantID := c.GetHeader("X-PSP-Tenant-Id"); tenantID != "" {
		return tenantID
	}
	if tenantID := c.Query("tenant_id"); tenantID != "" {
		return tenantID
	}
	if tenantID := os.Getenv("WEBHOOK_TENANT_" + provider); tenantID != "" {
		return tenantID
	}
	return ""
}

func VerifyWebhookSignature() gin.HandlerFunc {
	return func(c *gin.Context) {
		provider := c.Param("provider")

		if provider == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Missing provider in path"})
			c.Abort()
			return
		}

		contentType := c.GetHeader("Content-Type")
		if contentType == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Missing Content-Type header"})
			c.Abort()
			return
		}
		if !strings.HasPrefix(strings.ToLower(contentType), "application/json") {
			c.JSON(http.StatusUnsupportedMediaType, gin.H{"error": "Content-Type must be application/json"})
			c.Abort()
			return
		}

		tenantID := resolveTenantID(c, provider)
		if tenantID == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Missing tenant id"})
			c.Abort()
			return
		}
		c.Set("tenant_id", tenantID)

		secret, err := getWebhookSecret(provider, tenantID)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve secret"})
			c.Abort()
			return
		}

		signatureHeader := c.GetHeader("X-PSP-Signature")
		timestampHeader := c.GetHeader("X-PSP-Timestamp")
		eventID := c.GetHeader("X-PSP-Event-Id")

		if signatureHeader == "" || timestampHeader == "" || eventID == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Missing required PSP headers"})
			c.Abort()
			return
		}

		ts, err := strconv.ParseInt(timestampHeader, 10, 64)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid X-PSP-Timestamp"})
			c.Abort()
			return
		}
		if time.Now().Unix()-ts > 300 {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Timestamp outside tolerance"})
			c.Abort()
			return
		}

		sigTimestamp, sigV1, err := parsePSPSignature(signatureHeader)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid X-PSP-Signature format"})
			c.Abort()
			return
		}
		if sigTimestamp != timestampHeader {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Timestamp mismatch"})
			c.Abort()
			return
		}

		body, err := io.ReadAll(c.Request.Body)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Failed to read request body"})
			c.Abort()
			return
		}
		c.Request.Body = io.NopCloser(bytes.NewBuffer(body))
		c.Set("raw_payload", body)

		if !verifySignatureV1(body, secret, timestampHeader, sigV1) {
			log.Printf("Webhook signature mismatch provider=%s event_id=%s", provider, eventID)
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid signature"})
			c.Abort()
			return
		}

		c.Set("psp_provider", provider)
		c.Set("psp_event_id", eventID)

		c.Next()
	}
}

func parsePSPSignature(header string) (timestamp string, v1 string, err error) {
	parts := strings.Split(header, ",")
	if len(parts) < 2 {
		return "", "", errors.New("invalid signature parts")
	}
	for _, part := range parts {
		part = strings.TrimSpace(part)
		if strings.HasPrefix(part, "t=") {
			timestamp = strings.TrimPrefix(part, "t=")
			continue
		}
		if strings.HasPrefix(part, "v1=") {
			v1 = strings.TrimPrefix(part, "v1=")
			continue
		}
	}
	if timestamp == "" || v1 == "" {
		return "", "", errors.New("missing t or v1")
	}
	if _, err := strconv.ParseInt(timestamp, 10, 64); err != nil {
		return "", "", errors.New("invalid t")
	}
	if _, err := hex.DecodeString(v1); err != nil {
		return "", "", errors.New("invalid v1")
	}
	return timestamp, strings.ToLower(v1), nil
}

func verifySignatureV1(payload []byte, secret, timestamp, signatureV1 string) bool {
	h := hmac.New(sha256.New, []byte(secret))
	h.Write([]byte(timestamp))
	h.Write([]byte("."))
	h.Write(payload)
	expectedSignature := hex.EncodeToString(h.Sum(nil))
	return hmac.Equal([]byte(expectedSignature), []byte(strings.ToLower(signatureV1)))
}
