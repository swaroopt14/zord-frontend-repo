package services

import (
	"context"
	"database/sql"
	"zord-relay/model"
)

type PayoutContractsRepo struct {
	db *sql.DB
}

func NewPayoutContractsRepo(db *sql.DB) *PayoutContractsRepo {
	return &PayoutContractsRepo{db: db}
}

func (r *PayoutContractsRepo) ListAll(ctx context.Context) ([]model.PayoutContract, error) {
	query := `
		SELECT
			contract_id,
			tenant_id,
			intent_id,
			envelope_id,
			contract_payload,
			contract_hash,
			status,
			created_at,
			trace_id
		FROM payout_contracts
		ORDER BY created_at DESC
	`

	rows, err := r.db.QueryContext(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var results []model.PayoutContract

	for rows.Next() {
		var c model.PayoutContract
		err := rows.Scan(
			&c.ContractID,
			&c.TenantID,
			&c.IntentID,
			&c.EnvelopeID,
			&c.ContractPayload,
			&c.ContractHash,
			&c.Status,
			&c.CreatedAt,
			&c.TraceID,
		)
		if err != nil {
			return nil, err
		}
		results = append(results, c)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return results, nil
}
