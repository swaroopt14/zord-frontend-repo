package config

import (
	"log"
	"os"
	"strconv"
	"strings"
	"time"
)

type Config struct {
	KafkaBrokers           []string
	KafkaConsumerGroup     string
	ReadyTopic             string
	DLQTopic               string
	PublishFailureDLQTopic string
	PoisonEventDLQTopic    string
	PayoutTopic            string
	IntentEngineBaseURL    string
	SinkDBURL              string
	WorkerCount            int
	BatchSize              int
	PollInterval           time.Duration
	MaxAttempts            int
	MaxAge                 time.Duration
	ServiceName            string
}

func Load() *Config {
	workerCount, err := strconv.Atoi(getEnv("OUTBOX_WORKER_COUNT", "24"))
	if err != nil {
		log.Fatalf("Invalid OUTBOX_WORKER_COUNT: %v", err)
	}

	batchSize, err := strconv.Atoi(getEnv("OUTBOX_BATCH_SIZE", "10"))
	if err != nil {
		log.Fatalf("Invalid OUTBOX_BATCH_SIZE: %v", err)
	}

	maxAttempts, err := strconv.Atoi(getEnv("OUTBOX_MAX_ATTEMPTS", "7"))
	if err != nil || maxAttempts <= 0 {
		log.Fatalf("Invalid OUTBOX_MAX_ATTEMPTS: %v", err)
	}

	maxAge := 24 * time.Hour
	if raw := strings.TrimSpace(getEnv("OUTBOX_MAX_AGE", "")); raw != "" {
		d, err := time.ParseDuration(raw)
		if err != nil {
			log.Fatalf("Invalid OUTBOX_MAX_AGE: %v", err)
		}
		maxAge = d
	}

	pollInterval := 5 * time.Second
	if raw := strings.TrimSpace(getEnv("OUTBOX_POLL_INTERVAL", "")); raw != "" {
		d, err := time.ParseDuration(raw)
		if err != nil {
			log.Fatalf("Invalid OUTBOX_POLL_INTERVAL: %v", err)
		}
		pollInterval = d
	} else {
		pollIntervalSec, err := strconv.Atoi(getEnv("OUTBOX_POLL_INTERVAL_SEC", "5"))
		if err != nil {
			log.Fatalf("Invalid OUTBOX_POLL_INTERVAL_SEC: %v", err)
		}
		pollInterval = time.Duration(pollIntervalSec) * time.Second
	}

	dlqTopic := getEnv("KAFKA_DLQ_TOPIC", "z.intent.dlq.v1")

	return &Config{
		KafkaBrokers:           splitCSV(getEnv("KAFKA_BROKERS", "broker1:9092")),
		KafkaConsumerGroup:     getEnv("KAFKA_CONSUMER_GROUP", "zord-relay-group"),
		ReadyTopic:             getEnv("KAFKA_READY_TOPIC", "z.intent.ready.v1"),
		DLQTopic:               dlqTopic,
		PublishFailureDLQTopic: getEnv("KAFKA_PUBLISH_FAILURE_DLQ_TOPIC", dlqTopic),
		PoisonEventDLQTopic:    getEnv("KAFKA_POISON_EVENT_DLQ_TOPIC", dlqTopic),
		PayoutTopic:            getEnv("KAFKA_PAYOUT_TOPIC", "payout_contract.v1"),
		IntentEngineBaseURL:    getEnv("INTENT_ENGINE_BASE_URL", "http://zord-intent-engine:8083"),
		SinkDBURL:              getEnv("SINK_DATABASE_URL", ""),
		WorkerCount:            workerCount,
		BatchSize:              batchSize,
		PollInterval:           pollInterval,
		MaxAttempts:            maxAttempts,
		MaxAge:                 maxAge,
		ServiceName:            getEnv("SERVICE_NAME", "outbox-relay"),
	}
}

func getEnv(key, defaultValue string) string {
	if val, ok := os.LookupEnv(key); ok {
		return val
	}
	return defaultValue
}

func splitCSV(s string) []string {
	parts := strings.Split(s, ",")
	var brokers []string
	for _, p := range parts {
		p = strings.TrimSpace(p)
		if p != "" {
			brokers = append(brokers, p)
		}
	}
	return brokers
}
