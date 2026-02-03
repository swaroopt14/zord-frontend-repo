package services

import (
	"context"
	"encoding/json"
	"errors"
	"log"

	"github.com/google/uuid"
	"github.com/redis/go-redis/v9"
	"main.go/db"
	"main.go/dto"
	"main.go/messaging"
	"main.go/model"
)

func RawIntent(ctx context.Context,
	msg model.RawIntentMessage, ack *model.AckMessage, rdb *redis.Client) error {
	var req dto.Intent

	err := json.Unmarshal([]byte(msg.RawPayload), &req)
	if err != nil {
		return err
	}
	req.Tenant_id, err = uuid.Parse(msg.TenantID)
	if err != nil {
		log.Printf("Invalid TenantId: %s", msg.TenantID)
		return err
	}
	envelopeID, err := uuid.Parse(ack.EnvelopeId)
	if err != nil {
		log.Printf("Invalid EnvelopeId: %s", ack.EnvelopeId)
		return err
	}
	trace_id, err := uuid.Parse(msg.TraceID)
	if err != nil {
		log.Printf("Invalid TraceID: %s", msg.TraceID)
		return err
	}
	ObjRef := ack.ObjectRef

	// Build IngressEnvolope model
	envelope := model.IngressEnvolope{
		TraceID:        trace_id,
		EnvelopeID:     envelopeID,
		TenantID:       req.Tenant_id,
		Source:         req.Source,
		SourceSystem:   req.SourceSystem,
		IdempotencyKey: msg.IdempotencyKey,
		PayloadHash:    req.PayloadHash,
		ObjectRef:      ObjRef,
		AmountValue:    req.Amount.Value,
		AmountCurrency: req.Amount.Currency,
		ParseStatus:    "RECEIVED",
	}

	// Envolope.SaveRawIntent()
	err = SaveRawIntent(ctx,
		db.DB,
		&envelope,
	)
	if err != nil {
		if errors.Is(err, ErrDuplicateIdempotencyKey) {
			// log.Printf("Duplicate entry for Idempotency Key: %s", envelope.IdempotencyKey)
			_ = messaging.PublishClientError(ctx, rdb, model.ClientErrorEvent{
				TraceID:    envelope.TraceID.String(),
				ErrorCode:  "DUPLICATE_IDEMPOTENCY_KEY",
				ErrorMsg:   "An envelope with the same idempotency key already exists.",
				HttpStatus: 409,
			})

			return err

		}
		return err
	}

	envelope.Payload = json.RawMessage(msg.RawPayload)
	// Send to Intent Engine via Redis
	err = messaging.SendRawIntentMessage(ctx, envelope, rdb)
	if err != nil {
		log.Printf("Failed to send raw intent message: %v", err)
		return err
	}
	return nil

}
