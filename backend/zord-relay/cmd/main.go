package main

import (
	"context"
	"crypto/sha256"
	"database/sql"
	"encoding/hex"
	"encoding/json"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	_ "github.com/lib/pq"
	"go.uber.org/zap"

	"zord-relay/config"
	"zord-relay/db"
	"zord-relay/handler"
	"zord-relay/kafka"
	"zord-relay/services"
	"zord-relay/utils"
)

type DummyProviderHandler struct {
	db       *sql.DB
	producer *kafka.Producer
	dlqTopic string
}

type intentPayload struct{}

type payoutContract struct {
	ContractID   string `json:"contract_id"`
	IntentID     string `json:"intent_id"`
	EnvelopeID   string `json:"envelope_id"`
	CreatedAt    string `json:"created_at"`
	ContractHash string `json:"contract_hash"`
	TraceID      string `json:"trace_id"`
}

func (h *DummyProviderHandler) HandleMessage(ctx context.Context, topic string, key string, value []byte, headers map[string]string, timestamp time.Time) error {
	utils.Logger.Info("HandleMessage: Received message",
		zap.String("topic", topic),
		zap.String("key", key),
		zap.Int("payload_len", len(value)),
		zap.Any("headers", headers))

	var p interface{} // Use interface{} to accept any JSON type (object, array, string)
	if err := json.Unmarshal(value, &p); err != nil {
		utils.Logger.Error("HandleMessage: JSON Unmarshal failed", zap.Error(err), zap.String("payload_preview", string(value)))

		envelopeID := uuid.New().String()
		tenantID := uuid.New().String()
		traceID := headers["trace_id"]
		dlq := map[string]interface{}{
			"reason_code":         "SCHEMA_INVALID",
			"error_message":       err.Error(),
			"original_event_type": topic,
			"tenant_id":           tenantID,
			"trace_id":            traceID,
			"envelope_id":         envelopeID,
		}
		h.producer.Publish(h.dlqTopic, key, dlq, map[string]string{
			"trace_id":    traceID,
			"tenant_id":   tenantID,
			"envelope_id": envelopeID,
		})
		_, _ = h.db.Exec(`INSERT INTO dlq_events (id, aggregate_id, event_type, payload, reason_code, error_message, tenant_id, trace_id, envelope_id, created_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,NOW())`,
			uuid.New(), key, topic, value, "SCHEMA_INVALID", err.Error(), tenantID, traceID, envelopeID)

		return nil
	}

	envelopeID := headers["envelope_id"]
	tenantID := headers["tenant_id"]
	intentID := key
	traceID := headers["trace_id"]

	// Safe UUID parsing
	parsedTenantID, err := uuid.Parse(tenantID)
	if err != nil {
		utils.Logger.Error("HandleMessage: Invalid tenant_id UUID", zap.String("tenant_id", tenantID))
		parsedTenantID = uuid.Nil
	}
	parsedIntentID, err := uuid.Parse(intentID)
	if err != nil {
		utils.Logger.Error("HandleMessage: Invalid intent_id UUID", zap.String("intent_id", intentID))
		parsedIntentID = uuid.Nil
	}
	parsedEnvelopeID, err := uuid.Parse(envelopeID)
	if err != nil {
		utils.Logger.Error("HandleMessage: Invalid envelope_id UUID", zap.String("envelope_id", envelopeID))
		parsedEnvelopeID = uuid.Nil
	}

	contractID := uuid.New().String()
	contractHashBytes := sha256.Sum256(value)
	contractHash := hex.EncodeToString(contractHashBytes[:])

	// Note: We don't use payloadObj for insertion, we use raw 'value'

	parsedContractID, _ := uuid.Parse(contractID)

	utils.Logger.Info("HandleMessage: Attempting to insert into payout_contracts",
		zap.String("contract_id", contractID),
		zap.String("intent_id", intentID))

	_, err = h.db.Exec(`INSERT INTO payout_contracts (contract_id, tenant_id, intent_id, envelope_id, contract_payload, contract_hash, status, created_at, trace_id)
		VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
		ON CONFLICT (intent_id) DO NOTHING`,
		parsedContractID,
		parsedTenantID,
		parsedIntentID,
		parsedEnvelopeID,
		value,
		contractHash,
		"ISSUED",
		timestamp.UTC(),
		traceID,
	)
	if err != nil {
		utils.Logger.Error("HandleMessage: DB Insert failed", zap.Error(err))
	} else {
		utils.Logger.Info("HandleMessage: Successfully inserted into payout_contracts")
	}
	return err
}

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
	port := os.Getenv("HEALTH_PORT")
	if port == "" {
		port = "8082"
	}
	server := &http.Server{Addr: ":" + port}
	go func() {
		utils.Logger.Info("Starting health check server on :" + port)
		if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			utils.Logger.Error("Health check server failed", zap.Error(err))
		}
	}()

	sinkDB := db.Connect(cfg.SinkDBURL)
	defer sinkDB.Close()

	router := gin.New()
	router.Use(gin.Logger(), gin.Recovery())

	contractsRepo := services.NewPayoutContractsRepo(sinkDB)
	contractsHandler := handler.NewContractsHandler(contractsRepo)

	router.GET("/v1/contracts", contractsHandler.ListContracts)

	http.Handle("/", router)

	sourceDB := db.Connect(cfg.SourceDBURL)
	defer sourceDB.Close()

	producer := kafka.NewProducer(cfg.KafkaBrokers)
	defer producer.Close()

	consumer := kafka.NewConsumer(cfg.KafkaBrokers, cfg.KafkaConsumerGroup)
	defer consumer.Close()

	pubCfg := &services.Config{
		ReadyTopic:   cfg.ReadyTopic,
		DLQTopic:     cfg.DLQTopic,
		WorkerCount:  cfg.WorkerCount,
		BatchSize:    cfg.BatchSize,
		MaxRetries:   cfg.MaxRetries,
		RetryBackoff: cfg.RetryBackoff,
		PollInterval: cfg.PollInterval,
	}

	publisher := services.NewPublisher(sourceDB, producer, pubCfg)

	ctx, cancel := context.WithCancel(context.Background())
	publisher.Start(ctx)
	consumer.Consume(ctx, []string{cfg.ReadyTopic}, &DummyProviderHandler{db: sinkDB, producer: producer, dlqTopic: cfg.DLQTopic})

	http.HandleFunc("/admin/replay", func(w http.ResponseWriter, r *http.Request) {
		token := r.Header.Get("Authorization")
		expected := "Bearer " + os.Getenv("REPLAY_ADMIN_TOKEN")
		if expected == "Bearer " || token != expected {
			w.WriteHeader(http.StatusUnauthorized)
			return
		}
		envelopeID := r.URL.Query().Get("envelope_id")
		if envelopeID == "" {
			w.WriteHeader(http.StatusBadRequest)
			return
		}
		// var aggID, evType, tenantID, traceID, envID string
		// var payload []byte
		// err := sinkDB.QueryRow(`SELECT aggregate_id, event_type, payload, tenant_id, trace_id, envelope_id FROM dlq_events WHERE envelope_id=$1 ORDER BY created_at DESC LIMIT 1`, envelopeID).Scan(&aggID, &evType, &payload, &tenantID, &traceID, &envID)
		// if err != nil {
		// 	w.WriteHeader(http.StatusNotFound)
		// 	return
		// }
		// _, err = sourceDB.Exec(`INSERT INTO outbox (outbox_id, aggregate_id, event_type, payload, status, attempts, tenant_id, trace_id, envelope_id, created_at) VALUES ($1,$2,$3,$4,'PENDING',0,$5,$6,$7,NOW())`,
		// 	uuid.New(), aggID, evType, payload, tenantID, traceID, envID)
		// if err != nil {
		// 	w.WriteHeader(http.StatusInternalServerError)
		// 	return
		// }
		// w.WriteHeader(http.StatusOK)
	})

	// graceful shutdown
	stop := make(chan os.Signal, 1)
	signal.Notify(stop, os.Interrupt, syscall.SIGTERM)
	<-stop

	// Shutdown http server
	if err := server.Shutdown(context.Background()); err != nil {
		utils.Logger.Error("Server shutdown failed", zap.Error(err))
	}

	cancel()
}
