package kafka

import (
	"context"
	"encoding/json"
	"log"
	"strings"

	"github.com/segmentio/kafka-go"
	"github.com/zord/zord-intelligence/config"
	"github.com/zord/zord-intelligence/internal/models"
)

type EventHandler interface {
	HandleIntentCreated(ctx context.Context, e models.IntentCreatedEvent) error
	HandleDispatchCreated(ctx context.Context, e models.DispatchAttemptCreatedEvent) error
	HandleOutcomeNormalized(ctx context.Context, e models.OutcomeNormalizedEvent) error
	HandleFinalityCertIssued(ctx context.Context, e models.FinalityCertIssuedEvent) error
	HandleFinalContractUpdated(ctx context.Context, e models.FinalContractUpdatedEvent) error
	HandleEvidencePackReady(ctx context.Context, e models.EvidencePackReadyEvent) error
	HandleDLQEvent(ctx context.Context, e models.DLQEvent) error
	HandleStatementMatch(ctx context.Context, e models.StatementMatchEvent) error
}


func StartConsumers(ctx context.Context, cfg *config.Config, handler EventHandler) {
	
	brokers := strings.Split(cfg.KafkaBrokers, ",")

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

	go consume(ctx, brokers, cfg.TopicStatementMatch, cfg.KafkaGroupID,
		func(msg kafka.Message) error {
			var e models.StatementMatchEvent
			if err := json.Unmarshal(msg.Value, &e); err != nil {
				return err
			}
			return handler.HandleStatementMatch(ctx, e)
		})

	log.Println("kafka: all 8 consumers started")
}

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
