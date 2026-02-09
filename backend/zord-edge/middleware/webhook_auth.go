package middleware

import (
	"bytes"
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"io"
	"log"
	"net/http"
	"os"

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

func VerifyWebhookSignature() gin.HandlerFunc {
	return func(c *gin.Context) {
		provider := c.Param("provider")
		if provider == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Provider is required"})
			c.Abort()
			return
		}

		// Read body
		body, err := io.ReadAll(c.Request.Body)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Failed to read request body"})
			c.Abort()
			return
		}
		// Restore body for next handlers
		c.Request.Body = io.NopCloser(bytes.NewBuffer(body))
		c.Set("raw_payload", body)

		// Get Tenant ID (Assuming it might be passed as query param or we deduce it)
		// For now, let's allow an optional query param, or default to a system tenant
		tenantID := c.Query("tenant_id")
		
		secret, err := getWebhookSecret(provider, tenantID)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve secret"})
			c.Abort()
			return
		}

		// Verify signature
		// Note: Different providers use different headers and algorithms.
		// We implement a generic one (HMAC-SHA256) and Razorpay specific.
		
		var signature string
		
		switch provider {
		case "razorpay":
			signature = c.GetHeader("X-Razorpay-Signature")
		default:
			// Try standard headers
			signature = c.GetHeader("X-Webhook-Signature")
		}

		if signature == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Missing signature header"})
			c.Abort()
			return
		}

		if !verifySignature(body, secret, signature) {
			// Debugging aid: Log mismatch
			h := hmac.New(sha256.New, []byte(secret))
			h.Write(body)
			expected := hex.EncodeToString(h.Sum(nil))
			
			log.Printf("\n--- DEBUG INFO ---\n")
			log.Printf("Provider: [%s]", provider)
			log.Printf("Secret Used: [%s]", secret)
			log.Printf("Payload Received (len=%d): [%s]", len(body), string(body))
			log.Printf("Header Signature: [%s]", signature)
			log.Printf("Calculated Sig:   [%s]", expected)
			log.Printf("------------------\n")

			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid signature"})
			c.Abort()
			return
		}

		c.Next()
	}
}

func verifySignature(payload []byte, secret, signature string) bool {
	h := hmac.New(sha256.New, []byte(secret))
	h.Write(payload)
	expectedSignature := hex.EncodeToString(h.Sum(nil))
	return hmac.Equal([]byte(expectedSignature), []byte(signature))
}
