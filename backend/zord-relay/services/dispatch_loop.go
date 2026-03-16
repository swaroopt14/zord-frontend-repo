package services

import (
	"bytes"
	"context"
	"database/sql"
	"encoding/json"
	"net/http"
	"time"
	"zord-relay/model"
	"github.com/google/uuid"
)

type DispatchLoop struct {
	db           *sql.DB
	intentClient *IntentClient
	outboxRepo   *OutboxRepo
	dispatchRepo *DispatchRepo
	pspURL       string
}

func NewDispatchLoop(db *sql.DB, intentClient *IntentClient, outboxRepo *OutboxRepo, dispatchRepo *DispatchRepo, pspURL string) *DispatchLoop {
	return &DispatchLoop{db: db, intentClient: intentClient, outboxRepo: outboxRepo, dispatchRepo: dispatchRepo, pspURL: pspURL}
}

func (l *DispatchLoop) Start(ctx context.Context, batch int) {
	go func() {
		httpClient := &http.Client{Timeout: 10 * time.Second}
		for {
			select {
			case <-ctx.Done():
				return
			default:
			}
			lease, err := l.intentClient.Lease(ctx, batch)
			if err != nil || lease == nil || len(lease.Events) == 0 {
				time.Sleep(1 * time.Second)
				continue
			}

			var ackIDs []string
			var nackIDs []string

			for _, e := range lease.Events {
				dispatchID := "disp_" + uuid.New().String()
				connectorID := "razorpayx_prod"
				corridorID := "IMPS"
				tenantID := e.TenantID
				intentID := e.AggregateID
				traceID := e.TraceID
				contractID := e.ContractID

				// STEP 1: DispatchCreated in single transaction
				tx, err := l.db.BeginTx(ctx, nil)
				if err != nil {
					nackIDs = append(nackIDs, e.ID)
					continue
				}
				dCreated := map[string]any{
					"dispatch_id":   dispatchID,
					"contract_id":   contractID,
					"intent_id":     intentID,
					"tenant_id":     tenantID,
					"trace_id":      traceID,
					"connector_id":  connectorID,
					"corridor_id":   corridorID,
					"attempt_count": 1,
					"correlation_carriers": map[string]any{
						"reference_id": dispatchID,
						"narration":    "ZRD:" + contractID,
					},
					"created_at": time.Now().UTC(),
				}
				d := &model.Dispatch{
					DispatchID:   dispatchID,
					ContractID:   contractID,
					IntentID:     intentID,
					TenantID:     tenantID,
					TraceID:      traceID,
					ConnectorID:  connectorID,
					CorridorID:   corridorID,
					AttemptCount: 1,
					Status:       "PENDING",
					CreatedAt:    time.Now().UTC(),
				}
				if err := l.insertDispatchAndOutboxTx(ctx, tx, d, "DispatchCreated", dCreated); err != nil {
					_ = tx.Rollback()
					nackIDs = append(nackIDs, e.ID)
					continue
				}
				if err := tx.Commit(); err != nil {
					nackIDs = append(nackIDs, e.ID)
					continue
				}

				// STEP 3: AttemptSent + mark SENT
				tx2, err := l.db.BeginTx(ctx, nil)
				if err != nil {
					nackIDs = append(nackIDs, e.ID)
					continue
				}
				attemptSent := map[string]any{
					"dispatch_id":   dispatchID,
					"contract_id":   contractID,
					"intent_id":     intentID,
					"tenant_id":     tenantID,
					"trace_id":      traceID,
					"attempt_count": 1,
					"sent_at":       time.Now().UTC(),
				}
				if err := l.enqueueOutboxTx(ctx, tx2, "AttemptSent", dispatchID, contractID, intentID, tenantID, traceID, attemptSent); err != nil {
					_ = tx2.Rollback()
					nackIDs = append(nackIDs, e.ID)
					continue
				}
				if err := l.updateSentTx(ctx, tx2, dispatchID); err != nil {
					_ = tx2.Rollback()
					nackIDs = append(nackIDs, e.ID)
					continue
				}
				if err := tx2.Commit(); err != nil {
					nackIDs = append(nackIDs, e.ID)
					continue
				}

				// STEP 4: Call PSP
				pspBody := map[string]any{
					"reference_id": dispatchID,
					"narration":    "ZRD:" + contractID,
					"amount":       5000,
					"mode":         corridorID,
					"beneficiary": map[string]any{
						"name":           "Priya Sharma",
						"account_number": "1234567890",
						"ifsc":           "SBIN0001234",
					},
				}
				buf, _ := json.Marshal(pspBody)
				req, _ := http.NewRequestWithContext(ctx, http.MethodPost, l.pspURL+"/payouts", bytes.NewReader(buf))
				req.Header.Set("Content-Type", "application/json")
				resp, err := httpClient.Do(req)
				if err != nil || resp.StatusCode/100 != 2 {
					// FAILED path
					if resp != nil {
						resp.Body.Close()
					}
					tx3, err2 := l.db.BeginTx(ctx, nil)
					if err2 == nil {
						failPayload := map[string]any{
							"dispatch_id": dispatchID,
							"contract_id": contractID,
							"intent_id":   intentID,
							"tenant_id":   tenantID,
							"trace_id":    traceID,
							"status":      "failed",
							"failed_at":   time.Now().UTC(),
						}
						_ = l.enqueueOutboxTx(ctx, tx3, "DispatchFailed", dispatchID, contractID, intentID, tenantID, traceID, failPayload)
						_ = l.updateFailedTx(ctx, tx3, dispatchID)
						_ = tx3.Commit()
					}
					nackIDs = append(nackIDs, e.ID)
					continue
				}
				var pspResp struct {
					PayoutID    string `json:"payout_id"`
					ReferenceID string `json:"reference_id"`
					Status      string `json:"status"`
				}
				_ = json.NewDecoder(resp.Body).Decode(&pspResp)
				resp.Body.Close()

				// STEP 5: ProviderAcked + mark dispatch
				tx4, err := l.db.BeginTx(ctx, nil)
				if err != nil {
					nackIDs = append(nackIDs, e.ID)
					continue
				}
				acked := map[string]any{
					"dispatch_id":         dispatchID,
					"contract_id":         contractID,
					"intent_id":           intentID,
					"tenant_id":           tenantID,
					"trace_id":            traceID,
					"provider_attempt_id": pspResp.PayoutID,
					"provider_reference":  nil,
					"status":              pspResp.Status,
					"acked_at":            time.Now().UTC(),
				}
				if err := l.enqueueOutboxTx(ctx, tx4, "ProviderAcked", dispatchID, contractID, intentID, tenantID, traceID, acked); err != nil {
					_ = tx4.Rollback()
					nackIDs = append(nackIDs, e.ID)
					continue
				}
				if err := l.updateProviderAckTx(ctx, tx4, dispatchID, pspResp.PayoutID); err != nil {
					_ = tx4.Rollback()
					nackIDs = append(nackIDs, e.ID)
					continue
				}
				if err := tx4.Commit(); err != nil {
					nackIDs = append(nackIDs, e.ID)
					continue
				}
				ackIDs = append(ackIDs, e.ID)
			}

			if len(ackIDs) > 0 {
				_ = l.intentClient.Ack(ctx, lease.LeaseID, ackIDs)
			}
			if len(nackIDs) > 0 {
				_ = l.intentClient.Nack(ctx, lease.LeaseID, nackIDs)
			}
		}
	}()
}

func (l *DispatchLoop) insertDispatchAndOutboxTx(ctx context.Context, tx *sql.Tx, d *model.Dispatch, eventType string, payload map[string]any) error {
	_, err := tx.ExecContext(ctx, `
		INSERT INTO dispatches (
			dispatch_id, contract_id, intent_id, tenant_id, trace_id,
			connector_id, corridor_id, attempt_count, status, created_at
		) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
	`, d.DispatchID, d.ContractID, d.IntentID, d.TenantID, d.TraceID, d.ConnectorID, d.CorridorID, d.AttemptCount, d.Status, d.CreatedAt)
	if err != nil {
		return err
	}
	return l.enqueueOutboxTx(ctx, tx, eventType, d.DispatchID, d.ContractID, d.IntentID, d.TenantID, d.TraceID, payload)
}

func (l *DispatchLoop) enqueueOutboxTx(ctx context.Context, tx *sql.Tx, eventType, dispatchID, contractID, intentID, tenantID, traceID string, payload map[string]any) error {
	eventID := "evt_" + uuid.New().String()
	bytes, _ := json.Marshal(payload)
	_, err := tx.ExecContext(ctx, `
		INSERT INTO relay_outbox (event_id, event_type, dispatch_id, contract_id, intent_id, tenant_id, trace_id, payload, status)
		VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'PENDING')
	`, eventID, eventType, dispatchID, contractID, intentID, tenantID, traceID, bytes)
	return err
}

func (l *DispatchLoop) updateSentTx(ctx context.Context, tx *sql.Tx, dispatchID string) error {
	_, err := tx.ExecContext(ctx, `
		UPDATE dispatches SET status='SENT', sent_at=now() WHERE dispatch_id=$1
	`, dispatchID)
	return err
}

func (l *DispatchLoop) updateFailedTx(ctx context.Context, tx *sql.Tx, dispatchID string) error {
	_, err := tx.ExecContext(ctx, `
		UPDATE dispatches SET status='FAILED' WHERE dispatch_id=$1
	`, dispatchID)
	return err
}

func (l *DispatchLoop) updateProviderAckTx(ctx context.Context, tx *sql.Tx, dispatchID string, providerAttemptID string) error {
	_, err := tx.ExecContext(ctx, `
		UPDATE dispatches SET status='PROVIDER_ACKED', provider_attempt_id=$1, acked_at=now() WHERE dispatch_id=$2
	`, providerAttemptID, dispatchID)
	return err
}

func getStringField(payload json.RawMessage, key string, def string) string {
	var m map[string]any
	if err := json.Unmarshal(payload, &m); err != nil {
		return def
	}
	if v, ok := m[key]; ok {
		if s, ok2 := v.(string); ok2 && s != "" {
			return s
		}
	}
	return def
}
