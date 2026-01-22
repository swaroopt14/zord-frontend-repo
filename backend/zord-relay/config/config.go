// Package config handles configuration management for the Zord Relay service
package config

import (
	"log"
	"os"
	"strconv"
	"strings"
	"time"

	"github.com/joho/godotenv"
)

// Config holds all configuration values for the Zord Relay service
type Config struct {
	// Kafka configuration
	KafkaBrokers   []string // List of Kafka broker addresses
	ConsumerGroup  string   // Consumer group ID for this service

	// HTTP server configuration
	HTTPPort       string   // Port for HTTP server

	// Database configuration (for outbox pattern)
	DatabaseURL    string   // PostgreSQL connection string

	// Service configuration
	Environment    string   // Environment (development, production)
	ServiceName    string   // Service name for logging

	// Outbox configuration
	OutboxPollInterval time.Duration // How often to check for new outbox messages
	OutboxBatchSize    int          // Number of messages to process in each batch
}

// LoadConfig loads configuration from environment variables
func LoadConfig() *Config {
	// Load environment variables from .env file (if it exists)
	_ = godotenv.Load()

	config := &Config{
		// Kafka brokers (comma-separated list)
		KafkaBrokers:   getEnvAsSlice("KAFKA_BROKERS", []string{"localhost:9092"}),

		// Consumer group for this service
		ConsumerGroup:  getEnv("KAFKA_CONSUMER_GROUP", "zord-relay-group"),

		// HTTP server port
		HTTPPort:       getEnv("HTTP_PORT", "8082"),

		// Database connection
		DatabaseURL:    getEnv("DATABASE_URL", "postgres://relay_user:relay_password@localhost:5432/zord_relay_db?sslmode=disable"),

		// Environment settings
		Environment:    getEnv("ENVIRONMENT", "development"),
		ServiceName:    getEnv("SERVICE_NAME", "zord-relay"),

		// Outbox polling settings
		OutboxPollInterval: getEnvAsDuration("OUTBOX_POLL_INTERVAL", 5*time.Second),
		OutboxBatchSize:    getEnvAsInt("OUTBOX_BATCH_SIZE", 10),
	}

	log.Printf("Configuration loaded for environment: %s", config.Environment)
	log.Printf("Kafka brokers: %v", config.KafkaBrokers)
	log.Printf("HTTP server port: %s", config.HTTPPort)

	return config
}

// getEnv gets an environment variable with a fallback default value
func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

// getEnvAsSlice gets an environment variable as a string slice (comma-separated)
func getEnvAsSlice(key string, defaultValue []string) []string {
	if value := os.Getenv(key); value != "" {
		return strings.Split(value, ",")
	}
	return defaultValue
}

// getEnvAsInt gets an environment variable as an integer
func getEnvAsInt(key string, defaultValue int) int {
	if value := os.Getenv(key); value != "" {
		if intValue, err := strconv.Atoi(value); err == nil {
			return intValue
		}
	}
	return defaultValue
}

// getEnvAsDuration gets an environment variable as a time.Duration
func getEnvAsDuration(key string, defaultValue time.Duration) time.Duration {
	if value := os.Getenv(key); value != "" {
		if duration, err := time.ParseDuration(value); err == nil {
			return duration
		}
	}
	return defaultValue
}