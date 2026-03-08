package handler

import (
	"context"
	"crypto/sha256"
	"encoding/csv"
	"encoding/json"
	"log"
	"net/http"
	"path/filepath"
	"runtime"
	"strings"
	"sync"
	"time"

	"zord-edge/model"
	"zord-edge/services"
	"zord-edge/vault"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/xuri/excelize/v2"
)

type BulkResult struct {
	Row        int    `json:"row"`
	EnvelopeID string `json:"EnvelopeID,omitempty"`
	TraceID    string `json:"Trace_id,omitempty"`
	Status     string `json:"Status"`
	ReceivedAt string `json:"Received_At,omitempty"`
	Error      string `json:"error,omitempty"`
}

type BulkJob struct {
	Row     int
	Payload []byte
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

		sheet := f.GetSheetName(0)

		rows, err = f.GetRows(sheet)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "unable to read sheet"})
			return
		}

	case ".csv":

		reader := csv.NewReader(src)

		rows, err = reader.ReadAll()
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid CSV file"})
			return
		}

	default:

		c.JSON(http.StatusBadRequest, gin.H{
			"error": "unsupported file format (.csv or .xlsx only)",
		})
		return
	}

	if len(rows) < 2 {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "file must contain header and at least one row",
		})
		return
	}

	// Safety limit
	if len(rows) > 10000 {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "CSV limit exceeded (max 10000 rows)",
		})
		return
	}

	headers := rows[0]
	tenantID := c.MustGet("tenant_id").(uuid.UUID)

	results := make([]BulkResult, len(rows)-1)

	// Pipeline queue
	jobs := make(chan BulkJob, 100)

	// CPU based worker scaling
	workerCount := runtime.NumCPU() * 2

	var wg sync.WaitGroup

	/*
		Worker Pool
	*/
	for w := 0; w < workerCount; w++ {

		wg.Add(1)

		go func() {

			defer wg.Done()

			for job := range jobs {

				traceID := uuid.New().String()
				idempotencyKey := uuid.New().String()

				data, duplicateID, err := h.processBulkIntentRow(
					c.Request.Context(),
					job.Payload,
					tenantID,
					traceID,
					idempotencyKey,
					len(job.Payload),
					"application/json",
					"CSV",
				)

				if err != nil {

					results[job.Row-1] = BulkResult{
						Row:     job.Row,
						Status:  "FAILED",
						TraceID: traceID,
						Error:   err.Error(),
					}

					continue
				}

				if duplicateID != uuid.Nil {

					results[job.Row-1] = BulkResult{
						Row:        job.Row,
						Status:     "DUPLICATE",
						TraceID:    traceID,
						EnvelopeID: duplicateID.String(),
						Error:      "duplicate idempotency key",
					}

					continue
				}

				results[job.Row-1] = BulkResult{
					Row:        job.Row,
					Status:     "Accepted",
					TraceID:    traceID,
					EnvelopeID: data.EnvelopeId,
					ReceivedAt: data.ReceivedAt.Format(time.RFC3339Nano),
				}
			}

		}()
	}

	/*
		Producer Stage
		Build JSON payloads
	*/

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

			results[i-1] = BulkResult{
				Row:    i,
				Status: "FAILED",
				Error:  "failed to marshal JSON payload",
			}

			continue
		}

		jobs <- BulkJob{
			Row:     i,
			Payload: jsonPayload,
		}
	}

	close(jobs)

	wg.Wait()

	c.JSON(http.StatusAccepted, gin.H{
		"total":   len(results),
		"results": results,
	})
}

func (h *Handler) processBulkIntentRow(
	ctx context.Context,
	rawPayload []byte,
	tenantId uuid.UUID,
	traceId string,
	idempotencyKey string,
	payloadSize int,
	contentType string,
	sourceType string,
) (*model.AckMessage, uuid.UUID, error) {

	encryptedPayload, err := vault.Encrypt(rawPayload)
	if err != nil {
		log.Printf("Error encrypting payload for bulk row, trace_id=%s: %v", traceId, err)
		return nil, uuid.Nil, err
	}

	msg := model.RawIntentMessage{
		TenantID:       tenantId.String(),
		TraceID:        traceId,
		IdempotencyKey: idempotencyKey,
		PayloadSize:    payloadSize,
		Payload:        encryptedPayload,
		ContentType:    contentType,
		SourceType:     sourceType,
	}

	id, err := services.PersistIdempotency(ctx, msg)
	if err != nil {
		log.Printf("Error persisting idempotency key for bulk row, trace_id=%s: %v", traceId, err)
		return nil, uuid.Nil, err
	}
	if id != uuid.Nil {
		return nil, id, nil
	}

	data, err := services.ProcessRawIntent(msg, h.S3store)
	if err != nil {
		log.Printf("Error processing raw intent for bulk row, trace_id=%s: %v", traceId, err)
		return nil, uuid.Nil, err
	}
	if data == nil {
		log.Printf("S3 data is nil for bulk row, trace_id=%s", traceId)
		return nil, uuid.Nil, err
	}

	hash := sha256.Sum256(rawPayload)
	msg.PayloadHash = hash[:]

	if err := services.RawIntent(ctx, msg, data, false); err != nil {
		log.Printf("Error persisting raw intent for bulk row, trace_id=%s: %v", traceId, err)
		return nil, uuid.Nil, err
	}

	services.SendToIntentEngine(msg, data, h.Kafka, false)

	return data, uuid.Nil, nil
}
