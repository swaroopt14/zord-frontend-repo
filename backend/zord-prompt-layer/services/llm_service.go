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
		"Core Instructions:\n" +
		"1) Use the provided CONTEXT to answer the query.\n" +
		"2) SEMANTIC FLEXIBILITY: Records in 'ingress_envelopes' are raw forms of 'payouts', 'transactions', or 'requests'. If context contains these, explain what reached the system and its status (e.g., RECEIVED).\n" +
		"3) NO REFUSALS: If context records are present, do NOT say 'I don't have information'. Instead, explain those records clearly in terms of the user's question.\n" +
		"4) FORMATTING: Use Markdown (bold, lists) for a professional answer.\n" +
		"5) Output MUST be a strict JSON object with NO external text or Markdown blocks wrapping the JSON.\n\n" +
		"JSON SCHEMA:\n" +
		"{\n" +
		"  \"answer\": \"(Detailed text using markdown)\",\n" +
		"  \"confidence\": \"high|medium|low\",\n" +
		"  \"next_actions\": [\"Suggested next steps\"]\n" +
		"}\n\n" +
		"CONTEXT:\n" + context + "\n\n" +
		"USER QUERY:\n" + userQuery + "\n\n" +
		"Return just the raw JSON object."

	return s.gemini.Generate(prompt)
}
