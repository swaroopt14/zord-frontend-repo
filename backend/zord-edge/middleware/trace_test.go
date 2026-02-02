package middleware

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
)

func TestTraceMiddleware_SetsTraceID(t *testing.T) {
	gin.SetMode(gin.TestMode)

	req := httptest.NewRequest(http.MethodGet, "/test", nil)
	w := httptest.NewRecorder()

	r := gin.Default()
	r.Use(TraceMiddleware())
	r.GET("/test", func(c *gin.Context) {
		traceID, exists := c.Get("trace_id")
		if !exists {
			t.Errorf("expected trace_id to be set")
		}
		if traceID == "" {
			t.Errorf("expected non-empty trace_id")
		}
		c.JSON(http.StatusOK, gin.H{"trace_id": traceID})
	})

	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("expected 200 OK, got %d", w.Code)
	}
}

func TestTraceMiddleware_DifferentRequestsHaveDifferentTraceIDs(t *testing.T) {
	gin.SetMode(gin.TestMode)

	r := gin.Default()
	r.Use(TraceMiddleware())
	r.GET("/test", func(c *gin.Context) {
		traceID, _ := c.Get("trace_id")
		c.JSON(http.StatusOK, gin.H{"trace_id": traceID})
	})

	// First request
	req1 := httptest.NewRequest(http.MethodGet, "/test", nil)
	w1 := httptest.NewRecorder()
	r.ServeHTTP(w1, req1)

	// Second request
	req2 := httptest.NewRequest(http.MethodGet, "/test", nil)
	w2 := httptest.NewRecorder()
	r.ServeHTTP(w2, req2)

	if w1.Body.String() == w2.Body.String() {
		t.Errorf("expected different trace_id for different requests, got same: %s", w1.Body.String())
	}
}
