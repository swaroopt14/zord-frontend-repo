package services

import (
	"context"
	"database/sql"
	"fmt"
	"zord-relay/model"
)

// DispatchRepo handles all reads and writes to the dispatches table.
// All mutating methods that are part of the dispatch lifecycle are
// called inside transactions owned by DispatchLoop — they accept *sql.Tx,
// not *sql.DB, to make the transactional boundary explicit.
type DispatchRepo struct {
	db *sql.DB
}

func NewDispatchRepo(db *sql.DB) *DispatchRepo {
	return &DispatchRepo{db: db}
}

// FindByContractAndAttempt checks whether a dispatch row already exists
// for a given (contract_id, attempt_count) pair.
// This is the idempotency check: if a row exists, the dispatch_id is reused
// rather than minting a new one — preventing duplicate PSP calls on re-lease.
func (r *DispatchRepo) FindByContractAndAttempt(ctx context.Context, contractID string, attemptCount int) (*model.Dispatch, error) {
	row := r.db.QueryRowContext(ctx, `
		SELECT
			dispatch_id, contract_id, intent_id, tenant_id, trace_id,
			connector_id, corridor_id, attempt_count, status,
			provider_attempt_id, provider_reference,
			created_at, sent_at, acked_at
		FROM dispatches
		WHERE contract_id = $1 AND attempt_count = $2
		LIMIT 1
	`, contractID, attemptCount)

	var d model.Dispatch
	var providerAttemptID, providerReference sql.NullString
	var sentAt, ackedAt sql.NullTime

	err := row.Scan(
		&d.DispatchID, &d.ContractID, &d.IntentID, &d.TenantID, &d.TraceID,
		&d.ConnectorID, &d.CorridorID, &d.AttemptCount, &d.Status,
		&providerAttemptID, &providerReference,
		&d.CreatedAt, &sentAt, &ackedAt,
	)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, fmt.Errorf("dispatch_repo: find by contract and attempt: %w", err)
	}

	if providerAttemptID.Valid {
		d.ProviderAttemptID = &providerAttemptID.String
	}
	if providerReference.Valid {
		d.ProviderReference = &providerReference.String
	}
	if sentAt.Valid {
		d.SentAt = &sentAt.Time
	}
	if ackedAt.Valid {
		d.AckedAt = &ackedAt.Time
	}

	return &d, nil
}

// InsertTx inserts a new dispatch row inside an existing transaction.
// Called atomically with the DispatchCreated outbox write in Step 1.
func (r *DispatchRepo) InsertTx(ctx context.Context, tx *sql.Tx, d *model.Dispatch) error {
	_, err := tx.ExecContext(ctx, `
		INSERT INTO dispatches (
			dispatch_id, contract_id, intent_id, tenant_id, trace_id,
			connector_id, corridor_id, attempt_count, status, created_at
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
	`,
		d.DispatchID, d.ContractID, d.IntentID, d.TenantID, d.TraceID,
		d.ConnectorID, d.CorridorID, d.AttemptCount, string(d.Status), d.CreatedAt,
	)
	if err != nil {
		return fmt.Errorf("dispatch_repo: insert: %w", err)
	}
	return nil
}

// MarkSentTx updates a dispatch row to SENT inside an existing transaction.
// Called atomically with the AttemptSent outbox write in Step 3.
func (r *DispatchRepo) MarkSentTx(ctx context.Context, tx *sql.Tx, dispatchID string) error {
	res, err := tx.ExecContext(ctx, `
		UPDATE dispatches
		SET status = 'SENT', sent_at = now()
		WHERE dispatch_id = $1 AND status = 'PENDING'
	`, dispatchID)
	if err != nil {
		return fmt.Errorf("dispatch_repo: mark sent: %w", err)
	}
	if n, _ := res.RowsAffected(); n == 0 {
		return fmt.Errorf("dispatch_repo: mark sent: no row updated for dispatch_id=%s (already advanced?)", dispatchID)
	}
	return nil
}

// MarkProviderAckedTx updates a dispatch row to PROVIDER_ACKED inside
// an existing transaction. Called atomically with ProviderAcked outbox write.
func (r *DispatchRepo) MarkProviderAckedTx(ctx context.Context, tx *sql.Tx, dispatchID, providerAttemptID string) error {
	res, err := tx.ExecContext(ctx, `
		UPDATE dispatches
		SET status = 'PROVIDER_ACKED',
		    provider_attempt_id = $1,
		    acked_at = now()
		WHERE dispatch_id = $2 AND status = 'SENT'
	`, providerAttemptID, dispatchID)
	if err != nil {
		return fmt.Errorf("dispatch_repo: mark provider acked: %w", err)
	}
	if n, _ := res.RowsAffected(); n == 0 {
		return fmt.Errorf("dispatch_repo: mark provider acked: no row updated for dispatch_id=%s", dispatchID)
	}
	return nil
}

// MarkFailedTx updates a dispatch row to FAILED inside an existing transaction.
// Called atomically with the DispatchFailed outbox write on PSP failure.
func (r *DispatchRepo) MarkFailedTx(ctx context.Context, tx *sql.Tx, dispatchID string) error {
	_, err := tx.ExecContext(ctx, `
		UPDATE dispatches
		SET status = 'FAILED'
		WHERE dispatch_id = $1
	`, dispatchID)
	if err != nil {
		return fmt.Errorf("dispatch_repo: mark failed: %w", err)
	}
	return nil
}
