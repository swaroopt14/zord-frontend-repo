package main

import (
	"context"
	"errors"
	"log"
	"net/http"
	"os"
	"os/signal"
	"strconv"
	"strings"
	"syscall"
	"time"

	authhandler "zord-edge/auth/handler"
	authrepo "zord-edge/auth/repository"
	authsecurity "zord-edge/auth/security"
	authservice "zord-edge/auth/service"
	"zord-edge/config"
	"zord-edge/db"
	"zord-edge/handler"
	"zord-edge/kafka"
	"zord-edge/routes"
	"zord-edge/services"
	"zord-edge/storage"
	"zord-edge/vault"

	"zord-edge/tracing"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
	"github.com/prometheus/client_golang/prometheus"
	"github.com/prometheus/client_golang/prometheus/promhttp"
	"go.opentelemetry.io/contrib/instrumentation/github.com/gin-gonic/gin/otelgin"
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
	// Shutdown context — cancelled on SIGTERM/SIGINT.
	ctx, stop := signal.NotifyContext(context.Background(), syscall.SIGTERM, syscall.SIGINT)
	defer stop()

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

	bucket := os.Getenv("S3_BUCKET")
	region := os.Getenv("AWS_REGION")

	if bucket == "" || region == "" {
		log.Fatal("S3_BUCKET or AWS_REGION not set in environment")
	}

	s3store, err := storage.NewS3Store(context.Background(), bucket, region)
	if err != nil {
		log.Fatal("Failed to init S3", err)
	}

	kafkaBrokers := os.Getenv("KAFKA_BROKERS")
	if kafkaBrokers == "" {
		log.Fatal("KAFKA_BROKERS not set in environment")
	}
	kafkaProducer, err := kafka.NewProducer(strings.Split(kafkaBrokers, ","))
	if err != nil {
		log.Fatal("Failed to init Kafka producer:", err)
	}
	defer kafkaProducer.Close()

	// Start outbox poller — durability guarantee for PENDING rows.
	go services.StartOutboxPoller(ctx, kafkaProducer, 100*time.Millisecond)

	h := &handler.Handler{
		S3store: s3store,
	}
	cfg := config.LoadConfig()

	tokenManager, err := authsecurity.NewTokenManager(
		cfg.Auth.SigningKeyPath,
		cfg.Auth.SigningKeyBase64,
		cfg.Auth.Issuer,
		cfg.Auth.Audience,
		cfg.Auth.AccessTokenTTL,
		cfg.Auth.AllowEphemeralSigningKey,
	)
	if err != nil {
		log.Fatal("failed to initialize auth token manager:", err)
	}

	authRepository := authrepo.New(db.DB)
	authService := authservice.New(authRepository, tokenManager, authservice.Config{
		Issuer:                 cfg.Auth.Issuer,
		Audience:               cfg.Auth.Audience,
		AccessTokenTTL:         cfg.Auth.AccessTokenTTL,
		RefreshTokenTTL:        cfg.Auth.RefreshTokenTTL,
		LockoutThreshold:       cfg.Auth.LockoutThreshold,
		LockoutDuration:        cfg.Auth.LockoutDuration,
		BootstrapAdminName:     cfg.Auth.BootstrapAdminName,
		BootstrapAdminEmail:    cfg.Auth.BootstrapAdminEmail,
		BootstrapAdminPassword: cfg.Auth.BootstrapAdminPassword,
		BootstrapAdminTenantID: cfg.Auth.BootstrapAdminTenantID,
		BootstrapWorkspaceCode: cfg.Auth.BootstrapWorkspaceCode,
	})
	if err := authService.BootstrapAdmin(context.Background()); err != nil {
		log.Fatal("failed to bootstrap auth admin:", err)
	}
	authHTTPHandler := authhandler.New(authService)

	err = vault.InitVaultKey(cfg.VaultKey)
	if err != nil {
		log.Fatal("failed to initialize vault key:", err)
	}
	err = vault.InitSigningKeyFromConfig(
		cfg.Auth.SigningKeyPath,
		cfg.Auth.SigningKeyBase64,
		cfg.Auth.AllowEphemeralSigningKey,
	)
	if err != nil {
		log.Fatal("failed to load signing key:", err)
	}

	routes.Routes(server, h, authHTTPHandler, tokenManager)

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
	srv := &http.Server{
		Addr:              ":8080",
		Handler:           server,
		ReadHeaderTimeout: 5 * time.Second,
		ReadTimeout:       10 * time.Second,
		WriteTimeout:      20 * time.Second,
		IdleTimeout:       60 * time.Second,
	}
	if err := srv.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
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
			// Avoid high-cardinality metrics labels for unmatched routes.
			path = "/unmatched"
		}

		httpRequestsTotal.WithLabelValues(c.Request.Method, path, status).Inc()
		httpRequestDuration.WithLabelValues(c.Request.Method, path).Observe(duration)
	}
}
