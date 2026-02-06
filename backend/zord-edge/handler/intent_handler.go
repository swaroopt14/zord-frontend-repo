package handler

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"main.go/messaging"
	"main.go/model"
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

	err := messaging.ProduceIntentMessage(context.Request.Context(), msg, h.Redis)
	if err != nil {
		context.JSON(http.StatusInternalServerError, gin.H{
			"error": "failed to enqueue intent",
		})
		return
	}

	errCh := make(chan *model.ErrorEvent, 1)
	ackCh := make(chan *model.AckMessage, 1)
	go messaging.ConsumeErrorEvent(context.Request.Context(), msg.TraceID, h.Redis, errCh)
	go messaging.ConsumeAckMessage(context.Request.Context(), msg.TraceID, h.Redis, ackCh)

	select {
	case errEvent := <-errCh:
		context.JSON(errEvent.HttpStatus, gin.H{
			"Error_code": errEvent.ErrorCode,
			"Error_msg":  errEvent.ErrorMsg,
			"Trace_id":   errEvent.TraceID,
		})
		return

	case ack := <-ackCh:
		if ack == nil {
			context.JSON(http.StatusInternalServerError, gin.H{
				"error": "ack is nil",
			})
			return
		}
		context.JSON(http.StatusAccepted, gin.H{
			"EnvelopeID":  ack.EnvelopeId,
			"Trace_id":    ack.TraceID,
			"Received_At": ack.ReceivedAt})
	//No error event received

	case <-time.After(3 * time.Second):
		context.JSON(http.StatusGatewayTimeout, gin.H{
			"error": "timeout waiting for downstream response",
		})
		return

	}

	//Need to change this err process with go routine to listen error event

}
