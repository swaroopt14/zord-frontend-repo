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
| `v1.1` | 2026-04-07 | Added Docker-first auth test path, live runtime findings, and local blocker notes |
| `v1.2` | 2026-04-07 | Added admin console flow for creating login users after tenant registration |

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

## Docker-First Auth Test Path

If you want to test the auth-enabled backend in containers first, use this exact sequence:

### Start the backend auth stack

```bash
cd /Users/swaroopthakare/hackthon/Arealis-Zord
docker compose up -d zord-edge-postgres zord-redis zord-kafka-1 zord-kafka-2 zord-kafka-3 zord-edge
```

### Check backend health

```bash
curl -i http://localhost:8080/health
```

Expected result:

- `HTTP/1.1 200 OK`
- JSON payload containing `"service":"zord-edge"` and `"status":"healthy"`

### Build the console image

```bash
cd /Users/swaroopthakare/hackthon/Arealis-Zord
docker compose build zord-console
```

### Run a temporary console container on `3001`

Use this when local `3000` is already occupied or when the full root stack cannot be started because of unrelated host-port conflicts.

```bash
docker run -d --name zord-console-auth-test -p 3001:3000 \
  -e NODE_ENV=production \
  -e NEXT_TELEMETRY_DISABLED=1 \
  -e PORT=3000 \
  -e HOSTNAME=0.0.0.0 \
  -e AUTH_COOKIE_SECURE=false \
  -e ZORD_EDGE_URL=http://host.docker.internal:8080 \
  -e ZORD_VAULT_URL=http://host.docker.internal:8081 \
  -e ZORD_RELAY_URL=http://host.docker.internal:8082 \
  -e ZORD_INTENT_ENGINE_URL=http://host.docker.internal:8083 \
  -e ZORD_CONTRACTS_URL=http://host.docker.internal:8084 \
  -e ZORD_PII_ENCLAVE_URL=http://host.docker.internal:8085 \
  arealis-zord-zord-console:latest
```

### Check the Dockerized console

```bash
curl -i http://localhost:3001/api/health
curl -I http://localhost:3001/console/login
```

### Verify auth proxy wiring

```bash
curl -i -X POST http://localhost:3001/api/auth/login \
  -H 'Content-Type: application/json' \
  --data '{"workspace_id":"demo-workspace","email":"demo@example.com","password":"not-a-real-password","login_surface":"console"}'
```

Expected result:

- a structured backend auth error such as `Workspace not found`
- not a transport or proxy failure

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
- `http://localhost:3000/app-final`
- `http://localhost:3000/admin/tenants`

## Step 7: Create login users from the console

Once you have an admin session, open:

- `http://localhost:3000/admin/tenants`

Use this page to:

1. View registered tenants and their `workspace_code`
2. Create email-based login users for a workspace
3. Enable or disable existing login users later

Recommended flow:

1. Register the tenant
2. Note the `workspace_code`
3. Open `/admin/tenants`
4. Create the login user with the required role
5. Sign in on the matching login page

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
| Full Go suite | `cd /Users/swaroopthakare/hackthon/Arealis-Zord/backend/zord-edge && go test ./...` |
| Go static analysis | `cd /Users/swaroopthakare/hackthon/Arealis-Zord/backend/zord-edge && go vet ./...` |
| Go build | `cd /Users/swaroopthakare/hackthon/Arealis-Zord/backend/zord-edge && go build ./cmd/main.go` |
| Console production build | `cd /Users/swaroopthakare/hackthon/Arealis-Zord/backend/zord-console && npm run build` |
| Dev wrapper syntax | `node --check /Users/swaroopthakare/hackthon/Arealis-Zord/backend/zord-console/scripts/dev-single-process.mjs` |
| Console health | `curl -I http://127.0.0.1:3000/console/login` |
| App Final auth redirect | `curl -I http://127.0.0.1:3000/app-final` |
| Admin access-management page | `open http://127.0.0.1:3000/admin/tenants` |
| Dockerized backend health | `curl -i http://localhost:8080/health` |
| Dockerized console login | `curl -I http://localhost:3001/console/login` |

## Common Issues and Fixes

| Issue | Likely cause | Fix |
| --- | --- | --- |
| `/_next/static` 404s | Two Next dev servers or stale `.next` output | Stop old dev servers and run `npm run dev` again |
| Bootstrap admin fails | Workspace code or tenant ID does not exist | Create the tenant first, then restart with valid bootstrap values |
| Auth tests fail to start | Go not installed or build cache unavailable | Install Go and rerun `go test ./auth/... -v` |
| `zord-edge` fails on startup | Kafka or S3 variables missing | Fill required env values, or run supporting infra locally |
| Login works in UI but no backend session | `ZORD_EDGE_URL` not pointing at local `zord-edge` | Set `ZORD_EDGE_URL=http://localhost:8080` |
| `zord-edge` crashes with `pq: column "status" does not exist` | Older local DB volume was created before the current base schema | Recreate the local Postgres volume/database and start again so the schema is created fresh from the current code |
| `zord-edge` shows `unhealthy` in Docker even while `/health` returns `200` | Older root compose healthcheck used `wget` inside a `scratch` image | Pull latest root compose and recreate the service; health should be checked from host/orchestrator probes instead |
| Full root stack cannot start because port `5434` is already in use | Another local process or container is already bound to that host port | Stop the conflicting service or use the temporary console-on-`3001` flow for auth validation |
| Full root stack cannot bind console on `3000` | A local Node/Next process is already listening on `3000` | Stop the local process or run the temporary console container on `3001` |

## Reviewer Notes

| Area | Note |
| --- | --- |
| Backend auth | Core JWT auth path is implemented and tested |
| Frontend session handling | Uses `HttpOnly` cookies through same-origin proxy routes |
| Local dev reliability | Improved, but backend startup still includes non-auth dependencies |
| Docker validation | Auth-enabled backend and Dockerized console login path were both exercised during live testing on 2026-04-07 |

## Final Recommendation
For lead sign-off, use this runbook together with the backend and frontend reports, then validate:

1. `zord-edge` starts cleanly with auth config.
2. `zord-console` login loads without chunk/CSS 404s.
3. `go test ./auth/... -v` passes.
4. `npm run build` passes in `zord-console`.
