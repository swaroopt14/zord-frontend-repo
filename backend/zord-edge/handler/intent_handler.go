package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

func IntentHandler(context *gin.Context) {

	traceId := context.MustGet("trace_id").(string)
	tenantId := context.MustGet("tenant_id").(uuid.UUID)

	context.JSON(http.StatusAccepted, gin.H{
		"trace_id": traceId,
		"Response": "Accepted",
		"TenantId": tenantId,
	})
}
