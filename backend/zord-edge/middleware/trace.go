// Package middleware contains custom middleware functions for the Zord Edge service
package middleware

import (
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

const TraceIDKey = "trace_id"

func TraceMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		traceID := uuid.New().String()

		// Store trace ID in context
		c.Set(TraceIDKey, traceID)

		// Expose trace ID to client
		c.Header("X-Trace-Id", traceID)

		c.Next()
	}
}

// GetTraceID safely fetches trace_id from Gin context
func GetTraceID(c *gin.Context) string {
	if v, exists := c.Get(TraceIDKey); exists {
		if traceID, ok := v.(string); ok {
			return traceID
		}
	}
	return ""
}
