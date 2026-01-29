package main

import (
	"context"
	"encoding/json"
	"io"
	"log"
	"net/http"
	"os"

	"github.com/google/uuid"

	"main.go/config"
	"main.go/db"
	"main.go/internal/models"
	"main.go/internal/persistence"
	"main.go/internal/pii"
	"main.go/internal/services"
	"main.go/internal/validator"
)

func main() {
	// -------- DB INIT --------
	config.InitDB()

	// -------- Repositories (DB MODE) --------
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

	// -------- Intent Service --------
	intentService := services.NewIntentService(
		intentValidator,
		tokenizer,
		intentRepo,
	)

	// -------- HTTP --------
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

		// TEMP: test tenant
		tenantID := "11111111-1111-1111-1111-111111111111"

		// STEP 1 — simulate previous service
		envelopeID := uuid.NewString()
		// envelopeID := r.Header.Get("X-Envelope-ID")
		// or from payload if that’s the contract

		// STEP 2 — insert dummy ingress row (FK safety)
		err = ingressRepo.InsertDummy(
			r.Context(),
			envelopeID,
			tenantID,
		)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		// STEP 3–7 — validation → canonicalization → tokenization → persist
		canonical, dlq, err := intentService.Process(
			context.Background(),
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

	log.Println("🚀 Intent Engine (DB mode) running on :8080")
	log.Fatal(http.ListenAndServe(":8080", nil))
}
