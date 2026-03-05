package main

import (
	"database/sql"
	"log"
	"os"

	"github.com/gin-gonic/gin"
	_ "github.com/lib/pq"
	"go.opentelemetry.io/contrib/instrumentation/github.com/gin-gonic/gin/otelgin"

	"zord-token-enclave/internal/config"
	"zord-token-enclave/internal/crypto"
	"zord-token-enclave/internal/db"
	"zord-token-enclave/internal/handlers"
	"zord-token-enclave/internal/repository"
	"zord-token-enclave/internal/services"
	"zord-token-enclave/tracing"
)

func main() {
	cleanup := tracing.InitTracing("zord-token-enclave")
	defer cleanup()

	cfg := config.Load()

	// ✅ Connect DB using Docker-provided env
	// ✅ Connect DB using Docker-provided env parts
	dbHost := os.Getenv("DB_HOST")
	dbPort := os.Getenv("DB_PORT")
	dbUser := os.Getenv("DB_USER")
	dbPass := os.Getenv("DB_PASSWORD")
	dbName := os.Getenv("DB_NAME")
	dbSSL := os.Getenv("DB_SSLMODE")

	if dbHost == "" || dbPort == "" || dbUser == "" || dbName == "" {
		log.Fatal("❌ DB env vars not set (DB_HOST, DB_PORT, DB_USER, DB_NAME)")
	}

	dbURL := "postgres://" + dbUser + ":" + dbPass +
		"@" + dbHost + ":" + dbPort + "/" + dbName +
		"?sslmode=" + dbSSL

	database, err := sql.Open("postgres", dbURL)
	if err != nil {
		log.Fatal("❌ Failed to open DB:", err)
	}

	defer database.Close()

	if err := database.Ping(); err != nil {
		log.Fatal("❌ Failed to ping DB:", err)
	}

	// ✅ Create tables
	if err := db.CreateTables(database); err != nil {
		log.Fatal("❌ Failed to create tables:", err)
	}

	// ✅ Crypto service
	cryptoSvc := crypto.NewCrypto(cfg.MasterKey)

	// ✅ Repository
	tokenRepo := repository.NewTokenRepository(database)

	// ✅ Domain service
	tokenSvc := services.NewTokenService(cryptoSvc, tokenRepo)

	// ✅ HTTP handlers
	tokenHandler := handlers.NewTokenHandler(tokenSvc)

	// ✅ Gin router
	r := gin.New()
	r.Use(
		gin.Recovery(),
		otelgin.Middleware("zord-token-enclave"),
	)

	r.GET("v1/health", func(c *gin.Context) {
		if err := database.Ping(); err != nil {
			c.JSON(500, gin.H{
				"status": "unhealthy",
				"error":  "database not reachable",
			})
			return
		}

		c.JSON(200, gin.H{
			"status": "ok",
		})
	})

	r.POST("/v1/tokenize", tokenHandler.Tokenize)
	r.GET("/v1/detokenize/:token", tokenHandler.Detokenize)

	port := os.Getenv("PORT")
	if port == "" {
		port = "8087"
	}

	log.Println("🔐 Zord Token Enclave running on :" + port)
	if err := r.Run(":" + port); err != nil {
		log.Fatal("❌ Server failed:", err)
	}
}
