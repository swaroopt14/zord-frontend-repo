package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

func Intent_handler(context *gin.Context) {

	traceId := context.MustGet("trace_id").(string)

	context.JSON(http.StatusAccepted, gin.H{
		"trace_id": traceId,
		"Response": "Accepted",
	})
}
