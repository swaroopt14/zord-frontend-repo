package services

import (
	"context"
	"database/sql"
	"log"

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
		ON CONFLICT (tenant_id, idempotency_key) DO UPDATE SET
		object_ref       = EXCLUDED.object_ref,
		parse_status     = EXCLUDED.parse_status,
		amount_value     = EXCLUDED.amount_value,
		amount_currency  = EXCLUDED.amount_currency;
	`
	_, err = tx.ExecContext(ctx, query, envelope.Trace_id, envelope.Envolope_id, envelope.Tenant_id, envelope.Source, envelope.SourceSystem, envelope.IdempotencyKey, envelope.PayloadHash, envelope.ObjectRef, envelope.ParseStatus, envelope.AmountValue, envelope.AmountCurrency)
	if err != nil {
		log.Fatalf("SaveRawIntent error: %v", err)
		return err
	}
	return tx.Commit()

}
