package services

import (
	"context"
	"encoding/base64"
	"log"
	"time"

	"zord-edge/db"
	"zord-edge/kafka"
	"zord-edge/model"
	"zord-edge/vault"

	"github.com/google/uuid"
)

func RawIntent(ctx context.Context,
	msg model.RawIntentMessage, ack *model.AckMessage, isWebhook bool) error {

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
	encodedSig := base64.StdEncoding.EncodeToString(EnvelopeSignature)
	storedSignature := "ZORD_" + encodedSig

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
			EnvelopeSignature: storedSignature,
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

func SendToIntentEngine(
	msg model.RawIntentMessage, ack *model.AckMessage, pro *kafka.Producer, isWebhook bool) error {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

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

	var NewEnvelope model.Event

	// if isWebhook {
	// 	envelope = model.IngressEnvelope{
	// 		TraceID:        trace_id,
	// 		EnvelopeID:     envelopeID,
	// 		TenantID:       tenantUUID,
	// 		Source:         "WEBHOOK",
	// 		SourceSystem:   "",
	// 		IdempotencyKey: msg.IdempotencyKey,
	// 		PayloadSize:    msg.PayloadSize,
	// 		PayloadHash:    nil,
	// 		ObjectRef:      ObjRef,
	// 		Status:         "RECEIVED",
	// 		ReceivedAt:     ack.ReceivedAt,
	// 	}
	// } else {
	//var req dto.IncomingIntentRequestV1
	//err := json.Unmarshal([]byte(msg.RawPayload), &req)
	//if err != nil {
	//	log.Printf("Failed to unmarshal payload for intent engine: %v", err)
	//	return
	//}

	// envelope = model.IngressEnvelope{
	// 	TraceID:        trace_id,
	// 	EnvelopeID:     envelopeID,
	// 	TenantID:       tenantUUID,
	// 	Source:         msg.SourceType, //req.Source,
	// 	SourceSystem:   "RAzerpay",     //req.SourceSystem,
	// 	IdempotencyKey: msg.IdempotencyKey,
	// 	PayloadSize:    msg.PayloadSize,
	// 	PayloadHash:    msg.RawPayload, //Using RawPayload as PayloadHash for API flow to avoid JSON validation issues in intent engine. This is a temporary solution and should be replaced with proper hashing once schema validation is implemented in intent engine.
	// 	ObjectRef:      ObjRef,
	// 	Status:         "RECEIVED",
	// 	ReceivedAt:     ack.ReceivedAt,
	//}
	NewEnvelope = model.Event{
		TraceID:          trace_id,
		EnvelopeID:       envelopeID,
		TenantID:         tenantUUID,
		ObjectRef:        ObjRef,
		ReceivedAt:       ack.ReceivedAt,
		Source:           msg.SourceType,
		IdempotencyKey:   msg.IdempotencyKey,
		EncryptedPayload: msg.Payload,
		PayloadHash:      msg.PayloadHash,
	}

	// Prepare payload for intent engine
	// if isWebhook {
	// 	if !json.Valid([]byte(msg.RawPayload)) {
	// 		// Not valid JSON, quote it to ensure it's a valid JSON string
	// 		quoted, _ := json.Marshal(msg.RawPayload)
	// 		NewEnvelope.Raw_payload = json.RawMessage(quoted)
	// 	}
	// }
	// 	} else {
	// 		envelope.Payload = json.RawMessage(msg.RawPayload)
	// 	}
	// } else {
	// 	envelope.Payload = json.RawMessage(msg.RawPayload)
	// }

	//Send to Intent Engine via Kafka

	err = kafka.SendRawIntentMessage(ctx, NewEnvelope, pro)
	if err != nil {
		log.Printf("Failed to send raw intent message: %v", err)
		return err
	}
	return nil
}
