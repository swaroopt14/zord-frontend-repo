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
	msg model.RawIntentMessage, ack *model.AckMessage) error {

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

	envelope := model.IngressEnvelope{
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
	msg model.RawIntentMessage, ack *model.AckMessage, pro *kafka.Producer) error {
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

	err = kafka.SendRawIntentMessage(ctx, NewEnvelope, pro)
	if err != nil {
		log.Printf("Failed to send raw intent message: %v", err)
		return err
	}
	return nil
}
