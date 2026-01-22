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

	"github.com/gin-gonic/gin"
)

func main() {
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
		log.Printf("Starting HTTP server on port %s", cfg.HTTPPort)
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

	// API endpoints for message publishing
	v1 := router.Group("/api/v1")
	{
		v1.POST("/publish/:topic", publisher.HandlePublish)
		v1.GET("/topics", publisher.HandleListTopics)
	}

	return router
}
