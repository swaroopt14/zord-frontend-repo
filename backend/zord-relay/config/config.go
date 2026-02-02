package config

import (
	"log"
	"os"
	"strconv"
	"strings"
	"time"
)

type Config struct {
	KafkaBrokers       []string
	KafkaConsumerGroup string
	ReadyTopic         string
	DLQTopic           string
	PayoutTopic        string
	DBURL              string
	WorkerCount        int
	BatchSize          int
	MaxRetries         int
	RetryBackoff       time.Duration
	PollInterval       time.Duration
	ServiceName        string
}

func Load() *Config {
	workerCount, err := strconv.Atoi(getEnv("OUTBOX_WORKER_COUNT", "5"))
	if err != nil {
		log.Fatalf("Invalid OUTBOX_WORKER_COUNT: %v", err)
	}

	batchSize, err := strconv.Atoi(getEnv("OUTBOX_BATCH_SIZE", "10"))
	if err != nil {
		log.Fatalf("Invalid OUTBOX_BATCH_SIZE: %v", err)
	}

	maxRetries, err := strconv.Atoi(getEnv("OUTBOX_MAX_RETRIES", "5"))
	if err != nil {
		log.Fatalf("Invalid OUTBOX_MAX_RETRIES: %v", err)
	}

	retryBackoffMs, err := strconv.Atoi(getEnv("OUTBOX_RETRY_BACKOFF_MS", "50"))
	if err != nil {
		log.Fatalf("Invalid OUTBOX_RETRY_BACKOFF_MS: %v", err)
	}

	pollIntervalSec, err := strconv.Atoi(getEnv("OUTBOX_POLL_INTERVAL_SEC", "5"))
	if err != nil {
		log.Fatalf("Invalid OUTBOX_POLL_INTERVAL_SEC: %v", err)
	}

	return &Config{
		KafkaBrokers:       splitCSV(getEnv("KAFKA_BROKERS", "broker1:9092")),
		KafkaConsumerGroup: getEnv("KAFKA_CONSUMER_GROUP", "zord-relay-group"),
		ReadyTopic:         getEnv("KAFKA_READY_TOPIC", "z.intent.ready.v1"),
		DLQTopic:           getEnv("KAFKA_DLQ_TOPIC", "z.intent.dlq.v1"),
		PayoutTopic:        getEnv("KAFKA_PAYOUT_TOPIC", "payout_contract.v1"),
		DBURL:              getEnv("DATABASE_URL", ""),
		WorkerCount:        workerCount,
		BatchSize:          batchSize,
		MaxRetries:         maxRetries,
		RetryBackoff:       time.Duration(retryBackoffMs) * time.Millisecond,
		PollInterval:       time.Duration(pollIntervalSec) * time.Second,
		ServiceName:        getEnv("SERVICE_NAME", "outbox-relay"),
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