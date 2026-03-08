package services

import (
	"context"
	"database/sql"
	"fmt"
	"log"

	"zord-edge/model"
)

// intent *model.Payment_Intent,
func SaveRawIntent(
	ctx context.Context,
	db *sql.DB,
	envelope *model.IngressEnvelope,

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
		(trace_id,envelope_id, tenant_id, source, source_system,content_type,idempotency_key,payload_size,payload_hash,envelope_hash,envelope_signature,vault_object_ref,status,received_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
	`
	_, err = tx.ExecContext(ctx, query,
		envelope.TraceID,
		envelope.EnvelopeID,
		envelope.TenantID,
		envelope.Source,
		envelope.SourceSystem,
		envelope.ContentType,
		envelope.IdempotencyKey,
		envelope.PayloadSize,
		envelope.PayloadHash,
		envelope.EnvelopeHash,
		envelope.EnvelopeSignature,
		envelope.ObjectRef,
		envelope.Status,
		envelope.ReceivedAt)
	if err != nil {

		return err
	}

	query = `UPDATE idempotency_keys SET status=$1,first_envelope_id=$2 
		WHERE tenant_id=$3 AND idempotency_key=$4`

	res, err := tx.ExecContext(ctx, query, "Completed", envelope.EnvelopeID, envelope.TenantID, envelope.IdempotencyKey)
	if err != nil {
		log.Printf("Error updating idempotency key: %v", err)
		return err
	}
	rows, err := res.RowsAffected()
	if err != nil {
		return err
	}
	if rows != 1 {
		return fmt.Errorf("idempotency update affected %d rows", rows)
	}

	return tx.Commit()

}
