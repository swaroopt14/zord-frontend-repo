package handlers

import (
	"encoding/json"
	"net/http"
	"strconv"
	"strings"

	"zord-intent-engine/internal/models"
	"zord-intent-engine/internal/persistence"
)

// IntentHandler handles HTTP requests for payment intents
type IntentHandler struct {
	queryRepo persistence.IntentQueryRepository
}

// NewIntentHandler creates a new handler instance
func NewIntentHandler(queryRepo persistence.IntentQueryRepository) *IntentHandler {
	return &IntentHandler{queryRepo: queryRepo}
}

// RESPONSE STRUCTURES

type IntentListResponse struct {
	Data       []models.CanonicalIntent `json:"data"`
	Total      int                      `json:"total"`
	Page       int                      `json:"page"`
	PageSize   int                      `json:"page_size"`
	TotalPages int                      `json:"total_pages"`
}

type IntentDetailResponse struct {
	Data models.CanonicalIntent `json:"data"`
}

type ErrorResponse struct {
	Error   string `json:"error"`
	Code    string `json:"code"`
	Message string `json:"message"`
	TraceID string `json:"trace_id,omitempty"`
}

// ENDPOINT 1: LIST INTENTS
func (h *IntentHandler) List(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	// Extract pagination parameters
	page := getIntParam(r, "page", 1)
	pageSize := getIntParam(r, "page_size", 20)

	// Enforce limits (security)
	if pageSize > 100 {
		pageSize = 100
	}
	if page < 1 {
		page = 1
	}

	// Extract filter parameters
	tenantID := r.URL.Query().Get("tenant_id")
	status := r.URL.Query().Get("status")
	intentType := r.URL.Query().Get("intent_type")

	// Call repository
	intents, total, err := h.queryRepo.ListIntents(ctx, persistence.IntentFilter{
		TenantID:   tenantID,
		Status:     status,
		IntentType: intentType,
		Page:       page,
		PageSize:   pageSize,
	})

	if err != nil {
		respondError(w, "DATABASE_ERROR", "Failed to fetch intents", http.StatusInternalServerError, err)
		return
	}

	// Calculate pagination
	totalPages := (total + pageSize - 1) / pageSize

	// Build response
	response := IntentListResponse{
		Data:       intents,
		Total:      total,
		Page:       page,
		PageSize:   pageSize,
		TotalPages: totalPages,
	}

	// Send response
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(response)
}

// ENDPOINT 2: GET BY ID
func (h *IntentHandler) GetByID(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	// Extract intent_id from URL
	path := strings.TrimPrefix(r.URL.Path, "/v1/intents/")
	intentID := strings.TrimSpace(path)

	if intentID == "" {
		respondError(w, "INVALID_REQUEST", "Intent ID is required", http.StatusBadRequest, nil)
		return
	}

	// Fetch from database
	intent, err := h.queryRepo.GetIntentByID(ctx, intentID)

	if err != nil {
		if err.Error() == "intent not found" || strings.Contains(err.Error(), "not found") {
			respondError(w, "NOT_FOUND", "Intent not found", http.StatusNotFound, err)
			return
		}

		respondError(w, "DATABASE_ERROR", "Failed to fetch intent", http.StatusInternalServerError, err)
		return
	}

	// Build response
	response := IntentDetailResponse{
		Data: intent,
	}

	// Send response
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(response)
}

//  HELPERS

func getIntParam(r *http.Request, key string, defaultValue int) int {
	val := r.URL.Query().Get(key)
	if val == "" {
		return defaultValue
	}

	intVal, err := strconv.Atoi(val)
	if err != nil {
		return defaultValue
	}

	return intVal
}

func respondError(w http.ResponseWriter, code, message string, httpStatus int, err error) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(httpStatus)

	errResp := ErrorResponse{
		Error:   "REQUEST_FAILED",
		Code:    code,
		Message: message,
	}

	json.NewEncoder(w).Encode(errResp)
}
