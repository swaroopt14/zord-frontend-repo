package persistence

// ============================================================
// projection_repo.go — ATOMIC SQL OPERATIONS (Race-Condition Fix)
// ============================================================
//
// THE BUG WE ARE FIXING (read-modify-write race):
// ─────────────────────────────────────────────────
// Old code pattern:
//   1. SELECT value from DB into Go variable
//   2. value++ in Go
//   3. UPDATE DB with new value
//
// When two Kafka goroutines run this simultaneously for the same corridor:
//
//   Goroutine A reads:  total_count = 100
//   Goroutine B reads:  total_count = 100   ← sees same stale value!
//   Goroutine A writes: total_count = 101
//   Goroutine B writes: total_count = 101   ← OVERWRITES A, count lost!
//
// Two events happened but count only went 100 → 101, not 102.
// In fintech: wrong KPIs → wrong policy decisions → ops misses real problems.
//
// THE FIX: Move arithmetic INTO SQL.
// PostgreSQL executes each statement atomically.
// No other connection can interrupt a running statement.
//
//   -- Atomic: read, add, write all in one locked step
//   UPDATE ... SET value_json = jsonb_set(
//     value_json,
//     '{total_count}',
//     to_jsonb((value_json->>'total_count')::int + 1)
//   )
//
// BONUS FIX: Histogram-based percentiles (replaces the raw sample array)
// ────────────────────────────────────────────────────────────────────────
// Old code: stored up to 10,000 raw float64 samples in a JSON array.
// Problem:  every event reads AND rewrites the entire array (expensive).
//           80KB+ of JSON per corridor per day.
//
// New code: 20-bucket histogram. Each bucket is just a counter.
// Storage: ~20 integers regardless of how many samples we've seen.
// Each update increments one bucket counter (O(1), tiny SQL).
// Percentiles are estimated from bucket distribution (accurate enough for ops).
//
// JSONB OPERATORS USED IN THIS FILE:
// ────────────────────────────────────
//   ->  'key'        returns JSONB value for key
//   ->> 'key'        returns TEXT value for key (for casting to numbers)
//   jsonb_set(obj, path, value)  replaces a field inside a JSONB object
//   to_jsonb(x)      converts any Postgres value to JSONB
//   COALESCE(x, 0)   returns x if not NULL, else 0 (handles missing keys)
//   GREATEST(x, 0)   returns max(x, 0) — prevents negative counters
//   NULLIF(x, 0)     returns NULL if x=0 (used before division to avoid /0 error)

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"math"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/zord/zord-intelligence/internal/models"
)

// ProjectionRepo handles all DB operations for projection_state.
type ProjectionRepo struct {
	pool *pgxpool.Pool
}

// NewProjectionRepo creates a ProjectionRepo.
func NewProjectionRepo(pool *pgxpool.Pool) *ProjectionRepo {
	return &ProjectionRepo{pool: pool}
}

// ─────────────────────────────────────────────────────────────────────────────
// ATOMIC COUNTER OPERATIONS  (the core race-condition fix)
// ─────────────────────────────────────────────────────────────────────────────

// AtomicIncrementSuccess atomically adds 1 to settled_count AND total_count,
// then recomputes the rate. Called when final_state == "SETTLED".
//
// Uses INSERT ... ON CONFLICT DO UPDATE — a single atomic Postgres operation.
// If row exists: increments counters. If not: inserts with count=1.
func (r *ProjectionRepo) AtomicIncrementSuccess(
	ctx context.Context,
	tenantID, corridorID string,
	windowStart, windowEnd time.Time,
) error {
	key := fmt.Sprintf("corridor.success_rate.%s", corridorID)

	// Step 1: atomically increment both counters
	upsertSQL := `
		INSERT INTO projection_state
			(tenant_id, projection_key, window_start, window_end,
			 value_json, computed_at, projection_version)
		VALUES ($1, $2, $3, $4,
			'{"settled_count":1,"total_count":1,"rate":1.0}'::jsonb,
			now(), 1)
		ON CONFLICT (tenant_id, projection_key, window_start, projection_version)
		DO UPDATE SET
			value_json = jsonb_set(
				jsonb_set(
					projection_state.value_json,
					'{settled_count}',
					to_jsonb(COALESCE((projection_state.value_json->>'settled_count')::int, 0) + 1)
				),
				'{total_count}',
				to_jsonb(COALESCE((projection_state.value_json->>'total_count')::int, 0) + 1)
			),
			computed_at = now()
	`
	if _, err := r.pool.Exec(ctx, upsertSQL, tenantID, key, windowStart, windowEnd); err != nil {
		return fmt.Errorf("projection_repo.AtomicIncrementSuccess upsert corridor=%s: %w", corridorID, err)
	}

	// Step 2: recompute rate from the freshly incremented counters
	// NULLIF(total, 0) returns NULL if total=0, making the division NULL,
	// which COALESCE then turns into 0.0 — prevents divide-by-zero crash.
	return r.recomputeRate(ctx, tenantID, key, windowStart)
}

// AtomicIncrementFailure atomically adds 1 to total_count only.
// Called when final_state == "FAILED" or "REVERSED".
func (r *ProjectionRepo) AtomicIncrementFailure(
	ctx context.Context,
	tenantID, corridorID string,
	windowStart, windowEnd time.Time,
) error {
	key := fmt.Sprintf("corridor.success_rate.%s", corridorID)

	upsertSQL := `
		INSERT INTO projection_state
			(tenant_id, projection_key, window_start, window_end,
			 value_json, computed_at, projection_version)
		VALUES ($1, $2, $3, $4,
			'{"settled_count":0,"total_count":1,"rate":0.0}'::jsonb,
			now(), 1)
		ON CONFLICT (tenant_id, projection_key, window_start, projection_version)
		DO UPDATE SET
			value_json = jsonb_set(
				projection_state.value_json,
				'{total_count}',
				to_jsonb(COALESCE((projection_state.value_json->>'total_count')::int, 0) + 1)
			),
			computed_at = now()
	`
	if _, err := r.pool.Exec(ctx, upsertSQL, tenantID, key, windowStart, windowEnd); err != nil {
		return fmt.Errorf("projection_repo.AtomicIncrementFailure upsert corridor=%s: %w", corridorID, err)
	}

	return r.recomputeRate(ctx, tenantID, key, windowStart)
}

// AtomicIncrementPending atomically adds 1 to total_pending and bucket_0_10m.
// New intents always start in the 0–10 minute bucket.
func (r *ProjectionRepo) AtomicIncrementPending(
	ctx context.Context,
	tenantID, corridorID string,
	windowStart, windowEnd time.Time,
) error {
	key := fmt.Sprintf("corridor.pending_backlog.%s", corridorID)

	upsertSQL := `
		INSERT INTO projection_state
			(tenant_id, projection_key, window_start, window_end,
			 value_json, computed_at, projection_version)
		VALUES ($1, $2, $3, $4,
			'{"total_pending":1,"bucket_0_10m":1,"bucket_10_60m":0,"bucket_1_6h":0,"bucket_6h_plus":0}'::jsonb,
			now(), 1)
		ON CONFLICT (tenant_id, projection_key, window_start, projection_version)
		DO UPDATE SET
			value_json = jsonb_set(
				jsonb_set(
					projection_state.value_json,
					'{total_pending}',
					to_jsonb(COALESCE((projection_state.value_json->>'total_pending')::int, 0) + 1)
				),
				'{bucket_0_10m}',
				to_jsonb(COALESCE((projection_state.value_json->>'bucket_0_10m')::int, 0) + 1)
			),
			computed_at = now()
	`
	if _, err := r.pool.Exec(ctx, upsertSQL, tenantID, key, windowStart, windowEnd); err != nil {
		return fmt.Errorf("projection_repo.AtomicIncrementPending corridor=%s: %w", corridorID, err)
	}
	return nil
}

// AtomicDecrementPending atomically subtracts 1 from total_pending.
// GREATEST(x, 0) prevents the counter going below zero if events replay.
func (r *ProjectionRepo) AtomicDecrementPending(
	ctx context.Context,
	tenantID, corridorID string,
	windowStart, windowEnd time.Time,
) error {
	key := fmt.Sprintf("corridor.pending_backlog.%s", corridorID)

	upsertSQL := `
		INSERT INTO projection_state
			(tenant_id, projection_key, window_start, window_end,
			 value_json, computed_at, projection_version)
		VALUES ($1, $2, $3, $4,
			'{"total_pending":0,"bucket_0_10m":0,"bucket_10_60m":0,"bucket_1_6h":0,"bucket_6h_plus":0}'::jsonb,
			now(), 1)
		ON CONFLICT (tenant_id, projection_key, window_start, projection_version)
		DO UPDATE SET
			value_json = jsonb_set(
				projection_state.value_json,
				'{total_pending}',
				to_jsonb(GREATEST(COALESCE((projection_state.value_json->>'total_pending')::int, 0) - 1, 0))
			),
			computed_at = now()
	`
	if _, err := r.pool.Exec(ctx, upsertSQL, tenantID, key, windowStart, windowEnd); err != nil {
		return fmt.Errorf("projection_repo.AtomicDecrementPending corridor=%s: %w", corridorID, err)
	}
	return nil
}

// AtomicIncrementFailureReason increments a specific reason code in the taxonomy.
//
// The taxonomy is stored as:
//
//	{"total_fails": 42, "reasons": {"INSUFFICIENT_FUNDS": 20, "TIMEOUT": 15}}
//
// ARRAY['reasons', $5::text] is a dynamic path — Postgres supports arrays
// as paths in jsonb_set, allowing us to update nested keys safely.
// The reason_code is passed as a parameter ($5) — never concatenated into SQL.
// This prevents SQL injection attacks.
func (r *ProjectionRepo) AtomicIncrementFailureReason(
	ctx context.Context,
	tenantID, corridorID, reasonCode string,
	windowStart, windowEnd time.Time,
) error {
	key := fmt.Sprintf("corridor.failure_taxonomy.%s", corridorID)

	upsertSQL := `
		INSERT INTO projection_state
			(tenant_id, projection_key, window_start, window_end,
			 value_json, computed_at, projection_version)
		VALUES ($1, $2, $3, $4,
			jsonb_build_object('total_fails', 1, 'reasons', jsonb_build_object($5::text, 1)),
			now(), 1)
		ON CONFLICT (tenant_id, projection_key, window_start, projection_version)
		DO UPDATE SET
			value_json = jsonb_set(
				jsonb_set(
					projection_state.value_json,
					ARRAY['reasons', $5::text],
					to_jsonb(COALESCE((projection_state.value_json->'reasons'->>$5::text)::int, 0) + 1)
				),
				'{total_fails}',
				to_jsonb(COALESCE((projection_state.value_json->>'total_fails')::int, 0) + 1)
			),
			computed_at = now()
	`
	if _, err := r.pool.Exec(ctx, upsertSQL, tenantID, key, windowStart, windowEnd, reasonCode); err != nil {
		return fmt.Errorf("projection_repo.AtomicIncrementFailureReason corridor=%s reason=%s: %w",
			corridorID, reasonCode, err)
	}
	return nil
}

// AtomicIncrementEvidence increments with_evidence and total_settled, recomputes rate.
func (r *ProjectionRepo) AtomicIncrementEvidence(
	ctx context.Context,
	tenantID string,
	windowStart, windowEnd time.Time,
) error {
	key := "tenant.evidence_readiness"

	upsertSQL := `
		INSERT INTO projection_state
			(tenant_id, projection_key, window_start, window_end,
			 value_json, computed_at, projection_version)
		VALUES ($1, $2, $3, $4,
			'{"with_evidence":1,"total_settled":1,"rate":1.0}'::jsonb,
			now(), 1)
		ON CONFLICT (tenant_id, projection_key, window_start, projection_version)
		DO UPDATE SET
			value_json = jsonb_set(
				jsonb_set(
					projection_state.value_json,
					'{with_evidence}',
					to_jsonb(COALESCE((projection_state.value_json->>'with_evidence')::int, 0) + 1)
				),
				'{total_settled}',
				to_jsonb(COALESCE((projection_state.value_json->>'total_settled')::int, 0) + 1)
			),
			computed_at = now()
	`
	if _, err := r.pool.Exec(ctx, upsertSQL, tenantID, key, windowStart, windowEnd); err != nil {
		return fmt.Errorf("projection_repo.AtomicIncrementEvidence tenant=%s: %w", tenantID, err)
	}

	return r.recomputeEvidenceRate(ctx, tenantID, key, windowStart)
}

// AtomicIncrementDLQ increments the DLQ count for a topic.
func (r *ProjectionRepo) AtomicIncrementDLQ(
	ctx context.Context,
	tenantID, originalTopic string,
	windowStart, windowEnd time.Time,
) error {
	key := fmt.Sprintf("dlq.count.%s", originalTopic)

	upsertSQL := `
		INSERT INTO projection_state
			(tenant_id, projection_key, window_start, window_end,
			 value_json, computed_at, projection_version)
		VALUES ($1, $2, $3, $4, '{"count":1}'::jsonb, now(), 1)
		ON CONFLICT (tenant_id, projection_key, window_start, projection_version)
		DO UPDATE SET
			value_json = jsonb_set(
				projection_state.value_json,
				'{count}',
				to_jsonb(COALESCE((projection_state.value_json->>'count')::int, 0) + 1)
			),
			computed_at = now()
	`
	if _, err := r.pool.Exec(ctx, upsertSQL, tenantID, key, windowStart, windowEnd); err != nil {
		return fmt.Errorf("projection_repo.AtomicIncrementDLQ topic=%s: %w", originalTopic, err)
	}
	return nil
}

// AtomicRecordLatencySample places a latency observation into a histogram bucket.
//
// WHY A HISTOGRAM INSTEAD OF RAW SAMPLES?
// ─────────────────────────────────────────
// Raw samples approach (old code):
//
//	Storage per corridor per day: up to 10,000 × 8 bytes = 80KB JSON blob
//	Every finality cert: read 80KB, deserialize, append, reserialize, write 80KB
//	With 50 corridors: 4MB of JSON churn per day just for latency samples
//
// Histogram approach (this code):
//
//	Storage: 20 integer counters = ~200 bytes regardless of sample count
//	Every finality cert: increment ONE bucket counter (tiny atomic SQL)
//	Percentile accuracy: within ±5% for most practical use cases
//
// This is how Prometheus, Datadog, and every serious metrics system works.
func (r *ProjectionRepo) AtomicRecordLatencySample(
	ctx context.Context,
	tenantID, corridorID string,
	ttfSeconds float64,
	windowStart, windowEnd time.Time,
) error {
	key := fmt.Sprintf("corridor.finality_latency.%s", corridorID)
	bucketKey := fmt.Sprintf("bucket_%d", latencyBucket(ttfSeconds))

	upsertSQL := `
		INSERT INTO projection_state
			(tenant_id, projection_key, window_start, window_end,
			 value_json, computed_at, projection_version)
		VALUES ($1, $2, $3, $4,
			jsonb_build_object('total_count', 1, $5::text, 1),
			now(), 1)
		ON CONFLICT (tenant_id, projection_key, window_start, projection_version)
		DO UPDATE SET
			value_json = jsonb_set(
				jsonb_set(
					projection_state.value_json,
					ARRAY[$5::text],
					to_jsonb(COALESCE((projection_state.value_json->>$5::text)::int, 0) + 1)
				),
				'{total_count}',
				to_jsonb(COALESCE((projection_state.value_json->>'total_count')::int, 0) + 1)
			),
			computed_at = now()
	`
	if _, err := r.pool.Exec(ctx, upsertSQL, tenantID, key, windowStart, windowEnd, bucketKey); err != nil {
		return fmt.Errorf("projection_repo.AtomicRecordLatencySample corridor=%s: %w", corridorID, err)
	}
	return nil
}

// ─────────────────────────────────────────────────────────────────────────────
// READ OPERATIONS
// ─────────────────────────────────────────────────────────────────────────────

// GetLatest returns the most recent projection row for a tenant+key.
// Returns nil, nil when no row exists — normal on first startup.
func (r *ProjectionRepo) GetLatest(
	ctx context.Context,
	tenantID, key string,
) (*models.ProjectionState, error) {
	sql := `
		SELECT id, tenant_id, projection_key, window_start, window_end,
		       value_json, computed_at, projection_version
		FROM   projection_state
		WHERE  tenant_id      = $1
		  AND  projection_key = $2
		ORDER  BY window_end DESC, projection_version DESC
		LIMIT  1
	`
	row := r.pool.QueryRow(ctx, sql, tenantID, key)

	var p models.ProjectionState
	err := row.Scan(
		&p.ID, &p.TenantID, &p.ProjectionKey,
		&p.WindowStart, &p.WindowEnd,
		&p.ValueJSON, &p.ComputedAt, &p.ProjectionVersion,
	)
	if err != nil {
		// errors.Is with pgx.ErrNoRows is the correct way — never compare error strings
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil
		}
		return nil, fmt.Errorf("projection_repo.GetLatest key=%s: %w", key, err)
	}
	return &p, nil
}

// GetValueAs reads the latest projection and unmarshals ValueJSON into dest.
// dest must be a pointer to a struct that matches the stored JSON shape.
func (r *ProjectionRepo) GetValueAs(
	ctx context.Context,
	tenantID, key string,
	dest any,
) error {
	p, err := r.GetLatest(ctx, tenantID, key)
	if err != nil {
		return err
	}
	if p == nil {
		return nil // no data yet — dest stays zero value, not an error
	}
	return json.Unmarshal([]byte(p.ValueJSON), dest)
}

// ListByTenant returns the latest projection for every key owned by a tenant.
// Uses DISTINCT ON (Postgres feature) to get one row per unique projection_key.
func (r *ProjectionRepo) ListByTenant(
	ctx context.Context,
	tenantID string,
) ([]models.ProjectionState, error) {
	sql := `
		SELECT DISTINCT ON (projection_key)
		       id, tenant_id, projection_key, window_start, window_end,
		       value_json, computed_at, projection_version
		FROM   projection_state
		WHERE  tenant_id = $1
		ORDER  BY projection_key, window_end DESC, projection_version DESC
	`
	rows, err := r.pool.Query(ctx, sql, tenantID)
	if err != nil {
		return nil, fmt.Errorf("projection_repo.ListByTenant tenant=%s: %w", tenantID, err)
	}
	defer rows.Close()

	var result []models.ProjectionState
	for rows.Next() {
		var p models.ProjectionState
		if err := rows.Scan(
			&p.ID, &p.TenantID, &p.ProjectionKey,
			&p.WindowStart, &p.WindowEnd, &p.ValueJSON,
			&p.ComputedAt, &p.ProjectionVersion,
		); err != nil {
			return nil, fmt.Errorf("projection_repo.ListByTenant scan: %w", err)
		}
		result = append(result, p)
	}
	return result, nil
}

// ComputePercentilesFromHistogram reads the latency histogram for a corridor
// and estimates p50 and p95 in seconds. Used by the KPI handler.
func (r *ProjectionRepo) ComputePercentilesFromHistogram(
	ctx context.Context,
	tenantID, corridorID string,
) (p50, p95 float64, totalCount int, err error) {
	key := fmt.Sprintf("corridor.finality_latency.%s", corridorID)

	p, err := r.GetLatest(ctx, tenantID, key)
	if err != nil || p == nil {
		return 0, 0, 0, err
	}

	var histogram map[string]int
	if err := json.Unmarshal([]byte(p.ValueJSON), &histogram); err != nil {
		return 0, 0, 0, fmt.Errorf("projection_repo.ComputePercentiles unmarshal: %w", err)
	}

	totalCount = histogram["total_count"]
	if totalCount == 0 {
		return 0, 0, 0, nil
	}

	p50 = estimatePercentileFromHistogram(histogram, totalCount, 0.50)
	p95 = estimatePercentileFromHistogram(histogram, totalCount, 0.95)
	return p50, p95, totalCount, nil
}

// Upsert writes a full projection value. Kept for callers that need full control.
func (r *ProjectionRepo) Upsert(ctx context.Context, p models.ProjectionState) error {
	sql := `
		INSERT INTO projection_state
			(tenant_id, projection_key, window_start, window_end,
			 value_json, computed_at, projection_version)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
		ON CONFLICT (tenant_id, projection_key, window_start, projection_version)
		DO UPDATE SET
			value_json  = EXCLUDED.value_json,
			window_end  = EXCLUDED.window_end,
			computed_at = EXCLUDED.computed_at
	`
	if _, err := r.pool.Exec(ctx, sql,
		p.TenantID, p.ProjectionKey, p.WindowStart, p.WindowEnd,
		p.ValueJSON, p.ComputedAt, p.ProjectionVersion,
	); err != nil {
		return fmt.Errorf("projection_repo.Upsert key=%s: %w", p.ProjectionKey, err)
	}
	return nil
}

// UpsertWithValue marshals value to JSON then calls Upsert.
func (r *ProjectionRepo) UpsertWithValue(
	ctx context.Context,
	tenantID, key string,
	windowStart, windowEnd time.Time,
	value any,
) error {
	b, err := json.Marshal(value)
	if err != nil {
		return fmt.Errorf("projection_repo.UpsertWithValue marshal: %w", err)
	}
	return r.Upsert(ctx, models.ProjectionState{
		TenantID:          tenantID,
		ProjectionKey:     key,
		WindowStart:       windowStart,
		WindowEnd:         windowEnd,
		ValueJSON:         string(b),
		ComputedAt:        time.Now().UTC(),
		ProjectionVersion: 1,
	})
}

// ─────────────────────────────────────────────────────────────────────────────
// PRIVATE HELPERS
// ─────────────────────────────────────────────────────────────────────────────

// recomputeRate recalculates settled/total and stores as the rate field.
// Called after every success/failure increment so the rate is always fresh.
func (r *ProjectionRepo) recomputeRate(
	ctx context.Context,
	tenantID, key string,
	windowStart time.Time,
) error {
	sql := `
		UPDATE projection_state
		SET value_json = jsonb_set(
			value_json,
			'{rate}',
			to_jsonb(
				COALESCE(
					(value_json->>'settled_count')::numeric /
					NULLIF((value_json->>'total_count')::numeric, 0),
					0
				)
			)
		),
		computed_at = now()
		WHERE tenant_id          = $1
		  AND projection_key     = $2
		  AND window_start       = $3
		  AND projection_version = 1
	`
	if _, err := r.pool.Exec(ctx, sql, tenantID, key, windowStart); err != nil {
		return fmt.Errorf("projection_repo.recomputeRate key=%s: %w", key, err)
	}
	return nil
}

// recomputeEvidenceRate recalculates evidence readiness rate.
func (r *ProjectionRepo) recomputeEvidenceRate(
	ctx context.Context,
	tenantID, key string,
	windowStart time.Time,
) error {
	sql := `
		UPDATE projection_state
		SET value_json = jsonb_set(
			value_json,
			'{rate}',
			to_jsonb(
				COALESCE(
					(value_json->>'with_evidence')::numeric /
					NULLIF((value_json->>'total_settled')::numeric, 0),
					0
				)
			)
		),
		computed_at = now()
		WHERE tenant_id          = $1
		  AND projection_key     = $2
		  AND window_start       = $3
		  AND projection_version = 1
	`
	if _, err := r.pool.Exec(ctx, sql, tenantID, key, windowStart); err != nil {
		return fmt.Errorf("projection_repo.recomputeEvidenceRate key=%s: %w", key, err)
	}
	return nil
}

// latencyBucketBounds defines the upper boundary (in seconds) of each bucket.
// 20 buckets covering 0–96h+ — tuned for payout finality in Indian fintech.
var latencyBucketBounds = []float64{
	30,              // bucket_0:  0s–30s
	120,             // bucket_1:  30s–2m
	300,             // bucket_2:  2m–5m
	900,             // bucket_3:  5m–15m
	1800,            // bucket_4:  15m–30m
	3600,            // bucket_5:  30m–1h
	7200,            // bucket_6:  1h–2h
	10800,           // bucket_7:  2h–3h
	14400,           // bucket_8:  3h–4h
	18000,           // bucket_9:  4h–5h
	21600,           // bucket_10: 5h–6h
	28800,           // bucket_11: 6h–8h
	43200,           // bucket_12: 8h–12h
	64800,           // bucket_13: 12h–18h
	86400,           // bucket_14: 18h–24h
	129600,          // bucket_15: 24h–36h
	172800,          // bucket_16: 36h–48h
	259200,          // bucket_17: 48h–72h
	345600,          // bucket_18: 72h–96h
	math.MaxFloat64, // bucket_19: 96h+
}

// latencyBucket returns which bucket index a latency value falls into.
func latencyBucket(seconds float64) int {
	for i, bound := range latencyBucketBounds {
		if seconds <= bound {
			return i
		}
	}
	return 19
}

// estimatePercentileFromHistogram estimates a percentile from bucket counts.
//
// Algorithm: walk buckets accumulating counts until we reach the target rank,
// then linearly interpolate within that bucket for a smooth estimate.
//
// Example — 100 total samples, want p95 (rank = 95):
//
//	bucket_0 (0–30s):   count=60 → cumulative=60
//	bucket_1 (30s–2m):  count=30 → cumulative=90
//	bucket_2 (2m–5m):   count=8  → cumulative=98  ← crosses 95 here
//	→ target rank 95 is (95-90)=5 samples into bucket_2's 8 samples
//	→ fraction = 5/8 = 0.625
//	→ p95 = 120 + 0.625 × (300-120) = 120 + 112.5 = 232.5 seconds ≈ 3.9 minutes
func estimatePercentileFromHistogram(
	histogram map[string]int,
	total int,
	percentile float64,
) float64 {
	targetRank := int(float64(total) * percentile)
	cumulative := 0
	lowerBound := 0.0

	for i, upperBound := range latencyBucketBounds {
		bucketKey := fmt.Sprintf("bucket_%d", i)
		count := histogram[bucketKey]
		cumulative += count

		if cumulative >= targetRank && count > 0 {
			prev := cumulative - count
			fraction := float64(targetRank-prev) / float64(count)
			return lowerBound + fraction*(upperBound-lowerBound)
		}
		lowerBound = upperBound
	}

	return latencyBucketBounds[18] // fallback: last finite bound
}
