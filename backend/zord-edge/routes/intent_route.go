// Package routes defines all API routes and middleware for the Zord Edge service
package routes

import (
	"github.com/gin-gonic/gin"
	"main.go/handler"   // Request handlers
	"main.go/middleware" // Custom middleware
)

// Routes sets up all API routes and applies global middleware
func Routes(router *gin.Engine) {
	// Apply global middleware
	router.Use(gin.Recovery())              // Panic recovery middleware
	router.Use(middleware.TraceMiddleware()) // Request tracing middleware

	// Health check endpoint
	router.GET("/health", handler.HealthCheck) // Service health check

	// API v1 routes
	router.POST("/v1/ingest", handler.Intent_handler)     // Handle intent ingestion requests
	router.POST("/v1/tenantReg", handler.Tenant_Registry) // Handle tenant registration
}
