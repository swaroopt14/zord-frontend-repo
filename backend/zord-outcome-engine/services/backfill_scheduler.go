package services

import (
	"context"
	"log"
	"time"
	"zord-outcome-engine/db"

	"github.com/google/uuid"
)

// StartBackfillScheduler periodically schedules polling for contracts that are not yet terminal.
func StartBackfillScheduler(ctx context.Context) {
	go func() {
		ticker := time.NewTicker(30 * time.Second)
		defer ticker.Stop()
		for {
			select {
			case <-ctx.Done():
				return
			case <-ticker.C:
				if err := scheduleBackfillPolls(ctx); err != nil {
					log.Printf("backfill scheduler error: %v", err)
				}
			}
		}
	}()
}

func scheduleBackfillPolls(ctx context.Context) error {
	// For simplicity, schedule polls for contracts that have a dispatch but no fused_outcomes row yet.
	rows, err := db.DB.QueryContext(ctx, `
SELECT d.contract_id, d.dispatch_id, d.connector_id, d.corridor_id
FROM dispatch_index d
LEFT JOIN fused_outcomes f ON f.contract_id = d.contract_id
WHERE f.contract_id IS NULL
GROUP BY d.contract_id, d.dispatch_id, d.connector_id, d.corridor_id
LIMIT 50
`)
	if err != nil {
		return err
	}
	defer rows.Close()

	now := time.Now().UTC()

	for rows.Next() {
		var contractID, dispatchID, connectorID uuid.UUID
		var corridorID string
		if err := rows.Scan(&contractID, &dispatchID, &connectorID, &corridorID); err != nil {
			return err
		}

		// Upsert basic poll schedule starting at now+2min (webhook grace).
		_, err := db.DB.ExecContext(ctx, `
INSERT INTO poll_schedule(
	contract_id, dispatch_id, next_poll_at, poll_stage, last_poll_at, poll_failures, connector_id, corridor_id
) VALUES ($1,$2,$3,0,NULL,0,$4,$5)
ON CONFLICT (contract_id) DO NOTHING
`, contractID, dispatchID, now.Add(2*time.Minute), connectorID, corridorID)
		if err != nil {
			log.Printf("poll_schedule upsert error: %v", err)
		}
	}
	return nil
}

// StartPollWorker executes scheduled polls according to the configured backoff stages.
func StartPollWorker(ctx context.Context) {
	go func() {
		ticker := time.NewTicker(10 * time.Second)
		defer ticker.Stop()
		for {
			select {
			case <-ctx.Done():
				return
			case <-ticker.C:
				if err := runPollBatch(ctx); err != nil {
					log.Printf("poll worker error: %v", err)
				}
			}
		}
	}()
}

func runPollBatch(ctx context.Context) error {
	rows, err := db.DB.QueryContext(ctx, `
SELECT contract_id, dispatch_id, next_poll_at, poll_stage, poll_failures, connector_id, corridor_id
FROM poll_schedule
WHERE next_poll_at <= NOW()
LIMIT 20
`)
	if err != nil {
		return err
	}
	defer rows.Close()

	now := time.Now().UTC()

	for rows.Next() {
		var contractID, dispatchID, connectorID uuid.UUID
		var nextPollAt time.Time
		var stage, failures int
		var corridorID string
		if err := rows.Scan(&contractID, &dispatchID, &nextPollAt, &stage, &failures, &connectorID, &corridorID); err != nil {
			return err
		}

		// TODO: Call PSP-specific poll API here. For now, we just advance the schedule.
		interval := pollIntervalForStage(stage, now.Sub(nextPollAt))
		newStage := stage
		if stage < 3 {
			newStage++
		}

		_, _ = db.DB.ExecContext(ctx, `
UPDATE poll_schedule
SET poll_stage = $1, next_poll_at = $2, last_poll_at = $3
WHERE contract_id = $4
`, newStage, now.Add(interval), now, contractID)
	}
	return nil
}

func pollIntervalForStage(stage int, age time.Duration) time.Duration {
	switch stage {
	case 0:
		// 0–2 min: every 10s
		return 10 * time.Second
	case 1:
		// 2–10 min: every 30s
		return 30 * time.Second
	case 2:
		// 10–60 min: every 5m
		return 5 * time.Minute
	default:
		// 1–24h: every 30m (we clamp with stage>=3)
		return 30 * time.Minute
	}
}
