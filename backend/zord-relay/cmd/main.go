package main

import (
	"context"
	"encoding/json"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/gin-gonic/gin"
	_ "github.com/lib/pq"
	"go.uber.org/zap"

	"zord-relay/config"
	"zord-relay/kafka"
	"zord-relay/services"
	"zord-relay/utils"
)

func main() {
	utils.InitLogger()
	defer utils.SyncLogger()

	cfg := config.Load()

	// Health check server
	http.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)

		response := map[string]interface{}{
			"service": "zord-relay",
			"status":  "healthy",
			"time":    time.Now().UTC(),
		}
		if err := json.NewEncoder(w).Encode(response); err != nil {
			http.Error(w, "failed to encode health response", http.StatusInternalServerError)
		}
	})

	healthPort := os.Getenv("HEALTH_PORT")
	if healthPort == "" {
		healthPort = "8082"
	}
	healthServer := &http.Server{Addr: ":" + healthPort}
	go func() {
		utils.Logger.Info("Starting health check server on :" + healthPort)
		if err := healthServer.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			utils.Logger.Error("Health check server failed", zap.Error(err))
		}
	}()

	// Intent Engine API Client
	intentClient := services.NewIntentClient(cfg.IntentEngineBaseURL)

	// Kafka Producer
	producer := kafka.NewProducer(cfg.KafkaBrokers)
	defer producer.Close()

	// Publisher Service (Relay logic)
	pubCfg := &services.Config{
		ReadyTopic:   cfg.ReadyTopic,
		DLQTopic:     cfg.DLQTopic,
		WorkerCount:  cfg.WorkerCount,
		BatchSize:    cfg.BatchSize,
		PollInterval: cfg.PollInterval,
	}

	publisher := services.NewPublisher(intentClient, producer, pubCfg)

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	publisher.Start(ctx)

	// API Router (if needed for relay observability)
	router := gin.New()
	router.Use(gin.Logger(), gin.Recovery())

	// Graceful shutdown
	stop := make(chan os.Signal, 1)
	signal.Notify(stop, os.Interrupt, syscall.SIGTERM)

	utils.Logger.Info("Zord Relay started")
	<-stop
	utils.Logger.Info("Shutting down Zord Relay...")

	cancel()

	// Shutdown health server
	shutdownCtx, shutdownCancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer shutdownCancel()
	if err := healthServer.Shutdown(shutdownCtx); err != nil {
		utils.Logger.Error("Health server shutdown failed", zap.Error(err))
	}
}
