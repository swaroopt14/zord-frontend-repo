package main

import (
	"context"
	"database/sql"
	"log"
	"os"
	"strings"

	"github.com/gin-gonic/gin"
	_ "github.com/lib/pq"
	"go.opentelemetry.io/contrib/instrumentation/github.com/gin-gonic/gin/otelgin"

	"zord-token-enclave/internal/config"
	"zord-token-enclave/internal/crypto"
	"zord-token-enclave/internal/db"
	"zord-token-enclave/internal/handlers"
	"zord-token-enclave/internal/models"
	"zord-token-enclave/internal/repository"
	"zord-token-enclave/internal/services"
	"zord-token-enclave/kafka"
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

	// -------- KAFKA SETUP --------
	ctx := context.Background()

	brokers := strings.Split(os.Getenv("KAFKA_BROKERS"), ",")

	producer, err := kafka.NewProducer(brokers)
	if err != nil {
		log.Fatalf("Failed to create Kafka producer: %v", err)
	}

	tokenizeLogic := func(ctx context.Context, event models.TokenizeRequestEvent) error {

		canonical := event.Canonical

		pii := map[string]string{}

		// account number (root)
		if v, ok := canonical["account_number"].(string); ok {
			pii["account_number"] = v
		}

		// beneficiary fields
		if beneficiary, ok := canonical["beneficiary"].(map[string]interface{}); ok {

			if name, ok := beneficiary["name"].(string); ok {
				pii["name"] = name
			}

			if instrument, ok := beneficiary["instrument"].(map[string]interface{}); ok {

				if ifsc, ok := instrument["ifsc"].(string); ok {
					pii["ifsc"] = ifsc
				}

				if vpa, ok := instrument["vpa"].(string); ok {
					pii["vpa"] = vpa
				}
			}
		}

		// remitter fields
		if remitter, ok := canonical["remitter"].(map[string]interface{}); ok {

			if phone, ok := remitter["phone"].(string); ok {
				pii["phone"] = phone
			}

			if email, ok := remitter["email"].(string); ok {
				pii["email"] = email
			}
		}

		tokens, err := tokenSvc.TokenizePII(
			ctx,
			event.TenantID,
			event.TraceID,
			pii,
		)
		if err != nil {
			return err
		}

		result := models.TokenizeResultEvent{
			EventType:  "PII_TOKENIZE_RESULT",
			TraceID:    event.TraceID,
			EnvelopeID: event.EnvelopeID,
			TenantID:   event.TenantID,
			ObjectRef:  event.ObjectRef,
			Tokens:     tokens,
			Canonical:  canonical,
		}

		return producer.Publish(
			ctx,
			"pii.tokenize.result",
			event.EnvelopeID,
			result,
		)
	}

	handler := kafka.BuildTokenizeHandler(
		ctx,
		tokenizeLogic,
	)

	go func() {
		err := kafka.StartConsumer(
			ctx,
			brokers,
			"token-enclave-group",
			"pii.tokenize.request",
			handler,
		)
		if err != nil {
			log.Fatalf("Tokenize consumer failed: %v", err)
		}
	}()

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
