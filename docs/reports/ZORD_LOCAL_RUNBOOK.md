# Zord Local Runbook

## Document Control

| Field | Value |
| --- | --- |
| Document status | Operational appendix |
| Audience | Engineers running or reviewing the local stack |
| Last updated | 2026-04-07 |
| Related documents | `ZORD_IMPLEMENTATION_SUMMARY.md`, `ZORD_AUTH_BACKEND_REPORT.md`, `ZORD_FRONTEND_LOGIN_REPORT.md` |

## Purpose
This runbook explains how to run the new auth-enabled backend and frontend flow locally for review, QA, and debugging.

## Version History

| Version | Date | Summary |
| --- | --- | --- |
| `v1.0` | 2026-04-07 | Initial local runbook for auth-enabled flow |

## Prerequisites

| Requirement | Notes |
| --- | --- |
| Go | Required for `zord-edge` tests and local server runs |
| Node.js and npm | Required for `zord-console` |
| Docker | Recommended for local PostgreSQL and optional service dependencies |
| OpenSSL | Used to generate the local Ed25519 private key and vault key |

## Local Services Overview

| Service | Port | Purpose |
| --- | --- | --- |
| `zord-edge` | `8080` | Backend API gateway and human auth endpoints |
| `zord-console` | `3000` | Next.js UI and same-origin auth proxy routes |
| `zord-edge-postgres` | `5433` | Local Postgres for `zord-edge` |

## Step 1: Start Postgres

```bash
cd /Users/swaroopthakare/hackthon/Arealis-Zord
docker compose up -d zord-edge-postgres
```

## Step 2: Generate Local Keys

```bash
cd /Users/swaroopthakare/hackthon/Arealis-Zord/backend/zord-edge
openssl genpkey -algorithm Ed25519 -out ed25519_private.pem
openssl rand -base64 32
```

Use the Base64 output from the second command as `ZORD_VAULT_KEY`.

## Step 3: Configure `zord-edge`

Create or update:

- `backend/zord-edge/.env`

Recommended local shape:

```env
DB_HOST=localhost
DB_PORT=5433
DB_USER=zord_user
DB_PASSWORD=zord_password
DB_NAME=zord_edge_db
DB_SSLMODE=disable

KAFKA_BROKERS=localhost:9092
KAFKA_TOPIC=zord.intents.raw
S3_BUCKET=zord-local-bucket
AWS_REGION=ap-south-1
AWS_ACCESS_KEY_ID=dummy
AWS_SECRET_ACCESS_KEY=dummy

ZORD_VAULT_KEY=REPLACE_WITH_32_BYTE_BASE64_KEY

JWT_ISSUER=zord-edge
JWT_AUDIENCE=zord-console
JWT_ACCESS_TOKEN_TTL=15m
JWT_REFRESH_TOKEN_TTL=720h
JWT_SIGNING_PRIVATE_KEY_PATH=ed25519_private.pem
AUTH_COOKIE_DOMAIN=
AUTH_COOKIE_SECURE=false
JWT_LOCKOUT_THRESHOLD=5
JWT_LOCKOUT_DURATION=15m

BOOTSTRAP_ADMIN_NAME=Zord Admin
BOOTSTRAP_ADMIN_EMAIL=admin@zord.local
BOOTSTRAP_ADMIN_PASSWORD=ChangeThisNow123!
BOOTSTRAP_ADMIN_TENANT_ID=
BOOTSTRAP_ADMIN_WORKSPACE_CODE=your-workspace-code
```

## Step 4: Run `zord-edge`

```bash
cd /Users/swaroopthakare/hackthon/Arealis-Zord/backend/zord-edge
go mod download
go run ./cmd/main.go
```

Health check:

```bash
curl http://localhost:8080/health
```

## Step 5: Configure `zord-console`

If needed, set:

- `ZORD_EDGE_URL=http://localhost:8080`

The console resolves that in:

- `backend/zord-console/config/api.endpoints.ts`

## Step 6: Run `zord-console`

```bash
cd /Users/swaroopthakare/hackthon/Arealis-Zord/backend/zord-console
npm install
npm run dev
```

Open:

- `http://localhost:3000/console/login`

## Why `npm run dev` Is Important
The console now uses a guarded startup wrapper that:

- stops stale `zord-console` Next dev processes on `3000` and `3001`
- clears stale `.next` build output
- starts one clean Next server on `3000`

This prevents the repeated chunk and CSS 404 issue caused by duplicate Next servers.

## Validation Commands

| Area | Command |
| --- | --- |
| Go auth tests | `cd /Users/swaroopthakare/hackthon/Arealis-Zord/backend/zord-edge && go test ./auth/... -v` |
| Console production build | `cd /Users/swaroopthakare/hackthon/Arealis-Zord/backend/zord-console && npm run build` |
| Dev wrapper syntax | `node --check /Users/swaroopthakare/hackthon/Arealis-Zord/backend/zord-console/scripts/dev-single-process.mjs` |
| Console health | `curl -I http://127.0.0.1:3000/console/login` |

## Common Issues and Fixes

| Issue | Likely cause | Fix |
| --- | --- | --- |
| `/_next/static` 404s | Two Next dev servers or stale `.next` output | Stop old dev servers and run `npm run dev` again |
| Bootstrap admin fails | Workspace code or tenant ID does not exist | Create the tenant first, then restart with valid bootstrap values |
| Auth tests fail to start | Go not installed or build cache unavailable | Install Go and rerun `go test ./auth/... -v` |
| `zord-edge` fails on startup | Kafka or S3 variables missing | Fill required env values, or run supporting infra locally |
| Login works in UI but no backend session | `ZORD_EDGE_URL` not pointing at local `zord-edge` | Set `ZORD_EDGE_URL=http://localhost:8080` |

## Reviewer Notes

| Area | Note |
| --- | --- |
| Backend auth | Core JWT auth path is implemented and tested |
| Frontend session handling | Uses `HttpOnly` cookies through same-origin proxy routes |
| Local dev reliability | Improved, but backend startup still includes non-auth dependencies |

## Final Recommendation
For lead sign-off, use this runbook together with the backend and frontend reports, then validate:

1. `zord-edge` starts cleanly with auth config.
2. `zord-console` login loads without chunk/CSS 404s.
3. `go test ./auth/... -v` passes.
4. `npm run build` passes in `zord-console`.
