package main

import (
	"encoding/json"
	"io"
	"log"
	"net/http"
	"os"

	"github.com/google/uuid"

	"zord-intent-engine/config"
	"zord-intent-engine/db"
	"zord-intent-engine/internal/handlers"
	"zord-intent-engine/internal/models"
	"zord-intent-engine/internal/persistence"
	"zord-intent-engine/internal/pii"
	"zord-intent-engine/internal/services"
	"zord-intent-engine/internal/validator"
)

func main() {
	// -------- DB INIT --------
	config.InitDB()

	// -------- Repositories --------
	ingressRepo := persistence.NewIngressEnvelopeRepo(db.DB)
	dlqRepo := persistence.NewDLQRepo(db.DB)
	intentRepo := persistence.NewPaymentIntentRepo(db.DB)

	// -------- Validator --------
	intentValidator := validator.NewValidator(dlqRepo)

	// -------- PII Tokenizer --------
	tokenizer, err := pii.NewTokenizer(os.Getenv("PII_TOKEN_SECRET"))
	if err != nil {
		log.Fatal("failed to init PII tokenizer:", err)
	}

	// -------- Services --------
	intentService := services.NewIntentService(
		intentValidator,
		tokenizer,
		intentRepo,
	)

	// -------- Handlers --------
	dlqHandler := handlers.NewDLQHandler(dlqRepo)

	// -------- HTTP --------

	// Health check
	http.HandleFunc("/health", func(w http.ResponseWriter, _ *http.Request) {
		w.WriteHeader(http.StatusOK)
		w.Write([]byte("ok"))
	})

	// DLQ listing API (for frontend)
	http.HandleFunc("/v1/dlq", dlqHandler.List)

	// Intent ingestion (test mode)
	http.HandleFunc("/test/intent", func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
			return
		}
		var rawIncomingIntent models.RawIncomingIntent
		rawIncomingIntent.Payload, err = io.ReadAll(r.Body)
		if err != nil {
			http.Error(w, "invalid request body", http.StatusBadRequest)
			return
		}

		// TEMP: hardcoded tenant (replace with auth later)
		tenantID := "11111111-1111-1111-1111-111111111111"

		// TEMP: simulate previous service
		envelopeID := uuid.NewString()

		// Insert ingress row (FK safety)
		if err := ingressRepo.InsertDummy(
			r.Context(),
			envelopeID,
			tenantID,
		); err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		// Full pipeline
		canonical, dlq, err := intentService.Process(
			r.Context(), // ✅ use request context
			tenantID,
			envelopeID,
			rawIncomingIntent.Payload,
		)

		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		if dlq != nil {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusUnprocessableEntity)

			pretty, _ := json.MarshalIndent(dlq, "", "\t")
			w.Write(pretty)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(canonical)
	})

	log.Println("🚀 Intent Engine (DB mode) running on :8083")
	log.Fatal(http.ListenAndServe(":8083", nil))
}
