package persistence

// What is this file?
// Reads and writes the projection_state table.
// Called by projection_service.go to save KPI numbers,
// and by kpi_handler.go to fetch them for the frontend.

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/zord/zord-intelligence/internal/models"
)

// ProjectionRepo handles all DB operations for projection_state.
//
// WHY A STRUCT WITH A POOL FIELD?
// The pool is the connection to PostgreSQL.
// We store it here so every method can use it without passing it as a parameter.
// This is Go's version of dependency injection — pass dependencies via constructor.
type ProjectionRepo struct {
	pool *pgxpool.Pool
}

// NewProjectionRepo creates a new ProjectionRepo.
// Called once in main.go, pool is passed in from db.Connect().
//
// main.go:
//
//	pool := db.Connect(cfg)
//	projRepo := persistence.NewProjectionRepo(pool)
func NewProjectionRepo(pool *pgxpool.Pool) *ProjectionRepo {
	return &ProjectionRepo{pool: pool}
}

// Upsert saves a projection.
// "Upsert" = INSERT if not exists, UPDATE if already exists.
//
// WHY UPSERT INSTEAD OF INSERT?
// The same projection key gets updated many times a day as new events arrive.
// e.g. "corridor.success_rate.razorpay_UPI" is updated every time a
// finality certificate arrives. We don't want thousands of rows —
// we want ONE row per (tenant, key, window) that gets updated in place.
//
// ON CONFLICT DO UPDATE = PostgreSQL's upsert syntax.
// If a row with the same (tenant_id, projection_key, window_start, version) exists
// → update it. Otherwise → insert new row.
func (r *ProjectionRepo) Upsert(ctx context.Context, p models.ProjectionState) error {
	sql := `
		INSERT INTO projection_state
			(tenant_id, projection_key, window_start, window_end,
			 value_json, computed_at, projection_version)
		VALUES
			($1, $2, $3, $4, $5, $6, $7)
		ON CONFLICT (tenant_id, projection_key, window_start, projection_version)
		DO UPDATE SET
			value_json  = EXCLUDED.value_json,
			window_end  = EXCLUDED.window_end,
			computed_at = EXCLUDED.computed_at
	`
	// $1, $2, $3... are positional parameters — Postgres style (not ? like MySQL)
	_, err := r.pool.Exec(ctx, sql,
		p.TenantID,
		p.ProjectionKey,
		p.WindowStart,
		p.WindowEnd,
		p.ValueJSON,
		p.ComputedAt,
		p.ProjectionVersion,
	)
	if err != nil {
		return fmt.Errorf("projection_repo.Upsert key=%s: %w", p.ProjectionKey, err)
	}
	return nil
}

// GetLatest returns the most recent projection for a tenant and key.
// Returns nil, nil (no error) if no row exists yet — that is normal on first startup.
//
// Called by:
//
//	projection_service.go → to read current value before updating it
func (r *ProjectionRepo) GetLatest(ctx context.Context, tenantID, key string) (*models.ProjectionState, error) {
	sql := `
		SELECT id, tenant_id, projection_key, window_start, window_end,
		       value_json, computed_at, projection_version
		FROM   projection_state
		WHERE  tenant_id = $1
		  AND  projection_key = $2
		ORDER  BY window_end DESC, projection_version DESC
		LIMIT  1
	`
	row := r.pool.QueryRow(ctx, sql, tenantID, key)

	var p models.ProjectionState
	err := row.Scan(
		&p.ID,
		&p.TenantID,
		&p.ProjectionKey,
		&p.WindowStart,
		&p.WindowEnd,
		&p.ValueJSON,
		&p.ComputedAt,
		&p.ProjectionVersion,
	)
	if err != nil {
		// pgx returns this specific error when no rows were found
		// "no rows" is NOT an error in our system — we just return nil
		if err.Error() == "no rows in result set" {
			return nil, nil
		}
		return nil, fmt.Errorf("projection_repo.GetLatest key=%s: %w", key, err)
	}
	return &p, nil
}

// ListByTenant returns the latest projection for every key belonging to a tenant.
// Used by kpi_handler.go to fetch all KPIs in one query for the dashboard.
//
// DISTINCT ON is a PostgreSQL feature:
// "for each unique projection_key, give me the row with the most recent window_end"
// This is more efficient than running a separate query per key.
func (r *ProjectionRepo) ListByTenant(ctx context.Context, tenantID string) ([]models.ProjectionState, error) {
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
	defer rows.Close() // always close rows when done — releases the DB connection back to pool

	// Collect all rows into a slice
	var result []models.ProjectionState
	for rows.Next() { // rows.Next() moves to the next row, returns false when done
		var p models.ProjectionState
		if err := rows.Scan(
			&p.ID, &p.TenantID, &p.ProjectionKey,
			&p.WindowStart, &p.WindowEnd, &p.ValueJSON,
			&p.ComputedAt, &p.ProjectionVersion,
		); err != nil {
			return nil, fmt.Errorf("projection_repo.ListByTenant scan: %w", err)
		}
		result = append(result, p) // append adds to the slice (like List.add() in Java)
	}
	return result, nil
}

// GetValueAs is a helper that reads the latest projection and unmarshals
// the ValueJSON into a typed struct.
//
// EXAMPLE USAGE in projection_service.go:
//
//	var val models.SuccessRateValue
//	err := projRepo.GetValueAs(ctx, tenantID, "corridor.success_rate.X", &val)
//	// now val.Rate, val.TotalCount etc. are filled
//
// The "any" parameter accepts a pointer to any struct:
//
//	GetValueAs(ctx, id, key, &myStruct)
func (r *ProjectionRepo) GetValueAs(ctx context.Context, tenantID, key string, dest any) error {
	p, err := r.GetLatest(ctx, tenantID, key)
	if err != nil {
		return err
	}
	if p == nil {
		// No data yet — dest stays as zero value, not an error
		return nil
	}
	// json.Unmarshal decodes a JSON string into a Go struct
	// dest must be a pointer: &myStruct
	return json.Unmarshal([]byte(p.ValueJSON), dest)
}

// UpsertWithValue is a convenience method that marshals a value struct to JSON
// and upserts it in one call.
//
// EXAMPLE USAGE in projection_service.go:
//
//	val := models.SuccessRateValue{Rate: 0.97, SettledCount: 970, TotalCount: 1000}
//	err := projRepo.UpsertWithValue(ctx, tenantID, "corridor.success_rate.X",
//	                                windowStart, windowEnd, val)
func (r *ProjectionRepo) UpsertWithValue(
	ctx context.Context,
	tenantID, key string,
	windowStart, windowEnd time.Time,
	value any,
) error {
	// Marshal the value struct to JSON string
	jsonBytes, err := json.Marshal(value)
	if err != nil {
		return fmt.Errorf("projection_repo.UpsertWithValue marshal: %w", err)
	}

	return r.Upsert(ctx, models.ProjectionState{
		TenantID:          tenantID,
		ProjectionKey:     key,
		WindowStart:       windowStart,
		WindowEnd:         windowEnd,
		ValueJSON:         string(jsonBytes),
		ComputedAt:        time.Now().UTC(),
		ProjectionVersion: 1,
	})
}
