package handlers

// What is this file?
// HTTP handlers for KPI and projection data.
// These are the endpoints the zord-console dashboard calls most frequently.
//
// ENDPOINTS:
//   GET /v1/intelligence/kpis?tenant_id=X
//       → returns all latest projections for a tenant
//
//   GET /v1/intelligence/corridors/health?tenant_id=X
//       → returns success_rate and latency per corridor
//
//   GET /v1/intelligence/failures/top?tenant_id=X&corridor_id=Y
//       → returns top failure reason codes for a corridor

import (
	"encoding/json"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/zord/zord-intelligence/internal/models"
	"github.com/zord/zord-intelligence/internal/persistence"
)

// KPIHandler handles KPI and projection HTTP requests.
type KPIHandler struct {
	projRepo *persistence.ProjectionRepo
}

// NewKPIHandler creates a KPIHandler with its dependencies.
func NewKPIHandler(projRepo *persistence.ProjectionRepo) *KPIHandler {
	return &KPIHandler{projRepo: projRepo}
}

// GetKPIs handles GET /v1/intelligence/kpis?tenant_id=X
//
// Returns the latest value of every projection key for a tenant.
// The frontend uses this to populate the main KPI dashboard.
//
// EXAMPLE RESPONSE:
//
//	{
//	  "tenant_id": "tnt_A",
//	  "projections": [
//	    { "projection_key": "corridor.success_rate.razorpay_UPI",
//	      "value_json": {"rate": 0.97, "total_count": 1000}, ... },
//	    { "projection_key": "tenant.evidence_readiness",
//	      "value_json": {"rate": 0.91, ...}, ... }
//	  ]
//	}
func (h *KPIHandler) GetKPIs(w http.ResponseWriter, r *http.Request) {
	// Read query parameter: /kpis?tenant_id=tnt_A
	tenantID := r.URL.Query().Get("tenant_id")
	if tenantID == "" {
		writeError(w, http.StatusBadRequest, "tenant_id query parameter is required")
		return
	}

	projections, err := h.projRepo.ListByTenant(r.Context(), tenantID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to fetch KPIs")
		return
	}

	// Build response — parse value_json into typed objects for the frontend
	type projectionResponse struct {
		ProjectionKey string      `json:"projection_key"`
		WindowStart   string      `json:"window_start"`
		WindowEnd     string      `json:"window_end"`
		Value         interface{} `json:"value"` // parsed JSON, not raw string
		ComputedAt    string      `json:"computed_at"`
	}

	var items []projectionResponse
	for _, p := range projections {
		// Parse value_json string → Go map → JSON-friendly object
		// This way the frontend gets structured data, not an escaped JSON string
		var parsedValue interface{}
		if err := json.Unmarshal([]byte(p.ValueJSON), &parsedValue); err != nil {
			// If parsing fails, send the raw string — still useful
			parsedValue = p.ValueJSON
		}

		items = append(items, projectionResponse{
			ProjectionKey: p.ProjectionKey,
			WindowStart:   p.WindowStart.Format("2006-01-02T15:04:05Z"),
			WindowEnd:     p.WindowEnd.Format("2006-01-02T15:04:05Z"),
			Value:         parsedValue,
			ComputedAt:    p.ComputedAt.Format("2006-01-02T15:04:05Z"),
		})
	}

	writeJSON(w, http.StatusOK, map[string]interface{}{
		"tenant_id":   tenantID,
		"projections": items,
		"count":       len(items),
	})
}

// GetCorridorHealth handles GET /v1/intelligence/corridors/health?tenant_id=X
//
// Returns a health summary per corridor — success rate + latency.
// The frontend uses this for the "Payment Health" dashboard panel.
//
// EXAMPLE RESPONSE:
//
//	{
//	  "corridors": [
//	    { "corridor_id": "razorpay_UPI",
//	      "success_rate": 0.97,
//	      "finality_p95_seconds": 480,
//	      "total_pending": 23 }
//	  ]
//	}
func (h *KPIHandler) GetCorridorHealth(w http.ResponseWriter, r *http.Request) {
	tenantID := r.URL.Query().Get("tenant_id")
	if tenantID == "" {
		writeError(w, http.StatusBadRequest, "tenant_id is required")
		return
	}

	// Fetch all projections and filter for corridor-level ones
	projections, err := h.projRepo.ListByTenant(r.Context(), tenantID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to fetch corridor health")
		return
	}

	// Group by corridor ID
	// corridorID → map of metric → value
	type corridorData struct {
		CorridorID         string  `json:"corridor_id"`
		SuccessRate        float64 `json:"success_rate"`
		FinalityP95Seconds float64 `json:"finality_p95_seconds"`
		TotalPending       int     `json:"total_pending"`
		TotalCount         int     `json:"total_count"`
	}

	corridorMap := make(map[string]*corridorData)

	for _, p := range projections {
		// Extract corridor_id from projection_key
		// Key format: "corridor.success_rate.razorpay_UPI"
		corridorID := extractCorridorID(p.ProjectionKey)
		if corridorID == "" {
			continue // skip non-corridor projections
		}

		if _, exists := corridorMap[corridorID]; !exists {
			corridorMap[corridorID] = &corridorData{CorridorID: corridorID}
		}

		entry := corridorMap[corridorID]

		switch {
		case isKeyType(p.ProjectionKey, "success_rate"):
			var v models.SuccessRateValue
			if err := json.Unmarshal([]byte(p.ValueJSON), &v); err == nil {
				entry.SuccessRate = v.Rate
				entry.TotalCount = v.TotalCount
			}

		case isKeyType(p.ProjectionKey, "finality_latency"):
			var v models.FinalityLatencyValue
			if err := json.Unmarshal([]byte(p.ValueJSON), &v); err == nil {
				entry.FinalityP95Seconds = v.P95Seconds
			}

		case isKeyType(p.ProjectionKey, "pending_backlog"):
			var v models.PendingBacklogValue
			if err := json.Unmarshal([]byte(p.ValueJSON), &v); err == nil {
				entry.TotalPending = v.TotalPending
			}
		}
	}

	// Convert map to slice for JSON response
	var corridors []*corridorData
	for _, c := range corridorMap {
		corridors = append(corridors, c)
	}

	writeJSON(w, http.StatusOK, map[string]interface{}{
		"tenant_id": tenantID,
		"corridors": corridors,
		"count":     len(corridors),
	})
}

// GetTopFailures handles GET /v1/intelligence/failures/top?tenant_id=X&corridor_id=Y
//
// Returns the top failure reasons for a corridor.
// The frontend uses this for the "Failure Analysis" panel.
func (h *KPIHandler) GetTopFailures(w http.ResponseWriter, r *http.Request) {
	tenantID := r.URL.Query().Get("tenant_id")
	corridorID := r.URL.Query().Get("corridor_id")

	if tenantID == "" {
		writeError(w, http.StatusBadRequest, "tenant_id is required")
		return
	}

	key := "corridor.failure_taxonomy." + corridorID
	if corridorID == "" {
		key = "corridor.failure_taxonomy" // all corridors
	}

	var val models.FailureTaxonomyValue
	if err := h.projRepo.GetValueAs(r.Context(), tenantID, key, &val); err != nil {
		writeError(w, http.StatusInternalServerError, "failed to fetch failures")
		return
	}

	writeJSON(w, http.StatusOK, map[string]interface{}{
		"tenant_id":   tenantID,
		"corridor_id": corridorID,
		"top_reasons": val.TopReasons,
		"total_fails": val.TotalFails,
	})
}

// GetSLAStatus handles GET /v1/intelligence/sla?tenant_id=X
// Returns SLA timer status across all active intents for a tenant.
func (h *KPIHandler) GetSLAStatus(w http.ResponseWriter, r *http.Request) {
	tenantID := r.URL.Query().Get("tenant_id")
	if tenantID == "" {
		writeError(w, http.StatusBadRequest, "tenant_id is required")
		return
	}
	// SLA timer query is done in sla_worker for now
	// This endpoint returns a placeholder until sla_worker is wired
	writeJSON(w, http.StatusOK, map[string]interface{}{
		"tenant_id": tenantID,
		"message":   "SLA status endpoint — wired in session 9",
	})
}

// ── Private helpers used only in this file ────────────────────────────────────

// extractCorridorID pulls the corridor ID from a projection key.
// "corridor.success_rate.razorpay_UPI" → "razorpay_UPI"
// "tenant.evidence_readiness"          → "" (not a corridor key)
func extractCorridorID(key string) string {
	// chi provides URL params via chi.URLParam(r, "id")
	// Here we parse the projection key string manually
	parts := splitKey(key)
	// corridor keys have 3 parts: ["corridor", "metric_type", "corridor_id"]
	if len(parts) == 3 && parts[0] == "corridor" {
		return parts[2]
	}
	return ""
}

// isKeyType checks if a projection key contains a specific metric type.
// "corridor.success_rate.razorpay_UPI" with "success_rate" → true
func isKeyType(key, metricType string) bool {
	parts := splitKey(key)
	return len(parts) >= 2 && parts[1] == metricType
}

// splitKey splits a projection key by "."
func splitKey(key string) []string {
	var parts []string
	start := 0
	for i, c := range key {
		if c == '.' {
			parts = append(parts, key[start:i])
			start = i + 1
		}
	}
	parts = append(parts, key[start:])
	return parts
}

// GetSLABreachRate handles GET /v1/intelligence/sla-breach?tenant_id=X
//
// Returns SLA breach metrics for a tenant.
// Example response:
// {
//   "tenant_id": "tnt_A",
//   "total_processed": 1000,
//   "breached": 45,
//   "on_time": 955,
//   "breach_rate": 0.045,
//   "avg_breach_seconds": 1200,
//   "window_start": "2024-01-15T00:00:00Z",
//   "window_end": "2024-01-16T00:00:00Z"
// }
func (h *KPIHandler) GetSLABreachRate(w http.ResponseWriter, r *http.Request) {
	tenantID := r.URL.Query().Get("tenant_id")
	if tenantID == "" {
		writeError(w, http.StatusBadRequest, "tenant_id query parameter is required")
		return
	}

	key := "tenant.sla_breach_rate"
	
	p, err := h.projRepo.GetLatest(r.Context(), tenantID, key)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to fetch SLA breach rate")
		return
	}

	if p == nil {
		writeJSON(w, http.StatusOK, map[string]interface{}{
			"tenant_id":       tenantID,
			"message":         "no data available yet",
			"total_processed": 0,
			"breached":        0,
			"breach_rate":     0.0,
		})
		return
	}

	// Parse the JSONB value_json into our SLABreachRateValue struct
	var breachData models.SLABreachRateValue
	if err := json.Unmarshal([]byte(p.ValueJSON), &breachData); err != nil {
		writeError(w, http.StatusInternalServerError, "failed to parse SLA data")
		return
	}

	// Format response for the dashboard
	response := map[string]interface{}{
		"tenant_id":          tenantID,
		"total_processed":    breachData.TotalProcessed,
		"breached":           breachData.Breached,
		"on_time":            breachData.OnTime,
		"breach_rate":        breachData.BreachRate,
		"avg_breach_seconds": breachData.AvgBreachSeconds,
		"window_start":       p.WindowStart.Format("2006-01-02T15:04:05Z"),
		"window_end":         p.WindowEnd.Format("2006-01-02T15:04:05Z"),
		"computed_at":        p.ComputedAt.Format("2006-01-02T15:04:05Z"),
	}

	writeJSON(w, http.StatusOK, response)
}

// chi is imported for URL params in other handlers — keep it used
var _ = chi.URLParam
