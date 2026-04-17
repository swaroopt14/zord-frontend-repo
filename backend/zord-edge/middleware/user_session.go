package middleware

import (
	"net/http"
	"strings"

	authsecurity "zord-edge/auth/security"

	"github.com/gin-gonic/gin"
)

const sessionClaimsContextKey = "auth_session_claims"

func RequireUserSession(tokenManager *authsecurity.TokenManager) gin.HandlerFunc {
	return func(c *gin.Context) {
		token := bearerToken(c.GetHeader("Authorization"))
		if token == "" {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{
				"code":    "INVALID_SESSION",
				"message": "Session expired",
			})
			return
		}

		claims, err := tokenManager.VerifyAccessToken(token)
		if err != nil {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{
				"code":    "INVALID_SESSION",
				"message": "Session expired",
			})
			return
		}

		c.Set(sessionClaimsContextKey, claims)
		c.Next()
	}
}

func RequireRole(roles ...string) gin.HandlerFunc {
	return func(c *gin.Context) {
		claims := GetSessionClaims(c)
		if claims == nil {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{
				"code":    "INVALID_SESSION",
				"message": "Session expired",
			})
			return
		}

		for _, role := range roles {
			if claims.Role == role {
				c.Next()
				return
			}
		}

		c.AbortWithStatusJSON(http.StatusForbidden, gin.H{
			"code":    "FORBIDDEN",
			"message": "Insufficient role for this route",
		})
	}
}

func GetSessionClaims(c *gin.Context) *authsecurity.AccessClaims {
	raw, ok := c.Get(sessionClaimsContextKey)
	if !ok {
		return nil
	}

	claims, ok := raw.(*authsecurity.AccessClaims)
	if !ok {
		return nil
	}
	return claims
}

func bearerToken(header string) string {
	if !strings.HasPrefix(header, "Bearer ") {
		return ""
	}
	return strings.TrimSpace(strings.TrimPrefix(header, "Bearer "))
}
