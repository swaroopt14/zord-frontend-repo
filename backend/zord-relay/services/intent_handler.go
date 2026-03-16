package services

import (
	"context"
	"crypto/sha1"
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
	dispatches *DispatchRepo
	outbox     *OutboxRepo
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
func NewIntentHandler(dispatches *DispatchRepo, outbox *OutboxRepo) *IntentHandler {
	return &IntentHandler{dispatches: dispatches, outbox: outbox}
}

// HandleMessage processes the intent message and generates a payout contract
func (h *IntentHandler) HandleMessage(ctx context.Context, topic string, key string, value []byte, headers map[string]string, timestamp time.Time) error {
	log.Printf("Received message from topic %s with key %s", topic, key)

	var evt readyTopicEvent
	if err := json.Unmarshal(value, &evt); err != nil {
		log.Printf("Error decoding ready-topic event: %v", err)
		return err
	}

	dispatchID := "disp_" + uuid.New().String()
	connectorID := "razorpayx"
	corridorID := "IMPS"
	contractID, err := h.computeContractID(evt)
	if err != nil {
		return err
	}

	d := &model.Dispatch{
		DispatchID:   dispatchID,
		ContractID:   contractID,
		IntentID:     strings.TrimSpace(firstNonEmpty(evt.IntentID, key)),
		TenantID:     strings.TrimSpace(firstNonEmpty(evt.TenantID, headers["tenant_id"])),
		TraceID:      strings.TrimSpace(firstNonEmpty(evt.TraceID, headers["trace_id"])),
		ConnectorID:  connectorID,
		CorridorID:   corridorID,
		AttemptCount: 1,
		Status:       "PENDING",
		CreatedAt:    time.Now(),
	}
	if err := h.dispatches.Create(ctx, d); err != nil {
		return err
	}

	evtMsg := model.DispatchCreated{
		EventID:    uuid.New().String(),
		EventType:  "DispatchCreated",
		TenantID:   d.TenantID,
		IntentID:   d.IntentID,
		ContractID: d.ContractID,
		TraceID:    d.TraceID,
		CreatedAt:  time.Now(),
	}
	evtMsg.Payload.DispatchID = d.DispatchID
	evtMsg.Payload.ConnectorID = d.ConnectorID
	evtMsg.Payload.CorridorID = d.CorridorID
	evtMsg.Payload.AttemptCount = d.AttemptCount

	payloadBytes, _ := json.Marshal(evtMsg)
	eventID := "evt_" + uuid.New().String()
	if err := h.outbox.Enqueue(ctx, eventID, "DispatchCreated", d.DispatchID, d.ContractID, d.IntentID, d.TenantID, d.TraceID, payloadBytes); err != nil {
		return err
	}

	log.Printf("Dispatch initialized and enqueued for intent %s", d.IntentID)
	return nil
}

func (h *IntentHandler) computeContractID(evt readyTopicEvent) (string, error) {
	eventID := strings.TrimSpace(evt.EventID)
	intentID := strings.TrimSpace(evt.IntentID)
	if eventID == "" || intentID == "" {
		return "", fmt.Errorf("missing ids")
	}
	sum := sha1.Sum([]byte("payout_contract.v1|" + eventID + "|" + intentID))
	u := uuid.NewSHA1(uuid.NameSpaceOID, sum[:]).String()
	return u, nil
}

func (h *IntentHandler) generatePayoutContract(evt readyTopicEvent, fallbackKey string, headers map[string]string) (*model.PayoutContract, error) {
	return nil, fmt.Errorf("deprecated")
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
