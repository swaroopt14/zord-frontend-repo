package main

import (
	"context"
	"database/sql"
	"fmt"
	"log"
	"os"
	"time"

	_ "github.com/lib/pq"
)

// Hard-coded demo IDs that satisfy the UUID regex used in the prompt layer retriever
// (version 4, variant 8).
const (
	demoTenantID    = "11111111-1111-4111-8111-111111111111"
	demoIntentID    = "22222222-2222-4222-8222-222222222222"
	demoTraceID     = "33333333-3333-4333-8333-333333333333"
	demoEnvelopeID  = "44444444-4444-4444-8444-444444444444"
	demoOutboxID    = "55555555-5555-4555-8555-555555555555"
	demoDLQID       = "66666666-6666-4666-8666-666666666666"
	demoContractID  = "77777777-7777-4777-8777-777777777777"
	demoCurrency    = "INR"
	demoAmountValue = 100.50
)

func main() {
	ctx := context.Background()

	intentDSN := getenv("INTENT_READ_DSN",
		"postgres://intent_user:intent_password@zord-intent-postgres:5432/zord_intent_engine_db?sslmode=disable",
	)
	relayDSN := getenv("RELAY_READ_DSN",
		"postgres://relay_user:relay_password@zord-relay-postgres:5432/zord_relay_db?sslmode=disable",
	)

	log.Printf("INTENT_READ_DSN=%s", intentDSN)
	log.Printf("RELAY_READ_DSN=%s", relayDSN)

	intentDB := mustOpenDB("intent", intentDSN)
	defer intentDB.Close()

	relayDB := mustOpenDB("relay", relayDSN)
	defer relayDB.Close()

	if err := seedPaymentIntent(ctx, intentDB); err != nil {
		log.Fatalf("seed payment_intents: %v", err)
	}
	log.Println("✅ Seeded demo payment_intents row")

	if err := seedOutbox(ctx, intentDB); err != nil {
		log.Fatalf("seed outbox: %v", err)
	}
	log.Println("✅ Seeded demo outbox row")

	if err := seedDLQ(ctx, intentDB); err != nil {
		log.Fatalf("seed dlq_items: %v", err)
	}
	log.Println("✅ Seeded demo dlq_items row")

	if err := seedPayoutContract(ctx, relayDB); err != nil {
		log.Fatalf("seed payout_contracts: %v", err)
	}
	log.Println("✅ Seeded demo payout_contracts row")

	log.Println("✅ All demo rows seeded successfully")

	log.Println("\n--- Running Query ---")
	query()
}

func getenv(k, d string) string {
	if v := os.Getenv(k); v != "" {
		return v
	}
	return d
}

func mustOpenDB(name, dsn string) *sql.DB {
	db, err := sql.Open("postgres", dsn)
	if err != nil {
		log.Fatalf("open %s db: %v", name, err)
	}
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	if err := db.PingContext(ctx); err != nil {
		log.Fatalf("ping %s db: %v", name, err)
	}
	log.Printf("✅ Connected to %s DB", name)
	return db
}

func seedPaymentIntent(ctx context.Context, db *sql.DB) error {
	const q = `
INSERT INTO payment_intents (
    intent_id,
    trace_id,
    envelope_id,
    tenant_id,
    idempotency_key,
    salient_hash,

    intent_type,
    canonical_version,
    schema_version,

    amount,
    currency,
    deadline_at,

    constraints,
    beneficiary_type,
    pii_tokens,
    beneficiary,

    status,
    confidence_score,
    canonical_hash,
    prev_hash,
    canonical_ref,

    created_at
) VALUES (
    $1, $2, $3, $4,
    $5,
    $6,

    $7,
    $8,
    NULL,

    $9,
    $10,
    NULL,

    NULL,
    NULL,
    NULL,
    NULL,

    $11,
    NULL,
    $12,
    NULL,
    $13,

    NOW()
)
ON CONFLICT (intent_id) DO NOTHING;
`
	_, err := db.ExecContext(ctx, q,
		demoIntentID,
		demoTraceID,
		demoEnvelopeID,
		demoTenantID,
		"demo-idem-key-1",
		"demo-salient-hash",

		"PAYMENT",
		"v1",

		demoAmountValue,
		demoCurrency,

		"FAILED",
		"demo-canonical-hash",
		fmt.Sprintf("demo://canonical/ref/intent/%s", demoIntentID),
	)
	return err
}

func seedOutbox(ctx context.Context, db *sql.DB) error {
	const q = `
INSERT INTO outbox (
    event_id,
    tenant_id,

    aggregate_type,
    aggregate_id,

    event_type,
    schema_version,

    payload,
    amount,
    currency,

    status,
    retry_count,
    next_attempt_at,

    created_at,
    sent_at,
    lease_id,
    leased_by,
    lease_until,

    trace_id,
    envelope_id
) VALUES (
    $1,
    $2,

    'intent',
    $3,

    $4,
    'v1',

    $5,
    $6,
    $7,

    $8,
    0,
    NULL,

    NOW(),
    NULL,
    NULL,
    NULL,
    NULL,

    $9,
    $10
)
ON CONFLICT (event_id) DO NOTHING;
`
	payload := fmt.Sprintf(`{"demo":"outbox event for intent %s"}`, demoIntentID)
	_, err := db.ExecContext(ctx, q,
		demoOutboxID,
		demoTenantID,
		demoIntentID,
		"intent.failed.demo",
		payload,
		demoAmountValue,
		demoCurrency,
		"FAILED",
		demoTraceID,
		demoEnvelopeID,
	)
	return err
}

func seedDLQ(ctx context.Context, db *sql.DB) error {
	const q = `
INSERT INTO dlq_items (
    dlq_id,
    tenant_id,
    envelope_id,

    stage,
    reason_code,
    error_detail,
    replayable,

    created_at
) VALUES (
    $1,
    $2,
    $3,

    $4,
    $5,
    $6,
    $7,

    NOW()
)
ON CONFLICT (dlq_id) DO NOTHING;
`
	_, err := db.ExecContext(ctx, q,
		demoDLQID,
		demoTenantID,
		demoEnvelopeID,
		"INTENT_ENGINE",
		"semantic_validation_failed",
		"Demo DLQ entry seeded for prompt-layer testing",
		true,
	)
	return err
}

func seedPayoutContract(ctx context.Context, db *sql.DB) error {
	const q = `
INSERT INTO payout_contracts (
    contract_id,
    tenant_id,
    intent_id,
    envelope_id,
    contract_payload,
    contract_hash,
    status,
    created_at,
    trace_id
) VALUES (
    $1,
    $2,
    $3,
    $4,
    $5,
    $6,
    $7,
    NOW(),
    $8
)
ON CONFLICT (contract_id) DO NOTHING;
`
	payload := fmt.Sprintf(`{"demo":"payout contract for intent %s"}`, demoIntentID)
	_, err := db.ExecContext(ctx, q,
		demoContractID,
		demoTenantID,
		demoIntentID,
		demoEnvelopeID,
		payload,
		"demo-contract-hash-000000000000000000000000000000000000000000000",
		"FAILED",
		demoTraceID,
	)
	return err
}
