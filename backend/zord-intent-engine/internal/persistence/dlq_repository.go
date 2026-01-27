package persistence

import (
	"context"
	"database/sql"

	"github.com/google/uuid"
	"main.go/internal/models"
)

// DLQRepository defines how DLQ entries are persisted
type DLQRepository interface {
	Save(ctx context.Context, entry models.DLQEntry) (models.DLQEntry, error)
}

// Concrete Postgres implementation
type DLQPostgresRepo struct {
	db *sql.DB
}

// Constructor (returns interface, not pointer-to-interface)
func NewDLQRepo(db *sql.DB) DLQRepository {
	return &DLQPostgresRepo{db: db}
}

// Compile-time guarantee that implementation matches interface
var _ DLQRepository = (*DLQPostgresRepo)(nil)

func (r *DLQPostgresRepo) Save(
	ctx context.Context,
	entry models.DLQEntry,
) (models.DLQEntry, error) {

	entry.DLQID = uuid.NewString()

	_, err := r.db.ExecContext(ctx, `
		INSERT INTO dlq_items (
			dlq_id, tenant_id, envelope_id,
			stage, reason_code, error_detail,
			replayable, created_at
		) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
	`,
		entry.DLQID,
		entry.TenantID,
		entry.EnvelopeID,
		entry.Stage,
		entry.ReasonCode,
		entry.ErrorDetail,
		entry.Replayable,
		entry.CreatedAt,
	)

	return entry, err
}
