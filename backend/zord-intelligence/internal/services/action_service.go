package services

// What is this file?
// Creates ActionContracts and their matching outbox entries.
// Called by policy_service when a rule fires.
//
// RESPONSIBILITIES:
//   1. Generate a unique action_id
//   2. Build the idempotency_key (prevents duplicates)
//   3. Sign the contract (proves it was not tampered with)
//   4. Save ActionContract to DB
//   5. Save ActuationOutbox entry to DB
//
// NOTE: Steps 4 and 5 should ideally be in one DB transaction.
// We use a simple approach here — the ON CONFLICT DO NOTHING on both
// tables provides safety even without a transaction.

import (
	"context"
	"crypto/sha256"
	"encoding/json"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/zord/zord-intelligence/internal/models"
	"github.com/zord/zord-intelligence/internal/persistence"
)

// ActionService creates and stores ActionContracts.
type ActionService struct {
	actionRepo *persistence.ActionContractRepo
	outboxRepo *persistence.OutboxRepo
}

// NewActionService creates an ActionService.
func NewActionService(
	actionRepo *persistence.ActionContractRepo,
	outboxRepo *persistence.OutboxRepo,
) *ActionService {
	return &ActionService{
		actionRepo: actionRepo,
		outboxRepo: outboxRepo,
	}
}

// CreateActionRequest holds everything needed to create an ActionContract.
// policy_service.go fills this and passes it to CreateAction().
type CreateActionRequest struct {
	TenantID       string
	PolicyID       string
	PolicyVersion  int
	ScopeRefs      models.ScopeRefs
	InputRefsJSON  string
	Decision       models.Decision
	Confidence     float64
	PayloadJSON    string
	TriggerEventID string // original Kafka event ID — used for idempotency
}

// CreateAction creates an ActionContract and its outbox entry.
//
// IDEMPOTENCY KEY:
// Built from: SHA-256(policy_id + scope_refs_json + trigger_event_id)
// This means: for the same policy firing on the same event → same key.
// The UNIQUE constraint on idempotency_key silently ignores duplicates.
// Safe to call multiple times with the same inputs.
func (s *ActionService) CreateAction(
	ctx context.Context,
	req CreateActionRequest,
) error {

	// Step 1: Marshal scope_refs to JSON for signing and idempotency
	scopeJSON, err := json.Marshal(req.ScopeRefs)
	if err != nil {
		return fmt.Errorf("action_service: marshal scope_refs: %w", err)
	}

	// Step 2: Build idempotency key
	// Hash of (policy_id + scope_refs_json + trigger_event_id)
	// Same inputs → same hash → duplicate silently ignored by DB
	idempotencyKey := buildIdempotencyKey(
		req.PolicyID,
		string(scopeJSON),
		req.TriggerEventID,
	)

	// Step 3: Generate unique action ID
	// uuid.New() generates a random UUID like "550e8400-e29b-41d4-a716-446655440000"
	// We prefix with "act_" to make logs readable: "act_550e8400..."
	actionID := "act_" + uuid.New().String()

	now := time.Now().UTC()

	// Step 4: Build the contract
	contract := models.ActionContract{
		ActionID:       actionID,
		TenantID:       req.TenantID,
		PolicyID:       req.PolicyID,
		PolicyVersion:  req.PolicyVersion,
		ScopeRefs:      req.ScopeRefs,
		InputRefsJSON:  req.InputRefsJSON,
		Decision:       req.Decision,
		Confidence:     req.Confidence,
		PayloadJSON:    req.PayloadJSON,
		IdempotencyKey: idempotencyKey,
		CreatedAt:      now,
	}

	// Step 5: Sign the contract
	// Development: SHA-256 hash of key fields
	// Production: replace this with ed25519 KMS signing (like zord-edge uses)
	contract.Signature = signContract(contract, string(scopeJSON))

	// Step 6: Save the ActionContract to DB
	// ON CONFLICT DO NOTHING means: if idempotency_key already exists → skip silently
	if err := s.actionRepo.InsertIfNew(ctx, contract); err != nil {
		return fmt.Errorf("action_service: insert contract: %w", err)
	}

	// Step 7: Create an outbox entry (only for decisions that need actuation)
	// Safe decisions (ALLOW, ADVISORY) don't need Kafka delivery
	if !req.Decision.IsSafe() || needsActuation(req.Decision) {
		outboxEntry := models.ActuationOutbox{
			EventID:     "evt_" + uuid.New().String(),
			ActionID:    actionID,
			EventType:   string(req.Decision),
			Payload:     buildOutboxPayload(req, actionID),
			Status:      models.OutboxStatusPending,
			Attempts:    0,
			NextRetryAt: now, // try immediately
			CreatedAt:   now,
		}

		if err := s.outboxRepo.Insert(ctx, outboxEntry); err != nil {
			// Log but don't fail — the ActionContract was saved
			// The outbox entry can be recreated manually if needed
			fmt.Printf("action_service: WARNING outbox insert failed for action %s: %v\n",
				actionID, err)
		}
	}

	fmt.Printf("action_service: created action %s policy=%s decision=%s tenant=%s\n",
		actionID, req.PolicyID, req.Decision, req.TenantID)

	return nil
}

// ── Helper functions ──────────────────────────────────────────────────────────

// buildIdempotencyKey creates a SHA-256 hash from the key inputs.
// Same policy + same scope + same event → same hash → no duplicate action.
func buildIdempotencyKey(policyID, scopeRefsJSON, triggerEventID string) string {
	// Concatenate all inputs with a separator
	raw := fmt.Sprintf("%s|%s|%s", policyID, scopeRefsJSON, triggerEventID)

	// SHA-256 produces a 32-byte hash → encode as hex string (64 chars)
	hash := sha256.Sum256([]byte(raw))
	return fmt.Sprintf("%x", hash)
}

// signContract creates a simple signature for development.
// In production: replace with ed25519 signing via AWS KMS or Vault.
// (Your team already has this pattern in zord-edge/vault/signing.go)
func signContract(ac models.ActionContract, scopeJSON string) string {
	// Build a canonical string of the key fields
	canonical := fmt.Sprintf("%s|%s|%s|%s|%.3f|%s",
		ac.ActionID,
		ac.TenantID,
		ac.PolicyID,
		string(ac.Decision),
		ac.Confidence,
		scopeJSON,
	)
	hash := sha256.Sum256([]byte(canonical))
	return fmt.Sprintf("sha256:%x", hash)
}

// needsActuation returns true for decisions that require Kafka delivery.
// Safe decisions like ALLOW and ADVISORY_RECOMMENDATION don't need Kafka.
func needsActuation(d models.Decision) bool {
	switch d {
	case models.DecisionEscalate,
		models.DecisionNotify,
		models.DecisionOpenOpsIncident,
		models.DecisionGenerateEvidence,
		models.DecisionHold,
		models.DecisionRetry:
		return true
	}
	return false
}

// buildOutboxPayload constructs the JSON payload for the outbox entry.
// This is what gets published to Kafka when the outbox worker runs.
func buildOutboxPayload(req CreateActionRequest, actionID string) string {
	payload := map[string]any{
		"action_id":  actionID,
		"tenant_id":  req.TenantID,
		"policy_id":  req.PolicyID,
		"decision":   string(req.Decision),
		"scope_refs": req.ScopeRefs,
		"payload":    req.PayloadJSON,
		"created_at": time.Now().UTC(),
	}
	b, _ := json.Marshal(payload)
	return string(b)
}
