package handlers

import (
	"encoding/json"
	"net/http"
	"zord-outcome-engine/models"
	"zord-outcome-engine/services"

	"github.com/gin-gonic/gin"
)

// PollHandler ingests poll-based outcomes (S3).
func (h *Handler) PollHandler(c *gin.Context) {
	connectorID := c.Param("connector")
	payload, err := c.GetRawData()
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid body"})
		return
	}

	var referenceID *string
	var parsed struct {
		ReferenceID string `json:"reference_id"`
	}
	if err := json.Unmarshal(payload, &parsed); err == nil && parsed.ReferenceID != "" {
		referenceID = &parsed.ReferenceID
	}

	svc := &services.RawOutcomeService{S3: h.S3store}
	resp, err := svc.Ingest(c.Request.Context(), models.IngestRequest{
		ConnectorID: connectorID,
		SourceClass: "S3",
		Payload:     payload,
		ReferenceID: referenceID,
	})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, resp)
}
