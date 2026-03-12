package persistence

// What is this file?
// Reads and writes the policy_registry table.
//
// WHO READS FROM THIS FILE?
//   policy_service.go → GetByTrigger() to find policies to evaluate on each event
//
// WHO WRITES TO THIS FILE?
//   policy_handler.go → Insert(), SetEnabled() when ops team manages policies via API

import (
	"context"
	"fmt"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/zord/zord-intelligence/internal/models"
)

type PolicyRepo struct {
	pool *pgxpool.Pool
}

func NewPolicyRepo(pool *pgxpool.Pool) *PolicyRepo {
	return &PolicyRepo{pool: pool}
}

// GetByTrigger returns all ENABLED policies for a given trigger type and value.
// This is the most important query in ZPI — called on every Kafka event.
//
// EXAMPLE:
//
//	When a "final.contract.updated" event arrives:
//	policies := policyRepo.GetByTrigger(ctx, "event", "final.contract.updated")
//	→ returns [P_SLA_BREACH_RISK, P_FAILURE_BURST, P_DUPLICATE_RISK]
//	→ policy_service evaluates each one
//
// The WHERE enabled = true means disabled policies are completely skipped.
func (r *PolicyRepo) GetByTrigger(ctx context.Context, triggerType, triggerValue string) ([]models.Policy, error) {
	sql := `
		SELECT policy_id, version, scope_type, trigger_type, trigger_value,
		       dsl, enabled, COALESCE(tenant_id, ''), created_at, updated_at
		FROM   policy_registry
		WHERE  trigger_type  = $1
		  AND  trigger_value = $2
		  AND  enabled       = true
		ORDER  BY policy_id
	`
	// COALESCE(tenant_id, '') converts NULL to empty string
	// because Go strings cannot be NULL — only pointers can be nil

	rows, err := r.pool.Query(ctx, sql, triggerType, triggerValue)
	if err != nil {
		return nil, fmt.Errorf("policy_repo.GetByTrigger: %w", err)
	}
	defer rows.Close()

	var result []models.Policy
	for rows.Next() {
		var p models.Policy
		if err := rows.Scan(
			&p.PolicyID, &p.Version, &p.ScopeType,
			&p.TriggerType, &p.TriggerValue, &p.DSL,
			&p.Enabled, &p.TenantID,
			&p.CreatedAt, &p.UpdatedAt,
		); err != nil {
			return nil, fmt.Errorf("policy_repo.GetByTrigger scan: %w", err)
		}
		result = append(result, p)
	}
	return result, nil
}

// GetByID returns one policy by its ID.
// Used by policy_handler.go to show policy details in the UI.
func (r *PolicyRepo) GetByID(ctx context.Context, policyID string) (*models.Policy, error) {
	sql := `
		SELECT policy_id, version, scope_type, trigger_type, trigger_value,
		       dsl, enabled, COALESCE(tenant_id, ''), created_at, updated_at
		FROM   policy_registry
		WHERE  policy_id = $1
	`
	row := r.pool.QueryRow(ctx, sql, policyID)

	var p models.Policy
	err := row.Scan(
		&p.PolicyID, &p.Version, &p.ScopeType,
		&p.TriggerType, &p.TriggerValue, &p.DSL,
		&p.Enabled, &p.TenantID,
		&p.CreatedAt, &p.UpdatedAt,
	)
	if err != nil {
		if err.Error() == "no rows in result set" {
			return nil, nil // not found is not an error
		}
		return nil, fmt.Errorf("policy_repo.GetByID id=%s: %w", policyID, err)
	}
	return &p, nil
}

// ListAll returns every policy. Used by policy_handler.go for the policy list page.
func (r *PolicyRepo) ListAll(ctx context.Context) ([]models.Policy, error) {
	sql := `
		SELECT policy_id, version, scope_type, trigger_type, trigger_value,
		       dsl, enabled, COALESCE(tenant_id, ''), created_at, updated_at
		FROM   policy_registry
		ORDER  BY policy_id
	`
	rows, err := r.pool.Query(ctx, sql)
	if err != nil {
		return nil, fmt.Errorf("policy_repo.ListAll: %w", err)
	}
	defer rows.Close()

	var result []models.Policy
	for rows.Next() {
		var p models.Policy
		if err := rows.Scan(
			&p.PolicyID, &p.Version, &p.ScopeType,
			&p.TriggerType, &p.TriggerValue, &p.DSL,
			&p.Enabled, &p.TenantID,
			&p.CreatedAt, &p.UpdatedAt,
		); err != nil {
			return nil, fmt.Errorf("policy_repo.ListAll scan: %w", err)
		}
		result = append(result, p)
	}
	return result, nil
}

// Insert saves a new policy.
// Called by policy_handler.go when ops team creates a policy via API.
// New policies start DISABLED — must be explicitly enabled.
func (r *PolicyRepo) Insert(ctx context.Context, p models.Policy) error {
	sql := `
		INSERT INTO policy_registry
			(policy_id, version, scope_type, trigger_type, trigger_value,
			 dsl, enabled, tenant_id, created_at, updated_at)
		VALUES
			($1, $2, $3, $4, $5, $6, false, NULLIF($7, ''), $8, $9)
	`
	// NULLIF($7, '') converts empty string back to NULL for tenant_id
	// This is the reverse of COALESCE used in SELECT queries

	now := time.Now().UTC()
	_, err := r.pool.Exec(ctx, sql,
		p.PolicyID, p.Version, p.ScopeType,
		p.TriggerType, p.TriggerValue, p.DSL,
		p.TenantID, now, now,
	)
	if err != nil {
		return fmt.Errorf("policy_repo.Insert id=%s: %w", p.PolicyID, err)
	}
	return nil
}

// SetEnabled enables or disables a policy by ID.
// Called by policy_handler.go for the enable/disable API endpoints.
func (r *PolicyRepo) SetEnabled(ctx context.Context, policyID string, enabled bool) error {
	sql := `
		UPDATE policy_registry
		SET    enabled    = $1,
		       updated_at = $2
		WHERE  policy_id  = $3
	`
	result, err := r.pool.Exec(ctx, sql, enabled, time.Now().UTC(), policyID)
	if err != nil {
		return fmt.Errorf("policy_repo.SetEnabled id=%s: %w", policyID, err)
	}
	// RowsAffected() tells us how many rows were updated
	// If 0, the policy_id was not found
	if result.RowsAffected() == 0 {
		return fmt.Errorf("policy_repo.SetEnabled: policy %s not found", policyID)
	}
	return nil
}
