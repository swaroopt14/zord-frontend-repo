// Package services contains business logic for the Zord Relay service
package services

import (
	"context"
	"database/sql"
	"encoding/json"
	"log"
	"net/http"
	"time"

	"zord-relay/config"
	"zord-relay/kafka"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	_ "github.com/lib/pq"
)

// OutboxPublisher handles publishing messages from the outbox table to Kafka
type OutboxPublisher struct {
	producer   *kafka.Producer
	config     *config.Config
	db         *sql.DB
	isRunning  bool
}

// OutboxMessage represents a message in the outbox table
type OutboxMessage struct {
	ID        string    `json:"id" db:"id"`
	Topic     string    `json:"topic" db:"topic"`
	Key       string    `json:"key" db:"key"`
	Value     string    `json:"value" db:"value"`
	Status    string    `json:"status" db:"status"`
	CreatedAt time.Time `json:"created_at" db:"created_at"`
}

// PublishRequest represents a request to publish a message
type PublishRequest struct {
	Key   string      `json:"key"`
	Value interface{} `json:"value"`
}

// NewOutboxPublisher creates a new outbox publisher
func NewOutboxPublisher(producer *kafka.Producer, cfg *config.Config) *OutboxPublisher {
	// Initialize database connection
	db, err := sql.Open("postgres", cfg.DatabaseURL)
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}

	// Test database connection
	if err := db.Ping(); err != nil {
		log.Fatalf("Failed to ping database: %v", err)
	}

	// Create outbox table if it doesn't exist
	if err := createOutboxTable(db); err != nil {
		log.Fatalf("Failed to create outbox table: %v", err)
	}

	return &OutboxPublisher{
		producer: producer,
		config:   cfg,
		db:       db,
	}
}

// createOutboxTable creates the outbox table if it doesn't exist
func createOutboxTable(db *sql.DB) error {
	query := `
		CREATE TABLE IF NOT EXISTS outbox (
			id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
			topic      TEXT NOT NULL,
			key        TEXT,
			value      TEXT NOT NULL,
			status     TEXT NOT NULL DEFAULT 'pending',
			created_at TIMESTAMPTZ DEFAULT now(),
			processed_at TIMESTAMPTZ
		);

		CREATE INDEX IF NOT EXISTS idx_outbox_status ON outbox(status);
		CREATE INDEX IF NOT EXISTS idx_outbox_created_at ON outbox(created_at);
	`

	_, err := db.Exec(query)
	if err != nil {
		return err
	}

	log.Println("Outbox table created successfully")
	return nil
}

// Start begins the outbox polling process
func (op *OutboxPublisher) Start(ctx context.Context) {
	op.isRunning = true
	log.Printf("Starting outbox publisher with poll interval: %v", op.config.OutboxPollInterval)

	ticker := time.NewTicker(op.config.OutboxPollInterval)
	defer ticker.Stop()

	for {
		select {
		case <-ctx.Done():
			log.Println("Stopping outbox publisher...")
			op.isRunning = false
			return
		case <-ticker.C:
			if err := op.processOutboxMessages(ctx); err != nil {
				log.Printf("Error processing outbox messages: %v", err)
			}
		}
	}
}

// processOutboxMessages processes pending messages from the outbox table
func (op *OutboxPublisher) processOutboxMessages(ctx context.Context) error {
	// Get pending messages
	query := `
		SELECT id, topic, key, value, status, created_at
		FROM outbox
		WHERE status = 'pending'
		ORDER BY created_at ASC
		LIMIT $1
	`

	rows, err := op.db.QueryContext(ctx, query, op.config.OutboxBatchSize)
	if err != nil {
		return err
	}
	defer rows.Close()

	var messages []OutboxMessage
	for rows.Next() {
		var msg OutboxMessage
		err := rows.Scan(&msg.ID, &msg.Topic, &msg.Key, &msg.Value, &msg.Status, &msg.CreatedAt)
		if err != nil {
			return err
		}
		messages = append(messages, msg)
	}

	// Process each message
	for _, msg := range messages {
		if err := op.publishMessage(ctx, &msg); err != nil {
			log.Printf("Failed to publish message %s: %v", msg.ID, err)
			continue
		}
	}

	return nil
}

// publishMessage publishes a single message to Kafka and updates its status
func (op *OutboxPublisher) publishMessage(ctx context.Context, msg *OutboxMessage) error {
	// Publish to Kafka
	err := op.producer.Publish(msg.Topic, msg.Key, msg.Value)
	if err != nil {
		return err
	}

	// Update message status to processed
	updateQuery := `
		UPDATE outbox
		SET status = 'processed', processed_at = now()
		WHERE id = $1
	`

	_, err = op.db.ExecContext(ctx, updateQuery, msg.ID)
	if err != nil {
		log.Printf("Failed to update message status for %s: %v", msg.ID, err)
		return err
	}

	log.Printf("Successfully published message %s to topic %s", msg.ID, msg.Topic)
	return nil
}

// HandlePublish handles HTTP requests to publish messages
func (op *OutboxPublisher) HandlePublish(c *gin.Context) {
	topic := c.Param("topic")

	var req PublishRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid request format",
			"details": err.Error(),
		})
		return
	}

	// Generate unique ID for the message
	messageID := uuid.New().String()

	// Store message in outbox
	insertQuery := `
		INSERT INTO outbox (id, topic, key, value, status)
		VALUES ($1, $2, $3, $4, 'pending')
	`

	valueBytes, err := json.Marshal(req.Value)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to marshal message value",
		})
		return
	}

	_, err = op.db.Exec(insertQuery, messageID, topic, req.Key, string(valueBytes))
	if err != nil {
		log.Printf("Failed to insert message into outbox: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to queue message",
		})
		return
	}

	c.JSON(http.StatusAccepted, gin.H{
		"message_id": messageID,
		"topic":      topic,
		"status":     "queued",
		"message":    "Message queued for publishing",
	})
}

// HandleListTopics returns information about available topics
func (op *OutboxPublisher) HandleListTopics(c *gin.Context) {
	// Get distinct topics from outbox
	query := `SELECT DISTINCT topic FROM outbox ORDER BY topic`

	rows, err := op.db.Query(query)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to fetch topics",
		})
		return
	}
	defer rows.Close()

	var topics []string
	for rows.Next() {
		var topic string
		if err := rows.Scan(&topic); err != nil {
			continue
		}
		topics = append(topics, topic)
	}

	c.JSON(http.StatusOK, gin.H{
		"topics": topics,
		"count":  len(topics),
	})
}

// Close closes the database connection
func (op *OutboxPublisher) Close() error {
	if op.db != nil {
		return op.db.Close()
	}
	return nil
}
