package services

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"time"
)

// TokenClient calls Service 3 (Token Enclave) for JIT detokenization.
// Detokenization must only happen immediately before a PSP call.
// Resolved values must never be logged, stored, or passed outside
// the function that calls Do().
type TokenClient interface {
	// Detokenize resolves a slice of token IDs to their plaintext values.
	// purpose must be "PSP_EXECUTION" for dispatch calls.
	// Returns a map of token_id → plaintext value.
	// The caller is responsible for zeroing the map values after use.
	Detokenize(ctx context.Context, req DetokenizeRequest) (*DetokenizeResponse, error)
}

type DetokenizeRequest struct {
	TenantID         string            `json:"tenant_id"`
	TraceID          string            `json:"trace_id"`
	IntentID         string            `json:"intent_id"`
	Purpose          string            `json:"purpose"`           // "PSP_EXECUTION"
	RequestedTTLSecs int               `json:"requested_ttl_seconds"`
	Items            []DetokenizeItem  `json:"items"`
}

type DetokenizeItem struct {
	TokenID string `json:"token_id"`
}

type DetokenizeResponse struct {
	ExpiresAt time.Time              `json:"expires_at"`
	Items     []DetokenizeResultItem `json:"items"`
}

type DetokenizeResultItem struct {
	TokenID   string `json:"token_id"`
	Plaintext string `json:"plaintext"`
	// Meta contains non-PII routing fields returned alongside the token.
	// For bank_account tokens, meta includes ifsc.
	Meta map[string]string `json:"meta,omitempty"`
}

// HTTPTokenClient is the real Service 3 client.
// Wire this in when Service 3 is available.
type HTTPTokenClient struct {
	baseURL string
	http    *http.Client
}

func NewHTTPTokenClient(baseURL string, timeoutSecs int) *HTTPTokenClient {
	return &HTTPTokenClient{
		baseURL: baseURL,
		http: &http.Client{
			Timeout: time.Duration(timeoutSecs) * time.Second,
		},
	}
}

func (c *HTTPTokenClient) Detokenize(ctx context.Context, req DetokenizeRequest) (*DetokenizeResponse, error) {
	body, err := json.Marshal(req)
	if err != nil {
		return nil, fmt.Errorf("token_client: marshal: %w", err)
	}

	httpReq, err := http.NewRequestWithContext(ctx, http.MethodPost, c.baseURL+"/v1/detokenize", bytes.NewReader(body))
	if err != nil {
		return nil, fmt.Errorf("token_client: build request: %w", err)
	}
	httpReq.Header.Set("Content-Type", "application/json")

	resp, err := c.http.Do(httpReq)
	if err != nil {
		return nil, fmt.Errorf("token_client: request failed: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("token_client: HTTP %d", resp.StatusCode)
	}

	var result DetokenizeResponse
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, fmt.Errorf("token_client: decode response: %w", err)
	}
	return &result, nil
}

// StubTokenClient returns placeholder values for local development.
// Replace with HTTPTokenClient before connecting to any real PSP.
// NEVER use this in production — it returns fake account numbers.
type StubTokenClient struct{}

func NewStubTokenClient() *StubTokenClient {
	return &StubTokenClient{}
}

func (c *StubTokenClient) Detokenize(_ context.Context, req DetokenizeRequest) (*DetokenizeResponse, error) {
	items := make([]DetokenizeResultItem, 0, len(req.Items))
	for _, item := range req.Items {
		items = append(items, DetokenizeResultItem{
			TokenID:   item.TokenID,
			Plaintext: "STUB_" + item.TokenID, // placeholder — not a real account
		})
	}
	return &DetokenizeResponse{
		ExpiresAt: time.Now().Add(30 * time.Second),
		Items:     items,
	}, nil
}
