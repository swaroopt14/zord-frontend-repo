# Backend Execution Plan (App-Final)

## Phase 1 (MVP)

1. Implement `GET /api/v1/app-final/dashboard`.
2. Support query params: `tenant_id`, `period`, `range`, `activity_mode`, `from`, `to`.
3. Return payload per `/app/app-final/backend-handoff/openapi.yaml`.
4. Add null-safe serialization for partial data sources.
5. Add telemetry: `latency_ms`, `status_code`, `tenant_id`, `freshness_seconds`.

## Phase 2 (Quality + AI)

1. Implement `POST /api/v1/app-final/insights/query`.
2. Add result provenance (`citations`, source tables, time window).
3. Add cache strategy:
- dashboard: 30s
- retention: 5m
- insights: 30-60s
4. Add contract tests against OpenAPI schema.

## Suggested owners

- Data aggregation query service: Backend Core
- KPI definitions validation: Data/Analytics
- API contract + docs: Backend Platform
- Staging verification with frontend: Fullstack pairing

## Definition of done

- Endpoint contract stable and versioned
- Frontend can switch from mocks to API without schema changes
- p95 latency under agreed SLA
- No empty-card state due to missing required keys
