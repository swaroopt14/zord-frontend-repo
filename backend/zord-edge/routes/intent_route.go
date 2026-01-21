// Package routes defines all API routes and middleware for the Zord Edge service
package routes

import (
	"github.com/gin-gonic/gin"

	"main.go/handler"
	"main.go/middleware"
	"main.go/validator"

)

// Routes sets up all API routes and applies global middleware
func Routes(router *gin.Engine) {
	// Apply global middleware
	router.Use(gin.Recovery())              // Panic recovery middleware
	router.Use(middleware.TraceMiddleware()) // Request tracing middleware

	// Health check endpoint
	router.GET("/health", handler.HealthCheck) // Service health check


	if err := validator.InitSchemaValidator(); err != nil {
		panic("Failed to initialize schema validator: " + err.Error())
	}

	router.POST("/v1/ingest", middleware.ValidateIntentRequest(), handler.Intent_handler)
	router.POST("/v1/tenantReg", handler.Tenant_Registry)

	// API v1 routes
	router.POST("/v1/ingest", handler.Intent_handler)     // Handle intent ingestion requests
	router.POST("/v1/tenantReg", handler.Tenant_Registry) // Handle tenant registration

}
