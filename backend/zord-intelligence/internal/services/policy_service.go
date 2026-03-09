package services

// What is this file?
// The policy service evaluates rules against current KPI projection values.
// When a rule's conditions are met, it asks action_service to create an ActionContract.
//
// HOW POLICY EVALUATION WORKS:
//   1. An event arrives (e.g. finality.certificate.issued)
//   2. projection_service calls EvaluateForEvent(tenantID, corridorID, topic, eventID)
//   3. We fetch all enabled policies whose trigger_value = topic
//   4. For each policy, we read the relevant projection from DB
//   5. We evaluate the DSL condition against that projection value
//   6. If condition is true → call action_service.CreateAction()

import (
	"context"
	"encoding/json"
	"fmt"
	"strings"

	"github.com/zord/zord-intelligence/internal/models"
	"github.com/zord/zord-intelligence/internal/persistence"
)

// PolicyService evaluates policies and triggers actions.
type PolicyService struct {
	policyRepo    *persistence.PolicyRepo
	projRepo      *persistence.ProjectionRepo
	actionService *ActionService
}

// NewPolicyService creates a PolicyService.
// Note: actionService is passed in — circular dependency avoided by
// main.go creating all three services and wiring them after creation.
func NewPolicyService(
	policyRepo *persistence.PolicyRepo,
	projRepo *persistence.ProjectionRepo,
	actionService *ActionService,
) *PolicyService {
	return &PolicyService{
		policyRepo:    policyRepo,
		projRepo:      projRepo,
		actionService: actionService,
	}
}

// EvaluateForEvent is called by projection_service after every KPI update.
// It finds all enabled policies for the given topic and evaluates each one.
//
// PARAMETERS:
//
//	tenantID   → which tenant's data to check
//	corridorID → which corridor (e.g. "razorpay_UPI") — used to build projection keys
//	topic      → Kafka topic that triggered this (used to look up matching policies)
//	eventID    → original event ID — used in the idempotency key
func (s *PolicyService) EvaluateForEvent(
	ctx context.Context,
	tenantID, corridorID, topic, eventID string,
) error {
	// Step 1: Get all enabled policies for this topic
	policies, err := s.policyRepo.GetByTrigger(ctx, "event", topic)
	if err != nil {
		return fmt.Errorf("policy_service.EvaluateForEvent get policies: %w", err)
	}

	// No enabled policies for this topic — nothing to do
	if len(policies) == 0 {
		return nil
	}

	// Step 2: Evaluate each policy
	for _, policy := range policies {
		// Skip if this policy is locked to a different tenant
		if policy.TenantID != "" && policy.TenantID != tenantID {
			continue
		}

		if err := s.evaluateOne(ctx, policy, tenantID, corridorID, eventID); err != nil {
			// Log the error but continue evaluating other policies
			// One policy failing should not block the others
			fmt.Printf("policy_service: error evaluating policy %s: %v\n",
				policy.PolicyID, err)
		}
	}
	return nil
}

// EvaluateForCron is called by the cron worker (future session) for time-based policies.
// Works the same way as EvaluateForEvent but triggered by a timer, not an event.
func (s *PolicyService) EvaluateForCron(
	ctx context.Context,
	tenantID, corridorID string,
) error {
	policies, err := s.policyRepo.GetByTrigger(ctx, "cron", "*/5 * * * *")
	if err != nil {
		return err
	}
	for _, policy := range policies {
		if err := s.evaluateOne(ctx, policy, tenantID, corridorID, "cron"); err != nil {
			fmt.Printf("policy_service: cron error for policy %s: %v\n",
				policy.PolicyID, err)
		}
	}
	return nil
}

// evaluateOne evaluates a single policy against current projection data.
// This is where the actual rule checking happens.
func (s *PolicyService) evaluateOne(
	ctx context.Context,
	policy models.Policy,
	tenantID, corridorID, triggerEventID string,
) error {

	// Step 1: Build the evaluation context
	// Read all projection values this policy might need
	evalCtx, err := s.buildEvalContext(ctx, tenantID, corridorID)
	if err != nil {
		return err
	}

	// Step 2: Parse and evaluate the DSL
	// Returns: (should fire?, decision, confidence, payload)
	fires, decision, confidence, payload := evaluateDSL(policy.DSL, evalCtx)

	if !fires {
		return nil // condition not met — no action needed
	}

	// Step 3: Policy fired! Create an ActionContract
	scopeRefs := models.ScopeRefs{
		TenantID:   tenantID,
		CorridorID: corridorID,
	}

	// inputRefsJSON records WHAT ZPI looked at when making this decision
	// This is the "explainability" — ops can see exactly why ZPI acted
	inputRefs, _ := json.Marshal(evalCtx)

	return s.actionService.CreateAction(ctx, CreateActionRequest{
		TenantID:       tenantID,
		PolicyID:       policy.PolicyID,
		PolicyVersion:  policy.Version,
		ScopeRefs:      scopeRefs,
		InputRefsJSON:  string(inputRefs),
		Decision:       decision,
		Confidence:     confidence,
		PayloadJSON:    payload,
		TriggerEventID: triggerEventID,
	})
}

// buildEvalContext reads current projection values for a tenant+corridor.
// Returns a map that the DSL evaluator can query by key.
//
// Example output:
//
//	{
//	  "corridor.success_rate": 0.82,
//	  "corridor.finality_p95_seconds": 25200,
//	  "corridor.total_pending": 450,
//	  "tenant.evidence_readiness_rate": 0.75
//	}
func (s *PolicyService) buildEvalContext(
	ctx context.Context,
	tenantID, corridorID string,
) (map[string]float64, error) {
	ctx_map := make(map[string]float64)

	// Read success rate
	var successVal models.SuccessRateValue
	if err := s.projRepo.GetValueAs(ctx, tenantID,
		fmt.Sprintf("corridor.success_rate.%s", corridorID), &successVal); err != nil {
		return nil, err
	}
	ctx_map["corridor.success_rate"] = successVal.Rate
	ctx_map["corridor.total_count"] = float64(successVal.TotalCount)

	// Read finality latency
	var latencyVal models.FinalityLatencyValue
	if err := s.projRepo.GetValueAs(ctx, tenantID,
		fmt.Sprintf("corridor.finality_latency.%s", corridorID), &latencyVal); err != nil {
		return nil, err
	}
	ctx_map["corridor.finality_p50_seconds"] = latencyVal.P50Seconds
	ctx_map["corridor.finality_p95_seconds"] = latencyVal.P95Seconds

	// Read pending backlog
	var pendingVal models.PendingBacklogValue
	if err := s.projRepo.GetValueAs(ctx, tenantID,
		fmt.Sprintf("corridor.pending_backlog.%s", corridorID), &pendingVal); err != nil {
		return nil, err
	}
	ctx_map["corridor.total_pending"] = float64(pendingVal.TotalPending)
	ctx_map["corridor.pending_6h_plus"] = float64(pendingVal.Bucket6hPlus)

	// Read evidence readiness
	var evidenceVal models.EvidenceReadinessValue
	if err := s.projRepo.GetValueAs(ctx, tenantID,
		"tenant.evidence_readiness", &evidenceVal); err != nil {
		return nil, err
	}
	ctx_map["tenant.evidence_readiness_rate"] = evidenceVal.Rate

	return ctx_map, nil
}

// ── DSL Evaluator ─────────────────────────────────────────────────────────────
// Parses and evaluates the policy DSL stored in policy_registry.dsl
//
// DSL FORMAT:
//   WHEN <metric> <operator> <threshold>
//   THEN ACTION <decision> severity=<level>
//
// EXAMPLE:
//   WHEN corridor.success_rate < 0.90
//   THEN ACTION ESCALATE severity=HIGH
//
// This is a simple evaluator — it handles one WHEN condition and one THEN action.
// Production: would support AND/OR, multiple conditions, etc.

// evaluateDSL parses the policy DSL and evaluates it against the eval context.
// Returns: (fires bool, decision Decision, confidence float64, payloadJSON string)
func evaluateDSL(
	dsl string,
	evalCtx map[string]float64,
) (bool, models.Decision, float64, string) {

	lines := strings.Split(strings.TrimSpace(dsl), "\n")

	var whenLine, thenLine string
	for _, line := range lines {
		line = strings.TrimSpace(line)
		if strings.HasPrefix(line, "WHEN") {
			whenLine = line
		}
		if strings.HasPrefix(line, "THEN") {
			thenLine = line
		}
	}

	if whenLine == "" || thenLine == "" {
		// Malformed DSL — skip this policy
		return false, "", 0, ""
	}

	// ── Parse WHEN clause ─────────────────────────────────────────────────
	// Format: WHEN <metric> <operator> <threshold>
	// Example: WHEN corridor.success_rate < 0.90
	whenParts := strings.Fields(whenLine) // splits by whitespace
	if len(whenParts) < 4 {
		return false, "", 0, ""
	}

	metric := whenParts[1]   // e.g. "corridor.success_rate"
	operator := whenParts[2] // e.g. "<"
	var threshold float64
	fmt.Sscanf(whenParts[3], "%f", &threshold) // parse "0.90" → 0.90

	// Get the current value from projection context
	currentVal, exists := evalCtx[metric]
	if !exists {
		// No data for this metric yet — policy cannot fire
		return false, "", 0, ""
	}

	// Evaluate the condition
	conditionMet := false
	switch operator {
	case "<":
		conditionMet = currentVal < threshold
	case ">":
		conditionMet = currentVal > threshold
	case "<=":
		conditionMet = currentVal <= threshold
	case ">=":
		conditionMet = currentVal >= threshold
	case "==":
		conditionMet = currentVal == threshold
	}

	if !conditionMet {
		return false, "", 0, ""
	}

	// ── Parse THEN clause ─────────────────────────────────────────────────
	// Format: THEN ACTION <decision> severity=<level>
	// Example: THEN ACTION ESCALATE severity=HIGH
	thenParts := strings.Fields(thenLine)
	if len(thenParts) < 3 {
		return false, "", 0, ""
	}

	decision := models.Decision(thenParts[2]) // e.g. "ESCALATE"

	// Extract severity if present (severity=HIGH)
	severity := "MEDIUM"
	for _, part := range thenParts[3:] {
		if strings.HasPrefix(part, "severity=") {
			severity = strings.TrimPrefix(part, "severity=")
		}
	}

	// Build the payload JSON for the actuator
	payload, _ := json.Marshal(map[string]any{
		"metric":    metric,
		"value":     currentVal,
		"threshold": threshold,
		"operator":  operator,
		"severity":  severity,
		"message":   fmt.Sprintf("%s is %.4f (threshold %s %.4f)", metric, currentVal, operator, threshold),
	})

	// Confidence: how far past the threshold are we?
	// Far past threshold → high confidence this is real, not noise
	confidence := computeConfidence(currentVal, threshold, operator)

	return true, decision, confidence, string(payload)
}

// computeConfidence returns a 0.0-1.0 confidence score.
// The further the current value is from the threshold, the higher the confidence.
func computeConfidence(current, threshold float64, operator string) float64 {
	if threshold == 0 {
		return 0.75 // default
	}
	// How far past the threshold as a percentage of the threshold value
	var deviation float64
	switch operator {
	case "<", "<=":
		deviation = (threshold - current) / threshold
	case ">", ">=":
		deviation = (current - threshold) / threshold
	default:
		return 0.75
	}

	// Scale to 0.5 - 1.0 range
	// Small deviation (just crossed threshold) → 0.5 confidence
	// Large deviation (way past threshold) → 1.0 confidence
	confidence := 0.5 + (deviation * 0.5)
	if confidence > 1.0 {
		confidence = 1.0
	}
	if confidence < 0.5 {
		confidence = 0.5
	}
	return confidence
}
