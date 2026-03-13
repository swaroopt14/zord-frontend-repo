package services

import (
	"encoding/json"
	"fmt"
	"strings"

	"zord-prompt-layer/dto"
	"zord-prompt-layer/utils"
)

type RAGService interface {
	Query(req dto.QueryRequest) (dto.QueryResponse, error)
}

type DefaultRAGService struct {
	model     string
	textToSQL *TextToSQLService
	llm       *LLMService
	defaultK  int
}

func NewDefaultRAGService(model string, defaultK int, textToSQL *TextToSQLService, llm *LLMService) *DefaultRAGService {
	return &DefaultRAGService{
		model:     model,
		defaultK:  defaultK,
		textToSQL: textToSQL,
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

	citations, err := s.textToSQL.GenerateAndExecuteSQL(req)
	if err != nil {
		return dto.QueryResponse{}, fmt.Errorf("text-to-sql failed: %w", err)
	}

	entities := dto.EntitiesFound{IntentID: intentID, TraceID: traceID}

	if len(citations) == 0 {
		return dto.QueryResponse{
			Answer:        "I searched the database but found no records matching your request for this tenant.",
			Confidence:    "high",
			ModelUsed:     s.model,
			EntitiesFound: entities,
			Citations:     []dto.Citation{},
			NextActions: []string{
				"Try rephrasing your search criteria",
				"Ensure the data has been ingested for this tenant",
			},
		}, nil
	}

	contextStr := buildContext(citations)
	finalJSONAnswer, err := s.llm.GenerateFromContext(req.Query, contextStr)
	if err != nil {
		return dto.QueryResponse{}, fmt.Errorf("generation failed: %w", err)
	}

	// The LLM is requested to return `{ "answer": "...", "next_actions": [] }`
	var parsed struct {
		Answer      string   `json:"answer"`
		NextActions []string `json:"next_actions"`
	}

	cleanJSON := strings.TrimSpace(finalJSONAnswer)
	if strings.HasPrefix(cleanJSON, "```json") {
		cleanJSON = strings.TrimPrefix(cleanJSON, "```json")
		cleanJSON = strings.TrimSuffix(cleanJSON, "```")
	} else if strings.HasPrefix(cleanJSON, "```") {
		cleanJSON = strings.TrimPrefix(cleanJSON, "```")
		cleanJSON = strings.TrimSuffix(cleanJSON, "```")
	}

	if err := json.Unmarshal([]byte(cleanJSON), &parsed); err != nil {
		// Fallback if the LLM output was not strictly JSON
		parsed.Answer = finalJSONAnswer
		parsed.NextActions = []string{"Please check the input query for better results"}
	}

	return dto.QueryResponse{
		Answer:        parsed.Answer,
		ModelUsed:     s.model,
		EntitiesFound: entities,
		NextActions:   parsed.NextActions,
	}, nil
}

func buildContext(citations []dto.Citation) string {
	var b strings.Builder
	for i, c := range citations {
		b.WriteString(fmt.Sprintf("[%d] database_row:\n%s\n\n", i+1, c.Snippet))
	}
	return b.String()
}
