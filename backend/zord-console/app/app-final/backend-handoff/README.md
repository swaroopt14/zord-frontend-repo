# App-Final Frontend → Backend Handoff

Path scope: `/Users/swaroopthakare/hackthon/Arealis-Zord/backend/zord-console/app/app-final`  
Updated: 2026-03-20

---

## 1) Frontend Inventory: Components Mapped to Pages

## Page: `/app-final`

Layout shell:
- `DashboardLayout` → `/Users/swaroopthakare/hackthon/Arealis-Zord/backend/zord-console/components/fintech-dashboard/layout/DashboardLayout.tsx`
- `Navbar` (inside `DashboardLayout`) → `/Users/swaroopthakare/hackthon/Arealis-Zord/backend/zord-console/components/fintech-dashboard/layout/Navbar.tsx`

Cards/components rendered:
- `PaymentsCard` → `/Users/swaroopthakare/hackthon/Arealis-Zord/backend/zord-console/components/fintech-dashboard/cards/PaymentsCard.tsx`
- `VolumeCard` → `/Users/swaroopthakare/hackthon/Arealis-Zord/backend/zord-console/components/fintech-dashboard/cards/VolumeCard.tsx`
- `RetentionCard` → `/Users/swaroopthakare/hackthon/Arealis-Zord/backend/zord-console/components/fintech-dashboard/cards/RetentionCard.tsx`
- `TransactionsCard` (combined Transactions/Customers via toggle) → `/Users/swaroopthakare/hackthon/Arealis-Zord/backend/zord-console/components/fintech-dashboard/cards/TransactionsCard.tsx`
- `InsightCard` → `/Users/swaroopthakare/hackthon/Arealis-Zord/backend/zord-console/components/fintech-dashboard/cards/InsightCard.tsx`

Page entry:
- `/Users/swaroopthakare/hackthon/Arealis-Zord/backend/zord-console/app/app-final/page.tsx`

## Page: `/app-final/preserved`

Purpose:
- Read-only preserved snapshot/code browser for reference.

Component/page:
- `/Users/swaroopthakare/hackthon/Arealis-Zord/backend/zord-console/app/app-final/preserved/page.tsx`

Backend data needs:
- None (filesystem-only preview page).

## Existing but currently not rendered on `/app-final`
- `CustomersCard` (legacy standalone customers card):
  - `/Users/swaroopthakare/hackthon/Arealis-Zord/backend/zord-console/components/fintech-dashboard/cards/CustomersCard.tsx`

---

## 2) Per-Page KPI List + Precise Metric Definitions

## `/app-final` KPI definitions

### A. PaymentsCard (`Total Payments`)

Dimensions:
- `period`: `daily | weekly | monthly`
- `stage`: `income | essentials | investment | saving | rewards`

Metrics:
- `stage_value`
  - Definition: absolute value for each stage in selected period.
  - Type: number (raw) + display string.
- `stage_ratio_pct` (`pct`) and `stage_ratio_target_pct` (`pct_of`) where applicable
  - Definition: `stage_value / reference_value * 100`.
  - Type: number (0..100).
- `selected_stage`
  - Definition: current active stage used for highlight/tooltip.

### B. VolumeCard (`Gross Volume`)

Dimensions:
- `period`: `daily | weekly | monthly`
- `category`: `online_payments | subscriptions | in_store`

Metrics:
- `gross_volume_total`
  - Definition: total settled/posted amount for selected period.
- `gross_volume_growth_pct`
  - Definition: `(current_period_total - previous_period_total) / previous_period_total * 100`.
- `category_amount`
  - Definition: amount per category.
- `category_share_pct`
  - Definition: `category_amount / gross_volume_total * 100`.
- `transactions_count`
- `avg_order_value`
  - Definition: `gross_volume_total / transactions_count`.
- `refund_amount` and optionally `refund_rate_pct`
  - Definition: `refund_amount / gross_volume_total * 100`.

### C. RetentionCard

Dimensions:
- `range`: `1m | 3m | 6m`

Metrics:
- `current_retention_pct`
  - Definition: `retained_entities / eligible_entities * 100`.
- `target_retention_pct`
  - Definition: configured target for the same range.
- `gap_pts`
  - Definition: `target_retention_pct - current_retention_pct` (percentage points).
- `health`
  - Definition:
    - `Healthy` if `gap_pts <= 4`
    - `Watch` if `gap_pts <= 8`
    - `At Risk` otherwise

### D. TransactionsCard (combined Activity card)

Dimensions:
- `mode`: `transactions | customers`
- `day`: `Mon..Sun`

Metrics:
- `activity_value`
  - Definition: primary KPI number for selected mode.
- `peak_day`
  - Definition: day with highest value in selected mode + period.
- `delta_value`
  - Definition: absolute delta vs comparable previous period.
- `fill_target`
  - Definition: normalized liquid level for visual state (`0..1`).

### E. InsightCard (AI Insights)

Metrics:
- `insight_score`
  - Definition: normalized reliability/impact score (`0..100`).
- `confidence_pct`
  - Definition: model confidence (`0..100`).
- `progress_pct`
  - Definition: progress bar value (`0..100`), may match score or independent.
- `status_label`
  - Enum suggestion: `Reliable | Watch | Critical`.
- `updated_label`
  - Definition: freshness label (e.g., `Updated 12s ago`).
- `drivers[]`
  - Definition: top explanatory factors with tone.
- `chips[]`
  - Definition: summary stats (Recovered, Failures, Rate) with weight width (`0..100`).

---

## 3) UI Components and Data Contracts by Page

## `/app-final` contract shape (single payload)

Recommended frontend contract root:
- `AppFinalDashboardResponse`

Top-level keys required:
- `tenant_id`
- `generated_at`
- `period`
- `range`
- `activity_mode`
- `payments_funnel`
- `gross_volume`
- `retention`
- `activity`
- `ai_insights`

Field-level schema is defined in:
- `/Users/swaroopthakare/hackthon/Arealis-Zord/backend/zord-console/app/app-final/backend-handoff/openapi.yaml`

UI fallback rules:
- Missing metric must return `null` and optional `data_quality` reason.
- Frontend should render placeholders, never crash on partial response.
- Percentages returned normalized (`0..100`).

---

## 4) Backend API Endpoints + Response Schemas Required

## Primary endpoint (ship first)
- `GET /api/v1/app-final/dashboard`

Query params:
- `tenant_id` (required)
- `period` (`daily|weekly|monthly`, default `daily`)
- `range` (`1m|3m|6m`, default `6m`)
- `activity_mode` (`transactions|customers`, default `transactions`)
- `from` (ISO datetime, optional)
- `to` (ISO datetime, optional)

## Optional future endpoint
- `POST /api/v1/app-final/insights/query`
  - Purpose: answer “why” follow-up questions from AI insight context.

## OpenAPI spec file
- `/Users/swaroopthakare/hackthon/Arealis-Zord/backend/zord-console/app/app-final/backend-handoff/openapi.yaml`

---

## Backend Team Action Checklist

1. Implement `GET /api/v1/app-final/dashboard` exactly per OpenAPI schema.
2. Add tenant and time-window filter support in query layer.
3. Return raw numeric fields and display-formatted strings where needed.
4. Ensure enum stability:
- `health`: `Healthy | Watch | At Risk`
- `activity_mode`: `transactions | customers`
- `driver.tone`: `positive | neutral | warning`
5. Add endpoint SLO telemetry (latency p95, error rate, payload freshness).
6. Share Postman/OpenAPI URL with frontend once staging is ready.

