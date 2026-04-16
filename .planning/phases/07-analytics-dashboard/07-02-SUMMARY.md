---
phase: 07-analytics-dashboard
plan: "02"
subsystem: analytics-ui
tags: [analytics, dashboard, recharts, chart, mom-badge, aging, revenue-trend]
dependency_graph:
  requires:
    - buildRevenueTrend (07-01)
    - buildAgingBuckets (07-01)
    - buildMomDeltas (07-01)
    - chart.tsx (07-01)
    - getDashboardDataset.payments (07-01)
  provides:
    - RevenueChart component
    - AgingChart component
    - MetricCard.momBadge extension
    - getDashboardAnalyticsData
    - Analytics row in dashboard page
  affects:
    - src/app/(app)/app/page.tsx (analytics row + MoM badges wired)
    - src/components/app/metric-card.tsx (momBadge prop added)
tech_stack:
  added: []
  patterns:
    - next/dynamic with ssr:false for Recharts components (prevents ResizeObserver hydration mismatch)
    - Backward-compatible prop extension on MetricCard
    - Skeleton loading placeholders for dynamic chart imports
    - hasChartData guard (filters out draft-only users) for chart empty states
key_files:
  created:
    - src/components/app/revenue-chart.tsx
    - src/components/app/aging-chart.tsx
  modified:
    - src/components/app/metric-card.tsx
    - src/lib/billing-data.ts
    - src/app/(app)/app/page.tsx
decisions:
  - "AgingChart radius applies [0,3,3,0] to last bucket dynamically (idx === buckets.length - 1) rather than hardcoded idx === 3 — more defensive"
  - "hasChartData uses rows.some(r => r.status !== draft) so even new users with only drafts see empty states"
  - "MoM delta for currency unit uses Math.abs(delta) since sign is conveyed by color/arrow — avoids double-negative display"
  - "Git index corruption on settings/page.tsx resolved via git hash-object -w before commit"
metrics:
  duration_minutes: 28
  completed_date: "2026-04-17"
  tasks_completed: 2
  files_changed: 5
---

# Phase 7 Plan 02: Analytics UI Layer Summary

**One-liner:** Revenue trend chart (12-month grouped bars), receivables aging breakdown (horizontal stacked with legend), and MoM change badges on all four MetricCards — fully wired into the dashboard page.

## What Was Built

Wave 2 of Phase 7: all three visual analytics surfaces consuming the computation layer from Wave 1.

### RevenueChart (`src/components/app/revenue-chart.tsx`)

Client component loaded via `next/dynamic` with `ssr: false`. Renders a Recharts `BarChart` with two bars per month: Billed (`rgba(58,50,44,0.60)` — muted-strong at 60% opacity) and Collected (`#ca8a04` — accent gold). All 12 month slots always rendered via the zero-padded `buildRevenueTrend` output from Plan 01. Empty state (`EmptyState`) shown when no month has billed or collected data. Chart container has `role="img"` with descriptive `aria-label`.

### AgingChart (`src/components/app/aging-chart.tsx`)

Client component loaded via `next/dynamic` with `ssr: false`. Renders a horizontal stacked `BarChart` with 4 segments using the aging color palette (cream → amber-glow → amber-dense → danger red). Below the chart: a 2-col (mobile) / 4-col (sm+) legend grid showing each bucket's color swatch, label, AED amount, and invoice count. Empty state shown when all buckets are zero. Radius applied dynamically — first bucket gets left-rounded, last bucket gets right-rounded.

### MetricCard MoM Badge

Extended `src/components/app/metric-card.tsx` with two new optional props: `momBadge?: { delta: number | null; unit: "currency" | "percent" | "pp" }` and `currency?: string`. Badge renders as an inline-flex pill with `TrendingUp` or `TrendingDown` lucide icon (both `aria-hidden="true"`), colored green for positive delta and red for negative. Hidden entirely when `momBadge` is not passed or `delta` is null. Fully backward-compatible — all existing MetricCard usages unchanged.

### Dashboard Page Wiring (`src/app/(app)/app/page.tsx`)

- Added `getDashboardAnalyticsData` import and included it in the existing `Promise.all`
- Added `buildRevenueTrend`, `buildAgingBuckets`, `buildMomDeltas` imports from `@/lib/dashboard`
- Computed `revenueTrend`, `agingBuckets`, `momDeltas`, `hasChartData` after the data fetch
- Inserted analytics row (`grid md:grid-cols-[3fr_2fr]`) between the insight strip and drilldown card
- Wired `momBadge` and `currency` to all four MetricCards; collection rate uses `unit: "pp"`

### billing-data.ts Addition

`getDashboardAnalyticsData` wraps the `cache()`-keyed `getDashboardDataset` — no additional DB queries. Returns `{ rows, payments }` for direct consumption by the dashboard page analytics builders.

## Commits

| Task | Commit | Message |
|------|--------|---------|
| Task 1 | 1ac406a | feat(07-02): create RevenueChart and AgingChart components, extend MetricCard with MoM badge |
| Task 2 | 17ccb22 | feat(07-02): wire analytics row and MoM badges into dashboard page |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Dynamic radius on AgingChart last bucket**
- **Found during:** Task 1 implementation
- **Issue:** Plan hardcoded `idx === 3` for the last bucket's rounded right edge — breaks if bucket count ever changes.
- **Fix:** Used `idx === buckets.length - 1` for the last-bucket radius check.
- **Files modified:** src/components/app/aging-chart.tsx
- **Commit:** 1ac406a

**2. [Rule 3 - Blocking] Git index corruption on settings/page.tsx**
- **Found during:** Task 2 commit
- **Issue:** `src/app/(app)/app/settings/page.tsx` had a corrupt blob reference in the git index (object hash referenced but missing from object store). Commit failed with "invalid object" error.
- **Fix:** `git hash-object -w src/app/(app)/app/settings/page.tsx` to write the blob into the object store, then `git add` to refresh the index entry. File on disk was intact.
- **Files modified:** git index only (no source change)
- **Commit:** 17ccb22 (settings/page.tsx included in stage to repair index)

## Known Stubs

None. All chart components receive real computed data from the analytics layer. No hardcoded mock values flow to the UI.

## Threat Flags

No new threat surface introduced. Chart components are read-only visualizations of already-authenticated user data. `getDashboardAnalyticsData` reuses the `cache()`-wrapped dataset already guarded by user_id RLS. No new network endpoints, auth paths, or schema changes.

## Self-Check: PASSED

| Item | Status |
|------|--------|
| src/components/app/revenue-chart.tsx | FOUND |
| src/components/app/aging-chart.tsx | FOUND |
| MetricCard momBadge prop | FOUND |
| getDashboardAnalyticsData in billing-data.ts | FOUND |
| commit 1ac406a | FOUND |
| commit 17ccb22 | FOUND |
| 07-02-SUMMARY.md | FOUND |
