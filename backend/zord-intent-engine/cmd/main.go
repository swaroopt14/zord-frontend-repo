package main

import (
	"encoding/json"
	"io"
	"log"
	"net/http"

	"main.go/internal/fetcher"
	"main.go/internal/persistence"
	"main.go/internal/validator"
)

func main() {
	// -------- Repositories --------
	rawRepo := fetcher.NewInMemoryRawEnvelopeRepo()
	dlqRepo := persistence.NewInMemoryDLQRepo()

	// -------- Services --------
	fetchService := fetcher.NewService(rawRepo)

	// NOTE:
	// Structural validation is skipped in test mode
	intentValidator := validator.NewValidator(dlqRepo)

	// -------- HTTP --------
	http.HandleFunc("/test/intent", func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
			return
		}

		payload, err := io.ReadAll(r.Body)
		if err != nil {
			http.Error(w, "invalid request body", http.StatusBadRequest)
			return
		}

		// STEP 1 — Store RawEnvelope
		envelope, err := fetchService.StoreRawIntent(payload)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		// STEP 2–4 — Semantic + Instrument validation
		intent, dlq := intentValidator.Validate(
			envelope.EnvelopeID,
			payload,
		)

		if dlq != nil {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusBadRequest)

			pretty, err := json.MarshalIndent(dlq, "", "\t")
			if err != nil {
				http.Error(w, err.Error(), http.StatusInternalServerError)
				return
			}

			w.Write(pretty)
			return
		}

		// SUCCESS
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]any{
			"status":      "VALIDATED",
			"envelope_id": envelope.EnvelopeID,
			"intent_type": intent.IntentType,
		})
	})

	log.Println("🚀 Intent Engine (test mode) running on :8080")
	log.Fatal(http.ListenAndServe(":8080", nil))
}
