package handler

import (
	"errors"
	"log"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"main.go/model"
	"main.go/services"
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

	//we can add idempotency cache here

	msg := model.RawIntentMessage{
		TenantID:       tenantId.String(),
		TraceID:        traceId,
		RawPayload:     string(rawPayload),
		IdempotencyKey: IdempotencyKey,
	}

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

	if err := services.RawIntent(context.Request.Context(), msg, data, h.Redis, false); err != nil {
		if errors.Is(err, services.ErrDuplicateIdempotencyKey) {
			context.JSON(http.StatusConflict, gin.H{
				"TraceID":    msg.TraceID,
				"ErrorCode":  "DUPLICATE_IDEMPOTENCY_KEY",
				"ErrorMsg":   "An envelope with the same idempotency key already exists.",
				"HttpStatus": 409,
			})
			return
		}
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
		"Received_At": data.ReceivedAt,
	})

	// Send to intent engine asynchronously AFTER 202 response
	// Use background context to prevent cancellation when HTTP request completes
	go services.SendToIntentEngine(context.Copy(), msg, data, h.Redis, false)

	// err := messaging.ProduceIntentMessage(context.Request.Context(), msg, h.Redis)
	// if err != nil {
	// 	context.JSON(http.StatusInternalServerError, gin.H{
	// 		"error": "failed to enqueue intent",
	// 	})
	// 	return
	// }

	// errCh := make(chan *model.ErrorEvent, 1)
	// ackCh := make(chan *model.AckMessage, 1)
	// go messaging.ConsumeErrorEvent(context.Request.Context(), msg.TraceID, h.Redis, errCh)
	// go messaging.ConsumeAckMessage(context.Request.Context(), msg.TraceID, h.Redis, ackCh)

	// select {
	// case errEvent := <-errCh:
	// 	context.JSON(errEvent.HttpStatus, gin.H{
	// 		"Error_code": errEvent.ErrorCode,
	// 		"Error_msg":  errEvent.ErrorMsg,
	// 		"Trace_id":   errEvent.TraceID,
	// 	})
	// 	return

	// case ack := <-ackCh:
	// 	if ack == nil {
	// 		context.JSON(http.StatusInternalServerError, gin.H{
	// 			"error": "ack is nil",
	// 		})
	// 		return
	// 	}
	// context.JSON(http.StatusAccepted, gin.H{
	// 	"EnvelopeID":  ack.EnvelopeId,
	// 	"Trace_id":    ack.TraceID,
	// 	"Received_At": ack.ReceivedAt})
	//No error event received

	// case <-time.After(3 * time.Second):
	// 	context.JSON(http.StatusGatewayTimeout, gin.H{
	// 		"error": "timeout waiting for downstream response",
	// 	})
	// 	return

	//Need to change this err process with go routine to listen error event

}
