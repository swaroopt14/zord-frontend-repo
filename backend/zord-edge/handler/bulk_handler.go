package handler

import (
	"bytes"
	"context"
	"crypto/sha256"
	"encoding/csv"
	"encoding/hex"
	"encoding/json"
	"io"
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

var mu sync.Mutex

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

	fileBytes, err := io.ReadAll(src)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to read file"})
		return
	}

	// 🔐 Hash
	fileHashBytes := sha256.Sum256(fileBytes)
	fileHash := hex.EncodeToString(fileHashBytes[:])

	tenantID := c.MustGet("tenant_id").(uuid.UUID)

	fileTraceID := uuid.NewString()

	log.Printf(
		"Bulk file stored | filename=%s size=%d hash=%s ",
		file.Filename,
		len(fileBytes),
		fileHash,
	)

	filePayload := map[string]interface{}{
		"file_name":           file.Filename,
		"file_size_bytes":     len(fileBytes),
		"file_content_hash":   fileHash,
		"row_count_estimate":  strings.Count(string(fileBytes), "\n") - 1,
		"file_upload_channel": "CSV",
		"file_data":           fileBytes,
	}

	payloadBytes, err := json.Marshal(filePayload)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "failed to build file payload",
		})
		return
	}

	fileMsg := model.RawIntentMessage{
		TenantID:       tenantID.String(),
		TraceID:        fileTraceID,
		IdempotencyKey: uuid.NewString(),
		PayloadSize:    len(payloadBytes),  // 🔥 updated
		Payload:        payloadBytes,       // 🔥 updated
		ContentType:    "application/json", // 🔥 updated
		SourceType:     "BULK_FILE",
	}

	_, err = services.ProcessRawIntent(context.Background(), fileMsg, h.S3store)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "failed to store bulk file envelope",
		})
		return
	}

	// 🔄 New reader (clean)
	reader := bytes.NewReader(fileBytes)

	ext := strings.ToLower(filepath.Ext(file.Filename))

	var rows [][]string

	switch ext {

	case ".xlsx":

		f, err := excelize.OpenReader(reader)
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

		csvReader := csv.NewReader(reader)

		rows, err = csvReader.ReadAll()
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

	results := make([]BulkResult, len(rows)-1)

	// Pipeline queue
	jobs := make(chan BulkJob, len(rows))

	// CPU based worker scaling
	workerCount := runtime.NumCPU() * 4

	var wg sync.WaitGroup

	/*
		Worker Pool
	*/
	for w := 0; w < workerCount; w++ {

		wg.Add(1)

		go func() {

			defer wg.Done()

			for job := range jobs {

				traceID := uuid.NewString()
				idempotencyKey := uuid.NewString()

				data, duplicateID, err := h.processBulkIntentRow(
					context.Background(),
					job.Payload,
					tenantID,
					traceID,
					idempotencyKey,
					len(job.Payload),
					"application/json",
					"CSV",
				)

				if err != nil {
					mu.Lock()
					results[job.Row-1] = BulkResult{
						Row:     job.Row,
						Status:  "FAILED",
						TraceID: traceID,
						Error:   err.Error(),
					}
					mu.Unlock()

					continue
				}

				if duplicateID != uuid.Nil {
					mu.Lock()
					results[job.Row-1] = BulkResult{
						Row:        job.Row,
						Status:     "DUPLICATE",
						TraceID:    traceID,
						EnvelopeID: duplicateID.String(),
						Error:      "duplicate idempotency key",
					}
					mu.Unlock()
					continue
				}
				mu.Lock()
				results[job.Row-1] = BulkResult{
					Row:        job.Row,
					Status:     "Accepted",
					TraceID:    traceID,
					EnvelopeID: data.EnvelopeId,
					ReceivedAt: data.ReceivedAt.Format(time.RFC3339Nano),
				}
				mu.Unlock()
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

	// Run workers in background
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

	data, err := services.ProcessRawIntent(ctx, msg, h.S3store)
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

	if err := services.RawIntent(ctx, msg, data); err != nil {
		log.Printf("Error persisting raw intent for bulk row, trace_id=%s: %v", traceId, err)
		return nil, uuid.Nil, err
	}

	go services.SendToIntentEngine(msg, data, h.Kafka)

	return data, uuid.Nil, nil
}
