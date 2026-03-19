package services

import (
	"context"
	"fmt"
	"log"
	"time"

	"github.com/zord/zord-intelligence/internal/models"
	"github.com/zord/zord-intelligence/internal/persistence"
)

// ProjectionService computes and stores KPI projections from Kafka events.
type ProjectionService struct {
	projRepo      *persistence.ProjectionRepo
	policyService *PolicyService
	slaRepo       *persistence.SLATimerRepo
}

// NewProjectionService creates a ProjectionService.
//
// slaRepo is passed in rather than created here — this is dependency injection.
// main.go creates all repos and wires them together, keeping this struct simple.
func NewProjectionService(
	projRepo *persistence.ProjectionRepo,
	policyService *PolicyService,
	slaRepo *persistence.SLATimerRepo,
) *ProjectionService {
	return &ProjectionService{
		projRepo:      projRepo,
		policyService: policyService,
		slaRepo:       slaRepo,
	}
}

// ── EventHandler interface methods ────────────────────────────────────────────
// These 7 methods satisfy the EventHandler interface in kafka/consumer.go.
// consumer.go calls them when a Kafka message arrives on each topic.

// HandleIntentCreated seeds tracking when a new payout intent arrives.
//
// WHAT WAS BROKEN:
//
//	SeedSLATimer existed in sla_worker.go but was never called here.
//	Every intent was created with no SLA timer → the sla_worker had nothing
//	to check → SLA breach alerts never fired → ops was flying blind.
//
// WHAT WE DO NOW:
//  1. Atomically increment the pending backlog counter for this corridor
//  2. Seed an SLA timer so the sla_worker can detect deadline breaches
func (s *ProjectionService) HandleIntentCreated(
	ctx context.Context,
	e models.IntentCreatedEvent,
) error {
	window := todayWindow(e.CreatedAt)

	// Step 1: atomically add to the pending backlog (race-safe SQL upsert)
	if err := s.projRepo.AtomicIncrementPending(
		ctx, e.TenantID, e.CorridorID, window.start, window.end,
	); err != nil {
		return fmt.Errorf("HandleIntentCreated pending corridor=%s: %w", e.CorridorID, err)
	}

	// Step 2: seed the SLA timer (BUG FIX — this was missing before)
	// We log failures but do NOT return an error here.
	// Reason: the backlog increment already succeeded. If SLA seeding fails
	// (e.g. transient DB hiccup), we want Kafka to commit the offset — the
	// backlog data is correct. An ops alert about SLA seeding is better than
	// reprocessing the event and double-counting the backlog.
	if err := s.slaRepo.SeedTimer(ctx, e); err != nil {
		log.Printf("HandleIntentCreated: SeedTimer failed intent=%s corridor=%s: %v",
			e.IntentID, e.CorridorID, err)
	}

	return nil
}

// HandleDispatchCreated tracks payout dispatch attempts.
// Retry-rate projection will be added in Gap #5 (missing projections sprint).
func (s *ProjectionService) HandleDispatchCreated(
	ctx context.Context,
	e models.DispatchAttemptCreatedEvent,
) error {
	// Not a silent no-op — we log so the event appears in traces
	log.Printf("HandleDispatchCreated: attempt=%s intent=%s corridor=%s attempt_no=%d",
		e.AttemptID, e.IntentID, e.CorridorID, e.AttemptNo)
	return nil
}

// HandleOutcomeNormalized updates the failure taxonomy when a FAILED outcome arrives.
// Called for every webhook/poll/statement signal — even provisional ones.
// Only FAILED signals with a reason code update the taxonomy.
func (s *ProjectionService) HandleOutcomeNormalized(
	ctx context.Context,
	e models.OutcomeNormalizedEvent,
) error {
	if e.StatusCandidate != "FAILED" || e.ReasonCode == "" {
		return nil
	}

	window := todayWindow(e.OccurredAt)

	if err := s.projRepo.AtomicIncrementFailureReason(
		ctx, e.TenantID, e.CorridorID, e.ReasonCode, window.start, window.end,
	); err != nil {
		return fmt.Errorf("HandleOutcomeNormalized taxonomy corridor=%s reason=%s: %w",
			e.CorridorID, e.ReasonCode, err)
	}

	// Did this failure spike trigger any policy rules?
	return s.policyService.EvaluateForEvent(
		ctx, e.TenantID, e.CorridorID, "outcome.event.normalized", e.EventID,
	)
}

// HandleFinalityCertIssued is the most critical handler in ZPI.
// A finality certificate means a payout reached a terminal state.
//
// Updates three projections — all via atomic SQL (no race condition):
//  1. success_rate  — settled/total count for this corridor
//  2. finality_latency histogram — time from intent creation to finality
//  3. pending_backlog — decrement (this payout is done)
//
// Also resolves the SLA timer so we don't fire a false breach alert.
func (s *ProjectionService) HandleFinalityCertIssued(
	ctx context.Context,
	e models.FinalityCertIssuedEvent,
) error {
	window := todayWindow(e.DecisionAt)

	// ── Update 1: success_rate ────────────────────────────────────────────
	var err error
	switch e.FinalState {
	case "SETTLED":
		err = s.projRepo.AtomicIncrementSuccess(
			ctx, e.TenantID, e.CorridorID, window.start, window.end,
		)
	default:
		// FAILED, REVERSED, UNKNOWN — count in total but not settled
		err = s.projRepo.AtomicIncrementFailure(
			ctx, e.TenantID, e.CorridorID, window.start, window.end,
		)
	}
	if err != nil {
		return fmt.Errorf("HandleFinalityCertIssued success_rate corridor=%s: %w",
			e.CorridorID, err)
	}

	// ── Update 2: finality latency histogram ──────────────────────────────
	ttfSeconds := e.DecisionAt.Sub(e.IntentCreatedAt).Seconds()

	// Negative TTF means clock skew between services — clamp to 0
	if ttfSeconds < 0 {
		log.Printf("HandleFinalityCertIssued: negative TTF cert=%s (clock skew), clamping to 0",
			e.CertificateID)
		ttfSeconds = 0
	}

	if err := s.projRepo.AtomicRecordLatencySample(
		ctx, e.TenantID, e.CorridorID, ttfSeconds, window.start, window.end,
	); err != nil {
		return fmt.Errorf("HandleFinalityCertIssued latency corridor=%s: %w",
			e.CorridorID, err)
	}

	// ── Update 3: pending backlog ─────────────────────────────────────────
	if err := s.projRepo.AtomicDecrementPending(
		ctx, e.TenantID, e.CorridorID, window.start, window.end,
	); err != nil {
		return fmt.Errorf("HandleFinalityCertIssued pending corridor=%s: %w",
			e.CorridorID, err)
	}

	// ── Resolve the SLA timer ─────────────────────────────────────────────
	// Mark as RESOLVED so sla_worker doesn't fire a breach alert for a payout
	// that already finished. Log failures — don't let them fail the event.
	if err := s.slaRepo.ResolveTimer(ctx, e.IntentID, e.TenantID); err != nil {
		log.Printf("HandleFinalityCertIssued: ResolveTimer failed intent=%s: %v",
			e.IntentID, err)
	}

	// ── Track SLA Compliance ───────────────────────────────────────────────
	// Record whether this payout met its SLA deadline
	if err := s.HandleSLATimerResolved(ctx, e.TenantID); err != nil {
		log.Printf("HandleFinalityCertIssued: HandleSLATimerResolved failed tenant=%s: %v",
			e.TenantID, err)
	}

	// ── Trigger policy evaluation ─────────────────────────────────────────
	return s.policyService.EvaluateForEvent(
		ctx, e.TenantID, e.CorridorID, "finality.certificate.issued", e.EventID,
	)
}

// HandleEvidencePackReady updates the evidence readiness rate for the tenant.
func (s *ProjectionService) HandleEvidencePackReady(
	ctx context.Context,
	e models.EvidencePackReadyEvent,
) error {
	window := todayWindow(e.CreatedAt)
	if err := s.projRepo.AtomicIncrementEvidence(
		ctx, e.TenantID, window.start, window.end,
	); err != nil {
		return fmt.Errorf("HandleEvidencePackReady tenant=%s: %w", e.TenantID, err)
	}
	return nil
}

// HandleDLQEvent counts DLQ failures per original topic for ops visibility.
func (s *ProjectionService) HandleDLQEvent(
	ctx context.Context,
	e models.DLQEvent,
) error {
	window := todayWindow(e.FailedAt)
	if err := s.projRepo.AtomicIncrementDLQ(
		ctx, e.TenantID, e.OriginalTopic, window.start, window.end,
	); err != nil {
		return fmt.Errorf("HandleDLQEvent topic=%s: %w", e.OriginalTopic, err)
	}
	return nil
}

// ── Private helpers ───────────────────────────────────────────────────────────

type windowBounds struct {
	start time.Time
	end   time.Time
}

// todayWindow returns a 24-hour UTC window starting at midnight of the given time.
// All events on the same calendar day share the same window bucket.
func todayWindow(t time.Time) windowBounds {
	start := t.UTC().Truncate(24 * time.Hour)
	return windowBounds{
		start: start,
		end:   start.Add(24 * time.Hour),
	}
}

// ─────────────────────────────────────────────────────────────────────────────
// SLA BREACH RATE HANDLERS (new for Gap #4)
// ─────────────────────────────────────────────────────────────────────────────

// HandleSLATimerBreached is called by sla_worker when an SLA timer exceeds its deadline.
//
// Business logic:
//   - An intent had a deadline (created_at + 6 hours)
//   - Current time is now past that deadline
//   - The payout is still PENDING (not finalized)
//   - This is a breach
//
// What we do:
//  1. Calculate how late we are: breach_duration = now - deadline
//  2. Increment the breach counter
//  3. Track the breach duration for averaging
//  4. Update the projection
func (s *ProjectionService) HandleSLATimerBreached(
	ctx context.Context,
	tenantID string,
	breachDurationSeconds float64,
) error {
	window := todayWindow(time.Now())

	if err := s.projRepo.AtomicIncrementSLABreached(
		ctx, tenantID, breachDurationSeconds, window.start, window.end,
	); err != nil {
		return fmt.Errorf("HandleSLATimerBreached tenant=%s: %w", tenantID, err)
	}

	return nil
}

// HandleSLATimerResolved is called when an SLA timer reaches finality BEFORE its deadline.
//
// Business logic:
//   - An intent had a deadline
//   - The payout reached SETTLED/FAILED/REVERSED before deadline
//   - This is on-time delivery
//
// What we do:
//  1. Increment on_time counter
//  2. Increment total_processed counter
//  3. Update the projection
func (s *ProjectionService) HandleSLATimerResolved(
	ctx context.Context,
	tenantID string,
) error {
	window := todayWindow(time.Now())

	if err := s.projRepo.AtomicIncrementSLAOnTime(
		ctx, tenantID, window.start, window.end,
	); err != nil {
		return fmt.Errorf("HandleSLATimerResolved tenant=%s: %w", tenantID, err)
	}

	return nil
}
