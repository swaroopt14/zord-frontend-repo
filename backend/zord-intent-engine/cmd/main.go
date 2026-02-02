package main

import (
	"context"
	"log"
	"net/http"
	"os"

	"zord-intent-engine/internal/services"
	"zord-intent-engine/internal/validator"
	"zord-intent-engine/messaging"

	"zord-intent-engine/config"
	"zord-intent-engine/db"
	"zord-intent-engine/internal/handlers"

	"zord-intent-engine/internal/persistence"

	"zord-intent-engine/internal/pii"
)

func main() {
	// -------- INIT --------
	config.InitDB()
	if err := db.CreateTables(); err != nil {
		log.Fatal("failed to create tables:", err)
	}
	config.InitRedis()

	ctx := context.Background()

	// -------- Repositories --------
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

	// -------- DLQ HTTP (READ-ONLY) --------
	dlqHandler := handlers.NewDLQHandler(dlqRepo)

	http.HandleFunc("/health", func(w http.ResponseWriter, _ *http.Request) {
		w.WriteHeader(http.StatusOK)
		w.Write([]byte("ok"))
	})

	http.HandleFunc("/v1/dlq", dlqHandler.List)

	// -------- REDIS CONSUMER (PRIMARY ENTRYPOINT) --------
	go func() {
		log.Println("Ingress consumer started")

		for {
			incoming, err := messaging.ConsumeIngressMessage(ctx)
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
				// Business failure → DLQ already persisted
				log.Printf(
					"⚠️ Intent rejected [tenant=%s envelope=%s reason=%s]",
					incoming.TenantID,
					incoming.EnvelopeID,
					dlq.ReasonCode,
				)
				// STEP 11 (ACK) will still happen
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
	log.Println("Intent Engine (Service-2) running on :8081")
	log.Fatal(http.ListenAndServe(":8082", nil))
}
