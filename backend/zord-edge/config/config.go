package config

import (
	"database/sql"
	"fmt"
	"log"
	"os"
	"strconv"
	"strings"
	"time"

	"zord-edge/db"

	"github.com/joho/godotenv"
	_ "github.com/lib/pq"
)

type Config struct {
	VaultKey string
	Auth     AuthConfig
}

type AuthConfig struct {
	Issuer                   string
	Audience                 string
	AccessTokenTTL           time.Duration
	RefreshTokenTTL          time.Duration
	SigningKeyPath           string
	SigningKeyBase64         string
	AllowEphemeralSigningKey bool
	CookieDomain             string
	CookieSecure             bool
	LockoutThreshold         int
	LockoutDuration          time.Duration
	BootstrapAdminName       string
	BootstrapAdminEmail      string
	BootstrapAdminPassword   string
	BootstrapAdminTenantID   string
	BootstrapWorkspaceCode   string
}

func InitDB() {
	var err error
	_ = godotenv.Load()
	dsn := fmt.Sprintf("user=%s password=%s host=%s port=%s dbname=%s sslmode=%s",
		os.Getenv("DB_USER"),     // Database username
		os.Getenv("DB_PASSWORD"), // Database password
		os.Getenv("DB_HOST"),     // Database host (e.g., localhost, postgres container)
		os.Getenv("DB_PORT"),     // Database port (default: 5432)
		os.Getenv("DB_NAME"),     // Database name
		os.Getenv("DB_SSLMODE"),  // SSL mode (disable for local development)
	)
	db.DB, err = sql.Open("postgres", dsn)
	if err != nil {
		log.Fatalf("Database configuration failed: %v", err)
	}

	maxRetries := 10
	retryDelay := 1 * time.Second

	for i := 0; i < maxRetries; i++ {
		err = db.DB.Ping()
		if err == nil {
			log.Println("Database connection established successfully")
			break
		}

		if i < maxRetries-1 {
			log.Printf("Database Ping Error (attempt %d/%d): %v - retrying in %v", i+1, maxRetries, err, retryDelay)
			time.Sleep(retryDelay)
			retryDelay *= 2 // Exponential backoff
		} else {
			log.Fatalf("Database Ping Error after %d attempts: %v", maxRetries, err)
		}
	}
	db.DB.SetMaxOpenConns(1000)
	db.DB.SetMaxIdleConns(500)
	db.DB.SetConnMaxLifetime(5 * time.Minute)
}

func LoadConfig() *Config {
	signingKeyBase64 := os.Getenv("JWT_SIGNING_PRIVATE_KEY_BASE64")
	allowEphemeralSigningKey := envBool("AUTH_ALLOW_EPHEMERAL_SIGNING_KEY", false)
	signingKeyPath := firstNonEmpty(os.Getenv("JWT_SIGNING_PRIVATE_KEY_PATH"), os.Getenv("SIGNING_KEY_PATH"))
	if signingKeyPath == "" && strings.TrimSpace(signingKeyBase64) == "" && !allowEphemeralSigningKey {
		signingKeyPath = "ed25519_private.pem"
	}

	return &Config{
		VaultKey: os.Getenv("ZORD_VAULT_KEY"),
		Auth: AuthConfig{
			Issuer:                   firstNonEmpty(os.Getenv("JWT_ISSUER"), "zord-edge"),
			Audience:                 firstNonEmpty(os.Getenv("JWT_AUDIENCE"), "zord-console"),
			AccessTokenTTL:           envDuration("JWT_ACCESS_TOKEN_TTL", 15*time.Minute),
			RefreshTokenTTL:          envDuration("JWT_REFRESH_TOKEN_TTL", 30*24*time.Hour),
			SigningKeyPath:           signingKeyPath,
			SigningKeyBase64:         signingKeyBase64,
			AllowEphemeralSigningKey: allowEphemeralSigningKey,
			CookieDomain:             os.Getenv("AUTH_COOKIE_DOMAIN"),
			CookieSecure:             envBool("AUTH_COOKIE_SECURE", false),
			LockoutThreshold:         envInt("JWT_LOCKOUT_THRESHOLD", 5),
			LockoutDuration:          envDuration("JWT_LOCKOUT_DURATION", 15*time.Minute),
			BootstrapAdminName:       os.Getenv("BOOTSTRAP_ADMIN_NAME"),
			BootstrapAdminEmail:      os.Getenv("BOOTSTRAP_ADMIN_EMAIL"),
			BootstrapAdminPassword:   os.Getenv("BOOTSTRAP_ADMIN_PASSWORD"),
			BootstrapAdminTenantID:   os.Getenv("BOOTSTRAP_ADMIN_TENANT_ID"),
			BootstrapWorkspaceCode:   os.Getenv("BOOTSTRAP_ADMIN_WORKSPACE_CODE"),
		},
	}
}

func envDuration(key string, fallback time.Duration) time.Duration {
	raw := os.Getenv(key)
	if raw == "" {
		return fallback
	}
	parsed, err := time.ParseDuration(raw)
	if err != nil {
		log.Printf("invalid duration for %s: %v; using fallback %v", key, err, fallback)
		return fallback
	}
	return parsed
}

func envBool(key string, fallback bool) bool {
	raw := os.Getenv(key)
	if raw == "" {
		return fallback
	}
	parsed, err := strconv.ParseBool(raw)
	if err != nil {
		log.Printf("invalid boolean for %s: %v; using fallback %v", key, err, fallback)
		return fallback
	}
	return parsed
}

func envInt(key string, fallback int) int {
	raw := os.Getenv(key)
	if raw == "" {
		return fallback
	}
	parsed, err := strconv.Atoi(raw)
	if err != nil {
		log.Printf("invalid integer for %s: %v; using fallback %d", key, err, fallback)
		return fallback
	}
	return parsed
}

func firstNonEmpty(values ...string) string {
	for _, value := range values {
		if value != "" {
			return value
		}
	}
	return ""
}
