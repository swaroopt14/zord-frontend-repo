package services

import (
	"context"
	"encoding/json"
	"errors"
	"log"
	"math/big"
	"time"

	"github.com/google/uuid"

	"zord-intent-engine/internal/canonicalizer"
	"zord-intent-engine/internal/models"
	"zord-intent-engine/internal/pii"
	"zord-intent-engine/internal/validator"
	"zord-intent-engine/storage"
)

type IntentService struct {
	validator *validator.Validator
	tokenizer *pii.Tokenizer
	repo      CanonicalIntentRepository
	s3        *storage.S3Store
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
	t *pii.Tokenizer,
	r CanonicalIntentRepository,
	s3 *storage.S3Store, // ✅ ADD
) *IntentService {
	return &IntentService{
		validator: v,
		tokenizer: t,
		repo:      r,
		s3:        s3,
	}
}

/* ---------------- Helpers ---------------- */

func parseAmount(value string) (float64, error) {
	rat, ok := new(big.Rat).SetString(value)
	if !ok {
		return 0, errors.New("invalid amount format")
	}

	f, _ := rat.Float64()
	return f, nil
}

/* ---------------- Pipeline ---------------- */

// ProcessIncomingIntent is the ONLY entrypoint.
// It consumes ingress output from Service-1 (via Redis).
func (s *IntentService) ProcessIncomingIntent(
	ctx context.Context,
	in *models.IncomingIntent,
) (*models.CanonicalIntent, *models.DLQEntry, error) {

	// -------- STEP 0: Transport guards --------

	if len(in.Payload) == 0 {
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

	switch in.ParseStatus {
	case "PARSED":
		// OK — normal path

	case "RECEIVED":
		// Compatibility mode (temporary)
		// Service-1 hasn’t upgraded yet
		log.Printf(
			"⚠️ COMPAT: parse_status=RECEIVED treated as PARSED [envelope=%s]",
			in.EnvelopeID,
		)

	default:
		return nil, &models.DLQEntry{
			ReasonCode: "NOT_PARSED",
		}, nil
	}

	// if in.SignatureStatus == nil || *in.SignatureStatus != "VERIFIED" {
	// 	return nil, &models.DLQEntry{ReasonCode: "SIGNATURE_NOT_VERIFIED"}, nil
	// }

	// if in.PayloadHash == "" {
	// 	return nil, &models.DLQEntry{ReasonCode: "MISSING_PAYLOAD_HASH"}, nil
	// }

	if in.ObjectRef == "" {
		return nil, &models.DLQEntry{ReasonCode: "MISSING_OBJECT_REF"}, nil
	}

	// -------- STEP 4: Payload integrity verification --------

	// computedHash := sha256.Sum256(in.Payload)
	// if hex.EncodeToString(computedHash[:]) != in.PayloadHash {
	// 	return nil, &models.DLQEntry{ReasonCode: "PAYLOAD_HASH_MISMATCH"}, nil
	// }

	// -------- STEP 5: Parse raw payload into domain model --------

	var parsed models.ParsedIncomingIntent
	if err := json.Unmarshal(in.Payload, &parsed); err != nil {
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

	accountTokenRef, err := s.tokenizer.TokenizeAccountNumber(
		canonicalInput.AccountNumber,
	)
	if err != nil {
		return nil, nil, err
	}

	// -------- JSONB PREP --------

	beneficiaryJSON, err := json.Marshal(canonicalInput.Beneficiary)
	if err != nil {
		return nil, nil, err
	}

	piiJSON, err := json.Marshal(map[string]string{
		"account_number": accountTokenRef,
	})
	if err != nil {
		return nil, nil, err
	}

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
		IntentID:   uuid.NewString(),
		EnvelopeID: in.EnvelopeID.String(),
		TenantID:   in.TenantID.String(),

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

	outbox, err := CanonicalIntentToOutboxEvent(canonical, in.Payload)
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
