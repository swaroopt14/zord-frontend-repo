package handlers

import (
	"net/http"

	"zord-token-enclave/internal/services"

	"github.com/gin-gonic/gin"
)

type TokenHandler struct {
	svc *services.TokenService
}

func NewTokenHandler(s *services.TokenService) *TokenHandler {
	return &TokenHandler{svc: s}
}

func (h *TokenHandler) Tokenize(c *gin.Context) {
	var req struct {
		TenantID string `json:"tenant_id"`
		Kind     string `json:"kind"`
		Value    string `json:"value"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request"})
		return
	}

	token, err := h.svc.Tokenize(c, req.TenantID, req.Kind, []byte(req.Value))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "tokenization failed"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"token": token})
}

func (h *TokenHandler) Detokenize(c *gin.Context) {
	tokenID := c.Param("token")

	value, err := h.svc.Detokenize(c, tokenID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "token not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"value": string(value)})
}
