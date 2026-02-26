package services

import (
	"context"
	"encoding/json"
	"log"
	"time"

	"github.com/google/uuid"
	"github.com/redis/go-redis/v9"
	"main.go/db"
	"main.go/messaging"
	"main.go/model"
	"main.go/vault"
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

	EnvelopeHash := BuildEnvelopeHash(msg, ack)
	EnvelopeSignature := vault.SignEnvelopeHash(EnvelopeHash)

	var envelope model.IngressEnvelope

	if isWebhook {
		// Webhook Flow - Strict Separation
		envelope = model.IngressEnvelope{
			TraceID:        trace_id,
			EnvelopeID:     envelopeID,
			TenantID:       tenantUUID,
			Source:         "WEBHOOK",
			SourceSystem:   "",
			IdempotencyKey: msg.IdempotencyKey,
			PayloadSize:    msg.PayloadSize,
			PayloadHash:    nil,
			ObjectRef:      ObjRef,
			Status:         "RECEIVED",
			ReceivedAt:     ack.ReceivedAt,
		}
	} else {
		// API Flow - Strict Separation
		//	var req dto.IncomingIntentRequestV1
		//	err := json.Unmarshal([]byte(msg.RawPayload), &req)
		//	if err != nil {
		// If it's the API queue, it MUST be valid JSON conforming to schema
		//		return err
		//	}

		envelope = model.IngressEnvelope{
			TraceID:           trace_id,
			EnvelopeID:        envelopeID,
			TenantID:          tenantUUID,
			Source:            msg.SourceType, //req.Source,
			SourceSystem:      "RAzerpay",     //req.SourceSystem,
			ContentType:       msg.ContentType,
			IdempotencyKey:    msg.IdempotencyKey,
			PayloadSize:       msg.PayloadSize,
			PayloadHash:       msg.PayloadHash,
			EnvelopeHash:      EnvelopeHash,
			EnvelopeSignature: EnvelopeSignature,
			ObjectRef:         ObjRef,
			Status:            "RECEIVED",
			ReceivedAt:        ack.ReceivedAt,
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

	var envelope model.IngressEnvelope

	if isWebhook {
		envelope = model.IngressEnvelope{
			TraceID:        trace_id,
			EnvelopeID:     envelopeID,
			TenantID:       tenantUUID,
			Source:         "WEBHOOK",
			SourceSystem:   "",
			IdempotencyKey: msg.IdempotencyKey,
			PayloadSize:    msg.PayloadSize,
			PayloadHash:    nil,
			ObjectRef:      ObjRef,
			Status:         "RECEIVED",
			ReceivedAt:     ack.ReceivedAt,
		}
	} else {
		//var req dto.IncomingIntentRequestV1
		//err := json.Unmarshal([]byte(msg.RawPayload), &req)
		//if err != nil {
		//	log.Printf("Failed to unmarshal payload for intent engine: %v", err)
		//	return
		//}

		envelope = model.IngressEnvelope{
			TraceID:        trace_id,
			EnvelopeID:     envelopeID,
			TenantID:       tenantUUID,
			Source:         msg.SourceType, //req.Source,
			SourceSystem:   "RAzerpay",     //req.SourceSystem,
			IdempotencyKey: msg.IdempotencyKey,
			PayloadSize:    msg.PayloadSize,
			PayloadHash:    msg.RawPayload, //Using RawPayload as PayloadHash for API flow to avoid JSON validation issues in intent engine. This is a temporary solution and should be replaced with proper hashing once schema validation is implemented in intent engine.
			ObjectRef:      ObjRef,
			Status:         "RECEIVED",
			ReceivedAt:     ack.ReceivedAt,
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
