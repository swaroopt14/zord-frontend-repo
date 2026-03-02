package services

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"errors"
	"strings"
	"time"
	"zord-relay/kafka"
	"zord-relay/utils"

	"go.uber.org/zap"
)

type Publisher struct {
	intentClient *IntentClient
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

func NewPublisher(intentClient *IntentClient, producer *kafka.Producer, cfg *Config) *Publisher {
	return &Publisher{intentClient: intentClient, producer: producer, cfg: cfg}
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

		lease, err := p.intentClient.Lease(ctx, p.cfg.BatchSize)
		if err != nil {
			utils.Logger.Error("lease failed", zap.Int("worker_id", id), zap.Error(err))
			time.Sleep(p.cfg.PollInterval)
			continue
		}

		if lease == nil || len(lease.Events) == 0 || lease.LeaseID == "" {
			time.Sleep(p.cfg.PollInterval)
			continue
		}

		var ackIDs []string
		var nackIDs []string

		for _, e := range lease.Events {
			key := e.ID
			if key == "" {
				key = e.AggregateID
			}

			hash := sha256.Sum256(e.Payload)
			msg := relayEvent{
				EventID:       e.ID,
				EventType:     e.EventType,
				TenantID:      e.TenantID,
				IntentID:      e.AggregateID,
				EnvelopeID:    e.EnvelopeID,
				TraceID:       e.TraceID,
				SchemaVersion: e.SchemaVersion,
				PayloadInline: e.Payload,
				PayloadHash:   "sha256:" + hex.EncodeToString(hash[:]),
			}

			if p.cfg.MaxAge > 0 && time.Since(e.CreatedAt) >= p.cfg.MaxAge {
				dlqMsg := dlqEnvelope{
					Event:         msg,
					Error:         "retry window exceeded",
					ReasonCode:    "RETRY_WINDOW_EXCEEDED",
					LastAttemptAt: time.Now().UTC(),
					AttemptsCount: e.RetryCount,
				}
				dlqHeaders := map[string]string{
					"trace_id":     e.TraceID,
					"tenant_id":    e.TenantID,
					"event_id":     e.ID,
					"reason_code":  dlqMsg.ReasonCode,
					"dlq_category": "publish_failure",
				}
				if dlqErr := p.producer.Publish(p.cfg.PublishFailureDLQTopic, key, dlqMsg, dlqHeaders); dlqErr != nil {
					utils.Logger.Error("publish failure dlq publish failed", zap.Int("worker_id", id), zap.String("event_id", e.ID), zap.Error(dlqErr))
				}
				nackIDs = append(nackIDs, e.ID)
				continue
			}

			headers := map[string]string{
				"trace_id":  e.TraceID,
				"tenant_id": e.TenantID,
				"event_id":  e.ID,
			}

			err := p.producer.Publish(p.cfg.ReadyTopic, key, msg, headers)
			if err != nil {
				reasonCode := classifyPublishError(err)
				shouldDLQ := isPoisonPublishError(err)

				if shouldDLQ {
					dlqTopic := p.cfg.PoisonEventDLQTopic
					dlqMsg := dlqEnvelope{
						Event:         msg,
						Error:         err.Error(),
						ReasonCode:    reasonCode,
						LastAttemptAt: time.Now().UTC(),
						AttemptsCount: e.RetryCount,
					}

					if isMessageTooLargeError(err) {
						dlqMsg.Event.PayloadInline = nil
					}

					dlqHeaders := map[string]string{
						"trace_id":     e.TraceID,
						"tenant_id":    e.TenantID,
						"event_id":     e.ID,
						"reason_code":  dlqMsg.ReasonCode,
						"dlq_category": "poison_event",
					}

					if dlqErr := p.producer.Publish(dlqTopic, key, dlqMsg, dlqHeaders); dlqErr != nil {
						utils.Logger.Error("poison dlq publish failed", zap.Int("worker_id", id), zap.String("event_id", e.ID), zap.Error(dlqErr))
						nackIDs = append(nackIDs, e.ID)
					} else {
						ackIDs = append(ackIDs, e.ID)
					}
				} else {
					if p.cfg.MaxAttempts > 0 && e.RetryCount >= p.cfg.MaxAttempts {
						dlqMsg := dlqEnvelope{
							Event:         msg,
							Error:         err.Error(),
							ReasonCode:    "PUBLISH_FAILED_MAX_ATTEMPTS",
							LastAttemptAt: time.Now().UTC(),
							AttemptsCount: e.RetryCount,
						}
						dlqHeaders := map[string]string{
							"trace_id":     e.TraceID,
							"tenant_id":    e.TenantID,
							"event_id":     e.ID,
							"reason_code":  dlqMsg.ReasonCode,
							"dlq_category": "publish_failure",
						}
						if dlqErr := p.producer.Publish(p.cfg.PublishFailureDLQTopic, key, dlqMsg, dlqHeaders); dlqErr != nil {
							utils.Logger.Error("publish failure dlq publish failed", zap.Int("worker_id", id), zap.String("event_id", e.ID), zap.Error(dlqErr))
						}
					}
					utils.Logger.Error("publish failed", zap.Int("worker_id", id), zap.String("event_id", e.ID), zap.String("reason_code", reasonCode), zap.Error(err))
					nackIDs = append(nackIDs, e.ID)
				}
			} else {
				ackIDs = append(ackIDs, e.ID)
			}
		}

		if len(ackIDs) > 0 {
			if err := p.intentClient.Ack(ctx, lease.LeaseID, ackIDs); err != nil {
				utils.Logger.Error("ack failed", zap.Int("worker_id", id), zap.String("lease_id", lease.LeaseID), zap.Error(err))
			}
		}

		if len(nackIDs) > 0 {
			if err := p.intentClient.Nack(ctx, lease.LeaseID, nackIDs); err != nil {
				utils.Logger.Error("nack failed", zap.Int("worker_id", id), zap.String("lease_id", lease.LeaseID), zap.Error(err))
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
