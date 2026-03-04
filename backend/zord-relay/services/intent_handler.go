package services

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"log"
	"strings"
	"time"

	"zord-relay/model"

	"github.com/google/uuid"
)

// IntentHandler handles messages from the intent.ready.v1 topic

type IntentHandler struct {
	repo *PayoutContractsRepo
}

type readyTopicEvent struct {
	EventID       string          `json:"event_id"`
	EventType     string          `json:"event_type"`
	TenantID      string          `json:"tenant_id"`
	IntentID      string          `json:"intent_id"`
	EnvelopeID    string          `json:"envelope_id"`
	TraceID       string          `json:"trace_id"`
	SchemaVersion string          `json:"schema_version,omitempty"`
	PayloadInline json.RawMessage `json:"payload_inline"`
	PayloadHash   string          `json:"payload_hash"`
}

type payoutContractV1 struct {
	Schema      string          `json:"schema"`
	ContractID  string          `json:"contract_id"`
	EventID     string          `json:"event_id"`
	IntentID    string          `json:"intent_id"`
	TenantID    string          `json:"tenant_id"`
	EnvelopeID  string          `json:"envelope_id"`
	PayloadHash string          `json:"payload_hash"`
	Payload     json.RawMessage `json:"payload"`
}

// NewIntentHandler creates a new IntentHandler
func NewIntentHandler(repo *PayoutContractsRepo) *IntentHandler {
	return &IntentHandler{repo: repo}
}

// HandleMessage processes the intent message and generates a payout contract
func (h *IntentHandler) HandleMessage(ctx context.Context, topic string, key string, value []byte, headers map[string]string, timestamp time.Time) error {
	log.Printf("Received message from topic %s with key %s", topic, key)

	var evt readyTopicEvent
	if err := json.Unmarshal(value, &evt); err != nil {
		log.Printf("Error decoding ready-topic event: %v", err)
		return err
	}

	payoutContract, err := h.generatePayoutContract(evt, key, headers)
	if err != nil {
		log.Printf("Error generating payout contract: %v", err)
		return err
	}

	// Save the payout contract to the database
	err = h.repo.Save(ctx, payoutContract)
	if err != nil {
		log.Printf("Error saving payout contract: %v", err)
		return err
	}

	log.Printf("Successfully processed and saved payout contract for intent %s", payoutContract.IntentID)
	return nil
}

func (h *IntentHandler) generatePayoutContract(evt readyTopicEvent, fallbackKey string, headers map[string]string) (*model.PayoutContract, error) {
	eventID := strings.TrimSpace(firstNonEmpty(evt.EventID, fallbackKey))
	intentID := strings.TrimSpace(firstNonEmpty(evt.IntentID, fallbackKey))
	tenantID := strings.TrimSpace(firstNonEmpty(evt.TenantID, headers["tenant_id"]))
	envelopeID := strings.TrimSpace(firstNonEmpty(evt.EnvelopeID))

	if _, err := uuid.Parse(eventID); err != nil {
		return nil, fmt.Errorf("invalid event_id: %w", err)
	}
	if _, err := uuid.Parse(intentID); err != nil {
		return nil, fmt.Errorf("invalid intent_id: %w", err)
	}
	if _, err := uuid.Parse(tenantID); err != nil {
		return nil, fmt.Errorf("invalid tenant_id: %w", err)
	}
	if _, err := uuid.Parse(envelopeID); err != nil {
		return nil, fmt.Errorf("invalid envelope_id: %w", err)
	}

	contractID := uuid.NewSHA1(uuid.NameSpaceOID, []byte("payout_contract.v1|"+eventID+"|"+intentID)).String()

	payload := payoutContractV1{
		Schema:      "payout_contract.v1",
		ContractID:  contractID,
		EventID:     eventID,
		IntentID:    intentID,
		TenantID:    tenantID,
		EnvelopeID:  envelopeID,
		PayloadHash: evt.PayloadHash,
		Payload:     evt.PayloadInline,
	}

	payloadBytes, err := json.Marshal(payload)
	if err != nil {
		return nil, err
	}

	hash := sha256.Sum256(payloadBytes)
	contractHash := hex.EncodeToString(hash[:])

	var tracePtr *string
	traceID := strings.TrimSpace(firstNonEmpty(evt.TraceID, headers["trace_id"]))
	if traceID != "" {
		tracePtr = &traceID
	}

	return &model.PayoutContract{
		ContractID:      contractID,
		TenantID:        tenantID,
		IntentID:        intentID,
		EnvelopeID:      envelopeID,
		ContractPayload: payloadBytes,
		ContractHash:    contractHash,
		Status:          "ISSUED",
		TraceID:         tracePtr,
	}, nil
}

func firstNonEmpty(vals ...string) string {
	for _, v := range vals {
		v = strings.TrimSpace(v)
		if v != "" {
			return v
		}
	}
	return ""
}
