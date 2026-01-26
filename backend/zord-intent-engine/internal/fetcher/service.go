package fetcher

import (
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"time"

	"main.go/internal/models"

	"github.com/google/uuid"
)

type Service struct {
	repo RawEnvelopeRepository
}

func NewService(repo RawEnvelopeRepository) *Service {
	return &Service{repo: repo}
}

func (s *Service) StoreRawIntent(payload json.RawMessage) (models.RawEnvelope, error) {
	checksum := sha256.Sum256(payload)

	envelope := models.RawEnvelope{
		EnvelopeID:    uuid.NewString(),
		SchemaVersion: "intent.request.v1",
		SourceType:    "JSON",
		Payload:       payload,
		ReceivedAt:    time.Now().UTC(),
		Checksum:      hex.EncodeToString(checksum[:]),
	}

	err := s.repo.Save(envelope)
	if err != nil {
		return models.RawEnvelope{}, err
	}

	return envelope, nil
}

func (s *Service) FetchByID(envelopeID string) (models.RawEnvelope, error) {
	return s.repo.FindByID(envelopeID)
}
