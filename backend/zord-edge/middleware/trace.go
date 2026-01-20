// Package middleware contains custom middleware functions for the Zord Edge service
package middleware

import (
	"github.com/gin-gonic/gin"
	"github.com/google/uuid" // For generating unique identifiers
)

// TraceMiddleware generates and attaches a unique trace ID to each request
// This helps with request tracking and debugging across the system
func TraceMiddleware() gin.HandlerFunc {
	return func(context *gin.Context) {
		// Generate a new UUID for this request
		traceId := uuid.New().String()

		// Store the trace ID in the Gin context for use in handlers
		context.Set("trace_id", traceId)

		// Continue processing the request
		context.Next()
	}
}
