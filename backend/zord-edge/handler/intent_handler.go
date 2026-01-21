package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"main.go/dto"
)

func Intent_handler(context *gin.Context) {

	traceId := context.MustGet("trace_id").(string)

	var intentRequest dto.IncomingIntentRequestV1
	if err := context.ShouldBindJSON(&intentRequest); err != nil {
		context.JSON(http.StatusBadRequest, gin.H{
			"trace_id": traceId,
			"error":    "Failed to bind request",
			"code":     "BINDING_ERROR",
			"details":  err.Error(),
		})
		return
	}

	context.JSON(http.StatusAccepted, gin.H{
		"trace_id": traceId,
		"Response": "Accepted",
		"data":     intentRequest,
	})
}
