package middleware

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
)

func TestGetIdempotencyKey_MissingHeader(t *testing.T) {
	gin.SetMode(gin.TestMode)

	req := httptest.NewRequest(http.MethodPost, "/test", nil)
	w := httptest.NewRecorder()

	r := gin.Default()
	r.Use(GetIdempotencyKey())
	r.POST("/test", func(c *gin.Context) {
		// This should never be reached if header is missing
		c.JSON(http.StatusOK, gin.H{"message": "success"})
	})

	r.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("expected 400 Bad Request, got %d", w.Code)
	}
	if w.Body.String() != `{"Error":"Missing Idempotency Key"}` {
		t.Errorf("expected error message, got %s", w.Body.String())
	}
}

func TestGetIdempotencyKey_WithHeader(t *testing.T) {
	gin.SetMode(gin.TestMode)

	req := httptest.NewRequest(http.MethodPost, "/test", nil)
	req.Header.Set("X-Idempotency-Key", "fixed-key-123")
	w := httptest.NewRecorder()

	r := gin.Default()
	r.Use(GetIdempotencyKey())
	r.POST("/test", func(c *gin.Context) {
		key, exists := c.Get("idempotency_key")
		if !exists {
			t.Errorf("expected idempotency_key to be set")
		}
		if key != "fixed-key-123" {
			t.Errorf("expected idempotency_key to be 'fixed-key-123', got %v", key)
		}
		c.JSON(http.StatusOK, gin.H{"idempotency_key": key})
	})

	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("expected 200 OK, got %d", w.Code)
	}
}
