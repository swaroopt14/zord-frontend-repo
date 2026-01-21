// Package handler contains HTTP request handlers for the Zord Edge service
package handler

import (
	"log"
	"net/http"

	"github.com/gin-gonic/gin"
	"main.go/db"       // Database operations
	"main.go/model"    // Data models
	"main.go/services" // Business logic services
)

// Tenant_Registry handles tenant/merchant registration requests
func Tenant_Registry(context *gin.Context) {
	var req model.MerchantRequest

	// Parse JSON request body into MerchantRequest struct
	err := context.ShouldBindJSON(&req)
	log.Println(req) // Log the incoming request for debugging

	// Validate request data
	if err != nil {
		context.JSON(http.StatusNotAcceptable, gin.H{
			"Message": "Invalid Merchant Name",
			"Error":   err,
		})
		return
	}

	// Register the tenant using the service layer
	services.TenantReg(context.Request.Context(), db.DB, req.Name)

	// Return success response
	context.JSON(http.StatusCreated, gin.H{
		"Message": "Merchant Registered",
	})
}
