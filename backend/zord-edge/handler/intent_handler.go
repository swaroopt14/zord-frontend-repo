package handler

import (
	"encoding/json"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"main.go/config"
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

	data, err := json.Marshal(msg)
	if err != nil {
		context.JSON(http.StatusInternalServerError, gin.H{"Message": "Marshal Failed"})
		return
	}
	err = config.RedisClient.LPush(context.Request.Context(), "Intent_Data", data).Err()
	if err != nil {
		context.JSON(http.StatusInternalServerError, gin.H{"Message": "Reddis Push Failed"})
		return
	}

	result, err := config.RedisClient.BRPop(context.Request.Context(), 30*time.Second, "Ingest:ACK").Result()
	if err != nil {
		context.JSON(http.StatusGatewayTimeout, gin.H{
			"error": "timeout waiting for storage ack",
		})
		return
	}
	var ack model.AckMessage
	_ = json.Unmarshal([]byte(result[1]), &ack)

	context.JSON(http.StatusAccepted, gin.H{
		"EnvelopeID":  ack.EnvelopeId,
		"Trace_id":    ack.TraceID,
		"Received_At": ack.ReceivedAt})
}
