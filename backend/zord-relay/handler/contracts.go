package handler

import (
	"net/http"

	"zord-relay/services"

	"github.com/gin-gonic/gin"
)

type ContractsHandler struct {
	repo *services.PayoutContractsRepo
}

func NewContractsHandler(repo *services.PayoutContractsRepo) *ContractsHandler {
	return &ContractsHandler{repo: repo}
}

func (h *ContractsHandler) ListContracts(c *gin.Context) {
	contracts, err := h.repo.ListAll(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "failed to fetch contracts",
		})
		return
	}

	c.JSON(http.StatusOK, contracts)
}
