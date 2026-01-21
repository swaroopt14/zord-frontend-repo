// Package main is the entry point for the Zord Edge microservice
package main

import (
	"github.com/gin-gonic/gin"
	"main.go/config" // Configuration management
	"main.go/db"     // Database operations
	"main.go/routes" // API route definitions
)

// main initializes and starts the Zord Edge service
func main() {
	// Create a new Gin router instance with default middleware
	server := gin.Default()

	// Initialize database connection and configuration
	config.InitDB()

	// Create required database tables if they don't exist
	db.CreateTable()

	// Set up all API routes and middleware
	routes.Routes(server)

	// Start the HTTP server on port 8080
	server.Run(":8080")
}
