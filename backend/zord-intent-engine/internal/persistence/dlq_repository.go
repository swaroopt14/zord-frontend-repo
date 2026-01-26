package persistence

import (
	"sync"

	"github.com/google/uuid"
	"main.go/internal/models"
)

type DLQRepository interface {
	Save(entry models.DLQEntry) (models.DLQEntry, error)
	List() []models.DLQEntry
}

type InMemoryDLQRepo struct {
	mu    sync.RWMutex
	store []models.DLQEntry
}

func NewInMemoryDLQRepo() *InMemoryDLQRepo {
	return &InMemoryDLQRepo{
		store: make([]models.DLQEntry, 0),
	}
}

func (r *InMemoryDLQRepo) Save(entry models.DLQEntry) (models.DLQEntry, error) {
	r.mu.Lock()
	defer r.mu.Unlock()

	entry.DLQID = uuid.NewString()
	r.store = append(r.store, entry)

	return entry, nil
}

func (r *InMemoryDLQRepo) List() []models.DLQEntry {
	r.mu.RLock()
	defer r.mu.RUnlock()
	return r.store
}
