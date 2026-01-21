// Package handler contains HTTP request handlers for the Zord Edge service
package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"main.go/middleware"
)

// Intent_handler processes intent ingestion requests
// This endpoint accepts and acknowledges intent data for processing
func Intent_handler(c *gin.Context) {
	c.JSON(http.StatusAccepted, gin.H{
		"trace_id": middleware.GetTraceID(c),
		"response": "Accepted",
	})
}
