package services

import (
	"log"
	"time"

	"github.com/google/uuid"
	"zord-intent-engine/internal/models"
)

func CanonicalIntentToOutboxEvent(
	intent models.CanonicalIntent,
	payload []byte,
) (models.OutboxEvent, error) {

	intId, err := uuid.Parse(intent.IntentID)
	if err != nil {
		log.Fatal("Invalid Intent ID", intId)
	}

	return models.OutboxEvent{
		TenantID:      intent.TenantID,
		AggregateType: "intent",
		AggregateID:   intId,
		EventType:     "eventTypePlaceholder",
		Payload:       payload,
		Status:        "PENDING",
		CreatedAt:     time.Now(),
		EnvelopeID:    intent.EnvelopeID,
	}, nil
}
