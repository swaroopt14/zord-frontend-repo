package services

import (
	"context"
	"encoding/json"
	"errors"
	"log"
	"time"

	"github.com/google/uuid"
	"github.com/redis/go-redis/v9"
	"main.go/db"
	"main.go/dto"
	"main.go/messaging"
	"main.go/model"
)

func RawIntent(ctx context.Context,
	msg model.RawIntentMessage, ack *model.AckMessage, rdb *redis.Client, isWebhook bool) error {
	
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
	tenantUUID, err := uuid.Parse(msg.TenantID)
	if err != nil {
		log.Printf("Invalid TenantId: %s", msg.TenantID)
		return err
	}
	ObjRef := ack.ObjectRef

	var envelope model.IngressEnvolope

	if isWebhook {
		// Webhook Flow - Strict Separation
		envelope = model.IngressEnvolope{
			TraceID:        trace_id,
			EnvelopeID:     envelopeID,
			TenantID:       tenantUUID,
			Source:         "WEBHOOK", 
			SourceSystem:   "",        
			IdempotencyKey: msg.IdempotencyKey,
			PayloadHash:    "",
			ObjectRef:      ObjRef,
			AmountValue:    "0",
			AmountCurrency: "XXX",
			ParseStatus:    "RECEIVED",
		}
	} else {
		// API Flow - Strict Separation
		var req dto.Intent
		err := json.Unmarshal([]byte(msg.RawPayload), &req)
		if err != nil {
			// If it's the API queue, it MUST be valid JSON conforming to schema
			return err
		}
		
		envelope = model.IngressEnvolope{
			TraceID:        trace_id,
			EnvelopeID:     envelopeID,
			TenantID:       tenantUUID,
			Source:         req.Source,
			SourceSystem:   req.SourceSystem,
			IdempotencyKey: msg.IdempotencyKey,
			PayloadHash:    req.PayloadHash,
			ObjectRef:      ObjRef,
			AmountValue:    req.Amount.Value,
			AmountCurrency: req.Amount.Currency,
			ParseStatus:    "RECEIVED",
		}
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

	if isWebhook {
		if !json.Valid([]byte(msg.RawPayload)) {
			// Not valid JSON, quote it to ensure it's a valid JSON string
			quoted, _ := json.Marshal(msg.RawPayload)
			envelope.Payload = json.RawMessage(quoted)
		} else {
			envelope.Payload = json.RawMessage(msg.RawPayload)
		}
	} else {
		envelope.Payload = json.RawMessage(msg.RawPayload)
	}
	// Send to Intent Engine via Redis
	err = messaging.SendRawIntentMessage(ctx, envelope, rdb)
	if err != nil {
		log.Printf("Failed to send raw intent message: %v", err)
		return err
	}

	// Send ACK to zord-edge to prevent 504 Timeout
	ack.ReceivedAt = time.Now()
	err = messaging.SendACKMessage(ctx, *ack, rdb)
	if err != nil {
		log.Printf("Failed to send ACK message: %v", err)
		// We don't return error here because the intent is already persisted and sent to engine
	}

	return nil

}
