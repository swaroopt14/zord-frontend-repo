package handler

import (
	"context"
	"crypto/sha256"
	"fmt"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"main.go/model"
	"main.go/services"
	"main.go/vault"
)

func (h *Handler) IntentHandler(c *gin.Context) {

	rawPayloadAny, ok := c.Get("raw_payload")
	if !ok {
		c.JSON(400, gin.H{"error": "raw_payload missing"})
		return
	}

	rawPayload := rawPayloadAny.([]byte)
	traceId := c.GetString("trace_id")
	tenantId := c.MustGet("tenant_id").(uuid.UUID)
	idempotencyKey := c.GetString("idempotency_key")
	payloadSize := c.GetInt("payload_size")
	contentType := c.GetString("Content-Type")
	sourceType := c.GetString("source_type")

	data, duplicateID, err := h.processIntentCore(
		c.Request.Context(),
		rawPayload,
		tenantId,
		traceId,
		idempotencyKey,
		payloadSize,
		contentType,
		sourceType,
	)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"ErrorCode": "INTERNAL_SERVER_ERROR",
			"ErrorMsg":  err.Error(),
		})
		return
	}

	// Duplicate case
	if duplicateID != uuid.Nil {
		c.JSON(http.StatusConflict, gin.H{
			"ErrorCode":  "DUPLICATE_IDEMPOTENCY_KEY",
			"ErrorMsg":   "An envelope with the same idempotency key already exists.",
			"EnvelopeID": duplicateID.String(),
		})
		return
	}

	c.JSON(http.StatusAccepted, gin.H{
		"EnvelopeID":  data.EnvelopeId,
		"Trace_id":    traceId,
		"Status":      "Accepted",
		"Received_At": data.ReceivedAt,
	})
}

func (h *Handler) processIntentCore(
	ctx context.Context,
	rawPayload []byte,
	tenantId uuid.UUID,
	traceId string,
	idempotencyKey string,
	payloadSize int,
	contentType string,
	sourceType string,
) (*model.AckMessage, uuid.UUID, error) {

	// 🔐 Encrypt payload
	encryptedPayload, err := vault.Encrypt(rawPayload)
	if err != nil {
		return nil, uuid.Nil, err
	}

	msg := model.RawIntentMessage{
		TenantID:       tenantId.String(),
		TraceID:        traceId,
		IdempotencyKey: idempotencyKey,
		PayloadSize:    payloadSize,
		Payload:        encryptedPayload,
		ContentType:    contentType,
		SourceType:     sourceType,
	}

	// 🧾 Persist idempotency
	id, err := services.PersistIdempotency(ctx, msg)
	if err != nil {
		return nil, uuid.Nil, err
	}

	// Duplicate case
	if id != uuid.Nil {
		return nil, id, nil
	}

	// 📦 Store encrypted payload in S3
	data, err := services.ProcessRawIntent(msg, h.S3store)
	if err != nil {
		return nil, uuid.Nil, err
	}
	if data == nil {
		return nil, uuid.Nil, fmt.Errorf("S3 data is nil")
	}

	// 🔑 Hash original payload
	hash := sha256.Sum256(rawPayload)
	msg.PayloadHash = hash[:]

	// 🗄 Persist raw intent
	if err := services.RawIntent(ctx, msg, data, h.Redis, false); err != nil {
		return nil, uuid.Nil, err
	}

	// 🚀 Async dispatch
	go services.SendToIntentEngine(msg, data, h.Redis, false)

	return data, uuid.Nil, nil
}
