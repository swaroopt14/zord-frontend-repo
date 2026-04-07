package repository

import (
	"context"
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/google/uuid"
)

const (
	UserStatusActive   = "ACTIVE"
	UserStatusDisabled = "DISABLED"
)

type Repository struct {
	db *sql.DB
}

type WorkspaceRecord struct {
	TenantID      uuid.UUID
	TenantName    string
	WorkspaceCode string
	IsActive      bool
}

type UserRecord struct {
	UserID              uuid.UUID
	TenantID            uuid.UUID
	TenantName          string
	WorkspaceCode       string
	Email               string
	PasswordHash        string
	Role                string
	Status              string
	FailedLoginAttempts int
	LockedUntil         sql.NullTime
	LastLoginAt         sql.NullTime
	MFAEnabled          bool
	Name                string
	CreatedBy           sql.NullString
	CreatedAt           time.Time
	UpdatedAt           time.Time
}

type RefreshTokenRecord struct {
	TokenID            uuid.UUID
	UserID             uuid.UUID
	TenantID           uuid.UUID
	SessionID          uuid.UUID
	TokenHash          string
	ExpiresAt          time.Time
	RevokedAt          sql.NullTime
	ReplacedByTokenID  sql.NullString
	CreatedIP          sql.NullString
	CreatedUserAgent   sql.NullString
	LastUsedAt         sql.NullTime
}

type AuditEvent struct {
	TenantID   *uuid.UUID
	UserID     *uuid.UUID
	EventType  string
	IP         string
	UserAgent  string
	Metadata   map[string]any
	OccurredAt time.Time
}

type CreateUserParams struct {
	UserID       uuid.UUID
	TenantID     uuid.UUID
	Email        string
	PasswordHash string
	Role         string
	Status       string
	MFAEnabled   bool
	Name         string
	CreatedBy    *uuid.UUID
}

func New(db *sql.DB) *Repository {
	return &Repository{db: db}
}

func (r *Repository) FindWorkspaceByIdentifier(ctx context.Context, workspaceIdentifier string) (*WorkspaceRecord, error) {
	query := `
		SELECT tenant_id, tenant_name, workspace_code, is_active
		FROM tenants
		WHERE workspace_code = $1 OR tenant_id::text = $1
		ORDER BY CASE WHEN workspace_code = $1 THEN 0 ELSE 1 END
		LIMIT 1
	`

	var record WorkspaceRecord
	err := r.db.QueryRowContext(ctx, query, strings.ToLower(strings.TrimSpace(workspaceIdentifier))).Scan(
		&record.TenantID,
		&record.TenantName,
		&record.WorkspaceCode,
		&record.IsActive,
	)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, nil
	}
	if err != nil {
		return nil, fmt.Errorf("find workspace by identifier: %w", err)
	}
	return &record, nil
}

func (r *Repository) FindWorkspaceForBootstrap(ctx context.Context, tenantID string, workspaceCode string) (*WorkspaceRecord, error) {
	if strings.TrimSpace(tenantID) != "" {
		query := `SELECT tenant_id, tenant_name, workspace_code, is_active FROM tenants WHERE tenant_id::text = $1`
		var record WorkspaceRecord
		err := r.db.QueryRowContext(ctx, query, tenantID).Scan(&record.TenantID, &record.TenantName, &record.WorkspaceCode, &record.IsActive)
		if errors.Is(err, sql.ErrNoRows) {
			return nil, nil
		}
		if err != nil {
			return nil, fmt.Errorf("find bootstrap workspace by tenant id: %w", err)
		}
		return &record, nil
	}

	if strings.TrimSpace(workspaceCode) == "" {
		return nil, nil
	}

	return r.FindWorkspaceByIdentifier(ctx, workspaceCode)
}

func (r *Repository) FindUserByTenantAndEmail(ctx context.Context, tenantID uuid.UUID, email string) (*UserRecord, error) {
	query := `
		SELECT u.user_id, u.tenant_id, t.tenant_name, t.workspace_code, u.email, u.password_hash, u.role, u.status,
		       u.failed_login_attempts, u.locked_until, u.last_login_at, u.mfa_enabled, u.name, u.created_by,
		       u.created_at, u.updated_at
		FROM auth_users u
		JOIN tenants t ON t.tenant_id = u.tenant_id
		WHERE u.tenant_id = $1 AND u.email = $2
		LIMIT 1
	`

	return r.scanUser(ctx, query, tenantID, strings.ToLower(strings.TrimSpace(email)))
}

func (r *Repository) FindAnyUserByEmail(ctx context.Context, email string) (*UserRecord, error) {
	query := `
		SELECT u.user_id, u.tenant_id, t.tenant_name, t.workspace_code, u.email, u.password_hash, u.role, u.status,
		       u.failed_login_attempts, u.locked_until, u.last_login_at, u.mfa_enabled, u.name, u.created_by,
		       u.created_at, u.updated_at
		FROM auth_users u
		JOIN tenants t ON t.tenant_id = u.tenant_id
		WHERE u.email = $1
		ORDER BY u.created_at ASC
		LIMIT 1
	`

	return r.scanUser(ctx, query, strings.ToLower(strings.TrimSpace(email)))
}

func (r *Repository) FindUserByID(ctx context.Context, userID uuid.UUID) (*UserRecord, error) {
	query := `
		SELECT u.user_id, u.tenant_id, t.tenant_name, t.workspace_code, u.email, u.password_hash, u.role, u.status,
		       u.failed_login_attempts, u.locked_until, u.last_login_at, u.mfa_enabled, u.name, u.created_by,
		       u.created_at, u.updated_at
		FROM auth_users u
		JOIN tenants t ON t.tenant_id = u.tenant_id
		WHERE u.user_id = $1
		LIMIT 1
	`

	return r.scanUser(ctx, query, userID)
}

func (r *Repository) UpdateFailedLoginState(ctx context.Context, userID uuid.UUID, failedAttempts int, lockedUntil *time.Time) error {
	query := `
		UPDATE auth_users
		SET failed_login_attempts = $2,
		    locked_until = $3,
		    updated_at = now()
		WHERE user_id = $1
	`
	_, err := r.db.ExecContext(ctx, query, userID, failedAttempts, lockedUntil)
	if err != nil {
		return fmt.Errorf("update failed login state: %w", err)
	}
	return nil
}

func (r *Repository) MarkLoginSuccess(ctx context.Context, userID uuid.UUID, lastLoginAt time.Time) error {
	query := `
		UPDATE auth_users
		SET failed_login_attempts = 0,
		    locked_until = NULL,
		    last_login_at = $2,
		    updated_at = now()
		WHERE user_id = $1
	`
	_, err := r.db.ExecContext(ctx, query, userID, lastLoginAt)
	if err != nil {
		return fmt.Errorf("mark login success: %w", err)
	}
	return nil
}

func (r *Repository) StoreRefreshToken(ctx context.Context, record RefreshTokenRecord) error {
	query := `
		INSERT INTO auth_refresh_tokens (
			token_id, user_id, tenant_id, session_id, token_hash, expires_at,
			created_ip, created_user_agent, created_at, updated_at
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, now(), now())
	`
	_, err := r.db.ExecContext(
		ctx,
		query,
		record.TokenID,
		record.UserID,
		record.TenantID,
		record.SessionID,
		record.TokenHash,
		record.ExpiresAt,
		nullableString(record.CreatedIP.String),
		nullableString(record.CreatedUserAgent.String),
	)
	if err != nil {
		return fmt.Errorf("store refresh token: %w", err)
	}
	return nil
}

func (r *Repository) FindActiveRefreshTokenByHash(ctx context.Context, tokenHash string) (*RefreshTokenRecord, error) {
	query := `
		SELECT token_id, user_id, tenant_id, session_id, token_hash, expires_at, revoked_at,
		       replaced_by_token_id, created_ip, created_user_agent, last_used_at
		FROM auth_refresh_tokens
		WHERE token_hash = $1
		LIMIT 1
	`

	var record RefreshTokenRecord
	err := r.db.QueryRowContext(ctx, query, tokenHash).Scan(
		&record.TokenID,
		&record.UserID,
		&record.TenantID,
		&record.SessionID,
		&record.TokenHash,
		&record.ExpiresAt,
		&record.RevokedAt,
		&record.ReplacedByTokenID,
		&record.CreatedIP,
		&record.CreatedUserAgent,
		&record.LastUsedAt,
	)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, nil
	}
	if err != nil {
		return nil, fmt.Errorf("find refresh token: %w", err)
	}
	return &record, nil
}

func (r *Repository) RotateRefreshToken(ctx context.Context, currentTokenID uuid.UUID, replacement RefreshTokenRecord) error {
	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return fmt.Errorf("begin refresh token rotation: %w", err)
	}
	defer tx.Rollback()

	updateQuery := `
		UPDATE auth_refresh_tokens
		SET revoked_at = now(),
		    replaced_by_token_id = $2,
		    last_used_at = now(),
		    updated_at = now()
		WHERE token_id = $1 AND revoked_at IS NULL
	`
	result, err := tx.ExecContext(ctx, updateQuery, currentTokenID, replacement.TokenID.String())
	if err != nil {
		return fmt.Errorf("revoke current refresh token: %w", err)
	}
	affectedRows, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("read refresh rotation rows: %w", err)
	}
	if affectedRows == 0 {
		return errors.New("refresh token already rotated")
	}

	insertQuery := `
		INSERT INTO auth_refresh_tokens (
			token_id, user_id, tenant_id, session_id, token_hash, expires_at,
			created_ip, created_user_agent, created_at, updated_at
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, now(), now())
	`
	if _, err := tx.ExecContext(
		ctx,
		insertQuery,
		replacement.TokenID,
		replacement.UserID,
		replacement.TenantID,
		replacement.SessionID,
		replacement.TokenHash,
		replacement.ExpiresAt,
		nullableString(replacement.CreatedIP.String),
		nullableString(replacement.CreatedUserAgent.String),
	); err != nil {
		return fmt.Errorf("store rotated refresh token: %w", err)
	}

	if err := tx.Commit(); err != nil {
		return fmt.Errorf("commit refresh rotation: %w", err)
	}
	return nil
}

func (r *Repository) RevokeRefreshTokenByHash(ctx context.Context, tokenHash string) error {
	query := `
		UPDATE auth_refresh_tokens
		SET revoked_at = now(),
		    updated_at = now()
		WHERE token_hash = $1 AND revoked_at IS NULL
	`
	if _, err := r.db.ExecContext(ctx, query, tokenHash); err != nil {
		return fmt.Errorf("revoke refresh token: %w", err)
	}
	return nil
}

func (r *Repository) AdminExists(ctx context.Context) (bool, error) {
	var count int
	query := `SELECT COUNT(*) FROM auth_users WHERE role = 'ADMIN'`
	if err := r.db.QueryRowContext(ctx, query).Scan(&count); err != nil {
		return false, fmt.Errorf("count admin users: %w", err)
	}
	return count > 0, nil
}

func (r *Repository) CreateUser(ctx context.Context, params CreateUserParams) (*UserRecord, error) {
	query := `
		INSERT INTO auth_users (
			user_id, tenant_id, email, password_hash, role, status, failed_login_attempts,
			mfa_enabled, name, created_by, created_at, updated_at
		) VALUES ($1, $2, $3, $4, $5, $6, 0, $7, $8, $9, now(), now())
		RETURNING user_id
	`
	if err := r.db.QueryRowContext(
		ctx,
		query,
		params.UserID,
		params.TenantID,
		params.Email,
		params.PasswordHash,
		params.Role,
		params.Status,
		params.MFAEnabled,
		params.Name,
		nullableUUID(params.CreatedBy),
	).Scan(&params.UserID); err != nil {
		return nil, fmt.Errorf("create auth user: %w", err)
	}

	return r.FindUserByID(ctx, params.UserID)
}

func (r *Repository) ListUsers(ctx context.Context) ([]UserRecord, error) {
	query := `
		SELECT u.user_id, u.tenant_id, t.tenant_name, t.workspace_code, u.email, u.password_hash, u.role, u.status,
		       u.failed_login_attempts, u.locked_until, u.last_login_at, u.mfa_enabled, u.name, u.created_by,
		       u.created_at, u.updated_at
		FROM auth_users u
		JOIN tenants t ON t.tenant_id = u.tenant_id
		ORDER BY t.tenant_name ASC, u.email ASC
	`

	rows, err := r.db.QueryContext(ctx, query)
	if err != nil {
		return nil, fmt.Errorf("list auth users: %w", err)
	}
	defer rows.Close()

	var users []UserRecord
	for rows.Next() {
		record, err := scanUserRow(rows)
		if err != nil {
			return nil, err
		}
		users = append(users, record)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("iterate auth users: %w", err)
	}
	if users == nil {
		users = []UserRecord{}
	}
	return users, nil
}

func (r *Repository) UpdateUserStatus(ctx context.Context, userID uuid.UUID, status string) error {
	query := `
		UPDATE auth_users
		SET status = $2,
		    updated_at = now()
		WHERE user_id = $1
	`
	if _, err := r.db.ExecContext(ctx, query, userID, status); err != nil {
		return fmt.Errorf("update user status: %w", err)
	}
	return nil
}

func (r *Repository) CreateAuditEvent(ctx context.Context, event AuditEvent) error {
	metadataJSON, err := json.Marshal(event.Metadata)
	if err != nil {
		return fmt.Errorf("marshal audit metadata: %w", err)
	}

	query := `
		INSERT INTO auth_audit_events (
			event_id, tenant_id, user_id, event_type, ip, user_agent, metadata_json, created_at
		) VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6::jsonb, $7)
	`
	_, err = r.db.ExecContext(
		ctx,
		query,
		nullableUUID(event.TenantID),
		nullableUUID(event.UserID),
		event.EventType,
		nullableString(event.IP),
		nullableString(event.UserAgent),
		string(metadataJSON),
		event.OccurredAt,
	)
	if err != nil {
		return fmt.Errorf("create audit event: %w", err)
	}
	return nil
}

func (r *Repository) scanUser(ctx context.Context, query string, args ...any) (*UserRecord, error) {
	row := r.db.QueryRowContext(ctx, query, args...)
	record, err := scanUserScanner(row)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return &record, nil
}

type userScanner interface {
	Scan(dest ...any) error
}

func scanUserScanner(scanner userScanner) (UserRecord, error) {
	var record UserRecord
	err := scanner.Scan(
		&record.UserID,
		&record.TenantID,
		&record.TenantName,
		&record.WorkspaceCode,
		&record.Email,
		&record.PasswordHash,
		&record.Role,
		&record.Status,
		&record.FailedLoginAttempts,
		&record.LockedUntil,
		&record.LastLoginAt,
		&record.MFAEnabled,
		&record.Name,
		&record.CreatedBy,
		&record.CreatedAt,
		&record.UpdatedAt,
	)
	if err != nil {
		return UserRecord{}, err
	}
	return record, nil
}

func scanUserRow(rows *sql.Rows) (UserRecord, error) {
	record, err := scanUserScanner(rows)
	if err != nil {
		return UserRecord{}, fmt.Errorf("scan auth user row: %w", err)
	}
	return record, nil
}

func nullableUUID(value *uuid.UUID) any {
	if value == nil {
		return nil
	}
	return *value
}

func nullableString(value string) any {
	if strings.TrimSpace(value) == "" {
		return nil
	}
	return value
}
