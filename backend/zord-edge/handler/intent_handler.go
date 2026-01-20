// Package handler contains HTTP request handlers for the Zord Edge service
package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

// Intent_handler processes intent ingestion requests
// This endpoint accepts and acknowledges intent data for processing
func Intent_handler(context *gin.Context) {
	// Retrieve trace ID from middleware for request tracking
	traceId := context.MustGet("trace_id").(string)

	// Return acceptance response with trace ID for tracking
	context.JSON(http.StatusAccepted, gin.H{
		"trace_id": traceId,     // Unique identifier for request tracing
		"Response": "Accepted", // Confirmation that request was accepted
	})
}
