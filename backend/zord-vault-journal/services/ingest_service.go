package services

import (
	"context"
	"database/sql"
	"log"

	"main.go/config"
	"main.go/messaging"
	"main.go/model"
)

// intent *model.Payment_Intent,
func SaveRawIntent(
	ctx context.Context,
	db *sql.DB,
	envelope *model.IngressEnvolope,

) error {
	//log.Printf("%+v\n", envelope)
	tx, err := db.BeginTx(ctx, nil)
	if err != nil {
		log.Fatalf("SaveRawIntent Trasaction Error: %v", err)
		return err
	}

	defer func() {
		_ = tx.Rollback()
	}()

	query := `
		INSERT INTO ingress_envelopes
		(trace_id,envelope_id, tenant_id, source, source_system,idempotency_key,payload_hash,object_ref,parse_status,amount_value,amount_currency)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9,$10,$11)
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
		// log.Printf("Duplicate entry for Idempotency Key: %s", envelope.IdempotencyKey)
		err := messaging.PublishClientError(ctx, config.RedisClient, model.ClientErrorEvent{
			TraceID:    envelope.TraceID.String(),
			ErrorCode:  "DUPLICATE_IDEMPOTENCY_KEY",
			ErrorMsg:   "An envelope with the same idempotency key already exists.",
			HttpStatus: 409,
		})
		if err != nil {
			log.Printf("Failed to publish client error event: %v", err)
			return err
		}
		//log.Printf("Published client error event")
	}
	return tx.Commit()

}
