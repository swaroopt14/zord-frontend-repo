// Package config handles configuration management for the Zord Vault Journal service
package config

import (
	"log"
	"os"

	"github.com/joho/godotenv"
)

// Config holds all configuration values for the service
type Config struct {
	DatabaseURL   string
	EncryptionKey string
	StoragePath   string
	Port          string
	Environment   string
}

// LoadConfig loads configuration from environment variables
func LoadConfig() *Config {
	// Load environment variables from .env file (if it exists)
	_ = godotenv.Load()

	config := &Config{
		DatabaseURL:   getEnv("DATABASE_URL", "postgres://vault_user:vault_password@localhost:5432/zord_vault_journal_db?sslmode=disable"),
		EncryptionKey: getEnv("ENCRYPTION_KEY", "change-me-in-production"), // TODO: Use strong key in production
		StoragePath:   getEnv("STORAGE_PATH", "/data/vault"),
		Port:          getEnv("PORT", "8081"),
		Environment:   getEnv("ENVIRONMENT", "development"),
	}

	log.Println("Configuration loaded successfully")
	return config
}

// getEnv gets an environment variable with a fallback default value
func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}
