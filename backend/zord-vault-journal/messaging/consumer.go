package messaging

import (
	"context"
	"encoding/json"
	"log"

	"go.opentelemetry.io/otel"
	"go.opentelemetry.io/otel/attribute"
	"go.opentelemetry.io/otel/codes"
	"main.go/config"
	"main.go/model"
	"main.go/services"
	"main.go/storage"
)

// StartRawIntentWorker processes raw intent messages with distributed tracing
func StartRawIntentWorker(ctx context.Context, s3store *storage.S3Store) {
	tracer := otel.Tracer("zord-vault-journal")

	for {
		// Create span for Redis pop operation
		ctx, redisSpan := tracer.Start(ctx, "redis.pop_intent_message")

		result, err := config.RedisClient.BRPop(
			ctx,
			0,
			"Intent_Data",
		).Result()

		if err != nil {
			redisSpan.RecordError(err)
			redisSpan.SetStatus(codes.Error, "Redis pop error")
			redisSpan.End()
			log.Println("Redis Pop Error", err)
			continue
		}
		redisSpan.End()

		// Create span for message processing
		ctx, processSpan := tracer.Start(ctx, "vault.process_raw_intent")

		var msg model.RawIntentMessage
		err = json.Unmarshal([]byte(result[1]), &msg)
		if err != nil {
			processSpan.RecordError(err)
			processSpan.SetStatus(codes.Error, "Invalid message format")
			processSpan.End()
			log.Println("invalid message:", err)
			continue
		}

		// Add span attributes
		processSpan.SetAttributes(
			attribute.String("tenant.id", msg.TenantID),
			attribute.String("trace.id", msg.TraceID),
			attribute.String("idempotency.key", msg.IdempotencyKey),
			attribute.Int("payload.size", len(msg.RawPayload)),
		)

		// Process raw intent to S3
		ctx, s3Span := tracer.Start(ctx, "vault.store_s3")
		ack, err := services.ProcessRawIntent(ctx, msg, s3store)
		s3Span.End()

		if err != nil {
			processSpan.RecordError(err)
			processSpan.SetStatus(codes.Error, "Failed to process raw intent to S3")
			processSpan.End()
			log.Fatal("Failed to process raw intent to S3:", err)
			return
		}

		// Store in database
		ctx, dbSpan := tracer.Start(ctx, "vault.store_database")
		err = services.RawIntent(ctx, msg, ack)
		dbSpan.End()

		if err != nil {
			processSpan.RecordError(err)
			processSpan.SetStatus(codes.Error, "Failed to process raw intent to DB")
			processSpan.End()
			log.Fatal("Failed to process raw intent DB:", err)
			return
		}

		// Add success attributes
		processSpan.SetAttributes(
			attribute.String("envelope.id", ack.EnvelopeId),
			attribute.String("received.at", ack.ReceivedAt.Format("2006-01-02T15:04:05Z07:00")),
		)
		processSpan.SetStatus(codes.Ok, "Raw intent processed successfully")
		processSpan.End()

		log.Printf("Processed raw intent: envelope_id=%s, trace_id=%s", ack.EnvelopeId, msg.TraceID)
	}
}
