package handler

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"main.go/db"
	"main.go/services"
)

// ListEnvelopes handles GET /v1/envelopes
//
// Query params (all optional):
//   - page      : page number (default 1)
//   - page_size : items per page (default 50, max 100)
//   - tenant_id : filter by tenant UUID

func ListEnvelopes(c *gin.Context) {
	page, err := strconv.Atoi(c.DefaultQuery("page", "1"))
	if err != nil || page < 1 {
		page = 1
	}

	pageSize, err := strconv.Atoi(c.DefaultQuery("page_size", "50"))
	if err != nil || pageSize < 1 {
		pageSize = 50
	}
	if pageSize > 100 {
		pageSize = 100
	}

	tenantID := c.Query("tenant_id") // "" if not provided

	result, err := services.ListEnvelopes(c.Request.Context(), db.DB, page, pageSize, tenantID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Failed to fetch envelopes",
			"details": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, result)
}

// GetEnvelopeByID handles GET /v1/envelopes/:envelope_id

func GetEnvelopeByID(c *gin.Context) {
	envelopeID := c.Param("envelope_id")

	if envelopeID == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "envelope_id is required",
		})
		return
	}

	envelope, err := services.GetEnvelopeByID(c.Request.Context(), db.DB, envelopeID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Failed to fetch envelope",
			"details": err.Error(),
		})
		return
	}

	if envelope == nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error": "Envelope not found",
		})
		return
	}

	c.JSON(http.StatusOK, envelope)
}