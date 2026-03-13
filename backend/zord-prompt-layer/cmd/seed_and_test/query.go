package main

import (
	"bytes"
	"encoding/json"
	"io"
	"log"
	"net/http"
	"time"
)

// Same demo IDs as in seed.go so the prompt layer can retrieve linked rows.
const (
	qTenantID   = "11111111-1111-4111-8111-111111111111"
	qIntentID   = "22222222-2222-4222-8222-222222222222"
	qTraceID    = "33333333-3333-4333-8333-333333333333"
	defaultBase = "http://zord-prompt-layer:8086"
)

type QueryRequest struct {
	TenantID string `json:"tenant_id,omitempty"`
	Query    string `json:"query"`
	IntentID string `json:"intent_id,omitempty"`
	TraceID  string `json:"trace_id,omitempty"`
	TopK     int    `json:"top_k,omitempty"`
}

func query() {
	base := getenv("PROMPT_LAYER_BASE_URL", defaultBase)
	url := getenv("PROMPT_LAYER_URL", base+"/query")

	log.Printf("PROMPT_LAYER_URL=%s", url)

	queries := []QueryRequest{
		{
			TenantID: qTenantID,
			Query:    "Why did my last intent fail?",
			IntentID: qIntentID,
			TraceID:  qTraceID,
			TopK:     5,
		},
		{
			TenantID: qTenantID,
			Query:    "Have any payments of mine failed lately? If yes, why?",
			TopK:     5,
		},
		{
			TenantID: qTenantID,
			Query:    "What were my last 2 payments like?",
			TopK:     5,
		},
	}

	for i, body := range queries {
		log.Printf("\n--- EXECUTING QUERY %d ---", i+1)
		log.Printf("Question: %s", body.Query)
		log.Printf("Provided IDs - Intent: %s, Trace: %s\n", body.IntentID, body.TraceID)

		bs, err := json.Marshal(body)
		if err != nil {
			log.Fatalf("marshal request: %v", err)
		}

		req, err := http.NewRequest(http.MethodPost, url, bytes.NewReader(bs))
		if err != nil {
			log.Fatalf("new request: %v", err)
		}
		req.Header.Set("Content-Type", "application/json")

		client := &http.Client{Timeout: 45 * time.Second} // T2S might take longer
		resp, err := client.Do(req)
		if err != nil {
			log.Fatalf("http do: %v", err)
		}
		defer resp.Body.Close()

		raw, _ := io.ReadAll(resp.Body)
		log.Printf("Prompt layer status=%d", resp.StatusCode)
		log.Printf("Prompt layer body=\n%s\n", string(raw))
	}
}
