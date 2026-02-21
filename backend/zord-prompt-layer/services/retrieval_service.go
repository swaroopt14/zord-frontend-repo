package services

import (
	"zord-prompt-layer/dto"
	"zord-prompt-layer/model"
)

type EvidenceRetriever interface {
	Retrieve(req dto.QueryRequest, intentID, traceID string, topK int) ([]model.RetrievedChunk, error)
}
