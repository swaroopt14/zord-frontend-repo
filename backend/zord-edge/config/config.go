// Package config handles database configuration and initialization
package config

import (
	"database/sql"
	"fmt"
	"log"
	"os"

	"github.com/joho/godotenv" // For loading environment variables from .env file
	_ "github.com/lib/pq"       // PostgreSQL driver
	"main.go/db"               // Database connection variable
)

// InitDB initializes the database connection using environment variables
func InitDB() {
	var err error

	// Load environment variables from .env file (if it exists)
	_ = godotenv.Load()

	// Build PostgreSQL connection string from environment variables
	dsn := fmt.Sprintf("user=%s password=%s host=%s port=%s dbname=%s sslmode=%s",
		os.Getenv("DB_USER"),     // Database username
		os.Getenv("DB_PASSWORD"), // Database password
		os.Getenv("DB_HOST"),     // Database host (e.g., localhost, postgres container)
		os.Getenv("DB_PORT"),     // Database port (default: 5432)
		os.Getenv("DB_NAME"),     // Database name
		os.Getenv("DB_SSLMODE"),  // SSL mode (disable for local development)
	)

	// Open database connection
	db.DB, err = sql.Open("postgres", dsn)
	if err != nil {
		log.Fatalf("Database configuration failed: %v", err)
	}

	// Test the database connection
	err = db.DB.Ping()
	if err != nil {
		log.Fatalf("Database Ping Error %v", err)
	}

	// Log successful database connection
	log.Println("Database Working")
}
