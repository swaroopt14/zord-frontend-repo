package client

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"

	"zord-prompt-layer/model"
)

type ChromaClient struct {
	BaseURL  string
	Tenant   string
	Database string
	HTTP     *http.Client
}

func NewChromaClient(baseURL, tenant, database string) *ChromaClient {
	return &ChromaClient{
		BaseURL:  baseURL,
		Tenant:   tenant,
		Database: database,
		HTTP:     &http.Client{Timeout: 20 * time.Second},
	}
}

type queryRequest struct {
	QueryEmbeddings [][]float32    `json:"query_embeddings"`
	NResults        int            `json:"n_results"`
	Where           map[string]any `json:"where,omitempty"`
	Include         []string       `json:"include"`
}

type queryResponse struct {
	IDs       [][]string         `json:"ids"`
	Documents [][]string         `json:"documents"`
	Metadatas [][]map[string]any `json:"metadatas"`
	Distances [][]float64        `json:"distances"`
}

func (c *ChromaClient) Query(collection string, queryEmbedding []float32, topK int, where map[string]any) ([]model.RetrievedChunk, error) {
	reqBody := queryRequest{
		QueryEmbeddings: [][]float32{queryEmbedding},
		NResults:        topK,
		Where:           where,
		Include:         []string{"documents", "metadatas", "distances"},
	}

	b, err := json.Marshal(reqBody)
	if err != nil {
		return nil, err
	}

	url := fmt.Sprintf(
		"%s/api/v2/tenants/%s/databases/%s/collections/%s/query",
		c.BaseURL, c.Tenant, c.Database, collection,
	)

	req, err := http.NewRequest(http.MethodPost, url, bytes.NewReader(b))
	if err != nil {
		return nil, err
	}
	req.Header.Set("Content-Type", "application/json")

	resp, err := c.HTTP.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	raw, _ := io.ReadAll(resp.Body)
	if resp.StatusCode >= 300 {
		return nil, fmt.Errorf("chroma query failed: status=%d body=%s", resp.StatusCode, string(raw))
	}

	var out queryResponse
	if err := json.Unmarshal(raw, &out); err != nil {
		return nil, err
	}

	// Flatten first query result set
	var chunks []model.RetrievedChunk
	if len(out.IDs) == 0 {
		return chunks, nil
	}

	ids := out.IDs[0]
	var docs []string
	var metas []map[string]any
	var dists []float64

	if len(out.Documents) > 0 {
		docs = out.Documents[0]
	}
	if len(out.Metadatas) > 0 {
		metas = out.Metadatas[0]
	}
	if len(out.Distances) > 0 {
		dists = out.Distances[0]
	}

	for i := range ids {
		chunk := model.RetrievedChunk{
			ChunkID: ids[i],
		}
		if i < len(docs) {
			chunk.Text = docs[i]
		}
		if i < len(dists) {
			chunk.Score = 1.0 - dists[i] // convert distance -> rough similarity
		}
		if i < len(metas) {
			m := metas[i]
			chunk.SourceType = toString(m["source_type"])
			chunk.RecordID = toString(m["record_id"])
			chunk.IntentID = toString(m["intent_id"])
			chunk.TraceID = toString(m["trace_id"])
			chunk.TenantID = toString(m["tenant_id"])
		}
		chunks = append(chunks, chunk)
	}

	return chunks, nil
}

func toString(v any) string {
	if v == nil {
		return ""
	}
	s, _ := v.(string)
	return s
}
