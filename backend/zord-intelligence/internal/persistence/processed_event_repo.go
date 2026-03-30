package persistence

import (
	"context"
	"fmt"
)

// IsProcessed returns true if this event_id was already processed.
func (r *ProjectionRepo) IsProcessed(ctx context.Context, eventID string) (bool, error) {
	if eventID == "" {
		return false, nil
	}

	const sql = `
		SELECT EXISTS (
			SELECT 1
			FROM processed_events
			WHERE event_id = $1
		)
	`

	var processed bool
	if err := r.pool.QueryRow(ctx, sql, eventID).Scan(&processed); err != nil {
		return false, fmt.Errorf("processed_event_repo.IsProcessed event_id=%s: %w", eventID, err)
	}
	return processed, nil
}

// MarkProcessed records event_id as processed. Duplicate inserts are ignored.
func (r *ProjectionRepo) MarkProcessed(ctx context.Context, eventID string) error {
	if eventID == "" {
		return nil
	}

	const sql = `
		INSERT INTO processed_events (event_id)
		VALUES ($1)
		ON CONFLICT (event_id) DO NOTHING
	`

	if _, err := r.pool.Exec(ctx, sql, eventID); err != nil {
		return fmt.Errorf("processed_event_repo.MarkProcessed event_id=%s: %w", eventID, err)
	}
	return nil
}
