package service

import (
	"context"
	"database/sql"
	"fmt"
	"net/http"
	"strings"
	"time"

	"zord-edge/auth/dto"
	"zord-edge/auth/repository"
	authsecurity "zord-edge/auth/security"

	"github.com/google/uuid"
)

const (
	RoleCustomerUser  = "CUSTOMER_USER"
	RoleCustomerAdmin = "CUSTOMER_ADMIN"
	RoleOps           = "OPS"
	RoleAdmin         = "ADMIN"
)

var loginSurfaceRoleMap = map[string]map[string]bool{
	"console": {
		RoleCustomerUser:  true,
		RoleCustomerAdmin: true,
	},
	"customer": {
		RoleCustomerUser:  true,
		RoleCustomerAdmin: true,
	},
	"ops": {
		RoleOps: true,
	},
	"admin": {
		RoleAdmin: true,
	},
}

type Config struct {
	Issuer                 string
	Audience               string
	AccessTokenTTL         time.Duration
	RefreshTokenTTL        time.Duration
	LockoutThreshold       int
	LockoutDuration        time.Duration
	BootstrapAdminName     string
	BootstrapAdminEmail    string
	BootstrapAdminPassword string
	BootstrapAdminTenantID string
	BootstrapWorkspaceCode string
}

type RequestMeta struct {
	IP        string
	UserAgent string
}

type AppError struct {
	HTTPStatus int
	Code       string
	Message    string
}

func (e *AppError) Error() string {
	return e.Message
}

type Service struct {
	repo         *repository.Repository
	tokenManager *authsecurity.TokenManager
	config       Config
	now          func() time.Time
}

func New(repo *repository.Repository, tokenManager *authsecurity.TokenManager, cfg Config) *Service {
	return &Service{
		repo:         repo,
		tokenManager: tokenManager,
		config:       cfg,
		now:          time.Now,
	}
}

func (s *Service) TokenManager() *authsecurity.TokenManager {
	return s.tokenManager
}

func (s *Service) BootstrapAdmin(ctx context.Context) error {
	exists, err := s.repo.AdminExists(ctx)
	if err != nil {
		return err
	}
	if exists {
		return nil
	}

	if strings.TrimSpace(s.config.BootstrapAdminEmail) == "" || strings.TrimSpace(s.config.BootstrapAdminPassword) == "" {
		return nil
	}

	workspace, err := s.repo.FindWorkspaceForBootstrap(ctx, s.config.BootstrapAdminTenantID, s.config.BootstrapWorkspaceCode)
	if err != nil {
		return err
	}
	if workspace == nil {
		return fmt.Errorf("bootstrap admin workspace not found")
	}

	passwordHash, err := authsecurity.HashPassword(strings.TrimSpace(s.config.BootstrapAdminPassword))
	if err != nil {
		return err
	}

	admin, err := s.repo.CreateUser(ctx, repository.CreateUserParams{
		UserID:       uuid.New(),
		TenantID:     workspace.TenantID,
		Email:        normalizeEmail(s.config.BootstrapAdminEmail),
		PasswordHash: passwordHash,
		Role:         RoleAdmin,
		Status:       repository.UserStatusActive,
		MFAEnabled:   false,
		Name:         firstNonEmpty(s.config.BootstrapAdminName, "Bootstrap Admin"),
	})
	if err != nil {
		return err
	}

	return s.repo.CreateAuditEvent(ctx, repository.AuditEvent{
		TenantID:   &workspace.TenantID,
		UserID:     &admin.UserID,
		EventType:  "bootstrap_admin_created",
		Metadata:   map[string]any{"email": admin.Email},
		OccurredAt: s.now().UTC(),
	})
}

func (s *Service) Login(ctx context.Context, request dto.LoginRequest, meta RequestMeta) (*dto.LoginResponse, *AppError) {
	workspaceIdentifier := normalizeWorkspaceIdentifier(request.WorkspaceID)
	email := normalizeEmail(request.Email)
	password := request.Password
	loginSurface := strings.ToLower(strings.TrimSpace(request.LoginSurface))

	if workspaceIdentifier == "" || email == "" || strings.TrimSpace(password) == "" || loginSurface == "" {
		return nil, badRequest("INVALID_AUTH_REQUEST", "workspace_id, email, password, and login_surface are required")
	}

	// We resolve the workspace first because the UI wants a tenant-specific error,
	// not just a generic "bad credentials" message.
	workspace, err := s.repo.FindWorkspaceByIdentifier(ctx, workspaceIdentifier)
	if err != nil {
		return nil, internalServer("AUTH_LOOKUP_FAILED", err)
	}
	if workspace == nil || !workspace.IsActive {
		return nil, &AppError{HTTPStatus: http.StatusNotFound, Code: "WORKSPACE_NOT_FOUND", Message: "Workspace not found"}
	}

	user, err := s.repo.FindUserByTenantAndEmail(ctx, workspace.TenantID, email)
	if err != nil {
		return nil, internalServer("AUTH_LOOKUP_FAILED", err)
	}

	if user == nil {
		// This second lookup lets us distinguish "wrong password" from
		// "this account exists, but not in the workspace you entered".
		existingUserElsewhere, err := s.repo.FindAnyUserByEmail(ctx, email)
		if err != nil {
			return nil, internalServer("AUTH_LOOKUP_FAILED", err)
		}
		if existingUserElsewhere != nil {
			return nil, &AppError{HTTPStatus: http.StatusForbidden, Code: "ACCOUNT_NOT_IN_WORKSPACE", Message: "Account not part of this workspace"}
		}
		return nil, &AppError{HTTPStatus: http.StatusUnauthorized, Code: "INVALID_CREDENTIALS", Message: "Invalid email or password"}
	}

	if user.Status != repository.UserStatusActive {
		return nil, &AppError{HTTPStatus: http.StatusUnauthorized, Code: "INVALID_CREDENTIALS", Message: "Invalid email or password"}
	}

	if user.LockedUntil.Valid && user.LockedUntil.Time.After(s.now().UTC()) {
		return nil, &AppError{HTTPStatus: http.StatusLocked, Code: "ACCOUNT_LOCKED", Message: "Account temporarily locked"}
	}

	// Surface validation prevents an OPS or ADMIN account from silently entering the wrong console lane.
	if !allowsRoleForSurface(loginSurface, user.Role) {
		return nil, &AppError{HTTPStatus: http.StatusUnauthorized, Code: "INVALID_CREDENTIALS", Message: "Invalid email or password"}
	}

	if err := authsecurity.VerifyPassword(password, user.PasswordHash); err != nil {
		nextAttempts := user.FailedLoginAttempts + 1
		var lockedUntil *time.Time
		if nextAttempts >= s.config.LockoutThreshold {
			lockUntil := s.now().UTC().Add(s.config.LockoutDuration)
			lockedUntil = &lockUntil
		}
		if updateErr := s.repo.UpdateFailedLoginState(ctx, user.UserID, nextAttempts, lockedUntil); updateErr != nil {
			return nil, internalServer("AUTH_UPDATE_FAILED", updateErr)
		}

		_ = s.repo.CreateAuditEvent(ctx, repository.AuditEvent{
			TenantID:   &user.TenantID,
			UserID:     &user.UserID,
			EventType:  "login_failed",
			IP:         meta.IP,
			UserAgent:  meta.UserAgent,
			Metadata:   map[string]any{"reason": "invalid_password", "login_surface": loginSurface},
			OccurredAt: s.now().UTC(),
		})

		if lockedUntil != nil {
			return nil, &AppError{HTTPStatus: http.StatusLocked, Code: "ACCOUNT_LOCKED", Message: "Account temporarily locked"}
		}

		return nil, &AppError{HTTPStatus: http.StatusUnauthorized, Code: "INVALID_CREDENTIALS", Message: "Invalid email or password"}
	}

	if err := s.repo.MarkLoginSuccess(ctx, user.UserID, s.now().UTC()); err != nil {
		return nil, internalServer("AUTH_UPDATE_FAILED", err)
	}

	sessionID := uuid.New()
	jti := uuid.New()
	accessToken, claims, err := s.tokenManager.IssueAccessToken(ctx, authsecurity.IssueAccessTokenInput{
		Subject:       user.UserID.String(),
		TenantID:      user.TenantID.String(),
		WorkspaceCode: user.WorkspaceCode,
		Role:          user.Role,
		Email:         user.Email,
		SessionID:     sessionID.String(),
		JWTID:         jti.String(),
	})
	if err != nil {
		return nil, internalServer("TOKEN_ISSUE_FAILED", err)
	}

	refreshToken, refreshExpiresAt, err := s.createRefreshToken(ctx, user, sessionID, meta)
	if err != nil {
		return nil, internalServer("TOKEN_ISSUE_FAILED", err)
	}

	_ = s.repo.CreateAuditEvent(ctx, repository.AuditEvent{
		TenantID:   &user.TenantID,
		UserID:     &user.UserID,
		EventType:  "login_succeeded",
		IP:         meta.IP,
		UserAgent:  meta.UserAgent,
		Metadata:   map[string]any{"login_surface": loginSurface, "session_id": sessionID.String(), "refresh_expires_at": refreshExpiresAt.Format(time.RFC3339)},
		OccurredAt: s.now().UTC(),
	})

	updatedUser, err := s.repo.FindUserByID(ctx, user.UserID)
	if err != nil {
		return nil, internalServer("AUTH_LOOKUP_FAILED", err)
	}

	response := &dto.LoginResponse{
		User:            userResponseFromRecord(updatedUser),
		Session:         sessionResponseFromClaims(claims),
		RequiresMFA:     false,
		AccessToken:     accessToken,
		RefreshToken:    refreshToken,
		AccessExpiresAt: time.Unix(claims.ExpiresAt, 0).UTC().Format(time.RFC3339),
	}
	return response, nil
}

func (s *Service) Refresh(ctx context.Context, rawRefreshToken string, meta RequestMeta) (*dto.LoginResponse, *AppError) {
	if strings.TrimSpace(rawRefreshToken) == "" {
		return nil, badRequest("REFRESH_TOKEN_REQUIRED", "refresh_token is required")
	}

	tokenHash := authsecurity.HashOpaqueToken(rawRefreshToken)
	storedToken, err := s.repo.FindActiveRefreshTokenByHash(ctx, tokenHash)
	if err != nil {
		return nil, internalServer("AUTH_LOOKUP_FAILED", err)
	}
	if storedToken == nil || storedToken.RevokedAt.Valid || storedToken.ExpiresAt.Before(s.now().UTC()) {
		return nil, &AppError{HTTPStatus: http.StatusUnauthorized, Code: "INVALID_SESSION", Message: "Session expired"}
	}

	user, err := s.repo.FindUserByID(ctx, storedToken.UserID)
	if err != nil {
		return nil, internalServer("AUTH_LOOKUP_FAILED", err)
	}
	if user == nil || user.Status != repository.UserStatusActive {
		return nil, &AppError{HTTPStatus: http.StatusUnauthorized, Code: "INVALID_SESSION", Message: "Session expired"}
	}

	accessToken, claims, err := s.tokenManager.IssueAccessToken(ctx, authsecurity.IssueAccessTokenInput{
		Subject:       user.UserID.String(),
		TenantID:      user.TenantID.String(),
		WorkspaceCode: user.WorkspaceCode,
		Role:          user.Role,
		Email:         user.Email,
		SessionID:     storedToken.SessionID.String(),
		JWTID:         uuid.New().String(),
	})
	if err != nil {
		return nil, internalServer("TOKEN_ISSUE_FAILED", err)
	}

	nextRefreshToken, nextRefreshHash, nextRefreshExpiry, err := s.buildRefreshToken(user, storedToken.SessionID, meta)
	if err != nil {
		return nil, internalServer("TOKEN_ISSUE_FAILED", err)
	}

	replacementRecord := repository.RefreshTokenRecord{
		TokenID:          uuid.New(),
		UserID:           user.UserID,
		TenantID:         user.TenantID,
		SessionID:        storedToken.SessionID,
		TokenHash:        nextRefreshHash,
		ExpiresAt:        nextRefreshExpiry,
		CreatedIP:        nullableString(meta.IP),
		CreatedUserAgent: nullableString(meta.UserAgent),
	}
	// Rotation keeps refresh tokens single-use. If one token leaks, it cannot be
	// replayed forever because the previous token is revoked as soon as it refreshes.
	if err := s.repo.RotateRefreshToken(ctx, storedToken.TokenID, replacementRecord); err != nil {
		return nil, internalServer("TOKEN_ROTATION_FAILED", err)
	}

	_ = s.repo.CreateAuditEvent(ctx, repository.AuditEvent{
		TenantID:   &user.TenantID,
		UserID:     &user.UserID,
		EventType:  "refresh_succeeded",
		IP:         meta.IP,
		UserAgent:  meta.UserAgent,
		Metadata:   map[string]any{"session_id": storedToken.SessionID.String()},
		OccurredAt: s.now().UTC(),
	})

	return &dto.LoginResponse{
		User:            userResponseFromRecord(user),
		Session:         sessionResponseFromClaims(claims),
		RequiresMFA:     false,
		AccessToken:     accessToken,
		RefreshToken:    nextRefreshToken,
		AccessExpiresAt: time.Unix(claims.ExpiresAt, 0).UTC().Format(time.RFC3339),
	}, nil
}

func (s *Service) Logout(ctx context.Context, rawRefreshToken string, meta RequestMeta) *AppError {
	if strings.TrimSpace(rawRefreshToken) == "" {
		return nil
	}

	tokenHash := authsecurity.HashOpaqueToken(rawRefreshToken)
	storedToken, err := s.repo.FindActiveRefreshTokenByHash(ctx, tokenHash)
	if err != nil {
		return internalServer("AUTH_LOOKUP_FAILED", err)
	}
	if storedToken == nil {
		return nil
	}

	if err := s.repo.RevokeRefreshTokenByHash(ctx, tokenHash); err != nil {
		return internalServer("AUTH_UPDATE_FAILED", err)
	}

	_ = s.repo.CreateAuditEvent(ctx, repository.AuditEvent{
		TenantID:   &storedToken.TenantID,
		UserID:     &storedToken.UserID,
		EventType:  "logout_succeeded",
		IP:         meta.IP,
		UserAgent:  meta.UserAgent,
		Metadata:   map[string]any{"session_id": storedToken.SessionID.String()},
		OccurredAt: s.now().UTC(),
	})
	return nil
}

func (s *Service) Me(ctx context.Context, accessToken string) (*dto.MeResponse, *AppError) {
	claims, err := s.tokenManager.VerifyAccessToken(accessToken)
	if err != nil {
		return nil, &AppError{HTTPStatus: http.StatusUnauthorized, Code: "INVALID_SESSION", Message: "Session expired"}
	}

	userID, err := uuid.Parse(claims.Subject)
	if err != nil {
		return nil, &AppError{HTTPStatus: http.StatusUnauthorized, Code: "INVALID_SESSION", Message: "Session expired"}
	}

	user, err := s.repo.FindUserByID(ctx, userID)
	if err != nil {
		return nil, internalServer("AUTH_LOOKUP_FAILED", err)
	}
	if user == nil || user.Status != repository.UserStatusActive {
		return nil, &AppError{HTTPStatus: http.StatusUnauthorized, Code: "INVALID_SESSION", Message: "Session expired"}
	}

	return &dto.MeResponse{
		User:    userResponseFromRecord(user),
		Session: sessionResponseFromClaims(*claims),
	}, nil
}

func (s *Service) CreateUser(ctx context.Context, actor *authsecurity.AccessClaims, request dto.CreateUserRequest, meta RequestMeta) (*dto.UserResponse, *AppError) {
	if actor == nil || actor.Role != RoleAdmin {
		return nil, &AppError{HTTPStatus: http.StatusForbidden, Code: "FORBIDDEN", Message: "Admin access required"}
	}

	email := normalizeEmail(request.Email)
	if email == "" || strings.TrimSpace(request.Password) == "" || strings.TrimSpace(request.Role) == "" || strings.TrimSpace(request.Name) == "" {
		return nil, badRequest("INVALID_CREATE_USER_REQUEST", "tenant/workspace, email, password, role, and name are required")
	}

	workspace, err := s.resolveWorkspace(ctx, request.TenantID, request.WorkspaceCode)
	if err != nil {
		return nil, internalServer("AUTH_LOOKUP_FAILED", err)
	}
	if workspace == nil {
		return nil, &AppError{HTTPStatus: http.StatusNotFound, Code: "WORKSPACE_NOT_FOUND", Message: "Workspace not found"}
	}

	if !isSupportedRole(strings.ToUpper(strings.TrimSpace(request.Role))) {
		return nil, badRequest("INVALID_ROLE", "unsupported role")
	}

	passwordHash, err := authsecurity.HashPassword(request.Password)
	if err != nil {
		return nil, internalServer("PASSWORD_HASH_FAILED", err)
	}

	actorID, err := uuid.Parse(actor.Subject)
	if err != nil {
		return nil, &AppError{HTTPStatus: http.StatusUnauthorized, Code: "INVALID_SESSION", Message: "Session expired"}
	}

	user, err := s.repo.CreateUser(ctx, repository.CreateUserParams{
		UserID:       uuid.New(),
		TenantID:     workspace.TenantID,
		Email:        email,
		PasswordHash: passwordHash,
		Role:         strings.ToUpper(strings.TrimSpace(request.Role)),
		Status:       repository.UserStatusActive,
		MFAEnabled:   false,
		Name:         strings.TrimSpace(request.Name),
		CreatedBy:    &actorID,
	})
	if err != nil {
		return nil, internalServer("AUTH_CREATE_USER_FAILED", err)
	}

	_ = s.repo.CreateAuditEvent(ctx, repository.AuditEvent{
		TenantID:   &user.TenantID,
		UserID:     &actorID,
		EventType:  "user_created",
		IP:         meta.IP,
		UserAgent:  meta.UserAgent,
		Metadata:   map[string]any{"created_user_id": user.UserID.String(), "created_user_email": user.Email, "created_user_role": user.Role},
		OccurredAt: s.now().UTC(),
	})

	response := userResponseFromRecord(user)
	return &response, nil
}

func (s *Service) ListUsers(ctx context.Context, actor *authsecurity.AccessClaims) (*dto.ListUsersResponse, *AppError) {
	if actor == nil || actor.Role != RoleAdmin {
		return nil, &AppError{HTTPStatus: http.StatusForbidden, Code: "FORBIDDEN", Message: "Admin access required"}
	}

	users, err := s.repo.ListUsers(ctx)
	if err != nil {
		return nil, internalServer("AUTH_LOOKUP_FAILED", err)
	}

	items := make([]dto.UserResponse, 0, len(users))
	for idx := range users {
		items = append(items, userResponseFromRecord(&users[idx]))
	}

	return &dto.ListUsersResponse{Items: items}, nil
}

func (s *Service) UpdateUserStatus(ctx context.Context, actor *authsecurity.AccessClaims, userID string, status string, meta RequestMeta) (*dto.UserResponse, *AppError) {
	if actor == nil || actor.Role != RoleAdmin {
		return nil, &AppError{HTTPStatus: http.StatusForbidden, Code: "FORBIDDEN", Message: "Admin access required"}
	}

	parsedUserID, err := uuid.Parse(strings.TrimSpace(userID))
	if err != nil {
		return nil, badRequest("INVALID_USER_ID", "user id must be a valid UUID")
	}

	nextStatus := strings.ToUpper(strings.TrimSpace(status))
	if nextStatus != repository.UserStatusActive && nextStatus != repository.UserStatusDisabled {
		return nil, badRequest("INVALID_STATUS", "status must be ACTIVE or DISABLED")
	}

	if err := s.repo.UpdateUserStatus(ctx, parsedUserID, nextStatus); err != nil {
		return nil, internalServer("AUTH_UPDATE_FAILED", err)
	}

	updatedUser, err := s.repo.FindUserByID(ctx, parsedUserID)
	if err != nil {
		return nil, internalServer("AUTH_LOOKUP_FAILED", err)
	}
	if updatedUser == nil {
		return nil, &AppError{HTTPStatus: http.StatusNotFound, Code: "USER_NOT_FOUND", Message: "User not found"}
	}

	actorID, parseErr := uuid.Parse(actor.Subject)
	if parseErr == nil {
		_ = s.repo.CreateAuditEvent(ctx, repository.AuditEvent{
			TenantID:   &updatedUser.TenantID,
			UserID:     &actorID,
			EventType:  "user_status_updated",
			IP:         meta.IP,
			UserAgent:  meta.UserAgent,
			Metadata:   map[string]any{"updated_user_id": updatedUser.UserID.String(), "status": nextStatus},
			OccurredAt: s.now().UTC(),
		})
	}

	response := userResponseFromRecord(updatedUser)
	return &response, nil
}

func (s *Service) VerifyAccessToken(accessToken string) (*authsecurity.AccessClaims, error) {
	return s.tokenManager.VerifyAccessToken(accessToken)
}

func (s *Service) createRefreshToken(ctx context.Context, user *repository.UserRecord, sessionID uuid.UUID, meta RequestMeta) (string, time.Time, error) {
	rawToken, tokenHash, expiresAt, err := s.buildRefreshToken(user, sessionID, meta)
	if err != nil {
		return "", time.Time{}, err
	}

	record := repository.RefreshTokenRecord{
		TokenID:          uuid.New(),
		UserID:           user.UserID,
		TenantID:         user.TenantID,
		SessionID:        sessionID,
		TokenHash:        tokenHash,
		ExpiresAt:        expiresAt,
		CreatedIP:        nullableString(meta.IP),
		CreatedUserAgent: nullableString(meta.UserAgent),
	}
	if err := s.repo.StoreRefreshToken(ctx, record); err != nil {
		return "", time.Time{}, err
	}

	return rawToken, expiresAt, nil
}

func (s *Service) buildRefreshToken(user *repository.UserRecord, sessionID uuid.UUID, meta RequestMeta) (string, string, time.Time, error) {
	rawToken, err := authsecurity.GenerateOpaqueToken()
	if err != nil {
		return "", "", time.Time{}, err
	}
	tokenHash := authsecurity.HashOpaqueToken(rawToken)
	expiresAt := s.now().UTC().Add(s.config.RefreshTokenTTL)
	_ = user
	_ = meta
	return rawToken, tokenHash, expiresAt, nil
}

func (s *Service) resolveWorkspace(ctx context.Context, tenantID string, workspaceCode string) (*repository.WorkspaceRecord, error) {
	switch {
	case strings.TrimSpace(workspaceCode) != "":
		return s.repo.FindWorkspaceByIdentifier(ctx, workspaceCode)
	case strings.TrimSpace(tenantID) != "":
		return s.repo.FindWorkspaceByIdentifier(ctx, tenantID)
	default:
		return nil, nil
	}
}

func userResponseFromRecord(user *repository.UserRecord) dto.UserResponse {
	response := dto.UserResponse{
		ID:            user.UserID.String(),
		Email:         user.Email,
		Role:          user.Role,
		Name:          user.Name,
		TenantID:      user.TenantID.String(),
		TenantName:    user.TenantName,
		WorkspaceCode: user.WorkspaceCode,
		Status:        user.Status,
		MFAEnabled:    user.MFAEnabled,
	}
	if user.LastLoginAt.Valid {
		response.LastLoginAt = user.LastLoginAt.Time.UTC().Format(time.RFC3339)
	}
	return response
}

func sessionResponseFromClaims(claims authsecurity.AccessClaims) dto.SessionResponse {
	return dto.SessionResponse{
		SessionID:       claims.SessionID,
		TenantID:        claims.TenantID,
		WorkspaceCode:   claims.WorkspaceCode,
		Role:            claims.Role,
		AccessExpiresAt: time.Unix(claims.ExpiresAt, 0).UTC().Format(time.RFC3339),
	}
}

func normalizeEmail(email string) string {
	return strings.ToLower(strings.TrimSpace(email))
}

func normalizeWorkspaceIdentifier(value string) string {
	return strings.ToLower(strings.TrimSpace(value))
}

func allowsRoleForSurface(surface string, role string) bool {
	allowedRoles, ok := loginSurfaceRoleMap[surface]
	if !ok {
		return false
	}
	return allowedRoles[strings.ToUpper(strings.TrimSpace(role))]
}

func isSupportedRole(role string) bool {
	switch role {
	case RoleCustomerUser, RoleCustomerAdmin, RoleOps, RoleAdmin:
		return true
	default:
		return false
	}
}

func firstNonEmpty(values ...string) string {
	for _, value := range values {
		if strings.TrimSpace(value) != "" {
			return strings.TrimSpace(value)
		}
	}
	return ""
}

func nullableString(value string) sql.NullString {
	value = strings.TrimSpace(value)
	if value == "" {
		return sql.NullString{}
	}
	return sql.NullString{String: value, Valid: true}
}

func badRequest(code string, message string) *AppError {
	return &AppError{HTTPStatus: http.StatusBadRequest, Code: code, Message: message}
}

func internalServer(code string, err error) *AppError {
	_ = err
	return &AppError{HTTPStatus: http.StatusInternalServerError, Code: code, Message: "Internal server error"}
}
