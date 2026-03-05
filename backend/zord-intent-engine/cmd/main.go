package main

import (
	"context"
	"encoding/json"
	"log"
	"net/http"
	"os"
	"time"

	"go.opentelemetry.io/contrib/instrumentation/net/http/otelhttp"
	"zord-intent-engine/internal/models"
	"zord-intent-engine/internal/services"
	"zord-intent-engine/internal/validator"
	"zord-intent-engine/internal/vault"
	"zord-intent-engine/messaging"

	"zord-intent-engine/config"
	"zord-intent-engine/db"
	"zord-intent-engine/internal/handlers"

	"zord-intent-engine/internal/persistence"

	//"zord-intent-engine/internal/pii"

	"zord-intent-engine/storage"
	"zord-intent-engine/tracing"
)

func main() {
	// -------- INIT --------
	cleanup := tracing.InitTracing("zord-intent-engine")
	defer cleanup()

	config.InitDB()
	if err := db.CreateTables(); err != nil {
		log.Fatal("failed to create tables:", err)
	}

	Rdb := config.InitRedis()
	cfg := config.LoadConfig()

	err := vault.InitVaultKey(cfg.VaultKey)
	if err != nil {
		log.Fatal("failed to initialize vault key:", err)
	}

	ctx := context.Background()

	// -------- Repositories --------
	dlqRepo := persistence.NewDLQRepo(db.DB)
	intentRepo := persistence.NewPaymentIntentRepo(db.DB)
	intentQueryRepo := persistence.NewIntentQueryRepo(db.DB)
	outboxPullRepo := persistence.NewOutboxPullRepo(db.DB)

	// -------- Validator --------
	intentValidator := validator.NewValidator(dlqRepo)

	// -------- PII Tokenizer --------
	//tokenizer, err := pii.NewTokenizer(os.Getenv("PII_TOKEN_SECRET"))
	// if err != nil {
	// 	log.Fatal("failed to init PII tokenizer:", err)
	// }

	// -------- Intent Service --------
	//------Initializing s3
	s3store, err := storage.NewS3Store(ctx, os.Getenv("S3_BUCKET"), os.Getenv("AWS_REGION"))
	if err != nil {
		log.Fatal(err)
	}

	intentService := services.NewIntentService(
		intentValidator,
		intentRepo,
		s3store,
	)

	// -------- DLQ HTTP (READ-ONLY) --------
	dlqHandler := handlers.NewDLQHandler(dlqRepo)
	intentHandler := handlers.NewIntentHandler(intentQueryRepo)
	outboxHandler := handlers.NewOutboxHandler(outboxPullRepo)

	mux := http.NewServeMux()

	mux.HandleFunc("/health", func(w http.ResponseWriter, _ *http.Request) {
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

	mux.HandleFunc("/v1/dlq", dlqHandler.List)
	mux.HandleFunc("/v1/dlq/", func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path == "/v1/dlq" || r.URL.Path == "/v1/dlq/" {
			dlqHandler.List(w, r)
		} else {
			dlqHandler.GetByID(w, r) // NEW: /v1/dlq/{dlq_id}
		}
	})
	mux.HandleFunc("/v1/intents/", func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path == "/v1/intents" || r.URL.Path == "/v1/intents/" {
			intentHandler.List(w, r)
		} else {
			intentHandler.GetByID(w, r)
		}
	})
	mux.HandleFunc("/v1/intents", intentHandler.List)
	mux.HandleFunc("/internal/outbox/lease", outboxHandler.Lease)
	mux.HandleFunc("/internal/outbox/ack", outboxHandler.Ack)
	mux.HandleFunc("/internal/outbox/nack", outboxHandler.Nack)

	// -------- REDIS CONSUMER (PRIMARY ENTRYPOINT) --------

	workerPoolSize := config.GetWorkerPoolSize()
	jobChan := make(chan *models.Event, 100)

	// Worker function
	worker := func(id int, jobs <-chan *models.Event) {
		for job := range jobs {
			canonical, dlq, err := intentService.ProcessIncomingIntent(ctx, job)

			if err != nil {
				// System failure → retry (do NOT ack yet)
				log.Printf("Worker %d: System error processing intent: %v\n", id, err)
				continue
			}

			if dlq != nil {
				log.Printf("Worker %d: ⚠️ Intent rejected [tenant=%s envelope=%s reason=%s]",
					id, job.TenantID, job.EnvelopeID, dlq.ReasonCode)
				continue
			}

			log.Printf("Worker %d: Intent processed successfully [intent_id=%s envelope=%s]",
				id, canonical.IntentID, job.EnvelopeID)

			// ACK logic would go here
		}
	}

	// Start workers
	for i := 0; i < workerPoolSize; i++ {
		go worker(i, jobChan)
	}

	log.Printf("Started %d workers for Ingress processing", workerPoolSize)

	go func() {
		log.Println("Ingress consumer started (Dispatcher)")

		for {
			incoming, err := messaging.ConsumeIngressMessage(ctx, Rdb)
			if err != nil {
				log.Printf("Error consuming ingress message: %v\n", err)
				continue
			}
			jobChan <- incoming
		}
	}()

	// -------- HTTP SERVER --------
	log.Println("Intent Engine (Service-2) running on :8083")
	server := &http.Server{
		Addr:    ":8083",
		Handler: otelhttp.NewHandler(mux, "http"),
	}
	log.Fatal(server.ListenAndServe())
}
