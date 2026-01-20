package middleware

import (
	"fmt"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
)

func Authenticate(context *gin.Context) {
	auth := context.GetHeader("Authorization")

	if auth == "" || !strings.HasPrefix(auth, "Bearer ") {
		context.JSON(http.StatusUnauthorized, gin.H{"Error": "Missing API Key"})
	}
	context.Abort()

	apikey := strings.TrimPrefix(auth, "Bearer ")
	fmt.Print(apikey)

	//DB Logic to be validated from the database
}
