package middleware

import (
	"errors"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/gin-gonic/gin"
)

// --- Fake service for testing ---
type fakeService struct {
	tenantID string
	err      error
}

func (f fakeService) ValidateApiKey(_ interface{}, _ interface{}, _ string) (struct{ TenantId string }, error) {
	if f.err != nil {
		return struct{ TenantId string }{}, f.err
	}
	return struct{ TenantId string }{TenantId: f.tenantID}, nil
}

// --- Wrapper to inject fake service ---
func AuthMiddlewareWithService(s fakeService) gin.HandlerFunc {
	return func(c *gin.Context) {
		auth := c.GetHeader("Authorization")
		if auth == "" || !strings.HasPrefix(auth, "Bearer ") {
			c.JSON(http.StatusUnauthorized, gin.H{"Error": "Missing API Key"})
			c.Abort()
			return
		}
		apikey := strings.TrimPrefix(auth, "Bearer ")
		response, err := s.ValidateApiKey(c.Request.Context(), nil, apikey)
		if err != nil {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"message": "invalid api key"})
			return
		}
		c.Set("tenant_id", response.TenantId)
		c.Next()
	}
}

// --- Tests ---
func TestAuthMiddleware_MissingHeader(t *testing.T) {
	gin.SetMode(gin.TestMode)

	req := httptest.NewRequest(http.MethodGet, "/secure", nil)
	w := httptest.NewRecorder()

	r := gin.Default()
	r.Use(AuthMiddlewareWithService(fakeService{}))
	r.GET("/secure", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"message": "success"})
	})

	r.ServeHTTP(w, req)

	if w.Code != http.StatusUnauthorized {
		t.Errorf("expected 401 Unauthorized, got %d", w.Code)
	}
}

func TestAuthMiddleware_InvalidKey(t *testing.T) {
	gin.SetMode(gin.TestMode)

	req := httptest.NewRequest(http.MethodGet, "/secure", nil)
	req.Header.Set("Authorization", "Bearer bad-key")
	w := httptest.NewRecorder()

	r := gin.Default()
	r.Use(AuthMiddlewareWithService(fakeService{err: errors.New("invalid")}))
	r.GET("/secure", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"message": "success"})
	})

	r.ServeHTTP(w, req)

	if w.Code != http.StatusUnauthorized {
		t.Errorf("expected 401 Unauthorized, got %d", w.Code)
	}
}

func TestAuthMiddleware_ValidKey(t *testing.T) {
	gin.SetMode(gin.TestMode)

	req := httptest.NewRequest(http.MethodGet, "/secure", nil)
	req.Header.Set("Authorization", "Bearer good-key")
	w := httptest.NewRecorder()

	r := gin.Default()
	r.Use(AuthMiddlewareWithService(fakeService{tenantID: "tenant123"}))
	r.GET("/secure", func(c *gin.Context) {
		tenantID, exists := c.Get("tenant_id")
		if !exists {
			t.Errorf("expected tenant_id to be set")
		}
		if tenantID != "tenant123" {
			t.Errorf("expected tenant_id 'tenant123', got %v", tenantID)
		}
		c.JSON(http.StatusOK, gin.H{"message": "success"})
	})

	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("expected 200 OK, got %d", w.Code)
	}
}
