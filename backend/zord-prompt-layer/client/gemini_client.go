package client

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"
)

type GeminiClient struct {
	APIKey  string
	Model   string
	BaseURL string
	HTTP    *http.Client
}

func NewGeminiClient(apiKey, model, baseURL string) *GeminiClient {
	return &GeminiClient{
		APIKey:  apiKey,
		Model:   model,
		BaseURL: baseURL,
		HTTP:    &http.Client{Timeout: 30 * time.Second},
	}
}

type generateRequest struct {
	Contents []struct {
		Parts []struct {
			Text string `json:"text"`
		} `json:"parts"`
	} `json:"contents"`
}

type generateResponse struct {
	Candidates []struct {
		Content struct {
			Parts []struct {
				Text string `json:"text"`
			} `json:"parts"`
		} `json:"content"`
	} `json:"candidates"`
}

func (c *GeminiClient) Generate(prompt string) (string, error) {
	if c.APIKey == "" {
		return "", fmt.Errorf("missing GEMINI_API_KEY")
	}

	reqBody := generateRequest{
		Contents: []struct {
			Parts []struct {
				Text string `json:"text"`
			} `json:"parts"`
		}{
			{
				Parts: []struct {
					Text string `json:"text"`
				}{
					{Text: prompt},
				},
			},
		},
	}

	bodyBytes, err := json.Marshal(reqBody)
	if err != nil {
		return "", err
	}

	url := fmt.Sprintf("%s/models/%s:generateContent?key=%s", c.BaseURL, c.Model, c.APIKey)
	req, err := http.NewRequest(http.MethodPost, url, bytes.NewReader(bodyBytes))
	if err != nil {
		return "", err
	}
	req.Header.Set("Content-Type", "application/json")

	resp, err := c.HTTP.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	raw, _ := io.ReadAll(resp.Body)
	if resp.StatusCode >= 300 {
		return "", fmt.Errorf("gemini error: status=%d body=%s", resp.StatusCode, string(raw))
	}

	var out generateResponse
	if err := json.Unmarshal(raw, &out); err != nil {
		return "", err
	}
	if len(out.Candidates) == 0 || len(out.Candidates[0].Content.Parts) == 0 {
		return "", fmt.Errorf("empty response from gemini")
	}

	return out.Candidates[0].Content.Parts[0].Text, nil
}
