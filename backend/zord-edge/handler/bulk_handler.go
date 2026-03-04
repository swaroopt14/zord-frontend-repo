package handler

import (
	"encoding/csv"
	"encoding/json"
	"net/http"
	"path/filepath"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/xuri/excelize/v2"
)

type BulkResult struct {
	Row        int    `json:"row"`
	Status     string `json:"status"`
	EnvelopeID string `json:"EnvelopeID,omitempty"`
	Error      string `json:"error,omitempty"`
}

func (h *Handler) BulkIntentHandler(c *gin.Context) {

	file, err := c.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "file is required"})
		return
	}

	src, err := file.Open()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "unable to open file"})
		return
	}
	defer src.Close()

	ext := strings.ToLower(filepath.Ext(file.Filename))

	var rows [][]string

	switch ext {

	case ".xlsx":
		f, err := excelize.OpenReader(src)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid excel file"})
			return
		}

		sheetName := f.GetSheetName(0)
		rows, err = f.GetRows(sheetName)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "unable to read sheet"})
			return
		}

	case ".csv":
		csvReader := csv.NewReader(src)
		rows, err = csvReader.ReadAll()
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid CSV file"})
			return
		}

	default:
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "unsupported file format (only .xlsx and .csv allowed)",
		})
		return
	}

	if len(rows) < 2 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "file must contain header and at least one row"})
		return
	}

	headers := rows[0]
	tenantID := c.MustGet("tenant_id").(uuid.UUID)

	var results []BulkResult

	for i := 1; i < len(rows); i++ {

		row := rows[i]
		payloadMap := make(map[string]interface{})

		for j, header := range headers {
			if j >= len(row) {
				continue
			}

			keys := strings.Split(header, ".")
			current := payloadMap

			for k := 0; k < len(keys); k++ {

				if k == len(keys)-1 {
					current[keys[k]] = row[j]
				} else {
					if _, exists := current[keys[k]]; !exists {
						current[keys[k]] = make(map[string]interface{})
					}
					current = current[keys[k]].(map[string]interface{})
				}
			}
		}

		jsonPayload, err := json.Marshal(payloadMap)
		if err != nil {
			results = append(results, BulkResult{
				Row:    i,
				Status: "FAILED",
				Error:  "failed to marshal JSON",
			})
			continue
		}

		traceID := uuid.New().String()
		idempotencyKey := uuid.New().String()

		data, duplicateID, err := h.processIntentCore(
			c.Request.Context(),
			jsonPayload,
			tenantID,
			traceID,
			idempotencyKey,
			len(jsonPayload),
			"application/json",
			"CSV",
		)

		if err != nil {
			results = append(results, BulkResult{
				Row:    i,
				Status: "FAILED",
				Error:  err.Error(),
			})
			continue
		}

		if duplicateID != uuid.Nil {
			results = append(results, BulkResult{
				Row:        i,
				Status:     "DUPLICATE",
				EnvelopeID: duplicateID.String(),
				Error:      "duplicate idempotency key",
			})
			continue
		}

		results = append(results, BulkResult{
			Row:        i,
			Status:     "SUCCESS",
			EnvelopeID: data.EnvelopeId,
		})
	}

	c.JSON(http.StatusAccepted, gin.H{
		"total":   len(results),
		"results": results,
	})
}
