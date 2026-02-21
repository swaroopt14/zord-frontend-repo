package services

import "zord-prompt-layer/client"

type LLMService struct {
	gemini *client.GeminiClient
}

func NewLLMService(g *client.GeminiClient) *LLMService {
	return &LLMService{gemini: g}
}

func (s *LLMService) GenerateFromContext(userQuery string, context string) (string, error) {
	prompt := "" +
		"You are Zord Prompt Layer assistant.\n" +
		"Rules:\n" +
		"1) Use only the provided CONTEXT.\n" +
		"2) If context is insufficient, explicitly say so.\n" +
		"3) Do not invent intent IDs, trace IDs, statuses, or timestamps.\n\n" +
		"CONTEXT:\n" + context + "\n\n" +
		"USER QUERY:\n" + userQuery + "\n\n" +
		"Return concise operational answer."

	return s.gemini.Generate(prompt)
}
