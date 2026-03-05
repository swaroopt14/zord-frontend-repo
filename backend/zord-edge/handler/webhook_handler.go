package handler

import (
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

func (h *Handler) WebhookHandler(context *gin.Context) {
	provider := context.Param("provider")
	rawPayloadAny, ok := context.Get("raw_payload")
	if !ok {
		context.JSON(400, gin.H{"error": "raw_payload missing"})
		return
	}
	rawPayload := rawPayloadAny.([]byte)

	// Determine Tenant ID
	// 1. Try from Query Param
	tenantIdStr := context.Query("tenant_id")
	// 2. If missing, use a default system tenant or error out.
	// For now, we generate a random one if missing to allow testing without DB
	if tenantIdStr == "" {
		// context.JSON(http.StatusBadRequest, gin.H{"error": "tenant_id is required"})
		// return
		// Ideally we map provider/secret to tenant. For now, using a placeholder.
		tenantIdStr = "00000000-0000-0000-0000-000000000000"
	}

	// Determine Idempotency Key
	// PSPs send unique event IDs. We should try to extract it.
	// If not, hash the payload.
	idempotencyKey := extractIdempotencyKey(rawPayload, provider)
	if idempotencyKey == "" {
		hash := sha256.Sum256(rawPayload)
		idempotencyKey = hex.EncodeToString(hash[:])
	}

	traceId := uuid.New().String()

	// msg := model.RawIntentMessage{
	// 	TenantID:       tenantIdStr,
	// 	TraceID:        traceId,
	// 	PayloadHash:    rawPayload,
	// 	IdempotencyKey: idempotencyKey,
	// }

	// err := kafka.ProduceWebhookMessage(context.Request.Context(), msg, h.Redis)
	// if err != nil {
	// 	context.JSON(http.StatusInternalServerError, gin.H{
	// 		"error": "failed to enqueue webhook",
	// 	})
	// 	return
	// }

	// Webhooks usually expect a 200/202 OK quickly.
	// We don't necessarily need to wait for full processing unless we want to return synchronous errors.
	// The requirement says "ACK (202)".

	context.JSON(http.StatusAccepted, gin.H{
		"status":   "received",
		"trace_id": traceId,
	})
}

func extractIdempotencyKey(payload []byte, provider string) string {
	// Simple attempt to parse common fields
	var data map[string]interface{}
	if err := json.Unmarshal(payload, &data); err != nil {
		return ""
	}

	// Razorpay often has "event" and payload.entity.id
	if provider == "razorpay" {
		if payloadMap, ok := data["payload"].(map[string]interface{}); ok {
			// Iterate keys to find the entity (e.g. "payout")
			for _, v := range payloadMap {
				if entity, ok := v.(map[string]interface{}); ok {
					if entityInner, ok := entity["entity"].(map[string]interface{}); ok {
						if id, ok := entityInner["id"].(string); ok {
							return id
						}
					}
				}
			}
		}
	}

	// Generic fallback: check "id", "event_id"
	if id, ok := data["id"].(string); ok {
		return id
	}
	if id, ok := data["event_id"].(string); ok {
		return id
	}

	return ""
}
