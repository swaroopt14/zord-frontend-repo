package services

import (
	"context"
	"encoding/json"
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
        // API Flow - accept any valid JSON, extract fields if present
        var req dto.IncomingIntentRequestV1
        // We ignore the error here intentionally — fields may not exist
        json.Unmarshal([]byte(msg.RawPayload), &req)

        envelope = model.IngressEnvolope{
			TraceID:        trace_id,
			EnvelopeID:     envelopeID,
			TenantID:       tenantUUID,
			Source:         req.Source,         // empty string if not in JSON, that's OK now
			SourceSystem:   req.SourceSystem, 
			IdempotencyKey: msg.IdempotencyKey,
			PayloadHash:    req.PayloadHash,
			ObjectRef:      ObjRef,
			AmountValue:    req.Amount.Value,   // empty string if not in JSON
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
		return err
	}
	return nil
}

// SendToIntentEngine sends the envelope to the intent engine via Redis
// This function should be called asynchronously in a goroutine AFTER sending 202 response
func SendToIntentEngine(
	msg model.RawIntentMessage, ack *model.AckMessage, rdb *redis.Client, isWebhook bool) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	envelopeID, err := uuid.Parse(ack.EnvelopeId)
	if err != nil {
		log.Printf("Invalid EnvelopeId: %s", ack.EnvelopeId)
		return
	}
	trace_id, err := uuid.Parse(msg.TraceID)
	if err != nil {
		log.Printf("Invalid TraceID: %s", msg.TraceID)
		return
	}
	tenantUUID, err := uuid.Parse(msg.TenantID)
	if err != nil {
		log.Printf("Invalid TenantId: %s", msg.TenantID)
		return
	}
	ObjRef := ack.ObjectRef

	var envelope model.IngressEnvolope

	if isWebhook {
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
    	var req dto.IncomingIntentRequestV1
    	// Ignore unmarshal error — any JSON is valid, fields may be missing
    	json.Unmarshal([]byte(msg.RawPayload), &req)

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

	// Prepare payload for intent engine
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

	//Send to Intent Engine via Redis

	err = messaging.SendRawIntentMessage(ctx, envelope, rdb)
	if err != nil {
		log.Printf("Failed to send raw intent message: %v", err)
	}

}
