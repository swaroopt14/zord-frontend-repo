package main

import (
	"context"
	"fmt"
	"log"
	"os"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
	"github.com/prometheus/client_golang/prometheus"
	"github.com/prometheus/client_golang/prometheus/promhttp"
	"go.opentelemetry.io/contrib/instrumentation/github.com/gin-gonic/gin/otelgin"
	"main.go/config"
	"main.go/db"
	"main.go/messaging"
	"main.go/model"
	"main.go/services"
	"main.go/storage"
	"main.go/tracing"
)

var (
	// Prometheus metrics
	messagesProcessedTotal = prometheus.NewCounterVec(
		prometheus.CounterOpts{
			Name: "messages_processed_total",
			Help: "Total number of messages processed",
		},
		[]string{"status"},
	)

	s3OperationsTotal = prometheus.NewCounterVec(
		prometheus.CounterOpts{
			Name: "s3_operations_total",
			Help: "Total number of S3 operations",
		},
		[]string{"operation", "status"},
	)
)

func init() {
	// Register Prometheus metrics
	prometheus.MustRegister(messagesProcessedTotal)
	prometheus.MustRegister(s3OperationsTotal)
}

func main() {
	// Initialize tracing
	cleanup := tracing.InitTracing("zord-vault-journal")
	defer cleanup()

	ctx := context.Background()

	config.InitDB()
	config.InitRedis()
	db.CreateTable()

	err := godotenv.Load()
	if err != nil {
		log.Println("No .env file found")
	}

	bucket := os.Getenv("S3_BUCKET")
	region := os.Getenv("S3_REGION")

	if bucket == "" || region == "" {
		log.Fatal("S3_BUCKET or S3_REGION not set in environment")
	}

	s3store, err := storage.NewS3Store(ctx, bucket, region)
	if err != nil {
		log.Fatal("Failed to init S3", err)
	}

	// Start message processing worker
	go messaging.StartRawIntentWorker(ctx, func(ctx context.Context, msg model.RawIntentMessage) error {
		ack, err := services.ProcessRawIntent(ctx, msg, s3store)
		if err != nil {
			return err
		}
		if err := services.RawIntent(ctx, msg, ack); err != nil {
			return err
		}
		return messaging.SendACKMessage(ctx, *ack)
	})

	// Start HTTP server for metrics and health checks
	go startHTTPServer()

	log.Println("Zord Vault Journal service started with observability enabled")
	fmt.Println("Service 2 worker started")

	select {}
}

// startHTTPServer starts the HTTP server for metrics and health checks
func startHTTPServer() {
	router := gin.Default()

	// Add OpenTelemetry middleware
	router.Use(otelgin.Middleware("zord-vault-journal"))

	// Health check endpoint
	router.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"status":  "healthy",
			"service": "zord-vault-journal",
			"time":    time.Now().UTC(),
		})
	})

	// Metrics endpoint
	router.GET("/metrics", gin.WrapH(promhttp.Handler()))

	log.Println("Starting Zord Vault Journal HTTP server on port 8081")
	if err := router.Run(":8081"); err != nil {
		log.Fatalf("Failed to start HTTP server: %v", err)
	}
}
