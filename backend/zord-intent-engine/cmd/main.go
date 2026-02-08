package main

import (
	"context"
	"encoding/json"
	"log"
	"net/http"
	"os"
	"time"

	"zord-intent-engine/internal/services"
	"zord-intent-engine/internal/validator"
	"zord-intent-engine/messaging"

	"zord-intent-engine/config"
	"zord-intent-engine/db"
	"zord-intent-engine/internal/handlers"

	"zord-intent-engine/internal/persistence"

	"zord-intent-engine/internal/pii"

	"zord-intent-engine/storage"
)

func main() {
	// -------- INIT --------
	config.InitDB()
	if err := db.CreateTables(); err != nil {
		log.Fatal("failed to create tables:", err)
	}

	Rdb := config.InitRedis()

	ctx := context.Background()

	// -------- Repositories --------
	dlqRepo := persistence.NewDLQRepo(db.DB)
	intentRepo := persistence.NewPaymentIntentRepo(db.DB)
	intentQueryRepo := persistence.NewIntentQueryRepo(db.DB)

	// -------- Validator --------
	intentValidator := validator.NewValidator(dlqRepo)

	// -------- PII Tokenizer --------
	tokenizer, err := pii.NewTokenizer(os.Getenv("PII_TOKEN_SECRET"))
	if err != nil {
		log.Fatal("failed to init PII tokenizer:", err)
	}

	// -------- Intent Service --------
	//------Initializing s3
	s3store, err := storage.NewS3Store(ctx, os.Getenv("S3_BUCKET"), os.Getenv("AWS_REGION"))
	if err != nil {
		log.Fatal(err)
	}

	intentService := services.NewIntentService(
		intentValidator,
		tokenizer,
		intentRepo,
		s3store,
	)

	// -------- DLQ HTTP (READ-ONLY) --------
	dlqHandler := handlers.NewDLQHandler(dlqRepo)
	intentHandler := handlers.NewIntentHandler(intentQueryRepo)

	http.HandleFunc("/health", func(w http.ResponseWriter, _ *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)

		response := map[string]interface{}{
			"service": "zord-intent-engine",
			"status":  "healthy",
			"time":    time.Now().UTC(),
		}

		if err := json.NewEncoder(w).Encode(response); err != nil {
			http.Error(w, "failed to encode health response", http.StatusInternalServerError)
		}
	})

	http.HandleFunc("/v1/dlq", dlqHandler.List)
	http.HandleFunc("/v1/intents/", func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path == "/v1/intents" || r.URL.Path == "/v1/intents/" {
			intentHandler.List(w, r)
		} else {
			intentHandler.GetByID(w, r)
		}
	})
	http.HandleFunc("/v1/intents", intentHandler.List)

	// -------- REDIS CONSUMER (PRIMARY ENTRYPOINT) --------
	go func() {
		log.Println("Ingress consumer started")

		for {
			incoming, err := messaging.ConsumeIngressMessage(ctx, Rdb)
			if err != nil {
				log.Printf("Error consuming ingress message: %v\n", err)
				continue
			}

			canonical, dlq, err := intentService.ProcessIncomingIntent(
				ctx,
				incoming,
			)

			if err != nil {
				// System failure → retry (do NOT ack yet)
				log.Printf("System error processing intent: %v\n", err)
				continue
			}

			if dlq != nil {
				log.Printf(
					"⚠️ Intent rejected [tenant=%s envelope=%s reason=%s]",
					incoming.TenantID,
					incoming.EnvelopeID,
					dlq.ReasonCode,
				)

				continue
			}

			log.Printf(
				"Intent processed successfully [intent_id=%s envelope=%s]",
				canonical.IntentID,
				incoming.EnvelopeID,
			)

			// STEP 11 — ACK Redis message
			// (to be implemented inside messaging layer)
		}
	}()

	// -------- HTTP SERVER --------
	log.Println("Intent Engine (Service-2) running on :8083")
	log.Fatal(http.ListenAndServe(":8083", nil))
}
