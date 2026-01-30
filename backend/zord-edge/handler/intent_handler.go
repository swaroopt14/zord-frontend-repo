package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"main.go/messaging"
	"main.go/model"
)

func IntentHandler(context *gin.Context) {

	rawPayload := context.MustGet("raw_payload").([]byte)
	traceId := context.MustGet("trace_id").(string)
	tenantId := context.MustGet("tenant_id").(uuid.UUID)
	IdempotencyKey := context.MustGet("idempotency_key").(string)

	msg := model.RawIntentMessage{
		TenantID:       tenantId.String(),
		TraceID:        traceId,
		RawPayload:     string(rawPayload),
		IdempotencyKey: IdempotencyKey,
	}

	err := messaging.ProduceIntentMessage(context.Request.Context(), msg)
	if err != nil {
		context.JSON(http.StatusInternalServerError, gin.H{
			"error": "failed to enqueue intent message service 1",
		})
		return
	}
	ack, err := messaging.ConsumeAckMessage(context.Request.Context(), msg.TraceID)
	if err != nil {
		context.JSON(http.StatusInternalServerError, gin.H{"error": "failed to consume ack message from service 2"})
		return
	}

	context.JSON(http.StatusAccepted, gin.H{
		"EnvelopeID":  ack.EnvelopeId,
		"Trace_id":    ack.TraceID,
		"Received_At": ack.ReceivedAt})
}
