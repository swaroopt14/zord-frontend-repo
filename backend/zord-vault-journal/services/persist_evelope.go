package services

import (
	"context"
	"encoding/json"
	"log"

	"github.com/google/uuid"
	"main.go/db"
	"main.go/dto"
	"main.go/model"
)

func RawIntent(ctx context.Context,
	msg model.RawIntentMessage, ack *model.AckMessage) error {
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
	ObjRef := ack.ObjectRef

	// Build IngressEnvolope model
	envelope := model.IngressEnvolope{
		Envolope_id:    envelopeID,
		Tenant_id:      req.Tenant_id,
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
	SaveRawIntent(ctx,
		db.DB,
		&envelope,
	)
	return nil

}
