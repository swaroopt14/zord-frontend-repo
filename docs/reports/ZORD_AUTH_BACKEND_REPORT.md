# Zord Backend JWT Auth Report

## Document Control

| Field | Value |
| --- | --- |
| Document status | Draft for lead review |
| Audience | Engineering leads, backend leads, frontend leads, reviewers |
| Scope owner | Zord platform auth implementation |
| Last updated | 2026-04-07 |
| Related documents | `ZORD_IMPLEMENTATION_SUMMARY.md`, `ZORD_FRONTEND_LOGIN_REPORT.md`, `ZORD_LOCAL_RUNBOOK.md` |

## Version History

| Version | Date | Summary |
| --- | --- | --- |
| `v1.0` | 2026-04-07 | Initial backend JWT auth implementation report |
| `v1.1` | 2026-04-07 | Added review-ready structure, implementation notes, and local run appendix link |

## Scope
This report covers the JWT-based human authentication work added inside `backend/zord-edge`.

## Goal
The original console login flow was UI-only and depended on mock client-side state. The goal of this work was to add a real production-style backend auth flow for:

- `CUSTOMER_USER`
- `CUSTOMER_ADMIN`
- `OPS`
- `ADMIN`

## What Changed

### New auth domain inside `zord-edge`
The new human-auth module was added under:

- `backend/zord-edge/auth/dto`
- `backend/zord-edge/auth/handler`
- `backend/zord-edge/auth/repository`
- `backend/zord-edge/auth/security`
- `backend/zord-edge/auth/service`
- `backend/zord-edge/auth/workspacecode`
- `backend/zord-edge/auth/README.md`

### Backend integration points updated
The auth module was wired into the existing service through:

- `backend/zord-edge/cmd/main.go`
- `backend/zord-edge/config/config.go`
- `backend/zord-edge/db/db.go`
- `backend/zord-edge/routes/intent_route.go`
- `backend/zord-edge/middleware/user_session.go`

### Data model changes
The following auth-related persistence layer was added in the existing `zord-edge` database:

| Table / Column | Purpose |
| --- | --- |
| `tenants.workspace_code` | Operator-facing login identifier for workspace lookup |
| `auth_users` | Stores tenant-scoped human users |
| `auth_refresh_tokens` | Stores hashed rotating refresh tokens |
| `auth_audit_events` | Stores auth and admin activity history |

## Auth Flow Implemented

| Step | Behavior |
| --- | --- |
| Login request | `workspace_id`, `email`, `password`, `login_surface` |
| Workspace resolution | Resolve by `workspace_code`, then fallback to raw `tenant_id` |
| Password validation | Argon2id hash verification |
| Access token | Ed25519-signed JWT |
| Refresh token | Opaque token stored hashed in DB |
| Session renewal | Refresh token rotation on every refresh |
| Logout | Refresh token revoked |
| Session introspection | `GET /v1/auth/me` |

## HTTP Endpoints Added

| Method | Route | Purpose |
| --- | --- | --- |
| `POST` | `/v1/auth/login` | Sign in and issue tokens |
| `POST` | `/v1/auth/refresh` | Rotate refresh token and issue new access token |
| `POST` | `/v1/auth/logout` | Revoke refresh token |
| `GET` | `/v1/auth/me` | Return current user and session |
| `POST` | `/v1/auth/admin/users` | Admin creates users |
| `GET` | `/v1/auth/admin/users` | Admin lists users |
| `PATCH` | `/v1/auth/admin/users/:id/status` | Admin enables or disables users |

## Security Improvements

| Area | Implementation |
| --- | --- |
| Password storage | Argon2id |
| Access token signing | Ed25519 |
| Access token TTL | 15 minutes by default |
| Refresh token TTL | 30 days by default |
| Refresh protection | Rotation with revocation chain |
| Account protection | Temporary lockout after repeated failures |
| Role enforcement | Login surface is validated against role |
| Audit trail | Login, refresh, logout, bootstrap, and admin actions recorded |

## Frontend-facing Error Semantics
The backend now returns explicit auth failures required by the new login UX:

| Case | Message |
| --- | --- |
| Wrong credentials | `Invalid email or password` |
| Wrong workspace | `Workspace not found` |
| User in another workspace | `Account not part of this workspace` |
| Locked account | `Account temporarily locked` |

## Problems Faced

| Problem | Why it mattered |
| --- | --- |
| No real human auth existed in `zord-edge` | The console could not authenticate against backend truth |
| Tenant identity and login identity were different concepts | Operators needed a stable workspace code instead of raw tenant UUIDs |
| Refresh tokens were not implemented | Sessions could not be rotated or revoked properly |
| Existing service already had API-key auth for ingestion | Human auth had to be added without breaking ingestion routes |
| Bootstrap admin needed a real tenant/workspace | The first admin could not be created against a nonexistent workspace |

## How Those Problems Were Fixed

| Problem | Fix |
| --- | --- |
| No backend auth module | Added a new `auth/` domain under `zord-edge` |
| No workspace login identifier | Added `workspace_code` to tenants and backfill logic |
| No secure password handling | Added Argon2id hash and verify helpers |
| No JWT session system | Added Ed25519 JWT manager and session middleware |
| No refresh/session rotation | Added opaque refresh token hashing and rotation flow |
| Need to preserve API-key behavior | Left ingestion auth middleware untouched and added separate user-session middleware |
| Bootstrap admin dependency | Added bootstrap lookup by tenant ID or workspace code |

## Tests Added

| Test File | Coverage |
| --- | --- |
| `backend/zord-edge/auth/security/password_test.go` | Password hashing and verification |
| `backend/zord-edge/auth/security/token_test.go` | JWT issue and verify flow |
| `backend/zord-edge/auth/workspacecode/code_test.go` | Workspace-code sanitization and deterministic suffixing |

## Test Execution

| Command | Result |
| --- | --- |
| `go version` | Passed, Go available locally |
| `go test ./auth/... -v` | Passed |

## Risks and Current Constraints

| Area | Current state | Reviewer note |
| --- | --- | --- |
| MFA | Response model is ready, enforcement is not enabled in v1 | Acceptable for current milestone if explicitly tracked |
| Startup dependencies | `zord-edge` still requires Kafka and S3 initialization on boot | Recommend follow-up work to isolate auth-only local startup |
| Bootstrap admin | Requires an existing tenant/workspace | Operational setup step must be followed during first deployment |
| Password reset | Not included in this phase | Should be planned before wide internal rollout |

## Approval Checklist

| Check | Status |
| --- | --- |
| Human login is backed by server-side auth | Complete |
| Access tokens are short-lived JWTs | Complete |
| Refresh tokens rotate and revoke correctly | Complete |
| Workspace-aware login errors are explicit | Complete |
| Admin bootstrap path exists | Complete |
| Unit tests for core auth primitives pass | Complete |
| MFA enforcement | Deferred |
| Password reset flow | Deferred |

## Appendix A: Local Backend Run Reference
For exact startup steps, local dependencies, and environment templates, see:

- `docs/reports/ZORD_LOCAL_RUNBOOK.md`

## Notes for Future Work

| Area | Suggested next step |
| --- | --- |
| MFA | Add TOTP or email OTP and flip `requires_mfa` when enabled |
| Admin onboarding | Add invite flow or password reset flow |
| Service startup | Decouple auth-only local startup from Kafka/S3 requirements |
| Monitoring | Add auth-specific dashboards for failed logins and lockouts |

## Outcome
`zord-edge` now owns real human authentication for the console and related surfaces. The previous mock login path has a backend system behind it, with production-oriented password handling, session management, role checks, refresh rotation, and audit coverage.
