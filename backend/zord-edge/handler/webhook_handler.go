package handler

import (
	stdctx "context"
	"crypto/sha256"
	"encoding/json"
	"errors"
	"log"
	"net/http"
	"time"

	"zord-edge/model"
	"zord-edge/services"
	"zord-edge/vault"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

func (h *Handler) WebhookHandler(context *gin.Context) {
	provider := context.GetString("psp_provider")
	rawPayloadAny, ok := context.Get("raw_payload")
	if !ok {
		context.JSON(400, gin.H{"error": "raw_payload missing"})
		return
	}
	rawPayload := rawPayloadAny.([]byte)

	tenantIDStr := context.GetString("tenant_id")
	if tenantIDStr == "" {
		tenantIDStr = context.Query("tenant_id")
	}
	if tenantIDStr == "" {
		context.JSON(http.StatusBadRequest, gin.H{"error": "tenant_id is required"})
		return
	}

	// Determine Idempotency Key
	idempotencyKey := context.GetString("psp_event_id")
	if idempotencyKey == "" {
		context.JSON(http.StatusBadRequest, gin.H{"error": "missing X-PSP-Event-Id"})
		return
	}

	traceID := uuid.New().String()
	envelopeID := uuid.New().String()
	receivedAt := time.Now().UTC()

	tenantUUID, err := uuid.Parse(tenantIDStr)
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

	sourceSystem := context.GetHeader("X-Zord-Source-System")
	if sourceSystem == "" {
		sourceSystem = "UNKNOWN"
	}

	requestCtx, cancel := stdctx.WithTimeout(context.Request.Context(), 5*time.Second)
	defer cancel()
	context.Request = context.Request.WithContext(requestCtx)

	headersBytes, _ := json.Marshal(context.Request.Header)
	headersHashSum := sha256.Sum256(headersBytes)
	headersHash := headersHashSum[:]

	encryptedPayload, err := vault.Encrypt(rawPayload)
	if err != nil {
		log.Printf("Webhook encrypt failed, provider=%s trace_id=%s: %v", provider, traceID, err)
		context.JSON(http.StatusInternalServerError, gin.H{"error": "failed to encrypt payload"})
		return
	}

	// Compute fingerprint: Hash(payload + idempotencyKey + tenantID)
	fingerprintInput := append(rawPayload, []byte(idempotencyKey+tenantUUID.String())...)
	fingerprintSum := sha256.Sum256(fingerprintInput)
	fingerprint := fingerprintSum[:]

	rawIntent := model.RawIntentMessage{
		TenantID:           tenantUUID.String(),
		TraceID:            traceID,
		IdempotencyKey:     idempotencyKey,
		PayloadSize:        len(rawPayload),
		Payload:            encryptedPayload,
		ContentType:        contentType,
		SourceType:         sourceType,
		SourceSystem:       sourceSystem,
		RequestHeadersHash: headersHash,
		RequestFingerprint: fingerprint,
		SchemaHint:         nil,
	}

	duplicateID, err := services.PersistIdempotency(requestCtx, rawIntent)
	if err != nil {
		if errors.Is(err, services.ErrFingerprintMismatch) {
			context.JSON(http.StatusBadRequest, gin.H{
				"IdempotencyKey": idempotencyKey,
				"ErrorCode":      "IDEMPOTENCY_CONFLICT",
				"ErrorMsg":       "IDEMPOTENCY_KEY_REUSE_WITH_DIFFERENT_PAYLOAD",
				"HttpStatus":     http.StatusBadRequest,
			})
			return
		}
		log.Printf("Webhook idempotency persist failed, provider=%s trace_id=%s: %v", provider, traceID, err)
		context.JSON(http.StatusInternalServerError, gin.H{
			"ErrorCode":  "INTERNAL_SERVER_ERROR",
			"ErrorMsg":   "Failed to persist idempotency key.",
			"HttpStatus": http.StatusInternalServerError,
		})
		return
	}

	// Duplicate webhook deliveries are common; acknowledge quickly without reprocessing.
	if duplicateID != uuid.Nil {
		log.Printf("Duplicate webhook detected for provider=%s, idempotency_key=%s, Envelope_Id=%s", provider, idempotencyKey, duplicateID)
		context.JSON(http.StatusOK, gin.H{
			"status":     "received",
			"trace_id":   traceID,
			"EnvelopeID": duplicateID.String(),
		})
		return
	}

	storageAck, err := services.ProcessRawIntent(requestCtx, rawIntent, h.S3store, envelopeID, receivedAt)
	if err != nil {
		log.Printf("Webhook ProcessRawIntent failed, provider=%s trace_id=%s: %v", provider, traceID, err)
		context.JSON(http.StatusInternalServerError, gin.H{
			"TraceID":   rawIntent.TraceID,
			"ErrorCode": "INTERNAL_ERROR",
			"ErrorMsg":  err.Error(),
		})
		return
	}

	if storageAck == nil {
		log.Printf("Webhook S3 data is nil, provider=%s trace_id=%s", provider, traceID)
		context.JSON(http.StatusInternalServerError, gin.H{
			"TraceID":   rawIntent.TraceID,
			"ErrorCode": "INTERNAL_ERROR",
			"ErrorMsg":  "S3 data is nil",
		})
		return
	}

	payloadHashSum := sha256.Sum256(rawPayload)
	rawIntent.PayloadHash = payloadHashSum[:]

	if err := services.RawIntent(requestCtx, rawIntent, storageAck); err != nil {
		log.Printf("Webhook RawIntent persist failed, provider=%s trace_id=%s: %v", provider, traceID, err)
		context.JSON(http.StatusInternalServerError, gin.H{
			"TraceID":    rawIntent.TraceID,
			"ErrorCode":  "INTERNAL_SERVER_ERROR",
			"ErrorMsg":   "Failed to persist raw intent.",
			"HttpStatus": http.StatusInternalServerError,
		})
		return
	}

	context.JSON(http.StatusOK, gin.H{
		"status":   "received",
		"trace_id": traceID,
	})
}
