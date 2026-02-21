// Keeps /query orchestration complete right now.
package repositories

import (
	"zord-prompt-layer/client"
	"zord-prompt-layer/model"
)

type ChromaRepository struct {
	client     *client.ChromaClient
	collection string
}

func NewChromaRepository(c *client.ChromaClient, collection string) *ChromaRepository {
	return &ChromaRepository{
		client:     c,
		collection: collection,
	}
}

func (r *ChromaRepository) Retrieve(queryEmbedding []float32, topK int, filters map[string]any) ([]model.RetrievedChunk, error) {
	return r.client.Query(r.collection, queryEmbedding, topK, filters)
}
