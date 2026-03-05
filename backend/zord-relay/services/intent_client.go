package services

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"time"
	"zord-relay/model"

	"go.opentelemetry.io/contrib/instrumentation/net/http/otelhttp"
)

type IntentClient struct {
	baseURL    string
	httpClient *http.Client
}

type LeaseResponse struct {
	LeaseID    string              `json:"lease_id"`
	LeaseUntil *time.Time          `json:"lease_until,omitempty"`
	Events     []model.OutboxEvent `json:"events"`
}

type AckNackRequest struct {
	LeaseID  string   `json:"lease_id"`
	EventIDs []string `json:"event_ids"`
}

func NewIntentClient(baseURL string) *IntentClient {
	return &IntentClient{
		baseURL: baseURL,
		httpClient: &http.Client{
			Timeout:   10 * time.Second,
			Transport: otelhttp.NewTransport(http.DefaultTransport),
		},
	}
}

func (c *IntentClient) Lease(ctx context.Context, limit int) (*LeaseResponse, error) {
	url := fmt.Sprintf("%s/internal/outbox/lease?limit=%d", c.baseURL, limit)
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
	if err != nil {
		return nil, err
	}

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("lease failed with status: %d", resp.StatusCode)
	}

	var leaseResp LeaseResponse
	if err := json.NewDecoder(resp.Body).Decode(&leaseResp); err != nil {
		return nil, err
	}

	return &leaseResp, nil
}

func (c *IntentClient) Ack(ctx context.Context, leaseID string, eventIDs []string) error {
	return c.sendAckNack(ctx, "/internal/outbox/ack", leaseID, eventIDs)
}

func (c *IntentClient) Nack(ctx context.Context, leaseID string, eventIDs []string) error {
	return c.sendAckNack(ctx, "/internal/outbox/nack", leaseID, eventIDs)
}

func (c *IntentClient) sendAckNack(ctx context.Context, path, leaseID string, eventIDs []string) error {
	url := c.baseURL + path
	reqBody, err := json.Marshal(AckNackRequest{
		LeaseID:  leaseID,
		EventIDs: eventIDs,
	})
	if err != nil {
		return err
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, url, bytes.NewBuffer(reqBody))
	if err != nil {
		return err
	}
	req.Header.Set("Content-Type", "application/json")

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("%s failed with status: %d", path, resp.StatusCode)
	}

	return nil
}
