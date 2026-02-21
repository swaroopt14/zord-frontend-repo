package services

import (
	"fmt"
	"strings"

	"zord-prompt-layer/dto"
	"zord-prompt-layer/model"
	"zord-prompt-layer/utils"
)

type RAGService interface {
	Query(req dto.QueryRequest) (dto.QueryResponse, error)
}

type DefaultRAGService struct {
	model     string
	retriever EvidenceRetriever
	llm       *LLMService
	defaultK  int
}

func NewDefaultRAGService(model string, defaultK int, retriever EvidenceRetriever, llm *LLMService) *DefaultRAGService {
	return &DefaultRAGService{
		model:     model,
		defaultK:  defaultK,
		retriever: retriever,
		llm:       llm,
	}
}

func (s *DefaultRAGService) Query(req dto.QueryRequest) (dto.QueryResponse, error) {
	topK := req.TopK
	if topK <= 0 {
		topK = s.defaultK
	}

	intentID := req.IntentID
	traceID := req.TraceID
	if intentID == "" {
		intentID = utils.ExtractIntentID(req.Query)
	}
	if traceID == "" {
		traceID = utils.ExtractTraceID(req.Query)
	}

	chunks, err := s.retriever.Retrieve(req, intentID, traceID, topK)
	if err != nil {
		return dto.QueryResponse{}, fmt.Errorf("retrieval failed: %w", err)
	}

	entities := dto.EntitiesFound{IntentID: intentID, TraceID: traceID}
	citations := toCitations(chunks)
	conf := confidenceFromChunks(chunks)

	if len(chunks) == 0 {
		return dto.QueryResponse{
			Answer:        "I could not find reliable evidence for this query in the current data window.",
			Confidence:    "low",
			ModelUsed:     s.model,
			EntitiesFound: entities,
			Citations:     []dto.Citation{},
			NextActions: []string{
				"Try adding time/status context (for example: failed in last 24h)",
				"Add tenant_id/intent_id/trace_id for precise drill-down",
				"Verify upstream services are writing fresh records",
			},
		}, nil
	}

	context := buildContext(chunks)
	answer, err := s.llm.GenerateFromContext(req.Query, context)
	if err != nil {
		return dto.QueryResponse{}, fmt.Errorf("generation failed: %w", err)
	}

	return dto.QueryResponse{
		Answer:        answer,
		Confidence:    conf,
		ModelUsed:     s.model,
		EntitiesFound: entities,
		Citations:     citations,
		NextActions: []string{
			"Open cited records for verification",
			"Refine query with intent_id or trace_id for higher precision",
		},
	}, nil
}

func buildContext(chunks []model.RetrievedChunk) string {
	var b strings.Builder
	for i, c := range chunks {
		b.WriteString(fmt.Sprintf("[%d] source=%s record=%s score=%.4f\n%s\n\n", i+1, c.SourceType, c.RecordID, c.Score, c.Text))
	}
	return b.String()
}

func confidenceFromChunks(chunks []model.RetrievedChunk) string {
	if len(chunks) >= 3 {
		return "high"
	}
	if len(chunks) >= 1 {
		return "medium"
	}
	return "low"
}

func toCitations(chunks []model.RetrievedChunk) []dto.Citation {
	out := make([]dto.Citation, 0, len(chunks))
	for _, c := range chunks {
		out = append(out, dto.Citation{
			SourceType: c.SourceType,
			RecordID:   c.RecordID,
			ChunkID:    c.ChunkID,
			Snippet:    c.Text,
			Score:      c.Score,
		})
	}
	return out
}
