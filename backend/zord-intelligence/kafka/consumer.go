package kafka

// What is this file?
// This file is ZPI's "ears" — it listens to 7 Kafka topics simultaneously.
// When a message arrives, it decodes the JSON and calls the right service.
//
// WHO CALLS THIS FILE?
// cmd/main.go calls StartConsumers() once at startup.
//
// WHAT DOES IT CALL?
// It calls projection_service and policy_service when events arrive.
// We pass these in as an interface (explained below).

import (
	"context"
	"encoding/json"
	"log"

	"github.com/segmentio/kafka-go"
	"github.com/zord/zord-intelligence/config"
	"github.com/zord/zord-intelligence/internal/models"
)

// EventHandler defines what methods the consumer needs from the services layer.
//
// WHY AN INTERFACE HERE?
// The consumer doesn't care about the concrete type (projectionService or policyService).
// It just needs to call Handle methods. Using an interface:
//  1. Makes testing easy — you can pass a mock
//  2. Keeps kafka/ decoupled from internal/services/
//
// Think of it like a Java interface:
//
//	public interface EventHandler {
//	    void handleIntentCreated(IntentCreatedEvent e);
//	}
type EventHandler interface {
	HandleIntentCreated(ctx context.Context, e models.IntentCreatedEvent) error
	HandleDispatchCreated(ctx context.Context, e models.DispatchAttemptCreatedEvent) error
	HandleOutcomeNormalized(ctx context.Context, e models.OutcomeNormalizedEvent) error
	HandleFinalityCertIssued(ctx context.Context, e models.FinalityCertIssuedEvent) error
	HandleFinalContractUpdated(ctx context.Context, e models.FinalContractUpdatedEvent) error
	HandleEvidencePackReady(ctx context.Context, e models.EvidencePackReadyEvent) error
	HandleDLQEvent(ctx context.Context, e models.DLQEvent) error
}

// StartConsumers launches one goroutine per Kafka topic.
// Each goroutine runs forever until ctx is cancelled (service shutdown).
//
// Called once from cmd/main.go:
//
//	kafka.StartConsumers(ctx, cfg, handler)
func StartConsumers(ctx context.Context, cfg *config.Config, handler EventHandler) {
	brokers := []string{cfg.KafkaBrokers}

	// Each topic gets its own goroutine.
	// "go func()" starts the function in the background immediately.
	// All 7 run at the same time — they don't wait for each other.

	go consume(ctx, brokers, cfg.TopicIntentCreated, cfg.KafkaGroupID,
		func(msg kafka.Message) error {
			var e models.IntentCreatedEvent
			if err := json.Unmarshal(msg.Value, &e); err != nil {
				return err
			}
			return handler.HandleIntentCreated(ctx, e)
		})

	go consume(ctx, brokers, cfg.TopicDispatchCreated, cfg.KafkaGroupID,
		func(msg kafka.Message) error {
			var e models.DispatchAttemptCreatedEvent
			if err := json.Unmarshal(msg.Value, &e); err != nil {
				return err
			}
			return handler.HandleDispatchCreated(ctx, e)
		})

	go consume(ctx, brokers, cfg.TopicOutcomeNormalized, cfg.KafkaGroupID,
		func(msg kafka.Message) error {
			var e models.OutcomeNormalizedEvent
			if err := json.Unmarshal(msg.Value, &e); err != nil {
				return err
			}
			return handler.HandleOutcomeNormalized(ctx, e)
		})

	go consume(ctx, brokers, cfg.TopicFinalityCert, cfg.KafkaGroupID,
		func(msg kafka.Message) error {
			var e models.FinalityCertIssuedEvent
			if err := json.Unmarshal(msg.Value, &e); err != nil {
				return err
			}
			return handler.HandleFinalityCertIssued(ctx, e)
		})

	go consume(ctx, brokers, cfg.TopicFinalContract, cfg.KafkaGroupID,
		func(msg kafka.Message) error {
			var e models.FinalContractUpdatedEvent
			if err := json.Unmarshal(msg.Value, &e); err != nil {
				return err
			}
			return handler.HandleFinalContractUpdated(ctx, e)
		})

	go consume(ctx, brokers, cfg.TopicEvidenceReady, cfg.KafkaGroupID,
		func(msg kafka.Message) error {
			var e models.EvidencePackReadyEvent
			if err := json.Unmarshal(msg.Value, &e); err != nil {
				return err
			}
			return handler.HandleEvidencePackReady(ctx, e)
		})

	go consume(ctx, brokers, cfg.TopicDLQ, cfg.KafkaGroupID,
		func(msg kafka.Message) error {
			var e models.DLQEvent
			if err := json.Unmarshal(msg.Value, &e); err != nil {
				return err
			}
			return handler.HandleDLQEvent(ctx, e)
		})

	log.Println("kafka: all 7 consumers started")
}

// consume is the shared loop used by every topic above.
// It reads messages forever until ctx is cancelled.
//
// PARAMETERS:
//
//	brokers  → Kafka broker addresses
//	topic    → which topic to read
//	groupID  → consumer group name (all ZPI instances share one group)
//	handle   → function to call for each message
//
// MANUAL OFFSET COMMIT:
// We only commit the offset (tell Kafka "I processed this message")
// AFTER handle() returns nil (success).
// If handle() returns an error, we do NOT commit.
// This means Kafka will redeliver the message after restart.
// This is called "at-least-once processing" — safe if your handlers are idempotent.
func consume(
	ctx context.Context,
	brokers []string,
	topic string,
	groupID string,
	handle func(kafka.Message) error,
) {
	// kafka.NewReader creates a consumer connected to this topic
	reader := kafka.NewReader(kafka.ReaderConfig{
		Brokers: brokers,
		Topic:   topic,
		GroupID: groupID,

		// CommitInterval: 0 means MANUAL commit mode.
		// We call CommitMessages() ourselves only after successful processing.
		// This prevents message loss if the service crashes mid-processing.
		CommitInterval: 0,

		// How long to wait for a new message before timing out.
		// 3 seconds is standard — short enough to respond quickly to shutdown.
		MaxWait: 3e9, // 3 seconds in nanoseconds
	})

	// defer runs when this function exits (service shutdown).
	// Closes the Kafka connection cleanly.
	defer func() {
		if err := reader.Close(); err != nil {
			log.Printf("kafka: error closing reader for topic %s: %v", topic, err)
		}
	}()

	log.Printf("kafka: consumer started for topic=%s group=%s", topic, groupID)

	// This loop runs forever until ctx is cancelled.
	for {
		// FetchMessage blocks until:
		//   a) A message is available
		//   b) ctx is cancelled (service is shutting down)
		msg, err := reader.FetchMessage(ctx)
		if err != nil {
			// ctx.Err() is non-nil when context is cancelled (normal shutdown)
			if ctx.Err() != nil {
				log.Printf("kafka: consumer shutting down for topic=%s", topic)
				return
			}
			// Any other error: log it and continue the loop
			// This handles temporary Kafka connectivity issues
			log.Printf("kafka: fetch error on topic=%s: %v", topic, err)
			continue
		}

		// Call the handler function for this message
		if err := handle(msg); err != nil {
			// Handler failed — do NOT commit offset.
			// Kafka will redeliver this message after restart.
			log.Printf("kafka: handler error on topic=%s offset=%d: %v",
				topic, msg.Offset, err)
			continue
		}

		// Handler succeeded — commit offset.
		// This tells Kafka: "consumer group zord-intelligence has
		// successfully processed message at offset X on topic Y"
		if err := reader.CommitMessages(ctx, msg); err != nil {
			log.Printf("kafka: commit error on topic=%s offset=%d: %v",
				topic, msg.Offset, err)
		}
	}
}
