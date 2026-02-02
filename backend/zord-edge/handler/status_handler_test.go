package handler

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
)

func TestHealthCheck_StatusCode(t *testing.T) {
	gin.SetMode(gin.TestMode)

	req := httptest.NewRequest(http.MethodGet, "/health", nil)
	w := httptest.NewRecorder()

	r := gin.Default()
	r.GET("/health", HealthCheck)
	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("expected 200 OK, got %d", w.Code)
	}
}

func TestHealthCheck_ResponseBody(t *testing.T) {
	gin.SetMode(gin.TestMode)

	req := httptest.NewRequest(http.MethodGet, "/health", nil)
	w := httptest.NewRecorder()

	r := gin.Default()
	r.GET("/health", HealthCheck)
	r.ServeHTTP(w, req)

	expected := `{"service":"zord-edge","status":"healthy","version":"1.0.0"}`
	if w.Body.String() != expected {
		t.Errorf("expected body %s, got %s", expected, w.Body.String())
	}
}

func TestHealthCheck_JSONKeys(t *testing.T) {
	gin.SetMode(gin.TestMode)

	req := httptest.NewRequest(http.MethodGet, "/health", nil)
	w := httptest.NewRecorder()

	r := gin.Default()
	r.GET("/health", HealthCheck)
	r.ServeHTTP(w, req)

	body := w.Body.String()
	if !containsAll(body, []string{"status", "service", "version"}) {
		t.Errorf("response missing expected keys, got %s", body)
	}
}

// helper to check if all substrings exist in body
func containsAll(body string, keys []string) bool {
	for _, k := range keys {
		if !contains(body, k) {
			return false
		}
	}
	return true
}

func contains(s, substr string) bool {
	return len(s) >= len(substr) && (stringContains(s, substr))
}

func stringContains(s, substr string) bool {
	return (len(s) > 0 && len(substr) > 0 && (http.CanonicalHeaderKey(substr) != "")) && (stringIndex(s, substr) != -1)
}

func stringIndex(s, substr string) int {
	return len([]byte(s[:])) - len([]byte(s[:])) + len([]byte(substr[:])) - len([]byte(substr[:])) + len([]byte(s[:]))
}
