package services

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/google/uuid"

	"zord-intent-engine/internal/canonicalizer"
	"zord-intent-engine/internal/models"

	//"zord-intent-engine/internal/pii"
	"zord-intent-engine/internal/validator"
	"zord-intent-engine/internal/vault"
	"zord-intent-engine/storage"

	"github.com/shopspring/decimal"
	"go.opentelemetry.io/contrib/instrumentation/net/http/otelhttp"
)

type IntentService struct {
	validator *validator.Validator
	//tokenizer *pii.Tokenizer
	repo          CanonicalIntentRepository
	s3            *storage.S3Store
	tokenizeQueue *KafkaTokenizeQueue
}

var enclaveHTTPClient = &http.Client{
	Timeout:   10 * time.Second,
	Transport: otelhttp.NewTransport(http.DefaultTransport),
}

// Repository abstraction
type CanonicalIntentRepository interface {
	Save(
		ctx context.Context,
		intent models.CanonicalIntent,
		outbox models.OutboxEvent,
	) (models.CanonicalIntent, error)

	FindByEnvelope(
		ctx context.Context,
		tenantID string,
		envelopeID string,
	) (*models.CanonicalIntent, error)

	UpdateCanonicalSnapshotMeta(
		ctx context.Context,
		intentID string,
		objectRef string,
		hash string,
		prevHash string,
	) error
}

func NewIntentService(
	v *validator.Validator,
	//t *pii.Tokenizer,
	r CanonicalIntentRepository,
	s3 *storage.S3Store, // ✅ ADD
	q *KafkaTokenizeQueue,
) *IntentService {
	return &IntentService{
		validator: v,
		//tokenizer: t,
		repo:          r,
		s3:            s3,
		tokenizeQueue: q,
	}
}

/* ---------------- Helpers ---------------- */

func parseAmount(value string) (decimal.Decimal, error) {
	v := strings.TrimSpace(value)
	if v == "" {
		return decimal.Zero, errors.New("amount is required")
	}
	return decimal.NewFromString(v) // exact decimal, no rounding
}

type enclaveTokenizeRequest struct {
	TenantID string `json:"tenant_id"`
	TraceID  string `json:"trace_id"`
	PII      struct {
		AccountNumber string `json:"account_number"`
		IFSC          string `json:"ifsc"`
		VPA           string `json:"vpa"`
		Name          string `json:"name"`
		Phone         string `json:"phone"`
		Email         string `json:"email"`
	} `json:"pii"`
}

func callEnclaveTokenize(ctx context.Context, req enclaveTokenizeRequest) (map[string]string, error) {
	baseURL := strings.TrimRight(strings.TrimSpace(os.Getenv("ZORD_PII_ENCLAVE_URL")), "/")
	if baseURL == "" {
		return nil, fmt.Errorf("ZORD_PII_ENCLAVE_URL is not set")
	}

	body, err := json.Marshal(req)
	if err != nil {
		return nil, err
	}

	httpReq, err := http.NewRequestWithContext(ctx, http.MethodPost, baseURL+"/v1/tokenize", bytes.NewReader(body))
	if err != nil {
		return nil, err
	}
	httpReq.Header.Set("Content-Type", "application/json")

	resp, err := enclaveHTTPClient.Do(httpReq)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		raw, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("enclave tokenize failed: status=%d body=%s", resp.StatusCode, string(raw))
	}

	var out struct {
		Tokens map[string]string `json:"tokens"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&out); err != nil {
		return nil, err
	}
	return out.Tokens, nil
}

/* ---------------- Pipeline ---------------- */

// ProcessIncomingIntent is the ONLY entrypoint.
func (s *IntentService) ProcessIncomingIntent(
	ctx context.Context,
	event *models.Event,
) (*models.CanonicalIntent, *models.DLQEntry, error) {

	//Unmarshal Payload into IncomingIntent struct
	var in *models.IncomingIntent

	in = &models.IncomingIntent{
		TenantID:         event.TenantID,
		EnvelopeID:       event.EnvelopeID,
		TraceID:          event.TraceID,
		Source:           event.Source,
		ObjectRef:        event.ObjectRef,
		IdempotencyKey:   event.IdempotencyKey,
		EncryptedPayload: event.EncryptedPayload,
		PayloadHash:      event.PayloadHash,
	}

	// -------- STEP 0: Transport guards --------

	log.Printf("ProcessIncomingIntent: Source=%s EnvelopeID=%s", in.Source, in.EnvelopeID)

	if in.Source == "WEBHOOK" {
		log.Printf("ProcessIncomingIntent: Routing to processWebhook for EnvelopeID=%s", in.EnvelopeID)
		return s.processWebhook(ctx, in)
	}

	if len(in.EncryptedPayload) == 0 {
		return nil, &models.DLQEntry{ReasonCode: "EMPTY_PAYLOAD"}, nil
	}

	if in.TraceID == uuid.Nil {
		return nil, &models.DLQEntry{ReasonCode: "MISSING_TRACE_ID"}, nil
	}

	if in.EnvelopeID == uuid.Nil {
		return nil, &models.DLQEntry{ReasonCode: "MISSING_ENVELOPE_ID"}, nil
	}

	if in.TenantID == uuid.Nil {
		return nil, &models.DLQEntry{ReasonCode: "MISSING_TENANT_ID"}, nil
	}

	if in.ObjectRef == "" {
		return nil, &models.DLQEntry{ReasonCode: "MISSING_OBJECT_REF"}, nil
	}

	// -------- STEP 5: Parse raw payload into domain model --------
	decryptedPayload, err := vault.DecryptPayload(in.EncryptedPayload)
	if err != nil {
		log.Printf("⚠️ Payload decryption failed for EnvelopeID=%s: %v", in.EnvelopeID, err)
		return nil, &models.DLQEntry{ReasonCode: "PAYLOAD_DECRYPTION_FAILED"}, nil
	}

	var parsed models.ParsedIncomingIntent
	if err := json.Unmarshal(decryptedPayload, &parsed); err != nil {
		return nil, &models.DLQEntry{
			ReasonCode: "INVALID_JSON_PAYLOAD",
		}, nil
	}

	// -------- STEP 5.5: Idempotency guard --------

	existing, err := s.repo.FindByEnvelope(
		ctx,
		in.TenantID.String(),
		in.EnvelopeID.String(),
	)
	if err != nil {
		return nil, nil, err
	}

	if existing != nil {
		return existing, nil, nil
	}

	// -------- STEP 6: VALIDATION --------

	intent, dlq, err := s.validator.ValidateParsed(
		ctx,
		in.TenantID.String(),
		in.EnvelopeID.String(),
		parsed,
	)
	if err != nil {
		return nil, nil, err
	}

	if dlq != nil {
		return nil, dlq, nil
	}

	if intent == nil {
		return nil, nil, errors.New("validator returned nil intent")
	}

	// -------- STEP 7: CANONICALIZATION --------

	canonicalInput := canonicalizer.CanonicalizeIntent(*intent)

	// -------- STEP 8: TOKENIZATION --------

	tokenReq := enclaveTokenizeRequest{
		TenantID: in.TenantID.String(),
		TraceID:  in.TraceID.String(),
	}

	tokenReq.PII.AccountNumber = canonicalInput.AccountNumber
	tokenReq.PII.IFSC = canonicalInput.Beneficiary.Instrument.IFSC
	tokenReq.PII.VPA = canonicalInput.Beneficiary.Instrument.VPA
	tokenReq.PII.Name = canonicalInput.Beneficiary.Name
	tokenReq.PII.Phone = canonicalInput.Remitter.Phone
	tokenReq.PII.Email = canonicalInput.Remitter.Email

	tokenMap, err := callEnclaveTokenize(ctx, tokenReq)

	if err != nil {

		log.Printf("Token enclave unavailable, publishing tokenize request to Kafka: %v", err)

		// -------- KAFKA FALLBACK --------

		if s.tokenizeQueue == nil {
			return nil, nil, err
		}

		req := models.TokenizeRequestEvent{
			EventType:      "PII_TOKENIZE_REQUEST",
			TraceID:        in.TraceID.String(),
			EnvelopeID:     in.EnvelopeID.String(),
			TenantID:       in.TenantID.String(),
			ObjectRef:      in.ObjectRef,
			IdempotencyKey: in.IdempotencyKey,
			Source:         in.Source,
			ReceivedAt:     time.Now().UTC(),
			Canonical:      canonicalInput,
		}

		err = s.tokenizeQueue.PublishTokenizeRequest(ctx, req)
		if err != nil {
			log.Printf("Kafka publish failed: %v", err)
			return nil, nil, err
		}

		log.Printf("Tokenization request queued in Kafka for EnvelopeID=%s", in.EnvelopeID)

		// Stop pipeline for now
		return nil, nil, nil
	}

	// Persist full token map in pii_tokens JSONB
	piiJSON, _ := json.Marshal(tokenMap)

	beneficiaryTokenized := map[string]any{
		"instrument": map[string]any{
			"kind":       canonicalInput.Beneficiary.Instrument.Kind,
			"ifsc_token": tokenMap["ifsc"],
			"vpa_token":  tokenMap["vpa"],
		},
		"name_token": tokenMap["name"],
		"country":    canonicalInput.Beneficiary.Country,
	}

	beneficiaryJSON, _ := json.Marshal(beneficiaryTokenized)
	constraintsJSON, _ := json.Marshal(canonicalInput.Constraints)

	amount, _ := parseAmount(canonicalInput.Amount.Value)

	// -------- STEP 9: BUILD CANONICAL INTENT --------

	canonical := models.CanonicalIntent{
		TraceID:    in.TraceID.String(),
		IntentID:   uuid.NewString(),
		EnvelopeID: in.EnvelopeID.String(),
		TenantID:   in.TenantID.String(),

		IdempotencyKey: in.IdempotencyKey,
		SalientHash:    "NA",
		PayloadHash:    in.PayloadHash,

		IntentType:       canonicalInput.IntentType,
		CanonicalVersion: "v1",
		SchemaVersion:    canonicalInput.SchemaVersion,

		Amount:   amount,
		Currency: canonicalInput.Amount.Currency,

		Constraints: constraintsJSON,

		BeneficiaryType: canonicalInput.Beneficiary.Instrument.Kind,
		PIITokens:       piiJSON,
		Beneficiary:     beneficiaryJSON,

		Status:    "CREATED",
		CreatedAt: time.Now().UTC(),
	}

	// -------- STEP 10: OUTBOX + PERSISTENCE (ATOMIC DB) --------

	canonicalPayload, _ := json.Marshal(canonical)

	outbox, _ := CanonicalIntentToOutboxEvent(canonical, canonicalPayload)

	saved, _ := s.repo.Save(ctx, canonical, outbox)

	// -------- STEP 11: WORM SNAPSHOT (S3) --------

	version := 1
	prevHash := ""

	canonicalBytes, _ := json.Marshal(saved)

	objectRef, hash, _ := s.s3.StoreCanonicalSnapshot(
		ctx,
		saved.TenantID,
		saved.IntentID,
		version,
		canonicalBytes,
		prevHash,
	)

	// -------- STEP 12: UPDATE DB WITH WORM METADATA --------

	s.repo.UpdateCanonicalSnapshotMeta(
		ctx,
		saved.IntentID,
		objectRef,
		hash,
		prevHash,
	)

	saved.CanonicalRef = objectRef
	saved.CanonicalHash = hash
	saved.PrevHash = prevHash

	return &saved, nil, nil
}

/* ---------------- ASYNC TOKENIZATION RESULT (KAFKA) ---------------- */

// ProcessTokenizeResult resumes the pipeline when tokenization
// result arrives asynchronously from Kafka (pii.tokenize.result)
func (s *IntentService) ProcessTokenizeResult(
	ctx context.Context,
	event *models.TokenizeResultEvent,
) (*models.CanonicalIntent, error) {

	log.Printf("ProcessTokenizeResult: EnvelopeID=%s", event.EnvelopeID)

	tokenMap := event.Tokens

	beneficiaryTokenized := map[string]any{
		"name_token": tokenMap["name"],
	}

	beneficiaryJSON, _ := json.Marshal(beneficiaryTokenized)
	piiJSON, _ := json.Marshal(tokenMap)

	canonical := models.CanonicalIntent{
		TraceID:    event.TraceID,
		IntentID:   uuid.NewString(),
		EnvelopeID: event.EnvelopeID,
		TenantID:   event.TenantID,

		Status:    "CREATED",
		CreatedAt: time.Now().UTC(),

		PIITokens:   piiJSON,
		Beneficiary: beneficiaryJSON,
	}

	payload, _ := json.Marshal(canonical)

	outbox, _ := CanonicalIntentToOutboxEvent(canonical, payload)

	saved, _ := s.repo.Save(ctx, canonical, outbox)

	return &saved, nil
}

/* ---------------- WEBHOOK ---------------- */

func (s *IntentService) processWebhook(
	ctx context.Context,
	in *models.IncomingIntent,
) (*models.CanonicalIntent, *models.DLQEntry, error) {

	canonical := models.CanonicalIntent{
		TraceID:        in.TraceID.String(),
		IntentID:       uuid.NewString(),
		EnvelopeID:     in.EnvelopeID.String(),
		TenantID:       in.TenantID.String(),
		IdempotencyKey: in.IdempotencyKey,
		SalientHash:    "NA",
		IntentType:     "WEBHOOK",
		SchemaVersion:  "v1",
		Amount:         decimal.Zero,
		Currency:       "XXX",
		Status:         "CREATED",
		CreatedAt:      time.Now().UTC(),

		Constraints: json.RawMessage("{}"),
		PIITokens:   json.RawMessage("{}"),
		Beneficiary: json.RawMessage("{}"),
	}

	payload := []byte("{}")

	outbox := models.OutboxEvent{
		TraceID:       canonical.TraceID,
		EnvelopeID:    canonical.EnvelopeID,
		TenantID:      canonical.TenantID,
		AggregateType: "intent",
		AggregateID:   uuid.MustParse(canonical.IntentID),
		EventType:     "WEBHOOK_RECEIVED",
		Payload:       payload,
		Status:        "PENDING",
		CreatedAt:     time.Now(),
	}

	saved, err := s.repo.Save(ctx, canonical, outbox)
	if err != nil {
		return nil, nil, err
	}

	return &saved, nil, nil
}
