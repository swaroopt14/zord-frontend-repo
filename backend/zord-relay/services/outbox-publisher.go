package services

import (
	"context"
	"database/sql"
	"time"
	"math/rand"
	"github.com/google/uuid"
	"go.uber.org/zap"
	"zord-relay/kafka"
	"zord-relay/model"
	"zord-relay/utils"
)

type Publisher struct {
	db       *sql.DB
	producer *kafka.Producer
	cfg      *Config
}

type Config struct {
	ReadyTopic   string
	DLQTopic     string
	WorkerCount  int
	BatchSize    int
	MaxRetries   int
	RetryBackoff time.Duration
	PollInterval time.Duration
}

func NewPublisher(db *sql.DB, producer *kafka.Producer, cfg *Config) *Publisher {
	return &Publisher{db: db, producer: producer, cfg: cfg}
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

		tx, err := p.db.BeginTx(ctx, nil)
		if err != nil {
			utils.Logger.Error("begin tx failed", zap.Error(err))
			time.Sleep(p.cfg.PollInterval)
			continue
		}

		rows, err := tx.QueryContext(ctx, `
			SELECT outbox_id, aggregate_id, event_type, payload, attempts, tenant_id, trace_id, envelope_id
			FROM outbox
			WHERE status='PENDING' AND (next_attempt_at IS NULL OR next_attempt_at <= NOW())
			FOR UPDATE SKIP LOCKED
			LIMIT $1
		`, p.cfg.BatchSize)
		if err != nil {
			utils.Logger.Error("fetch pending failed", zap.Error(err))
			tx.Rollback()
			time.Sleep(p.cfg.PollInterval)
			continue
		}

		events := []model.OutboxEvent{}
		for rows.Next() {
			var e model.OutboxEvent
			if err := rows.Scan(&e.ID, &e.AggregateID, &e.EventType, &e.Payload, &e.RetryCount, &e.TenantID, &e.TraceID, &e.EnvelopeID); err != nil {
				utils.Logger.Error("row scan failed", zap.Error(err))
				continue
			}
			events = append(events, e)
		}
		rows.Close()

		for _, e := range events {
			headers := map[string]string{
				"trace_id":    e.TraceID.String,
				"tenant_id":   e.TenantID,
				"envelope_id": e.EnvelopeID.String,
			}

			err := p.producer.Publish(p.cfg.ReadyTopic, e.AggregateID, e.Payload, headers)
			if err != nil {
				retries := e.RetryCount + 1
				if retries >= p.cfg.MaxRetries {
					dlq := map[string]interface{}{
						"reason_code":        "PUBLISH_FAILED",
						"error_message":      err.Error(),
						"original_event_type": e.EventType,
						"tenant_id":          e.TenantID,
						"trace_id":           e.TraceID.String,
						"envelope_id":        e.EnvelopeID.String,
						"schema_subject": "z.intent.ready",
						"schema_version": "v1",
					}
					_ = p.producer.Publish(p.cfg.DLQTopic, e.AggregateID, dlq, headers)
					
					envelopeID := e.EnvelopeID.String
					if !e.EnvelopeID.Valid {
						envelopeID = uuid.New().String() // Fallback if missing, as dlq_items requires it
					}
					
					_, _ = tx.ExecContext(ctx, `INSERT INTO dlq_items (dlq_id, tenant_id, envelope_id, stage, reason_code, error_detail, replayable, created_at) VALUES ($1,$2,$3,$4,$5,$6,$7,NOW())`,
						uuid.New().String(), e.TenantID, envelopeID, "OUTBOX_PUBLISH", "PUBLISH_FAILED", err.Error(), true)
					_, _ = tx.ExecContext(ctx, `UPDATE outbox SET status='FAILED' WHERE outbox_id=$1`, e.ID)
				} else {
					backoff := p.cfg.RetryBackoff * time.Duration(1<<retries)
					backoff += time.Duration(rand.Intn(100)) * time.Millisecond
					ms := int(backoff / time.Millisecond)
					_, _ = tx.ExecContext(ctx, `UPDATE outbox SET attempts=$1, next_attempt_at=NOW() + ($2::int * interval '1 millisecond') WHERE outbox_id=$3`, retries, ms, e.ID)
				}
			} else {
				_, _ = tx.ExecContext(ctx, `UPDATE outbox SET status='SENT', sent_at=NOW() WHERE outbox_id=$1`, e.ID)
			}
		}

		tx.Commit()
		if len(events) == 0 {
			time.Sleep(p.cfg.PollInterval)
		}
	}
}
