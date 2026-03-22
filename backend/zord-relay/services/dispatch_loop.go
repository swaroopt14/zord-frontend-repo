package services

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"sync"
	"time"
	"zord-relay/model"
	"zord-relay/psp"
	"zord-relay/utils"

	"github.com/google/uuid"
	"go.uber.org/zap"
)

type DispatchLoopConfig struct {
	WorkerCount  int
	BatchSize    int
	PollInterval time.Duration
	LeaseTTLSecs int
	ConnectorID  string
	CorridorID   string
	// PSPCircuitBreaker: consecutive PSP failures before the loop pauses leasing.
	// When the circuit opens, the loop stops consuming from Service 2's outbox
	// entirely — preserving retry budget until PSP recovers.
	// Default: 5 consecutive failures opens the circuit.
	// Circuit resets after PSPCircuitResetSecs seconds of no new attempts.
	PSPCircuitBreakerThreshold int
	PSPCircuitResetSecs        int
}

// DispatchLoop polls Service 2's outbox, dispatches each event through the
// five-step lifecycle, and writes all state transitions atomically to
// Service 4's own DB before acking/nacking back to Service 2.
//
// The five steps per event:
//
//	Step 1 — DispatchCreated:  mint dispatch_id (idempotent), write dispatches row
//	                           + DispatchCreated outbox event atomically.
//	Step 2 — Detokenize:       call Service 3 JIT to resolve PII tokens.
//	                           If this fails → FAILED + nack. No PSP call made.
//	Step 3 — AttemptSent:      write AttemptSent outbox event + mark dispatches SENT
//	                           atomically. Must happen BEFORE the PSP HTTP call.
//	Step 4 — PSP call:         call the PSP with real PII in memory only.
//	                           Discard PII immediately after call returns.
//	                           On failure → DispatchFailed outbox + FAILED + nack.
//	Step 5 — ProviderAcked:    write ProviderAcked outbox event + mark PROVIDER_ACKED
//	                           atomically. Then ack back to Service 2.
type DispatchLoop struct {
	db           *sql.DB
	intentClient IntentClientIface
	outboxRepo   *RelayOutboxRepo
	dispatchRepo *DispatchRepo
	pspClient    psp.Client
	tokenClient  TokenClient
	cfg          *DispatchLoopConfig

	// Circuit breaker state — protects Service 2's retry budget when PSP is down.
	// When consecutive PSP failures exceed threshold, the poller pauses leasing.
	cbMu       sync.Mutex
	cbFailures int       // consecutive PSP failures across all workers
	cbOpenAt   time.Time // when circuit opened (zero = closed)
}

func NewDispatchLoop(
	db *sql.DB,
	intentClient IntentClientIface,
	outboxRepo *RelayOutboxRepo,
	dispatchRepo *DispatchRepo,
	pspClient psp.Client,
	tokenClient TokenClient,
	cfg *DispatchLoopConfig,
) *DispatchLoop {
	return &DispatchLoop{
		db:           db,
		intentClient: intentClient,
		outboxRepo:   outboxRepo,
		dispatchRepo: dispatchRepo,
		pspClient:    pspClient,
		tokenClient:  tokenClient,
		cfg:          cfg,
	}
}

// Start launches the dispatch loop with a worker pool.
// The WaitGroup is used for graceful shutdown — Start adds cfg.WorkerCount
// to wg, and each worker calls wg.Done when it exits.
// Shutdown sequence: cancel ctx → workers finish in-flight event → wg.Wait().
func (l *DispatchLoop) Start(ctx context.Context, wg *sync.WaitGroup) {
	// The poller runs in a single goroutine and distributes work
	// to a pool of workers via a buffered channel.
	workCh := make(chan leaseWork, l.cfg.WorkerCount*2)

	// Start workers.
	for i := 0; i < l.cfg.WorkerCount; i++ {
		wg.Add(1)
		go func(workerID int) {
			defer wg.Done()
			l.worker(ctx, workerID, workCh)
		}(i)
	}

	// Start poller in its own goroutine.
	wg.Add(1)
	go func() {
		defer wg.Done()
		defer close(workCh) // signals workers to drain and exit
		l.poller(ctx, workCh)
	}()
}

// leaseWork is the unit of work dispatched from the poller to a worker.
type leaseWork struct {
	leaseID string
	event   model.OutboxEvent
	// resultCh receives the event_id back with a boolean:
	// true = ack, false = nack.
	resultCh chan<- dispatchResult
}

type dispatchResult struct {
	eventID string
	ack     bool
}

// poller fetches lease batches from Service 2 and distributes them to workers.
// It collects results from all workers in the batch before sending ack/nack,
// so Service 2 receives a single ack and a single nack call per batch.
func (l *DispatchLoop) poller(ctx context.Context, workCh chan<- leaseWork) {
	for {
		select {
		case <-ctx.Done():
			return
		default:
		}

		// Circuit breaker check: if PSP is consistently down,
		// stop leasing from Service 2 to preserve retry budget.
		// Events stay safely PENDING in Service 2's outbox.
		if l.circuitOpen() {
			utils.Logger.Warn("dispatch_loop: circuit open — skipping lease poll",
				zap.Int("reset_after_seconds", func() int {
					if l.cfg.PSPCircuitResetSecs > 0 {
						return l.cfg.PSPCircuitResetSecs
					}
					return 60
				}()),
			)
			l.sleep(ctx, l.cfg.PollInterval*5) // back off longer when circuit is open
			continue
		}

		lease, err := l.intentClient.Lease(ctx, l.cfg.BatchSize, l.cfg.LeaseTTLSecs)
		if err != nil {
			utils.Logger.Warn("dispatch_loop: lease failed", zap.Error(err))
			l.sleep(ctx, l.cfg.PollInterval)
			continue
		}

		if len(lease.Events) == 0 {
			l.sleep(ctx, l.cfg.PollInterval)
			continue
		}

		utils.Logger.Info("dispatch_loop: leased batch",
			zap.String("lease_id", lease.LeaseID),
			zap.Int("count", len(lease.Events)),
		)

		// Create a result channel for this batch.
		resultCh := make(chan dispatchResult, len(lease.Events))

		// Send all events to workers.
		for _, e := range lease.Events {
			select {
			case <-ctx.Done():
				// Context cancelled mid-batch — nack everything we haven't sent yet.
				// Workers that already received work will send their results.
				break
			case workCh <- leaseWork{leaseID: lease.LeaseID, event: e, resultCh: resultCh}:
			}
		}

		// Collect results from all events in the batch.
		var ackIDs, nackIDs []string
		for range lease.Events {
			r := <-resultCh
			if r.ack {
				ackIDs = append(ackIDs, r.eventID)
			} else {
				nackIDs = append(nackIDs, r.eventID)
			}
		}

		// Send ack/nack back to Service 2.
		// These are best-effort — if they fail, Service 2 will re-lease
		// after the lease TTL expires. The idempotency check in Step 1
		// protects against duplicate dispatch on re-lease.
		if len(ackIDs) > 0 {
			if err := l.intentClient.Ack(ctx, lease.LeaseID, ackIDs); err != nil {
				utils.Logger.Error("dispatch_loop: ack failed",
					zap.String("lease_id", lease.LeaseID),
					zap.Int("count", len(ackIDs)),
					zap.Error(err),
				)
			}
		}
		if len(nackIDs) > 0 {
			if err := l.intentClient.Nack(ctx, lease.LeaseID, nackIDs); err != nil {
				utils.Logger.Error("dispatch_loop: nack failed",
					zap.String("lease_id", lease.LeaseID),
					zap.Int("count", len(nackIDs)),
					zap.Error(err),
				)
			}
		}

		utils.Logger.Info("dispatch_loop: batch complete",
			zap.String("lease_id", lease.LeaseID),
			zap.Int("acked", len(ackIDs)),
			zap.Int("nacked", len(nackIDs)),
		)
	}
}

// worker receives events from the work channel and processes each one
// through the five-step dispatch lifecycle.
func (l *DispatchLoop) worker(ctx context.Context, workerID int, workCh <-chan leaseWork) {
	for work := range workCh {
		ack := l.processEvent(ctx, workerID, work.event)
		work.resultCh <- dispatchResult{eventID: work.event.ID, ack: ack}
	}
}

// processEvent runs the five-step dispatch lifecycle for a single event.
// Returns true if the event should be acked (ProviderAcked committed),
// false if it should be nacked (any earlier failure).
func (l *DispatchLoop) processEvent(ctx context.Context, workerID int, e model.OutboxEvent) (ack bool) {
	log := utils.Logger.With(
		zap.Int("worker_id", workerID),
		zap.String("event_id", e.ID),
		zap.String("contract_id", e.ContractID),
		zap.String("intent_id", e.AggregateID),
		zap.String("tenant_id", e.TenantID),
		zap.String("trace_id", e.TraceID),
	)

	// Parse the outbox payload using the real structure Service 2 sends.
	// amount is a top-level string, currency is a top-level string.
	// PII tokens are under pii_tokens, not beneficiary.
	var payload model.OutboxPayload
	if err := json.Unmarshal(e.Payload, &payload); err != nil {
		log.Error("dispatch_loop: failed to parse outbox payload", zap.Error(err))
		return false
	}

	// Routing fields come from loop config defaults.
	// Refine corridor based on instrument kind when present.
	connectorID := l.cfg.ConnectorID
	corridorID := l.cfg.CorridorID
	switch payload.Beneficiary.Instrument.Kind {
	case "UPI":
		corridorID = "UPI"
	case "BANK":
		corridorID = "IMPS"
	}

	intentID := e.AggregateID
	contractID := e.ContractID
	tenantID := e.TenantID
	traceID := e.TraceID

	// =========================================================
	// STEP 1: DispatchCreated — idempotency check first
	// =========================================================
	existing, err := l.dispatchRepo.FindByContractAndAttempt(ctx, contractID, 1)
	if err != nil {
		log.Error("dispatch_loop: step1 idempotency check failed", zap.Error(err))
		return false
	}

	var dispatchID string
	if existing != nil {
		dispatchID = existing.DispatchID
		log.Info("dispatch_loop: step1 reusing existing dispatch_id",
			zap.String("dispatch_id", dispatchID),
			zap.String("existing_status", string(existing.Status)),
		)
		if existing.Status == model.DispatchStatusProviderAcked {
			log.Info("dispatch_loop: step1 already provider_acked, skipping re-dispatch")
			return true
		}
	} else {
		dispatchID = uuid.New().String()

		d := &model.Dispatch{
			DispatchID:   dispatchID,
			ContractID:   contractID,
			IntentID:     intentID,
			TenantID:     tenantID,
			TraceID:      traceID,
			ConnectorID:  connectorID,
			CorridorID:   corridorID,
			AttemptCount: 1,
			Status:       model.DispatchStatusPending,
			CreatedAt:    time.Now().UTC(),
		}

		dcPayload := model.DispatchCreatedEvent{
			EventID:       uuid.New().String(),
			EventType:     "DispatchCreated",
			TenantID:      tenantID,
			IntentID:      intentID,
			ContractID:    contractID,
			DispatchID:    dispatchID,
			TraceID:       traceID,
			SchemaVersion: "v1",
			CreatedAt:     time.Now().UTC(),
			Payload: model.DispatchCreatedPayload{
				DispatchID:   dispatchID,
				ConnectorID:  connectorID,
				CorridorID:   corridorID,
				AttemptCount: 1,
				CorrelationCarriers: model.CorrelationCarriers{
					ReferenceID: dispatchID,
					Narration:   "ZRD:" + contractID,
				},
			},
		}

		if err := l.atomicStep(ctx, func(tx *sql.Tx) error {
			if err := l.dispatchRepo.InsertTx(ctx, tx, d); err != nil {
				return err
			}
			return l.outboxRepo.EnqueueTx(ctx, tx,
				dcPayload.EventID, "DispatchCreated",
				dispatchID, contractID, intentID, tenantID, traceID,
				dcPayload,
			)
		}); err != nil {
			log.Error("dispatch_loop: step1 atomic write failed", zap.Error(err))
			return false
		}

		log.Info("dispatch_loop: step1 DispatchCreated",
			zap.String("dispatch_id", dispatchID),
		)
	}

	// =========================================================
	// STEP 2: Detokenize (JIT — Service 3)
	// Send only the token fields present in the payload.
	// Response fields are plaintext — zero them via defer rb.Zero().
	// =========================================================
	detokResp, err := l.tokenClient.Detokenize(ctx, DetokenizeRequest{
		AccountNumber: payload.PIITokens.AccountNumber,
		Name:          payload.PIITokens.Name,
		IFSC:          payload.PIITokens.IFSC,
		VPA:           payload.PIITokens.VPA,
	})
	if err != nil {
		log.Error("dispatch_loop: step2 detokenize failed",
			zap.String("dispatch_id", dispatchID),
			zap.Error(err),
		)
		if mfErr := l.markFailedAndEnqueue(ctx, dispatchID, contractID, intentID, tenantID, traceID, 1, "DETOKENIZE_FAILED"); mfErr != nil {
			log.Error("dispatch_loop: step2 mark failed write error", zap.Error(mfErr))
		}
		return false
	}

	// PII is now in rb — zeroed by defer rb.Zero() on every exit path.
	rb := &model.ResolvedBeneficiary{
		AccountNumber: detokResp.AccountNumber,
		Name:          detokResp.Name,
		IFSC:          detokResp.IFSC,
	}
	defer rb.Zero()

	if rb.AccountNumber == "" || rb.Name == "" {
		log.Error("dispatch_loop: step2 detokenize returned empty values",
			zap.String("dispatch_id", dispatchID),
		)
		if mfErr := l.markFailedAndEnqueue(ctx, dispatchID, contractID, intentID, tenantID, traceID, 1, "DETOKENIZE_EMPTY"); mfErr != nil {
			log.Error("dispatch_loop: step2 mark failed write error", zap.Error(mfErr))
		}
		return false
	}

	// =========================================================
	// STEP 3: AttemptSent — must fire BEFORE PSP call
	// =========================================================
	asSentAt := time.Now().UTC()
	asPayload := model.AttemptSentEvent{
		EventID:       uuid.New().String(),
		EventType:     "AttemptSent",
		TenantID:      tenantID,
		IntentID:      intentID,
		ContractID:    contractID,
		DispatchID:    dispatchID,
		TraceID:       traceID,
		SchemaVersion: "v1",
		CreatedAt:     asSentAt,
		Payload: model.AttemptSentPayload{
			DispatchID:   dispatchID,
			ConnectorID:  connectorID,
			CorridorID:   corridorID,
			AttemptCount: 1,
			SentAt:       asSentAt,
			// CorrelationCarriers must match exactly what was sent to the PSP.
			// Service 5 uses these to correlate incoming webhook/statement signals.
			CorrelationCarriers: model.CorrelationCarriers{
				ReferenceID: dispatchID,
				Narration:   "ZRD:" + contractID,
			},
		},
	}

	if err := l.atomicStep(ctx, func(tx *sql.Tx) error {
		if err := l.outboxRepo.EnqueueTx(ctx, tx,
			asPayload.EventID, "AttemptSent",
			dispatchID, contractID, intentID, tenantID, traceID,
			asPayload,
		); err != nil {
			return err
		}
		return l.dispatchRepo.MarkSentTx(ctx, tx, dispatchID)
	}); err != nil {
		log.Error("dispatch_loop: step3 AttemptSent write failed", zap.Error(err))
		return false
	}

	log.Info("dispatch_loop: step3 AttemptSent written",
		zap.String("dispatch_id", dispatchID),
	)

	// =========================================================
	// STEP 4: PSP call
	// rb fields are PII — zeroed by defer rb.Zero() above.
	// Do NOT log rb.AccountNumber or rb.Name at any level.
	// =========================================================
	pspReq := psp.PayoutRequest{
		ReferenceID: dispatchID,
		Narration:   "ZRD:" + contractID,
		Amount:      amountFromOutbox(e.Amount),
		Mode:        corridorID,
		Beneficiary: psp.Beneficiary{
			Name:          rb.Name,
			AccountNumber: rb.AccountNumber,
			IFSC:          rb.IFSC,
		},
	}

	pspResp, pspErr := l.pspClient.Do(ctx, pspReq)
	// defer rb.Zero() runs here — PII cleared regardless of outcome.

	if pspErr != nil {
		log.Error("dispatch_loop: step4 PSP call failed",
			zap.String("dispatch_id", dispatchID),
			zap.Error(pspErr),
		)
		// Record failure — may open the circuit breaker if threshold exceeded.
		// When circuit opens, the poller stops consuming from Service 2
		// entirely, preserving the retry budget for all pending events.
		l.recordPSPFailure()
		if err := l.markFailedAndEnqueue(ctx, dispatchID, contractID, intentID, tenantID, traceID, 1, pspErr.Error()); err != nil {
			log.Error("dispatch_loop: step4 mark failed write error", zap.Error(err))
		}
		return false
	}

	// PSP call succeeded — reset the circuit breaker.
	l.recordPSPSuccess()

	log.Info("dispatch_loop: step4 PSP acked",
		zap.String("dispatch_id", dispatchID),
		zap.String("provider_attempt_id", pspResp.PayoutID),
		zap.String("psp_status", pspResp.Status),
	)

	// =========================================================
	// STEP 5: ProviderAcked
	// Write ProviderAcked outbox event + mark dispatch PROVIDER_ACKED
	// atomically. On success, return true → poller acks to Service 2.
	// =========================================================
	ackedAt := time.Now().UTC()
	paPayload := model.ProviderAckedEvent{
		EventID:       uuid.New().String(),
		EventType:     "ProviderAcked",
		TenantID:      tenantID,
		IntentID:      intentID,
		ContractID:    contractID,
		DispatchID:    dispatchID,
		TraceID:       traceID,
		SchemaVersion: "v1",
		CreatedAt:     ackedAt,
		Payload: model.ProviderAckedPayload{
			DispatchID:        dispatchID,
			ProviderAttemptID: pspResp.PayoutID,
			ProviderReference: nil, // UTR arrives later via webhook (Service 5)
			Status:            pspResp.Status,
			AckedAt:           ackedAt.Format(time.RFC3339),
		},
	}

	if err := l.atomicStep(ctx, func(tx *sql.Tx) error {
		if err := l.outboxRepo.EnqueueTx(ctx, tx,
			paPayload.EventID, "ProviderAcked",
			dispatchID, contractID, intentID, tenantID, traceID,
			paPayload,
		); err != nil {
			return err
		}
		return l.dispatchRepo.MarkProviderAckedTx(ctx, tx, dispatchID, pspResp.PayoutID)
	}); err != nil {
		log.Error("dispatch_loop: step5 ProviderAcked write failed",
			zap.String("dispatch_id", dispatchID),
			zap.Error(err),
		)
		// PSP call succeeded but we failed to write the ack.
		// Nacking here means Service 2 will re-lease. The idempotency
		// check in Step 1 will detect the existing SENT dispatch row
		// and attempt to recover by querying the PSP again.
		return false
	}

	log.Info("dispatch_loop: step5 ProviderAcked written",
		zap.String("dispatch_id", dispatchID),
		zap.String("provider_attempt_id", pspResp.PayoutID),
	)

	return true
}

// atomicStep executes fn inside a single PostgreSQL transaction.
// Rolls back automatically on any error returned by fn.
func (l *DispatchLoop) atomicStep(ctx context.Context, fn func(*sql.Tx) error) error {
	tx, err := l.db.BeginTx(ctx, nil)
	if err != nil {
		return fmt.Errorf("begin tx: %w", err)
	}
	if err := fn(tx); err != nil {
		_ = tx.Rollback()
		return err
	}
	if err := tx.Commit(); err != nil {
		return fmt.Errorf("commit tx: %w", err)
	}
	return nil
}

// markFailedAndEnqueue writes a DispatchFailed outbox event and marks
// the dispatch row FAILED in a single atomic transaction.
func (l *DispatchLoop) markFailedAndEnqueue(
	ctx context.Context,
	dispatchID, contractID, intentID, tenantID, traceID string,
	attemptCount int,
	reason string,
) error {
	failedAt := time.Now().UTC()
	dfPayload := model.DispatchFailedEvent{
		EventID:       uuid.New().String(),
		EventType:     "DispatchFailed",
		TenantID:      tenantID,
		IntentID:      intentID,
		ContractID:    contractID,
		DispatchID:    dispatchID,
		TraceID:       traceID,
		SchemaVersion: "v1",
		CreatedAt:     failedAt,
		Payload: model.DispatchFailedPayload{
			DispatchID:   dispatchID,
			AttemptCount: attemptCount,
			Reason:       reason,
			FailedAt:     failedAt,
		},
	}

	return l.atomicStep(ctx, func(tx *sql.Tx) error {
		if err := l.outboxRepo.EnqueueTx(ctx, tx,
			dfPayload.EventID, "DispatchFailed",
			dispatchID, contractID, intentID, tenantID, traceID,
			dfPayload,
		); err != nil {
			return err
		}
		return l.dispatchRepo.MarkFailedTx(ctx, tx, dispatchID)
	})
}

// sleep pauses for d unless ctx is cancelled.
func (l *DispatchLoop) sleep(ctx context.Context, d time.Duration) {
	select {
	case <-ctx.Done():
	case <-time.After(d):
	}
}

// amountFromOutbox converts the outbox amount to int64 for the PSP request.
// The value is passed through exactly as stored in Service 2's outbox —
// no unit conversion is applied. Whatever unit the tenant sent is what
// the PSP receives. Service 4 is not responsible for unit decisions.
func amountFromOutbox(amount json.Number) int64 {
	value, err := amount.Int64()
	if err != nil {
		// Float fallback for amounts like "5000.00"
		f, ferr := amount.Float64()
		if ferr != nil {
			return 0
		}
		return int64(f)
	}
	return value
}

// ─────────────────────────────────────────────────────────────────────────────
// Circuit breaker — protects Service 2's retry budget when PSP is down.
//
// Problem without this: if PSP is down for 30 minutes and retry budget is 7,
// the dispatch loop nacks every event on every poll cycle. After 7 nacks
// the event is FAILED in Service 2's outbox and permanently unrecoverable —
// even though nothing was wrong with the intent itself.
//
// Solution: after N consecutive PSP failures, stop leasing from Service 2
// entirely. Events stay safely in Service 2's PENDING outbox untouched.
// When PSP recovers (circuit resets after timeout), leasing resumes and
// the events are processed with their retry budget fully intact.
// ─────────────────────────────────────────────────────────────────────────────

// recordPSPSuccess resets the circuit breaker after a successful PSP call.
func (l *DispatchLoop) recordPSPSuccess() {
	l.cbMu.Lock()
	defer l.cbMu.Unlock()
	l.cbFailures = 0
	l.cbOpenAt = time.Time{}
}

// recordPSPFailure increments the failure counter and opens the circuit
// if the threshold is exceeded.
func (l *DispatchLoop) recordPSPFailure() {
	threshold := l.cfg.PSPCircuitBreakerThreshold
	if threshold <= 0 {
		threshold = 5 // default: 5 consecutive failures
	}

	l.cbMu.Lock()
	defer l.cbMu.Unlock()
	l.cbFailures++
	if l.cbFailures >= threshold && l.cbOpenAt.IsZero() {
		l.cbOpenAt = time.Now()
		utils.Logger.Error("dispatch_loop: PSP circuit breaker OPENED — pausing lease",
			zap.Int("consecutive_failures", l.cbFailures),
			zap.Int("threshold", threshold),
		)
	}
}

// circuitOpen returns true if the circuit breaker is open (PSP is down).
// Also handles auto-reset after PSPCircuitResetSecs.
func (l *DispatchLoop) circuitOpen() bool {
	resetSecs := l.cfg.PSPCircuitResetSecs
	if resetSecs <= 0 {
		resetSecs = 60 // default: try again after 60 seconds
	}

	l.cbMu.Lock()
	defer l.cbMu.Unlock()

	if l.cbOpenAt.IsZero() {
		return false // circuit closed
	}

	// Auto-reset: if enough time has passed, close the circuit and try again.
	if time.Since(l.cbOpenAt) >= time.Duration(resetSecs)*time.Second {
		utils.Logger.Info("dispatch_loop: PSP circuit breaker RESET — resuming lease",
			zap.Int("after_seconds", resetSecs),
		)
		l.cbFailures = 0
		l.cbOpenAt = time.Time{}
		return false
	}

	return true // circuit still open
}
