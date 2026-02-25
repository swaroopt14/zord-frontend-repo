package services

import (
	"context"
	"database/sql"
	"errors"
	"log"

	"main.go/model"
)

var ErrDuplicateIdempotencyKey = errors.New("duplicate idempotency key")

// intent *model.Payment_Intent,
func SaveRawIntent(
	ctx context.Context,
	db *sql.DB,
	envelope *model.IngressEnvolope,

) error {
	//log.Printf("%+v\n", envelope)
	tx, err := db.BeginTx(ctx, nil)
	if err != nil {
		log.Printf("SaveRawIntent Trasaction Error: %v", err)
		return err
	}

	defer func() {
		_ = tx.Rollback()
	}()

	query := `
    	INSERT INTO ingress_envelopes
    	(trace_id, envelope_id, tenant_id, source, source_system, idempotency_key, payload_hash, object_ref, parse_status, amount_value, amount_currency)
		VALUES ($1, $2, $3, 
			NULLIF($4, ''), 
			NULLIF($5, ''), 
			$6, $7, $8, $9, 
			NULLIF($10::text, '')::NUMERIC, 
			NULLIF($11, ''))
		ON CONFLICT (tenant_id, idempotency_key) DO NOTHING
	`
	res, err := tx.ExecContext(ctx, query, envelope.TraceID, envelope.EnvelopeID, envelope.TenantID, envelope.Source, envelope.SourceSystem, envelope.IdempotencyKey, envelope.PayloadHash, envelope.ObjectRef, envelope.ParseStatus, envelope.AmountValue, envelope.AmountCurrency)
	if err != nil {

		return err
	}
	rows, err := res.RowsAffected()
	if err != nil {
		return err
	}
	if rows == 0 {
		return ErrDuplicateIdempotencyKey
	}
	return tx.Commit()

}
