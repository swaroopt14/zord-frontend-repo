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
	repo CanonicalIntentRepository
	s3   *storage.S3Store
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
) *IntentService {
	return &IntentService{
		validator: v,
		//tokenizer: t,
		repo: r,
		s3:   s3,
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

// func firstNonEmpty(vals ...string) string {
// 	for _, v := range vals {
// 		v = strings.TrimSpace(v)
// 		if v != "" {
// 			return v
// 		}
// 	}
// 	return ""
// }

// func nestedString(m map[string]any, keys ...string) string {
// 	var cur any = m
// 	for _, k := range keys {
// 		obj, ok := cur.(map[string]any)
// 		if !ok {
// 			return ""
// 		}
// 		cur, ok = obj[k]
// 		if !ok {
// 			return ""
// 		}
// 	}
// 	s, _ := cur.(string)
// 	return strings.TrimSpace(s)
// }

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
	decryptedPayload, err := vault.DecryptPayload(in.EncryptedPayload) // best effort, log + continue if fails
	if err != nil {
		log.Printf("⚠️ Payload decryption failed for EnvelopeID=%s: %v", in.EnvelopeID, err)
		return nil, &models.DLQEntry{ReasonCode: "PAYLOAD_DECRYPTION_FAILED"}, nil
	}
	//log.Println("Payload decrypted successfully", string(decryptedPayload))
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

	// accountTokenRef, err := s.tokenizer.TokenizeAccountNumber(
	// 	canonicalInput.AccountNumber,
	// )
	// if err != nil {
	// 	return nil, nil, err
	// }
	// -------- STEP 8: TOKENIZATION (PII ENCLAVE SERVICE) --------
	tokenReq := enclaveTokenizeRequest{
		TenantID: in.TenantID.String(),
		TraceID:  in.TraceID.String(),
		PII: struct {
			AccountNumber string `json:"account_number"`
			IFSC          string `json:"ifsc"`
			VPA           string `json:"vpa"`
			Name          string `json:"name"`
			Phone         string `json:"phone"`
			Email         string `json:"email"`
		}{
			AccountNumber: canonicalInput.AccountNumber,
			IFSC:          canonicalInput.Beneficiary.Instrument.IFSC,
			VPA:           canonicalInput.Beneficiary.Instrument.VPA,
			Name:          canonicalInput.Beneficiary.Name,
			Phone:         canonicalInput.Remitter.Phone,
			Email:         canonicalInput.Remitter.Email,
		},
	}
	//log.Println("Data sent for tokenization", tokenReq)
	tokenMap, err := callEnclaveTokenize(ctx, tokenReq)
	if err != nil {
		return nil, nil, err
	}

	// Persist full token map in pii_tokens JSONB
	piiJSON, err := json.Marshal(tokenMap)
	if err != nil {
		return nil, nil, err
	}

	// Replace raw beneficiary PII with token references before persist
	beneficiaryTokenized := map[string]any{
		"instrument": map[string]any{
			"kind":       canonicalInput.Beneficiary.Instrument.Kind,
			"ifsc_token": tokenMap["ifsc"],
			"vpa_token":  tokenMap["vpa"],
		},
		"name_token": tokenMap["name"],
		"country":    canonicalInput.Beneficiary.Country,
	}
	beneficiaryJSON, err := json.Marshal(beneficiaryTokenized)
	if err != nil {
		return nil, nil, err
	}

	// -------- JSONB PREP --------

	// beneficiaryJSON, err := json.Marshal(canonicalInput.Beneficiary)
	// if err != nil {
	// 	return nil, nil, err
	// }

	// piiJSON, err := json.Marshal(map[string]string{
	// 	"account_number": accountTokenRef,
	// })
	// if err != nil {
	// 	return nil, nil, err
	// }

	constraintsJSON, err := json.Marshal(canonicalInput.Constraints)
	if err != nil {
		return nil, nil, err
	}

	amount, err := parseAmount(canonicalInput.Amount.Value)
	if err != nil {
		return nil, nil, err
	}

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

	canonicalPayload, err := json.Marshal(canonical)
	if err != nil {
		return nil, nil, err
	}
	outbox, err := CanonicalIntentToOutboxEvent(canonical, canonicalPayload)

	if err != nil {
		return nil, nil, err
	}

	saved, err := s.repo.Save(ctx, canonical, outbox)
	if err != nil {
		return nil, nil, err
	}

	// -------- STEP 11: WORM SNAPSHOT (S3) --------

	// versioning: v1 for now
	version := 1
	prevHash := "" // later: fetch last hash if version > 1

	canonicalBytes, err := json.Marshal(saved)
	if err != nil {
		return &saved, nil, err
	}

	objectRef, hash, err := s.s3.StoreCanonicalSnapshot(
		ctx,
		saved.TenantID,
		saved.IntentID,
		version,
		canonicalBytes,
		prevHash,
	)
	if err != nil {
		// ⚠️ Do NOT rollback DB. Log + alert + retry mechanism later.
		return &saved, nil, err
	}

	// -------- STEP 12: UPDATE DB WITH WORM METADATA --------

	err = s.repo.UpdateCanonicalSnapshotMeta(
		ctx,
		saved.IntentID,
		objectRef,
		hash,
		prevHash,
	)
	if err != nil {
		return &saved, nil, err
	}

	saved.CanonicalRef = objectRef
	saved.CanonicalHash = hash
	saved.PrevHash = prevHash

	return &saved, nil, nil

}

func (s *IntentService) processWebhook(
	ctx context.Context,
	in *models.IncomingIntent,
) (*models.CanonicalIntent, *models.DLQEntry, error) {

	// 1. Create Canonical Intent (Webhook)
	canonical := models.CanonicalIntent{
		TraceID:        in.TraceID.String(),
		IntentID:       uuid.NewString(),
		EnvelopeID:     in.EnvelopeID.String(),
		TenantID:       in.TenantID.String(),
		IdempotencyKey: in.IdempotencyKey,
		SalientHash:    "NA", // Might be empty
		IntentType:     "WEBHOOK",
		SchemaVersion:  "v1",
		Amount:         decimal.Zero,
		Currency:       "XXX",
		Status:         "CREATED",
		CreatedAt:      time.Now().UTC(),
		// Initialize JSONB fields to empty JSON object to avoid "invalid input syntax for type json"
		Constraints: json.RawMessage("{}"),
		PIITokens:   json.RawMessage("{}"),
		Beneficiary: json.RawMessage("{}"),
	}

	// 2. Create Outbox Event
	// We must use aggregate_type='intent' due to DB constraint
	payload := in.Payload
	if len(payload) == 0 {
		payload = []byte("{}")
	}

	outbox := models.OutboxEvent{
		TraceID:       canonical.TraceID,
		EnvelopeID:    canonical.EnvelopeID,
		TenantID:      canonical.TenantID,
		AggregateType: "intent",
		AggregateID:   uuid.MustParse(canonical.IntentID),
		EventType:     "WEBHOOK_RECEIVED",
		Payload:       payload,
		PayloadHash:   canonical.PayloadHash,
		Status:        "PENDING",
		CreatedAt:     time.Now(),
	}

	// 3. Save to DB (Atomic)
	saved, err := s.repo.Save(ctx, canonical, outbox)
	if err != nil {
		log.Printf("processWebhook: Save failed for EnvelopeID=%s: %v", canonical.EnvelopeID, err)
		return nil, nil, err
	}
	log.Printf("processWebhook: Save success for EnvelopeID=%s, IntentID=%s", canonical.EnvelopeID, saved.IntentID)

	// 4. Store Snapshot in S3
	version := 1
	prevHash := ""
	canonicalBytes, err := json.Marshal(saved)
	if err != nil {
		return &saved, nil, err
	}

	objectRef, hash, err := s.s3.StoreCanonicalSnapshot(
		ctx,
		saved.TenantID,
		saved.IntentID,
		version,
		canonicalBytes,
		prevHash,
	)
	if err != nil {
		return &saved, nil, err
	}

	// 5. Update DB with Snapshot Metadata
	err = s.repo.UpdateCanonicalSnapshotMeta(
		ctx,
		saved.IntentID,
		objectRef,
		hash,
		prevHash,
	)
	if err != nil {
		return &saved, nil, err
	}

	saved.CanonicalRef = objectRef
	saved.CanonicalHash = hash
	saved.PrevHash = prevHash

	return &saved, nil, nil
}
