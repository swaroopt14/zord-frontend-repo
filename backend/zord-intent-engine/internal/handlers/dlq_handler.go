package handlers

import (
	"encoding/json"
	"net/http"

	"zord-intent-engine/internal/models"
	"zord-intent-engine/internal/persistence"
)

type DLQHandler struct {
	repo persistence.DLQRepository
}

func NewDLQHandler(repo persistence.DLQRepository) *DLQHandler {
	return &DLQHandler{repo: repo}
}

// GET /v1/dlq
// - No tenant_id  → all DLQ entries
// - tenant_id=?   → DLQ entries for that tenant
func (h *DLQHandler) List(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	tenantID := r.URL.Query().Get("tenant_id")

	var (
		items []models.DLQEntry
		err   error
	)

	if tenantID != "" {
		items, err = h.repo.ListByTenant(ctx, tenantID)
	} else {
		items, err = h.repo.ListAll(ctx)
	}

	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(items)
}
