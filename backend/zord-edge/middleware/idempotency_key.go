package middleware

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

func GetIdempotencyKey() gin.HandlerFunc {
	return func(context *gin.Context) {
		{
			idempotencyKey := context.GetHeader("X-Idempotency-Key")
			if idempotencyKey == "" {
				context.JSON(http.StatusBadRequest, gin.H{"Error": "Missing Idempotency Key"})
				context.Abort()
				return
			}
			context.Set("idempotency_key", idempotencyKey)
			context.Next()

		}
	}
}
