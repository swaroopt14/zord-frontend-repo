// Package main is the entry point for the Zord Relay service
package main

import (
	"context"
	"log"
	"os"
	"os/signal"
	"syscall"
	"time"

	"zord-relay/config"
	"zord-relay/kafka"
	"zord-relay/services"
	"zord-relay/tracing"

	"github.com/gin-gonic/gin"
	"github.com/prometheus/client_golang/prometheus"
	"github.com/prometheus/client_golang/prometheus/promhttp"
	"go.opentelemetry.io/contrib/instrumentation/github.com/gin-gonic/gin/otelgin"
)

var (
	// Prometheus metrics
	outboxMessagesTotal = prometheus.NewCounterVec(
		prometheus.CounterOpts{
			Name: "outbox_messages_total",
			Help: "Total number of outbox messages processed",
		},
		[]string{"status"},
	)
	
	kafkaPublishTotal = prometheus.NewCounterVec(
		prometheus.CounterOpts{
			Name: "kafka_publish_total",
			Help: "Total number of Kafka messages published",
		},
		[]string{"topic", "status"},
	)
)

func init() {
	// Register Prometheus metrics
	prometheus.MustRegister(outboxMessagesTotal)
	prometheus.MustRegister(kafkaPublishTotal)
}

func main() {
	// Initialize tracing
	cleanup := tracing.InitTracing("zord-relay")
	defer cleanup()

	// Load configuration
	cfg := config.LoadConfig()

	// Initialize Kafka producer and consumer
	producer := kafka.NewProducer(cfg.KafkaBrokers)
	defer producer.Close()

	consumer := kafka.NewConsumer(cfg.KafkaBrokers, cfg.ConsumerGroup)
	defer consumer.Close()

	// Initialize outbox publisher service
	outboxPublisher := services.NewOutboxPublisher(producer, cfg)

	// Start outbox publisher in background
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	go outboxPublisher.Start(ctx)

	// Set up HTTP server for health checks and API endpoints
	router := setupRouter(outboxPublisher)

	// Start HTTP server in background
	go func() {
		log.Printf("Starting Zord Relay HTTP server on port %s with tracing enabled", cfg.HTTPPort)
		if err := router.Run(":" + cfg.HTTPPort); err != nil {
			log.Fatalf("Failed to start HTTP server: %v", err)
		}
	}()

	// Wait for interrupt signal to gracefully shutdown
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	log.Println("Shutting down Zord Relay service...")

	// Give services time to cleanup
	time.Sleep(2 * time.Second)
	log.Println("Zord Relay service stopped")
}

// setupRouter configures the HTTP routes
func setupRouter(publisher *services.OutboxPublisher) *gin.Engine {
	router := gin.Default()

	// Add OpenTelemetry middleware
	router.Use(otelgin.Middleware("zord-relay"))

	// Health check endpoint
	router.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"status": "healthy",
			"service": "zord-relay",
			"time": time.Now().UTC(),
		})
	})
	router.HEAD("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"status": "healthy",
			"service": "zord-relay",
			"time": time.Now().UTC(),
		})
	})

	// Metrics endpoint
	router.GET("/metrics", gin.WrapH(promhttp.Handler()))

	// API endpoints for message publishing
	v1 := router.Group("/api/v1")
	{
		v1.POST("/publish/:topic", publisher.HandlePublish)
		v1.GET("/topics", publisher.HandleListTopics)
	}

	return router
}
