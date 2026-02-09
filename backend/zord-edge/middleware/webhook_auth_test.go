package middleware

import (
	"bytes"
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"net/http"
	"net/http/httptest"
	"os"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
)

func TestVerifyWebhookSignature(t *testing.T) {
	// Setup
	gin.SetMode(gin.TestMode)
	os.Setenv("WEBHOOK_SECRET_razorpay", "test_secret")
	defer os.Unsetenv("WEBHOOK_SECRET_razorpay")

	tests := []struct {
		name           string
		provider       string
		payload        string
		signature      string
		headerName     string
		expectedStatus int
	}{
		{
			name:           "Valid Razorpay Signature",
			provider:       "razorpay",
			payload:        `{"event":"test"}`,
			signature:      generateSignature(`{"event":"test"}`, "test_secret"),
			headerName:     "X-Razorpay-Signature",
			expectedStatus: 200,
		},
		{
			name:           "Invalid Signature",
			provider:       "razorpay",
			payload:        `{"event":"test"}`,
			signature:      "invalid_signature",
			headerName:     "X-Razorpay-Signature",
			expectedStatus: 401,
		},
		{
			name:           "Missing Signature",
			provider:       "razorpay",
			payload:        `{"event":"test"}`,
			signature:      "",
			headerName:     "X-Razorpay-Signature",
			expectedStatus: 401,
		},
        {
			name:           "Unknown Provider (Uses Default Secret)",
			provider:       "stripe",
			payload:        `{"event":"test"}`,
			signature:      generateSignature(`{"event":"test"}`, "test_secret"), // Default mock returns "test_secret"
			headerName:     "X-Webhook-Signature",
			expectedStatus: 200,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			w := httptest.NewRecorder()
			c, _ := gin.CreateTestContext(w)

			req, _ := http.NewRequest("POST", "/webhooks/"+tt.provider, bytes.NewBufferString(tt.payload))
			if tt.signature != "" {
				req.Header.Set(tt.headerName, tt.signature)
			}
            
            // Gin params need to be set manually in unit test if not using router
            c.Params = gin.Params{{Key: "provider", Value: tt.provider}}
			c.Request = req

			VerifyWebhookSignature()(c)

			assert.Equal(t, tt.expectedStatus, w.Code)
		})
	}
}

func generateSignature(payload, secret string) string {
	h := hmac.New(sha256.New, []byte(secret))
	h.Write([]byte(payload))
	return hex.EncodeToString(h.Sum(nil))
}
