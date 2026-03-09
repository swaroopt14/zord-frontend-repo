package worker

// What is this file?
// The SLA worker monitors payout deadlines.
// It wakes every 5 minutes and checks if any active payout has breached its SLA.
//
// AN SLA BREACH MEANS:
// A payout intent was created more than N hours ago and still has no finality.
// Default SLA: 6 hours. If a payout is still PENDING at hour 7 → breach.
//
// WHAT IT DOES EVERY 5 MINUTES:
//   1. Query sla_timers WHERE status=ACTIVE AND sla_deadline < now()
//   2. For each breached timer:
//      a. Create an ESCALATE ActionContract via action_service
//      b. Mark the timer as BREACHED so we don't alert twice
//
// WHO STARTS THIS?
// cmd/main.go calls slaWorker.Start(ctx) in a goroutine.

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/zord/zord-intelligence/internal/models"
	"github.com/zord/zord-intelligence/internal/services"
)

// SLATimer mirrors one row from the sla_timers table.
// We define it here locally — it is only used by this worker.
// (No need for a full repo file for SLA timers — the worker owns this table.)
type SLATimer struct {
	ID          int64
	IntentID    string
	TenantID    string
	CorridorID  string
	SLADeadline time.Time
	Status      string
	ResolvedAt  *time.Time
	NotifiedAt  *time.Time
	CreatedAt   time.Time
}

// SLAWorker checks SLA timers and creates breach actions.
type SLAWorker struct {
	pool          *pgxpool.Pool // direct DB access — no repo layer for this worker
	actionService *services.ActionService
}

// NewSLAWorker creates an SLAWorker.
// Takes the DB pool directly because SLA timer operations are simple
// and don't need the full persistence layer.
func NewSLAWorker(
	pool *pgxpool.Pool,
	actionService *services.ActionService,
) *SLAWorker {
	return &SLAWorker{
		pool:          pool,
		actionService: actionService,
	}
}

// Start runs the SLA check loop until ctx is cancelled.
// Call this in a goroutine from main.go:
//
//	go slaWorker.Start(ctx)
func (w *SLAWorker) Start(ctx context.Context) {
	ticker := time.NewTicker(5 * time.Minute)
	defer ticker.Stop()

	log.Println("sla_worker: started (interval=5m)")

	// Run once immediately on startup to catch any breaches from before restart
	w.runOnce(ctx)

	for {
		select {
		case <-ticker.C:
			w.runOnce(ctx)
		case <-ctx.Done():
			log.Println("sla_worker: shutting down")
			return
		}
	}
}

// runOnce finds all breached SLA timers and creates ESCALATE actions for them.
func (w *SLAWorker) runOnce(ctx context.Context) {
	// Step 1: Find all ACTIVE timers that have passed their deadline
	// AND have not been notified yet (notified_at IS NULL)
	breached, err := w.fetchBreachedTimers(ctx)
	if err != nil {
		log.Printf("sla_worker: fetch error: %v", err)
		return
	}

	if len(breached) == 0 {
		return // no breaches — nothing to do
	}

	log.Printf("sla_worker: found %d SLA breaches", len(breached))

	for _, timer := range breached {
		if err := w.handleBreach(ctx, timer); err != nil {
			log.Printf("sla_worker: breach handling error intent=%s: %v",
				timer.IntentID, err)
		}
	}
}

// fetchBreachedTimers queries the sla_timers table for active breached timers.
// "Breached" = status is ACTIVE AND deadline has passed AND not yet notified.
func (w *SLAWorker) fetchBreachedTimers(ctx context.Context) ([]SLATimer, error) {
	sql := `
		SELECT id, intent_id, tenant_id, corridor_id,
		       sla_deadline, status, resolved_at, notified_at, created_at
		FROM   sla_timers
		WHERE  status      = 'ACTIVE'
		  AND  sla_deadline < now()
		  AND  notified_at IS NULL
		ORDER  BY sla_deadline ASC
		LIMIT  100
	`
	rows, err := w.pool.Query(ctx, sql)
	if err != nil {
		return nil, fmt.Errorf("sla_worker.fetchBreached: %w", err)
	}
	defer rows.Close()

	var result []SLATimer
	for rows.Next() {
		var t SLATimer
		if err := rows.Scan(
			&t.ID, &t.IntentID, &t.TenantID, &t.CorridorID,
			&t.SLADeadline, &t.Status, &t.ResolvedAt, &t.NotifiedAt, &t.CreatedAt,
		); err != nil {
			return nil, fmt.Errorf("sla_worker.fetchBreached scan: %w", err)
		}
		result = append(result, t)
	}
	return result, nil
}

// handleBreach processes one breached SLA timer:
//  1. Creates an ESCALATE ActionContract
//  2. Marks the timer as BREACHED and sets notified_at
func (w *SLAWorker) handleBreach(ctx context.Context, timer SLATimer) error {
	// How late is this payout?
	overdueBy := time.Since(timer.SLADeadline).Round(time.Minute)

	// Build payload for the escalation
	payload, _ := json.Marshal(map[string]any{
		"intent_id":    timer.IntentID,
		"corridor_id":  timer.CorridorID,
		"sla_deadline": timer.SLADeadline.Format(time.RFC3339),
		"overdue_by":   overdueBy.String(), // e.g. "1h23m0s"
		"severity":     "HIGH",
		"message": fmt.Sprintf(
			"SLA breach: intent %s on corridor %s is %s overdue",
			timer.IntentID, timer.CorridorID, overdueBy,
		),
	})

	// Step 1: Create an ESCALATE ActionContract
	// TriggerEventID = "sla_breach_" + intentID makes the idempotency key unique per breach
	// This prevents creating duplicate ESCALATE actions if the worker runs twice
	if err := w.actionService.CreateAction(ctx, services.CreateActionRequest{
		TenantID:      timer.TenantID,
		PolicyID:      "P_SLA_BREACH", // built-in policy — always active
		PolicyVersion: 1,
		ScopeRefs: models.ScopeRefs{
			TenantID:   timer.TenantID,
			IntentID:   timer.IntentID,
			CorridorID: timer.CorridorID,
		},
		InputRefsJSON: fmt.Sprintf(
			`{"sla_deadline": "%s", "overdue_seconds": %d}`,
			timer.SLADeadline.Format(time.RFC3339),
			int(time.Since(timer.SLADeadline).Seconds()),
		),
		Decision:       models.DecisionEscalate,
		Confidence:     1.0, // SLA breach is a fact, not a prediction
		PayloadJSON:    string(payload),
		TriggerEventID: "sla_breach_" + timer.IntentID,
	}); err != nil {
		return fmt.Errorf("sla_worker: create action for intent %s: %w",
			timer.IntentID, err)
	}

	// Step 2: Mark timer as BREACHED and record when we notified
	// This prevents sending duplicate alerts for the same breach
	now := time.Now().UTC()
	sql := `
		UPDATE sla_timers
		SET    status      = 'BREACHED',
		       notified_at = $1
		WHERE  id          = $2
	`
	if _, err := w.pool.Exec(ctx, sql, now, timer.ID); err != nil {
		return fmt.Errorf("sla_worker: mark breached id=%d: %w", timer.ID, err)
	}

	log.Printf("sla_worker: breach handled intent=%s corridor=%s overdue=%s",
		timer.IntentID, timer.CorridorID, overdueBy)

	return nil
}

// SeedSLATimer creates a new SLA timer when an intent arrives.
// Called by projection_service.HandleIntentCreated to seed the timer.
//
// This is a package-level function (not a method) so projection_service
// can call it without depending on SLAWorker itself.
// Default SLA: 6 hours from intent creation time.
func SeedSLATimer(ctx context.Context, pool *pgxpool.Pool, e models.IntentCreatedEvent) error {
	const slaHours = 6
	deadline := e.CreatedAt.Add(slaHours * time.Hour)

	sql := `
		INSERT INTO sla_timers
			(intent_id, tenant_id, corridor_id, sla_deadline, status, created_at)
		VALUES
			($1, $2, $3, $4, 'ACTIVE', $5)
		ON CONFLICT (tenant_id, intent_id) DO NOTHING
	`
	// ON CONFLICT DO NOTHING = safe to call twice for same intent
	_, err := pool.Exec(ctx, sql,
		e.IntentID,
		e.TenantID,
		e.CorridorID,
		deadline,
		e.CreatedAt,
	)
	if err != nil {
		return fmt.Errorf("sla_worker.SeedTimer intent=%s: %w", e.IntentID, err)
	}
	return nil
}

// ResolveSLATimer marks a timer as RESOLVED when finality is reached.
// Called by projection_service.HandleFinalityCertIssued.
//
// Same pattern as SeedSLATimer — a package-level function so services
// can call it directly without coupling to the SLAWorker struct.
func ResolveSLATimer(ctx context.Context, pool *pgxpool.Pool, intentID, tenantID string) error {
	now := time.Now().UTC()
	sql := `
		UPDATE sla_timers
		SET    status      = 'RESOLVED',
		       resolved_at = $1
		WHERE  intent_id   = $2
		  AND  tenant_id   = $3
		  AND  status      = 'ACTIVE'
	`
	// WHERE status = 'ACTIVE' means we never overwrite a BREACHED timer
	// Once breached, it stays breached even if finality arrives late
	_, err := pool.Exec(ctx, sql, now, intentID, tenantID)
	if err != nil {
		return fmt.Errorf("sla_worker.ResolveTimer intent=%s: %w", intentID, err)
	}
	return nil
}
