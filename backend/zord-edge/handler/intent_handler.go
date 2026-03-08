package handler

import (
	"crypto/sha256"
	"log"
	"net/http"

	"zord-edge/model"
	"zord-edge/services"
	"zord-edge/vault"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

func (h *Handler) IntentHandler(context *gin.Context) {

	rawPayloadAny, ok := context.Get("raw_payload")
	if !ok {
		context.JSON(400, gin.H{"error": "raw_payload missing"})
		return
	}
	rawPayload := rawPayloadAny.([]byte)
	traceId := context.GetString("trace_id")
	tenantId := context.MustGet("tenant_id").(uuid.UUID)
	IdempotencyKey := context.GetString("idempotency_key")
	PayloadSize := context.GetInt("payload_size")
	ContentType := context.ContentType()
	SourceType := context.GetString("source_type")
	Tenant_name := context.GetString("tenant_name")

	encryptedPayload, err := vault.Encrypt(rawPayload)
	if err != nil {
		context.JSON(http.StatusInternalServerError, gin.H{"error": "failed to encrypt payload"})
		return
	}

	msg := model.RawIntentMessage{
		TenantID:       tenantId.String(),
		TraceID:        traceId,
		IdempotencyKey: IdempotencyKey,
		PayloadSize:    PayloadSize,
		Payload:        encryptedPayload,
		ContentType:    ContentType,
		SourceType:     SourceType,
		TenantName:     Tenant_name,
	}

	id, err := services.PersistIdempotency(context.Request.Context(), msg)
	if err != nil {
		log.Printf("Error persisting idempotency key: %v", err)
		context.JSON(http.StatusInternalServerError, gin.H{
			"ErrorCode":  "INTERNAL_SERVER_ERROR",
			"ErrorMsg":   "Failed to persist idempotency key.",
			"HttpStatus": http.StatusInternalServerError,
		})
		return
	}
	if id != uuid.Nil {
		log.Printf("Duplicate idempotency key detected for tenant_id=%s, idempotency_key=%s, Envelope_Id=%s", msg.TenantID, msg.IdempotencyKey, id)
		context.JSON(http.StatusConflict, gin.H{
			"ErrorCode":  "DUPLICATE_IDEMPOTENCY_KEY",
			"ErrorMsg":   "An envelope with the same idempotency key already exists.",
			"EnvelopeID": id.String(),
		})
		return
	}
	//Need to replace Hashed payload with Encrypted Payload before sending to S3

	data, err := services.ProcessRawIntent(msg, h.S3store)
	if err != nil {
		log.Printf("Error processing intent: %v", err)
		context.JSON(http.StatusInternalServerError, gin.H{
			"TraceID":   msg.TraceID,
			"ErrorCode": "INTERNAL_ERROR",
			"ErrorMsg":  err.Error(),
		})
		return
	}

	if data == nil {
		log.Printf("S3 Data is nil for trace_id=%s", msg.TraceID)
		context.JSON(http.StatusInternalServerError, gin.H{
			"TraceID":   msg.TraceID,
			"ErrorCode": "INTERNAL_ERROR",
			"ErrorMsg":  "S3 data is nil",
		})
		return
	}

	//Hash Payload Using SHA256
	Hash := sha256.Sum256(rawPayload)
	PayloadHash := Hash[:]

	msg.PayloadHash = PayloadHash

	if err := services.RawIntent(context.Request.Context(), msg, data, false); err != nil {
		log.Printf("Error persisting raw intent: %v", err)
		context.JSON(http.StatusInternalServerError, gin.H{
			"TraceID":    msg.TraceID,
			"ErrorCode":  "INTERNAL_SERVER_ERROR",
			"ErrorMsg":   "Failed to persist raw intent.",
			"HttpStatus": http.StatusInternalServerError,
		})
		return
	}

	context.JSON(http.StatusAccepted, gin.H{
		"EnvelopeID":  data.EnvelopeId,
		"Trace_id":    msg.TraceID,
		"Status":      "Accepted",
		"Received_At": data.ReceivedAt,
	})

	// Async Kafka publish
	go func() {
		err := services.SendToIntentEngine(msg, data, h.Kafka, false)
		if err != nil {
			log.Printf(
				"Async intent engine publish failed trace_id=%s envelope_id=%s error=%v",
				msg.TraceID,
				data.EnvelopeId,
				err,
			)
		}
	}()
}
