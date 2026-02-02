package main

import (
	"database/sql"
	"encoding/json"
	"log"
	"time"

	"github.com/google/uuid"
	_ "github.com/lib/pq"
)

// Event represents a simplified payload structure
type Event struct {
	Amount int `json:"amount"`
}

func main() {
	// Update to match your test Postgres DB
	connStr := "postgres://relay_user:relay_password@localhost:5435/zord_relay_db?sslmode=disable"
	db, err := sql.Open("postgres", connStr)
	if err != nil {
		log.Fatalf("Failed to connect to DB: %v", err)
	}
	defer db.Close()

	log.Println("Connected to Postgres. Starting simulation...")

	for {
		tenantID := uuid.New()
		for i := 0; i < 3; i++ {
			eventID := uuid.New()
			aggregateID := uuid.New()
			traceID := uuid.New()
			envelopeID := uuid.New()

			payload := Event{
				Amount: 100 + int(time.Now().Unix()%100),
			}

			payloadBytes, _ := json.Marshal(payload)

			_, _ = db.Exec(`INSERT INTO tenants (tenant_id) VALUES ($1) ON CONFLICT (tenant_id) DO NOTHING`, tenantID)
			_, _ = db.Exec(`INSERT INTO payment_intents (intent_id) VALUES ($1) ON CONFLICT (intent_id) DO NOTHING`, aggregateID)
			_, _ = db.Exec(`INSERT INTO ingress_envelopes (envelope_id) VALUES ($1) ON CONFLICT (envelope_id) DO NOTHING`, envelopeID)

			_, err := db.Exec(`
				INSERT INTO outbox (
					outbox_id, tenant_id, aggregate_type, aggregate_id, event_type, payload, status, attempts, next_attempt_at, created_at, trace_id, envelope_id
				) VALUES ($1,$2,'intent',$3,$4,$5,'PENDING',0,NULL,NOW(),$6,$7)
			`, eventID, tenantID, aggregateID, "intent.created.v1", payloadBytes, traceID.String(), envelopeID.String())

			if err != nil {
				log.Printf("Failed to insert event: %v", err)
				continue
			}

			log.Printf("Inserted event for tenant %s with envelope_id %s", tenantID.String(), envelopeID.String())
		}

		time.Sleep(10 * time.Second) // Insert every 10 seconds
	}
}
