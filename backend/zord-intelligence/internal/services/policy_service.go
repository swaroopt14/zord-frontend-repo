package services

// ============================================================
// policy_service.go
// ============================================================
//
// Evaluates policy rules against current KPI projection values.
// When a rule's conditions are met, calls action_service.CreateAction().
//
// GAP #2 CHANGE — Structured logging:
// ─────────────────────────────────────
// BEFORE:
//   fmt.Printf("policy_service: error evaluating policy %s: %v\n", ...)
//   fmt.Printf("policy_service: cron error for policy %s: %v\n", ...)
//
// AFTER:
//   logger.Error("policy evaluation failed",
//       "policy_id", policy.PolicyID,
//       "error", err,
//   )
//
// The difference matters in production:
//   fmt.Printf → plain text on stdout, invisible to monitoring
//   logger.Error → JSON with level=ERROR, Datadog alerts trigger

import (
	"context"
	"encoding/json"
	"fmt"
	"strings"

	"github.com/zord/zord-intelligence/internal/logger"
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
// Finds all enabled policies for the given topic and evaluates each one.
func (s *PolicyService) EvaluateForEvent(
	ctx context.Context,
	tenantID, corridorID, topic, eventID string,
) error {
	policies, err := s.policyRepo.GetByTrigger(ctx, "event", topic)
	if err != nil {
		return fmt.Errorf("policy_service.EvaluateForEvent get policies: %w", err)
	}

	if len(policies) == 0 {
		return nil
	}

	for _, policy := range policies {
		if policy.TenantID != "" && policy.TenantID != tenantID {
			continue
		}

		if err := s.evaluateOne(ctx, policy, tenantID, corridorID, eventID); err != nil {
			// GAP #2 FIX: was fmt.Printf — now logger.Error with structured fields
			//
			// BEFORE: fmt.Printf("policy_service: error evaluating policy %s: %v\n", policy.PolicyID, err)
			//   → stdout, no level, no timestamp, Datadog cannot find this
			//
			// AFTER: logger.Error with key-value pairs
			//   → JSON: {"level":"ERROR","msg":"policy evaluation failed","policy_id":"P_SLA","error":"..."}
			//   → Datadog alert fires when ERROR count exceeds threshold
			//
			// We log and continue — one policy failing must not block others.
			// Example: P_FAILURE_BURST has a bad DSL but P_SLA_BREACH should still run.
			logger.Error("policy evaluation failed",
				"policy_id", policy.PolicyID,
				"tenant_id", tenantID,
				"corridor_id", corridorID,
				"topic", topic,
				"error", err,
			)
		}
	}
	return nil
}

// EvaluateForCron is called by the cron worker for time-based policies.
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
			// GAP #2 FIX: was fmt.Printf — now logger.Error
			logger.Error("cron policy evaluation failed",
				"policy_id", policy.PolicyID,
				"tenant_id", tenantID,
				"corridor_id", corridorID,
				"error", err,
			)
		}
	}
	return nil
}

// evaluateOne evaluates a single policy against current projection data.
func (s *PolicyService) evaluateOne(
	ctx context.Context,
	policy models.Policy,
	tenantID, corridorID, triggerEventID string,
) error {
	evalCtx, err := s.buildEvalContext(ctx, tenantID, corridorID)
	if err != nil {
		return err
	}

	fires, decision, confidence, payload := evaluateDSL(policy.DSL, evalCtx)

	if !fires {
		return nil
	}

	// Policy fired — log it so ops can see which rules are triggering
	logger.Info("policy fired",
		"policy_id", policy.PolicyID,
		"policy_version", policy.Version,
		"decision", string(decision),
		"confidence", confidence,
		"tenant_id", tenantID,
		"corridor_id", corridorID,
	)

	scopeRefs := models.ScopeRefs{
		TenantID:   tenantID,
		CorridorID: corridorID,
	}

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
// Returns a map the DSL evaluator queries by key name.
func (s *PolicyService) buildEvalContext(
	ctx context.Context,
	tenantID, corridorID string,
) (map[string]float64, error) {
	ctx_map := make(map[string]float64)

	var successVal models.SuccessRateValue
	if err := s.projRepo.GetValueAs(ctx, tenantID,
		fmt.Sprintf("corridor.success_rate.%s", corridorID), &successVal); err != nil {
		return nil, err
	}
	ctx_map["corridor.success_rate"] = successVal.Rate
	ctx_map["corridor.total_count"] = float64(successVal.TotalCount)

	var latencyVal models.FinalityLatencyValue
	if err := s.projRepo.GetValueAs(ctx, tenantID,
		fmt.Sprintf("corridor.finality_latency.%s", corridorID), &latencyVal); err != nil {
		return nil, err
	}
	ctx_map["corridor.finality_p50_seconds"] = latencyVal.P50Seconds
	ctx_map["corridor.finality_p95_seconds"] = latencyVal.P95Seconds

	var pendingVal models.PendingBacklogValue
	if err := s.projRepo.GetValueAs(ctx, tenantID,
		fmt.Sprintf("corridor.pending_backlog.%s", corridorID), &pendingVal); err != nil {
		return nil, err
	}
	ctx_map["corridor.total_pending"] = float64(pendingVal.TotalPending)
	ctx_map["corridor.pending_6h_plus"] = float64(pendingVal.Bucket6hPlus)

	var evidenceVal models.EvidenceReadinessValue
	if err := s.projRepo.GetValueAs(ctx, tenantID,
		"tenant.evidence_readiness", &evidenceVal); err != nil {
		return nil, err
	}
	ctx_map["tenant.evidence_readiness_rate"] = evidenceVal.Rate

	return ctx_map, nil
}

// evaluateDSL parses and evaluates the policy DSL.
// DSL format:
//
//	WHEN <metric> <operator> <threshold>
//	THEN ACTION <decision> severity=<level>
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
		return false, "", 0, ""
	}

	whenParts := strings.Fields(whenLine)
	if len(whenParts) < 4 {
		return false, "", 0, ""
	}

	metric := whenParts[1]
	operator := whenParts[2]
	var threshold float64
	fmt.Sscanf(whenParts[3], "%f", &threshold)

	currentVal, exists := evalCtx[metric]
	if !exists {
		return false, "", 0, ""
	}

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

	thenParts := strings.Fields(thenLine)
	if len(thenParts) < 3 {
		return false, "", 0, ""
	}

	decision := models.Decision(thenParts[2])

	severity := "MEDIUM"
	for _, part := range thenParts[3:] {
		if strings.HasPrefix(part, "severity=") {
			severity = strings.TrimPrefix(part, "severity=")
		}
	}

	payload, _ := json.Marshal(map[string]any{
		"metric":    metric,
		"value":     currentVal,
		"threshold": threshold,
		"operator":  operator,
		"severity":  severity,
		"message":   fmt.Sprintf("%s is %.4f (threshold %s %.4f)", metric, currentVal, operator, threshold),
	})

	confidence := computeConfidence(currentVal, threshold, operator)

	return true, decision, confidence, string(payload)
}

// computeConfidence returns 0.5–1.0 based on how far past the threshold we are.
func computeConfidence(current, threshold float64, operator string) float64 {
	if threshold == 0 {
		return 0.75
	}
	var deviation float64
	switch operator {
	case "<", "<=":
		deviation = (threshold - current) / threshold
	case ">", ">=":
		deviation = (current - threshold) / threshold
	default:
		return 0.75
	}

	confidence := 0.5 + (deviation * 0.5)
	if confidence > 1.0 {
		confidence = 1.0
	}
	if confidence < 0.5 {
		confidence = 0.5
	}
	return confidence
}
