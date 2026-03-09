package handler

import (
	stdctx "context"
	"crypto/sha256"
	"log"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"main.go/model"
	"main.go/services"
	"main.go/vault"
)

func (h *Handler) WebhookHandler(context *gin.Context) {
	provider := context.GetString("psp_provider")
	rawPayloadAny, ok := context.Get("raw_payload")
	if !ok {
		context.JSON(400, gin.H{"error": "raw_payload missing"})
		return
	}
	rawPayload := rawPayloadAny.([]byte)

	tenantIdStr := context.GetString("tenant_id")
	if tenantIdStr == "" {
		tenantIdStr = context.Query("tenant_id")
	}
	if tenantIdStr == "" {
		context.JSON(http.StatusBadRequest, gin.H{"error": "tenant_id is required"})
		return
	}

	// Determine Idempotency Key
	idempotencyKey := context.GetString("psp_event_id")
	if idempotencyKey == "" {
		context.JSON(http.StatusBadRequest, gin.H{"error": "missing X-PSP-Event-Id"})
		return
	}

	traceId := uuid.New().String()

	tenantUUID, err := uuid.Parse(tenantIdStr)
	if err != nil {
		context.JSON(http.StatusBadRequest, gin.H{"error": "invalid tenant_id"})
		return
	}

	contentType := context.GetHeader("Content-Type")
	if contentType == "" {
		contentType = "application/json"
	}
	sourceType := "WEBHOOK:" + provider
	if eventType := context.GetString("psp_event_type"); eventType != "" {
		sourceType += ":" + eventType
	}

	reqCtx, cancel := stdctx.WithTimeout(context.Request.Context(), 5*time.Second)
	defer cancel()
	context.Request = context.Request.WithContext(reqCtx)

	encryptedPayload, err := vault.Encrypt(rawPayload)
	if err != nil {
		log.Printf("Webhook encrypt failed, provider=%s trace_id=%s: %v", provider, traceId, err)
		context.JSON(http.StatusInternalServerError, gin.H{"error": "failed to encrypt payload"})
		return
	}

	msg := model.RawIntentMessage{
		TenantID:       tenantUUID.String(),
		TraceID:        traceId,
		IdempotencyKey: idempotencyKey,
		PayloadSize:    len(rawPayload),
		Payload:        encryptedPayload,
		ContentType:    contentType,
		SourceType:     sourceType,
	}

	dupID, err := services.PersistIdempotency(reqCtx, msg)
	if err != nil {
		log.Printf("Webhook idempotency persist failed, provider=%s trace_id=%s: %v", provider, traceId, err)
		context.JSON(http.StatusInternalServerError, gin.H{
			"ErrorCode":  "INTERNAL_SERVER_ERROR",
			"ErrorMsg":   "Failed to persist idempotency key.",
			"HttpStatus": http.StatusInternalServerError,
		})
		return
	}

	// Duplicate webhook deliveries are common; acknowledge quickly without reprocessing.
	if dupID != uuid.Nil {
		context.JSON(http.StatusOK, gin.H{
			"status":   "received",
			"trace_id": traceId,
		})
		return
	}

	data, err := services.ProcessRawIntent(reqCtx, msg, h.S3store)
	if err != nil {
		log.Printf("Webhook ProcessRawIntent failed, provider=%s trace_id=%s: %v", provider, traceId, err)
		context.JSON(http.StatusInternalServerError, gin.H{
			"TraceID":   msg.TraceID,
			"ErrorCode": "INTERNAL_ERROR",
			"ErrorMsg":  err.Error(),
		})
		return
	}

	if data == nil {
		log.Printf("Webhook S3 data is nil, provider=%s trace_id=%s", provider, traceId)
		context.JSON(http.StatusInternalServerError, gin.H{
			"TraceID":   msg.TraceID,
			"ErrorCode": "INTERNAL_ERROR",
			"ErrorMsg":  "S3 data is nil",
		})
		return
	}

	hash := sha256.Sum256(rawPayload)
	msg.PayloadHash = hash[:]

	if err := services.RawIntent(reqCtx, msg, data); err != nil {
		log.Printf("Webhook RawIntent persist failed, provider=%s trace_id=%s: %v", provider, traceId, err)
		context.JSON(http.StatusInternalServerError, gin.H{
			"TraceID":    msg.TraceID,
			"ErrorCode":  "INTERNAL_SERVER_ERROR",
			"ErrorMsg":   "Failed to persist raw intent.",
			"HttpStatus": http.StatusInternalServerError,
		})
		return
	}

	services.SendToIntentEngine(msg, data, h.Kafka)

	context.JSON(http.StatusOK, gin.H{
		"status":   "received",
		"trace_id": traceId,
	})
}
