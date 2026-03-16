package services

import (
	"context"
	"database/sql"
	"encoding/json"
	"time"
	"github.com/lib/pq"
)

type OutboxRepo struct {
	db *sql.DB
}

type OutboxRow struct {
	EventID    string
	EventType  string
	DispatchID string
	ContractID string
	IntentID   string
	TenantID   string
	TraceID    string
	Payload    json.RawMessage
	CreatedAt  time.Time
}

func NewOutboxRepo(db *sql.DB) *OutboxRepo {
	return &OutboxRepo{db: db}
}

func (r *OutboxRepo) Enqueue(ctx context.Context, eventID string, eventType string, dispatchID string, contractID string, intentID string, tenantID string, traceID string, payload json.RawMessage) error {
	query := `
		INSERT INTO relay_outbox (
			event_id,
			event_type,
			dispatch_id,
			contract_id,
			intent_id,
			tenant_id,
			trace_id,
			payload,
			status
		) VALUES (
			$1,$2,$3,$4,$5,$6,$7,$8,'PENDING'
		)
	`
	_, err := r.db.ExecContext(ctx, query, eventID, eventType, dispatchID, contractID, intentID, tenantID, traceID, payload)
	return err
}

func (r *OutboxRepo) ListPending(ctx context.Context, batch int) ([]OutboxRow, error) {
	rows, err := r.db.QueryContext(ctx, `
		SELECT event_id, event_type, dispatch_id, contract_id, intent_id, tenant_id, trace_id, payload, created_at
		FROM relay_outbox
		WHERE status='PENDING'
		ORDER BY created_at ASC
		LIMIT $1
	`, batch)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var events []OutboxRow
	for rows.Next() {
		var e OutboxRow
		if err := rows.Scan(&e.EventID, &e.EventType, &e.DispatchID, &e.ContractID, &e.IntentID, &e.TenantID, &e.TraceID, &e.Payload, &e.CreatedAt); err != nil {
			return nil, err
		}
		events = append(events, e)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	return events, nil
}

func (r *OutboxRepo) MarkPublished(ctx context.Context, eventIDs []string) error {
	if len(eventIDs) == 0 {
		return nil
	}
	query := `
		UPDATE relay_outbox
		SET status='PUBLISHED', published_at=now()
		WHERE event_id = ANY($1)
	`
	_, err := r.db.ExecContext(ctx, query, pq.Array(eventIDs))
	return err
}
