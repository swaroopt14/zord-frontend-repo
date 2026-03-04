package main

import (
	"context"
	"encoding/json"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"zord-relay/config"
	"zord-relay/db"
	"zord-relay/handler"
	"zord-relay/kafka"
	"zord-relay/services"
	"zord-relay/utils"

	"github.com/gin-gonic/gin"
	"go.uber.org/zap"
)

const (
	WebPort = ":8081"
)

func main() {
	utils.InitLogger()
	defer utils.SyncLogger()

	cfg := config.Load()

	// Database
	dbConn := db.Connect(cfg.DatabaseURL)
	defer dbConn.Close()

	// Repositories
	payoutContractsRepo := services.NewPayoutContractsRepo(dbConn)

	// HTTP Server
	router := gin.Default()
	contractsHandler := handler.NewContractsHandler(payoutContractsRepo)
	router.GET("/contracts", contractsHandler.ListContracts)

	server := &http.Server{
		Addr:    WebPort,
		Handler: router,
	}

	go func() {
		utils.Logger.Info("Starting HTTP server on " + WebPort)
		if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			utils.Logger.Fatal("HTTP server failed", zap.Error(err))
		}
	}()

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

	// Kafka Consumer for intents
	intentConsumer := kafka.NewConsumer(cfg.KafkaBrokers, "zord-relay-payout-contracts-consumer")
	intentHandler := services.NewIntentHandler(payoutContractsRepo)
	intentConsumer.Consume(context.Background(), []string{"z.intent.ready.v1"}, intentHandler)
	defer intentConsumer.Close()

	// Intent Engine API Client
	intentClient := services.NewIntentClient(cfg.IntentEngineBaseURL)

	// Kafka Producer
	producer := kafka.NewProducer(cfg.KafkaBrokers)
	defer producer.Close()

	// Publisher Service (Relay logic)
	pubCfg := &services.Config{
		ReadyTopic:             cfg.ReadyTopic,
		PublishFailureDLQTopic: cfg.PublishFailureDLQTopic,
		PoisonEventDLQTopic:    cfg.PoisonEventDLQTopic,
		WorkerCount:            cfg.WorkerCount,
		BatchSize:              cfg.BatchSize,
		PollInterval:           cfg.PollInterval,
		MaxAttempts:            cfg.MaxAttempts,
		MaxAge:                 cfg.MaxAge,
	}

	publisher := services.NewPublisher(intentClient, producer, pubCfg)

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	publisher.Start(ctx)

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
