package services

import (
	"context"
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
	ReadyTopic   string
	DLQTopic     string
	WorkerCount  int
	BatchSize    int
	PollInterval time.Duration
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
			utils.Logger.Error("lease failed", zap.Error(err))
			time.Sleep(p.cfg.PollInterval)
			continue
		}

		if len(lease.Events) == 0 {
			time.Sleep(p.cfg.PollInterval)
			continue
		}

		var ackIDs []string
		var nackIDs []string

		for _, e := range lease.Events {
			headers := map[string]string{
				"trace_id":    e.TraceID,
				"tenant_id":   e.TenantID,
				"envelope_id": e.EnvelopeID,
				"event_type":  e.EventType,
			}

			err := p.producer.Publish(p.cfg.ReadyTopic, e.AggregateID, e.Payload, headers)
			if err != nil {
				utils.Logger.Error("publish failed", zap.String("event_id", e.ID), zap.Error(err))
				nackIDs = append(nackIDs, e.ID)
			} else {
				ackIDs = append(ackIDs, e.ID)
			}
		}

		if len(ackIDs) > 0 {
			if err := p.intentClient.Ack(ctx, lease.LeaseID, ackIDs); err != nil {
				utils.Logger.Error("ack failed", zap.String("lease_id", lease.LeaseID), zap.Error(err))
			}
		}

		if len(nackIDs) > 0 {
			if err := p.intentClient.Nack(ctx, lease.LeaseID, nackIDs); err != nil {
				utils.Logger.Error("nack failed", zap.String("lease_id", lease.LeaseID), zap.Error(err))
			}
		}
	}
}
