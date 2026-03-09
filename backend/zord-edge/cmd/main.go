package main

import (
	"context"
	"log"
	"os"
	"strconv"
	"strings"
	"time"

	"zord-edge/config"
	"zord-edge/db"
	"zord-edge/handler"
	"zord-edge/kafka"
	"zord-edge/routes"
	"zord-edge/storage"
	"zord-edge/vault"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
	"github.com/prometheus/client_golang/prometheus"
	"github.com/prometheus/client_golang/prometheus/promhttp"
	"go.opentelemetry.io/contrib/instrumentation/github.com/gin-gonic/gin/otelgin"
	"zord-edge/tracing"
)

var (
	// Prometheus metrics
	httpRequestsTotal = prometheus.NewCounterVec(
		prometheus.CounterOpts{
			Name: "http_requests_total",
			Help: "Total number of HTTP requests",
		},
		[]string{"method", "endpoint", "status"},
	)

	httpRequestDuration = prometheus.NewHistogramVec(
		prometheus.HistogramOpts{
			Name: "http_request_duration_seconds",
			Help: "Duration of HTTP requests in seconds",
		},
		[]string{"method", "endpoint"},
	)
)

func init() {
	// Register Prometheus metrics
	prometheus.MustRegister(httpRequestsTotal)
	prometheus.MustRegister(httpRequestDuration)
}

func main() {
	// Initialize tracing
	cleanup := tracing.InitTracing("zord-edge")
	defer cleanup()

	gin.SetMode(gin.ReleaseMode)
	server := gin.New()
	server.Use(
		gin.Recovery(),
		otelgin.Middleware("zord-edge"),
		prometheusMiddleware(),
	)

	config.InitDB()
	if db.DB == nil {
		log.Fatal("DB is nil after InitDB")
	}

	db.CreateTable()
	err := godotenv.Load()
	if err != nil {
		log.Println("No .env file found")
	}
	brokers := strings.Split(os.Getenv("KAFKA_BROKERS"), ",")
	producer, err := kafka.NewProducer(brokers)
	if err != nil {
		log.Fatal("Kafka producer creation failure: ", err)
	}

	defer producer.Close()

	bucket := os.Getenv("S3_BUCKET")
	region := os.Getenv("AWS_REGION")

	if bucket == "" || region == "" {
		log.Fatal("S3_BUCKET or S3_REGION not set in environment")
	}

	s3store, err := storage.NewS3Store(context.Background(), bucket, region)
	if err != nil {
		log.Fatal("Failed to init S3", err)
	}

	h := &handler.Handler{
		S3store: s3store,
		Kafka:   producer,
	}
	cfg := config.LoadConfig()

	err = vault.InitVaultKey(cfg.VaultKey)
	if err != nil {
		log.Fatal("failed to initialize vault key:", err)
	}
	signingKeyPath := os.Getenv("SIGNING_KEY_PATH")
	if signingKeyPath == "" {
		signingKeyPath = "ed25519_private.pem"
	}
	err = vault.InitSigningKey(signingKeyPath)
	if err != nil {
		log.Fatal("failed to load signing key:", err)
	}

	routes.Routes(server, h)

	// Add metrics endpoint
	server.GET("/metrics", gin.WrapH(promhttp.Handler()))

	// Add health check endpoint
	server.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"status":  "healthy",
			"service": "zord-edge",
			"time":    time.Now().UTC(),
		})
	})

	log.Println("Starting Zord Edge service on port 8080 with observability enabled")
	if err := server.Run(":8080"); err != nil {
		log.Fatal("Server failed to start:", err)
	}
}

// prometheusMiddleware adds Prometheus metrics collection
func prometheusMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		start := time.Now()

		c.Next()

		duration := time.Since(start).Seconds()
		status := strconv.Itoa(c.Writer.Status())

		path := c.FullPath()
		if path == "" {
			path = c.Request.URL.Path
		}

		httpRequestsTotal.WithLabelValues(c.Request.Method, path, status).Inc()
		httpRequestDuration.WithLabelValues(c.Request.Method, path).Observe(duration)
	}
}
