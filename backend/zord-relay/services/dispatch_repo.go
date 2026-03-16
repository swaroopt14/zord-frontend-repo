package services

import (
	"context"
	"database/sql"
	"zord-relay/model"
)

type DispatchRepo struct {
	db *sql.DB
}

func NewDispatchRepo(db *sql.DB) *DispatchRepo {
	return &DispatchRepo{db: db}
}

func (r *DispatchRepo) Create(ctx context.Context, d *model.Dispatch) error {
	query := `
		INSERT INTO dispatches (
			dispatch_id,
			contract_id,
			intent_id,
			tenant_id,
			trace_id,
			connector_id,
			corridor_id,
			attempt_count,
			status,
			provider_attempt_id,
			provider_reference,
			created_at,
			sent_at,
			acked_at
		) VALUES (
			$1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14
		)
	`
	_, err := r.db.ExecContext(ctx, query,
		d.DispatchID,
		d.ContractID,
		d.IntentID,
		d.TenantID,
		d.TraceID,
		d.ConnectorID,
		d.CorridorID,
		d.AttemptCount,
		d.Status,
		d.ProviderAttemptID,
		d.ProviderReference,
		d.CreatedAt,
		d.SentAt,
		d.AckedAt,
	)
	return err
}

func (r *DispatchRepo) UpdateProviderAck(ctx context.Context, dispatchID string, providerAttemptID string, status string) error {
	_, err := r.db.ExecContext(ctx, `
		UPDATE dispatches
		SET provider_attempt_id=$1, status=$2, acked_at=now()
		WHERE dispatch_id=$4
	`, providerAttemptID, status, dispatchID)
	return err
}
