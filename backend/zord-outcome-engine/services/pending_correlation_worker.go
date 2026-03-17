package services

import (
	"context"
	"log"
	"time"
	"zord-outcome-engine/db"

	"github.com/google/uuid"
)

// StartPendingCorrelationWorker periodically retries correlation for unmatched events.
func StartPendingCorrelationWorker(ctx context.Context) {
	go func() {
		ticker := time.NewTicker(10 * time.Second)
		defer ticker.Stop()
		for {
			select {
			case <-ctx.Done():
				return
			case <-ticker.C:
				if err := processPendingCorrelationBatch(ctx); err != nil {
					log.Printf("pending correlation worker error: %v", err)
				}
			}
		}
	}()
}

func processPendingCorrelationBatch(ctx context.Context) error {
	rows, err := db.DB.QueryContext(ctx, `
SELECT queue_id, event_id, tenant_id, connector_id, attempt_count
FROM pending_correlation_queue
WHERE next_attempt_at <= NOW()
ORDER BY next_attempt_at
LIMIT 20
`)
	if err != nil {
		return err
	}
	defer rows.Close()

	for rows.Next() {
		var queueID, eventID, tenantID, connectorID uuid.UUID
		var attemptCount int
		if err := rows.Scan(&queueID, &eventID, &tenantID, &connectorID, &attemptCount); err != nil {
			return err
		}

		// Load canonical event minimal fields we need.
		var providerRefHash *string
		if err := db.DB.QueryRowContext(ctx, `
SELECT provider_ref_hash
FROM canonical_outcome_events
WHERE event_id = $1
`, eventID).Scan(&providerRefHash); err != nil {
			continue
		}

		res, err := correlateCanonical(ctx, nil, providerRefHash)
		if err != nil {
			continue
		}
		if res != nil && res.DispatchID != nil {
			if err := applyCorrelationOrEnqueue(ctx, eventID, tenantID, connectorID, res); err == nil {
				_, _ = db.DB.ExecContext(ctx, `DELETE FROM pending_correlation_queue WHERE queue_id=$1`, queueID)
				continue
			}
		}

		// Bump attempt_count and back off.
		next := time.Now().Add(time.Duration(min(30*(attemptCount+1), 300)) * time.Second)
		_, _ = db.DB.ExecContext(ctx, `
UPDATE pending_correlation_queue
SET attempt_count = attempt_count + 1, next_attempt_at = $1
WHERE queue_id = $2
`, next, queueID)
	}
	return nil
}

func min(a, b int) int {
	if a < b {
		return a
	}
	return b
}
