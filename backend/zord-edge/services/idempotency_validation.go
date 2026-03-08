package services

import (
	"context"
	"log"

	"zord-edge/db"
	"zord-edge/model"

	"github.com/google/uuid"
)

func PersistIdempotency(ctx context.Context, msg model.RawIntentMessage) (uuid.UUID, error) {

	if msg.IdempotencyKey == "" {
		log.Print("Idempotency key is missing, skipping idempotency validation")
		return uuid.Nil, nil
	}
	// Perform idempotency validation logic here

	query :=
		`INSERT INTO idempotency_keys(tenant_id, idempotency_key,status) VALUES($1,$2,$3)
		ON CONFLICT (tenant_id, idempotency_key) DO NOTHING`

	res, err := db.DB.ExecContext(ctx, query, msg.TenantID, msg.IdempotencyKey, "Reserved")
	if err != nil {
		log.Printf("Error in Idempotendy persist %v", err)
		return uuid.Nil, err
	}
	rows, err := res.RowsAffected()
	if err != nil {
		log.Printf("Error checking idempotency key: %v", err)
		return uuid.Nil, err
	}
	var first_envelope_id uuid.UUID
	if rows == 0 {
		query =
			`SELECT first_envelope_id FROM idempotency_keys
			WHERE idempotency_key=$1 AND tenant_id=$2`
		err = db.DB.QueryRowContext(ctx, query, msg.IdempotencyKey, msg.TenantID).Scan(&first_envelope_id)
		if err != nil {
			log.Printf("Error checking idempotency key: %v", err)
			return uuid.Nil, err
		}
		return first_envelope_id, nil
	}

	return uuid.Nil, nil
}

func UpdateIdempotency(ctx context.Context, msg model.RawIntentMessage, ack *model.AckMessage) error {

	query := `UPDATE idempotency_keys SET status=$1,first_envelope_id=$2 
		WHERE tenant_id=$3 AND idempotency_key=$4`

	_, err := db.DB.ExecContext(ctx, query, "Completed", ack.EnvelopeId, msg.TenantID, msg.IdempotencyKey)
	if err != nil {
		log.Printf("Error updating idempotency key: %v", err)
		return err
	}
	return nil
}
