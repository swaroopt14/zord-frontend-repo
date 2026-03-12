package services

// What is this file?
// The projection service receives Kafka events and updates KPI numbers.
// It implements the EventHandler interface that kafka/consumer.go requires.
//
// EVERY METHOD HERE FOLLOWS THIS PATTERN:
//   1. Receive a typed event struct from the Kafka consumer
//   2. Compute what changed (new rate, new count, new latency etc.)
//   3. Save updated projection to DB via projectionRepo
//   4. Ask policyService: "did this change trigger any rules?"

import (
	"context"
	"encoding/json"
	"fmt"
	"math"
	"sort"
	"time"

	"github.com/zord/zord-intelligence/internal/models"
	"github.com/zord/zord-intelligence/internal/persistence"
)

// ProjectionService computes and stores KPI projections from Kafka events.
// It also calls PolicyService after each update to check if rules fired.
type ProjectionService struct {
	projRepo      *persistence.ProjectionRepo
	policyService *PolicyService // called after every projection update
}

// NewProjectionService creates a ProjectionService with its dependencies.
// Called once in main.go.
//
// NOTE: policyService is passed in — this is dependency injection.
// ProjectionService does not create PolicyService itself.
// main.go creates both and wires them together.
func NewProjectionService(
	projRepo *persistence.ProjectionRepo,
	policyService *PolicyService,
) *ProjectionService {
	return &ProjectionService{
		projRepo:      projRepo,
		policyService: policyService,
	}
}

// ── EventHandler interface methods ───────────────────────────────────────────
// These 7 methods satisfy the EventHandler interface in kafka/consumer.go
// That is why consumer.go can call handler.HandleFinalityCertIssued(...)
// without knowing what ProjectionService is.

// HandleIntentCreated seeds tracking when a new payout intent arrives.
// Actions:
//   - Increment pending backlog count for this corridor
//   - SLA timer is created separately by sla_worker (not here)
func (s *ProjectionService) HandleIntentCreated(
	ctx context.Context,
	e models.IntentCreatedEvent,
) error {
	key := fmt.Sprintf("corridor.pending_backlog.%s", e.CorridorID)
	window := todayWindow(e.CreatedAt)

	// Read current value, increment, save back
	var val models.PendingBacklogValue
	if err := s.projRepo.GetValueAs(ctx, e.TenantID, key, &val); err != nil {
		return err
	}
	val.TotalPending++
	val.Bucket0to10m++ // new intent starts in 0-10m bucket
	val.UpdatedAt = time.Now().UTC()

	return s.projRepo.UpsertWithValue(ctx, e.TenantID, key,
		window.start, window.end, val)
}

// HandleDispatchCreated tracks payout attempt counts per corridor.
func (s *ProjectionService) HandleDispatchCreated(
	ctx context.Context,
	e models.DispatchAttemptCreatedEvent,
) error {
	// For now we just log the attempt.
	// In a later step we will track retry_rate projections here.
	return nil
}

// HandleOutcomeNormalized updates failure taxonomy for a corridor.
// Called for every webhook/poll/statement outcome — even provisional ones.
func (s *ProjectionService) HandleOutcomeNormalized(
	ctx context.Context,
	e models.OutcomeNormalizedEvent,
) error {
	// Only track FAILED outcomes in taxonomy
	if e.StatusCandidate != "FAILED" || e.ReasonCode == "" {
		return nil
	}

	key := fmt.Sprintf("corridor.failure_taxonomy.%s", e.CorridorID)
	window := todayWindow(e.OccurredAt)

	var val models.FailureTaxonomyValue
	if err := s.projRepo.GetValueAs(ctx, e.TenantID, key, &val); err != nil {
		return err
	}

	// Build a map of reason → count
	// We store it locally to compute then re-save as TopReasons
	reasonCounts := make(map[string]int)
	for _, r := range val.TopReasons {
		reasonCounts[r.ReasonCode] = r.Count
	}
	reasonCounts[e.ReasonCode]++
	val.TotalFails++

	// Recompute top 5 reasons sorted by count
	val.TopReasons = topKReasons(reasonCounts, val.TotalFails, 5)
	val.UpdatedAt = time.Now().UTC()

	if err := s.projRepo.UpsertWithValue(ctx, e.TenantID, key,
		window.start, window.end, val); err != nil {
		return err
	}

	// Ask policy service: did this failure spike trigger any rules?
	return s.policyService.EvaluateForEvent(ctx, e.TenantID,
		e.CorridorID, "outcome.event.normalized", e.EventID)
}

// HandleFinalityCertIssued is the most important handler.
// A finality certificate means a payout reached a terminal state.
// This updates success_rate and time_to_finality projections.
func (s *ProjectionService) HandleFinalityCertIssued(
	ctx context.Context,
	e models.FinalityCertIssuedEvent,
) error {
	window := todayWindow(e.DecisionAt)

	// ── Update 1: success_rate for this corridor ──────────────────────────
	successKey := fmt.Sprintf("corridor.success_rate.%s", e.CorridorID)
	var successVal models.SuccessRateValue
	if err := s.projRepo.GetValueAs(ctx, e.TenantID, successKey, &successVal); err != nil {
		return err
	}
	successVal.TotalCount++
	if e.FinalState == "SETTLED" {
		successVal.SettledCount++
	}
	if successVal.TotalCount > 0 {
		successVal.Rate = float64(successVal.SettledCount) / float64(successVal.TotalCount)
	}
	successVal.UpdatedAt = time.Now().UTC()

	if err := s.projRepo.UpsertWithValue(ctx, e.TenantID, successKey,
		window.start, window.end, successVal); err != nil {
		return err
	}

	// ── Update 2: time_to_finality p50/p95 for this corridor ─────────────
	latencyKey := fmt.Sprintf("corridor.finality_latency.%s", e.CorridorID)

	// time_to_finality = when finality happened - when intent was created
	// This tells us: "how long did this payout take end to end?"
	ttfSeconds := e.DecisionAt.Sub(e.IntentCreatedAt).Seconds()

	var latencyVal models.FinalityLatencyValue
	if err := s.projRepo.GetValueAs(ctx, e.TenantID, latencyKey, &latencyVal); err != nil {
		return err
	}

	// We need raw samples to compute percentiles.
	// Read existing samples from a separate storage key.
	samplesKey := fmt.Sprintf("corridor.finality_samples.%s", e.CorridorID)
	var samples []float64
	if err := s.projRepo.GetValueAs(ctx, e.TenantID, samplesKey, &samples); err != nil {
		return err
	}
	samples = append(samples, ttfSeconds)

	// Cap at 10,000 samples to prevent unbounded growth
	if len(samples) > 10000 {
		samples = samples[len(samples)-10000:]
	}

	// Compute p50 and p95
	latencyVal.P50Seconds, latencyVal.P95Seconds = computePercentiles(samples)
	latencyVal.Count = len(samples)
	latencyVal.UpdatedAt = time.Now().UTC()

	// Save both the computed values and the raw samples
	if err := s.projRepo.UpsertWithValue(ctx, e.TenantID, latencyKey,
		window.start, window.end, latencyVal); err != nil {
		return err
	}
	if err := s.projRepo.UpsertWithValue(ctx, e.TenantID, samplesKey,
		window.start, window.end, samples); err != nil {
		return err
	}

	// ── Update 3: decrement pending backlog (this payout is now done) ─────
	pendingKey := fmt.Sprintf("corridor.pending_backlog.%s", e.CorridorID)
	var pendingVal models.PendingBacklogValue
	if err := s.projRepo.GetValueAs(ctx, e.TenantID, pendingKey, &pendingVal); err != nil {
		return err
	}
	if pendingVal.TotalPending > 0 {
		pendingVal.TotalPending--
	}
	pendingVal.UpdatedAt = time.Now().UTC()

	if err := s.projRepo.UpsertWithValue(ctx, e.TenantID, pendingKey,
		window.start, window.end, pendingVal); err != nil {
		return err
	}

	// ── Trigger policy evaluation ─────────────────────────────────────────
	// After updating projections, ask: did any policy rule just trigger?
	return s.policyService.EvaluateForEvent(ctx, e.TenantID,
		e.CorridorID, "finality.certificate.issued", e.EventID)
}

// HandleFinalContractUpdated triggers policy evaluation.
// This is the main trigger for contract-scoped policies.
func (s *ProjectionService) HandleFinalContractUpdated(
	ctx context.Context,
	e models.FinalContractUpdatedEvent,
) error {
	return s.policyService.EvaluateForEvent(ctx, e.TenantID,
		e.CorridorID, "final.contract.updated", e.EventID)
}

// HandleEvidencePackReady updates evidence readiness rate for the tenant.
func (s *ProjectionService) HandleEvidencePackReady(
	ctx context.Context,
	e models.EvidencePackReadyEvent,
) error {
	key := "tenant.evidence_readiness"
	window := todayWindow(e.CreatedAt)

	var val models.EvidenceReadinessValue
	if err := s.projRepo.GetValueAs(ctx, e.TenantID, key, &val); err != nil {
		return err
	}

	val.WithEvidence++
	val.TotalSettled++
	if val.TotalSettled > 0 {
		val.Rate = float64(val.WithEvidence) / float64(val.TotalSettled)
	}
	val.UpdatedAt = time.Now().UTC()

	return s.projRepo.UpsertWithValue(ctx, e.TenantID, key,
		window.start, window.end, val)
}

// HandleDLQEvent logs DLQ failures for ops visibility.
// Future: cluster by reason code and suggest remediation.
func (s *ProjectionService) HandleDLQEvent(
	ctx context.Context,
	e models.DLQEvent,
) error {
	// For now just track count per topic
	key := fmt.Sprintf("dlq.count.%s", e.OriginalTopic)
	window := todayWindow(e.FailedAt)

	// Simple counter stored as JSON: {"count": 42}
	var val struct {
		Count     int       `json:"count"`
		UpdatedAt time.Time `json:"updated_at"`
	}
	if err := s.projRepo.GetValueAs(ctx, e.TenantID, key, &val); err != nil {
		return err
	}
	val.Count++
	val.UpdatedAt = time.Now().UTC()

	return s.projRepo.UpsertWithValue(ctx, e.TenantID, key,
		window.start, window.end, val)
}

// ── Helper functions ──────────────────────────────────────────────────────────
// These are private (lowercase) — only usable inside this package.

// windowBounds holds a start and end time for a projection window.
type windowBounds struct {
	start time.Time
	end   time.Time
}

// todayWindow returns a 24-hour window starting at midnight of the given time.
// All projections within the same calendar day share the same window.
// e.g. any event on 2024-01-15 → window_start=2024-01-15 00:00, window_end=2024-01-16 00:00
func todayWindow(t time.Time) windowBounds {
	start := t.UTC().Truncate(24 * time.Hour) // midnight UTC
	return windowBounds{
		start: start,
		end:   start.Add(24 * time.Hour),
	}
}

// computePercentiles calculates p50 (median) and p95 from a sorted list of samples.
// Used for time_to_finality projections.
func computePercentiles(samples []float64) (p50, p95 float64) {
	if len(samples) == 0 {
		return 0, 0
	}
	sorted := make([]float64, len(samples))
	copy(sorted, samples)
	sort.Float64s(sorted) // sort ascending

	p50 = percentileAt(sorted, 0.50)
	p95 = percentileAt(sorted, 0.95)
	return
}

// percentileAt returns the value at a given percentile using linear interpolation.
// e.g. percentileAt(sorted, 0.95) = "95% of payouts finished faster than this many seconds"
func percentileAt(sorted []float64, p float64) float64 {
	n := float64(len(sorted))
	idx := p * (n - 1)            // position in array (can be fractional)
	lower := int(math.Floor(idx)) // floor index
	upper := int(math.Ceil(idx))  // ceil index
	if lower == upper {
		return sorted[lower]
	}
	// Linear interpolation between the two nearest values
	frac := idx - float64(lower)
	return sorted[lower] + frac*(sorted[upper]-sorted[lower])
}

// topKReasons returns the top k failure reasons sorted by count descending.
func topKReasons(counts map[string]int, total, k int) []models.ReasonCount {
	// Convert map to slice so we can sort it
	// In Go, maps have no guaranteed order — you must sort explicitly
	type pair struct {
		code  string
		count int
	}
	var pairs []pair
	for code, count := range counts {
		pairs = append(pairs, pair{code, count})
	}
	// Sort descending by count
	sort.Slice(pairs, func(i, j int) bool {
		return pairs[i].count > pairs[j].count
	})

	var result []models.ReasonCount
	for i, p := range pairs {
		if i >= k {
			break
		}
		rate := 0.0
		if total > 0 {
			rate = float64(p.count) / float64(total)
		}
		result = append(result, models.ReasonCount{
			ReasonCode: p.code,
			Count:      p.count,
			Rate:       rate,
		})
	}
	return result
}

// getValueAsJSON is a local helper to unmarshal arbitrary JSON into a target.
// Used when we need to read raw JSON not covered by the typed value models.
func getValueAsJSON(jsonStr string, dest any) error {
	if jsonStr == "" {
		return nil
	}
	return json.Unmarshal([]byte(jsonStr), dest)
}
