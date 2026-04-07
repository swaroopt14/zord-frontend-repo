# Zord Edge Human Auth

This folder owns the human login flow that powers the console, customer, ops, and admin UI surfaces.

## Read This In Order
1. `dto/types.go`
2. `security/password.go`
3. `security/token.go`
4. `repository/repository.go`
5. `service/service.go`
6. `handler/http.go`

## Request Lifecycle
1. The console sends credentials to a Next.js route in `zord-console/app/api/auth/login`.
2. That route forwards the request to `zord-edge` at `POST /v1/auth/login`.
3. The auth service resolves the workspace, checks the user, verifies the Argon2id password hash, and issues:
   - a short-lived Ed25519 JWT access token
   - a long-lived rotating opaque refresh token
4. The Next.js route stores those tokens in `HttpOnly` cookies and returns only safe session/user JSON to the browser.
5. Browser pages call `/api/auth/me`, not `zord-edge` directly.

## Tables
- `tenants.workspace_code`
  Used as the operator-facing workspace login code.
- `auth_users`
  Stores tenant-scoped human users.
- `auth_refresh_tokens`
  Stores hashed refresh tokens so raw tokens never live in the database.
- `auth_audit_events`
  Stores login, refresh, logout, lockout, and admin-user actions.

## Token Lifecycle
- Access tokens expire quickly and are verified on every protected backend request.
- Refresh tokens are opaque random strings.
- Every refresh rotates the token and revokes the previous one.
- Logout revokes the current refresh token so the browser session cannot refresh again.

## Why Comments Are Placed Sparingly
The comments in this module explain *why* the code does something when the reason is not obvious from the code alone:
- workspace lookup order
- surface-to-role validation
- temporary account lockout
- refresh rotation
- cookie-safe proxying expectations
