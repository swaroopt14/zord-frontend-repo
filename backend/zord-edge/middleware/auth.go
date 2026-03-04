package middleware

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"main.go/db"
	"main.go/services"
)

func Authenticate() gin.HandlerFunc {
	return func(context *gin.Context) {
		{
			auth := context.GetHeader("Authorization")

			if auth == "" || !strings.HasPrefix(auth, "Bearer ") {
				context.JSON(http.StatusUnauthorized, gin.H{"Error": "Missing API Key"})
				context.Abort()
			}

			apikey := strings.TrimPrefix(auth, "Bearer ")
			response, err := services.ValidateApiKey(context.Request.Context(), db.DB, apikey)
			if err != nil {
				context.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{
					"success": false,
					"error": gin.H{
						"code":    "UNAUTHORIZED",
						"message": "Invalid API key",
					},
				})
				return
			}
			ContentType := context.GetHeader("Content-Type")
			if !strings.HasPrefix(ContentType, "application/json") &&
				!strings.HasPrefix(ContentType, "multipart/form-data") {

				context.JSON(http.StatusBadRequest, gin.H{
					"Error": "Unsupported Content-Type",
				})
				context.Abort()
				return
			}
			SourceType := context.GetHeader("X-Zord-Source-Type")
			if SourceType == "" {
				context.JSON(http.StatusBadRequest, gin.H{"Error": "X-Zord-Source-Type header is required"})
				context.Abort()
				return
			}
			validSources := map[string]bool{
				"REST":        true,
				"CSV":         true,
				"PROMPT":      true,
				"WEBHOOK":     true,
				"FILE_UPLOAD": true,
			}
			if !validSources[SourceType] {
				context.JSON(http.StatusBadRequest, gin.H{"Error": "Invalid X-Zord-Source-Type header value"})
				context.Abort()
				return
			}

			context.Set("tenant_id", response.TenantId)
			context.Set("Content-Type", ContentType)
			context.Set("source_type", SourceType)
			context.Next()

		}
	}
}
