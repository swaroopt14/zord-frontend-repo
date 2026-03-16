package services

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"errors"
	"os"
	"strings"
	"time"
	"zord-relay/kafka"
	"zord-relay/model"
	"zord-relay/utils"

	"github.com/google/uuid"
	"go.uber.org/zap"
)

type Publisher struct {
	outboxRepo   *OutboxRepo
	producer     *kafka.Producer
	cfg          *Config
}

type Config struct {
	ReadyTopic             string
	PublishFailureDLQTopic string
	PoisonEventDLQTopic    string
	WorkerCount            int
	BatchSize              int
	PollInterval           time.Duration
	MaxAttempts            int
	MaxAge                 time.Duration
}

type relayEvent struct {
	EventID       string          `json:"event_id"`
	EventType     string          `json:"event_type"`
	TenantID      string          `json:"tenant_id"`
	IntentID      string          `json:"intent_id"`
	EnvelopeID    string          `json:"envelope_id"`
	TraceID       string          `json:"trace_id"`
	SchemaVersion string          `json:"schema_version,omitempty"`
	PayloadInline json.RawMessage `json:"payload_inline"`
	PayloadHash   string          `json:"payload_hash"`
}

type dlqEnvelope struct {
	Event         relayEvent `json:"event"`
	Error         string     `json:"error"`
	ReasonCode    string     `json:"reason_code"`
	LastAttemptAt time.Time  `json:"last_attempt_at"`
	AttemptsCount int        `json:"attempts_count"`
}

func NewPublisher(outboxRepo *OutboxRepo, producer *kafka.Producer, cfg *Config) *Publisher {
	return &Publisher{outboxRepo: outboxRepo, producer: producer, cfg: cfg}
}

func (p *Publisher) Start(ctx context.Context) {
	for i := 0; i < p.cfg.WorkerCount; i++ {
		go p.worker(ctx, i)
	}
}

func (p *Publisher) worker(ctx context.Context, id int) {
	for {
		select {
		case <-ctx.Done():
			return
		default:
		}

		events, err := p.outboxRepo.ListPending(ctx, p.cfg.BatchSize)
		if err != nil {
			utils.Logger.Error("lease failed", zap.Int("worker_id", id), zap.Error(err))
			time.Sleep(p.cfg.PollInterval)
			continue
		}

		if len(events) == 0 {
			time.Sleep(p.cfg.PollInterval)
			continue
		}

		var publishedIDs []string

		for _, e := range events {
			key := e.EventID

			hash := sha256.Sum256(e.Payload)
			_ = hex.EncodeToString(hash[:])

			// No age gating or DLQ for simplified outbox

			headers := map[string]string{
				"trace_id":   e.TraceID,
				"tenant_id":  e.TenantID,
				"intent_id":  e.IntentID,
				"event_id":   e.EventID,
				"event_type": e.EventType,
			}

			err := p.producer.Publish("dispatch.events.v1", key, e.Payload, headers)
			if err != nil {
				reasonCode := classifyPublishError(err)
				poison := isPoisonPublishError(err)

				dlqMsg := dlqEnvelope{
					Event:         relayEvent{EventID: e.EventID, EventType: e.EventType, TenantID: e.TenantID, IntentID: e.IntentID, TraceID: e.TraceID, PayloadInline: e.Payload},
					Error:         err.Error(),
					ReasonCode:    reasonCode,
					LastAttemptAt: time.Now().UTC(),
					AttemptsCount: 0,
				}
				if poison && isMessageTooLargeError(err) {
					dlqMsg.Event.PayloadInline = nil
				}
				dlqHeaders := map[string]string{
					"trace_id":     e.TraceID,
					"tenant_id":    e.TenantID,
					"event_id":     e.EventID,
					"reason_code":  dlqMsg.ReasonCode,
					"dlq_category": func() string { if poison { return "poison_event" } ; return "publish_failure" }(),
				}
				topic := p.cfg.PublishFailureDLQTopic
				if poison {
					topic = p.cfg.PoisonEventDLQTopic
				}
				dlqErr := p.producer.Publish(topic, key, dlqMsg, dlqHeaders)
				if dlqErr != nil {
					utils.Logger.Error("dlq publish failed", zap.Int("worker_id", id), zap.String("event_id", e.EventID), zap.Error(dlqErr))
				} else if poison {
					publishedIDs = append(publishedIDs, e.EventID)
				}
				utils.Logger.Error("publish failed", zap.Int("worker_id", id), zap.String("event_id", e.EventID), zap.String("reason_code", reasonCode), zap.Error(err))
			} else {
				publishedIDs = append(publishedIDs, e.EventID)
				utils.Logger.Info("published event", zap.Int("worker_id", id), zap.String("event_id", e.EventID), zap.String("topic", "dispatch.events.v1"))

				// Optional: Emit provider-related events locally (disabled by default).
				// Enable by setting RELAY_EMIT_PROVIDER_EVENTS=true
				if os.Getenv("RELAY_EMIT_PROVIDER_EVENTS") == "true" {
					env := relayEvent{EventID: e.EventID, EventType: e.EventType, TenantID: e.TenantID, IntentID: e.IntentID, TraceID: e.TraceID, PayloadInline: e.Payload}
					if err := p.publishAttemptSentEvent(env); err != nil {
						utils.Logger.Error("failed to publish AttemptSent event", zap.Error(err))
					}
					if err := p.publishProviderAckedEvent(env); err != nil {
						utils.Logger.Error("failed to publish ProviderAcked event", zap.Error(err))
					}
				}
			}
		}

		if len(publishedIDs) > 0 {
			if err := p.outboxRepo.MarkPublished(ctx, publishedIDs); err != nil {
				utils.Logger.Error("mark published failed", zap.Int("worker_id", id), zap.Error(err))
			}
		}
	}
}

func classifyPublishError(err error) string {
	if isPoisonPublishError(err) {
		if isMessageTooLargeError(err) {
			return "POISON_EVENT_TOO_LARGE"
		}
		if isJSONMarshalError(err) {
			return "POISON_EVENT_INVALID_JSON"
		}
		return "POISON_EVENT"
	}
	return "KAFKA_PUBLISH_FAILED"
}

func isPoisonPublishError(err error) bool {
	return isJSONMarshalError(err) || isMessageTooLargeError(err)
}

func isJSONMarshalError(err error) bool {
	var syntaxErr *json.SyntaxError
	var typeErr *json.UnsupportedTypeError
	var valueErr *json.UnsupportedValueError

	if errors.As(err, &syntaxErr) || errors.As(err, &typeErr) || errors.As(err, &valueErr) {
		return true
	}
	return strings.Contains(strings.ToLower(err.Error()), "invalid character")
}

func isMessageTooLargeError(err error) bool {
	msg := strings.ToLower(err.Error())
	return strings.Contains(msg, "message size") ||
		strings.Contains(msg, "too large") ||
		strings.Contains(msg, "record is too large") ||
		strings.Contains(msg, "packet encoding")
}

func (p *Publisher) publishAttemptSentEvent(event relayEvent) error {
	attemptSentEvent := model.AttemptSent{
		EventID:    uuid.New().String(),
		EventType:  "AttemptSent",
		TenantID:   event.TenantID,
		IntentID:   event.IntentID,
		ContractID: event.IntentID,
		TraceID:    event.TraceID,
		CreatedAt:  time.Now(),
	}
	attemptSentEvent.Payload.DispatchID = uuid.New().String()
	attemptSentEvent.Payload.ConnectorID = "razorpayx"
	attemptSentEvent.Payload.CorridorID = "IMPS"
	attemptSentEvent.Payload.AttemptCount = 1
	attemptSentEvent.Payload.CorrelationCarriers = map[string]interface{}{
		"reference_id": uuid.New().String(),
		"narration":    "ZRD:" + event.IntentID,
	}

	headers := map[string]string{
		"trace_id":   attemptSentEvent.TraceID,
		"tenant_id":  attemptSentEvent.TenantID,
		"intent_id":  attemptSentEvent.IntentID,
		"event_id":   attemptSentEvent.EventID,
		"event_type": attemptSentEvent.EventType,
	}
	return p.producer.Publish("dispatch.events.v1", attemptSentEvent.EventID, attemptSentEvent, headers)
}

func (p *Publisher) publishProviderAckedEvent(event relayEvent) error {
	providerAckedEvent := model.ProviderAcked{
		EventID:    uuid.New().String(),
		EventType:  "ProviderAcked",
		TenantID:   event.TenantID,
		IntentID:   event.IntentID,
		ContractID: event.IntentID,
		TraceID:    event.TraceID,
		CreatedAt:  time.Now(),
	}
	providerAckedEvent.Payload.DispatchID = uuid.New().String()
	providerAckedEvent.Payload.ProviderAttemptID = "rp_" + uuid.New().String()
	providerAckedEvent.Payload.Status = "pending"

	headers := map[string]string{
		"trace_id":   providerAckedEvent.TraceID,
		"tenant_id":  providerAckedEvent.TenantID,
		"intent_id":  providerAckedEvent.IntentID,
		"event_id":   providerAckedEvent.EventID,
		"event_type": providerAckedEvent.EventType,
	}
	return p.producer.Publish("dispatch.events.v1", providerAckedEvent.EventID, providerAckedEvent, headers)
}
