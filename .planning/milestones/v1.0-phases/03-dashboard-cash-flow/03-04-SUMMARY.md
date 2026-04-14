---
phase: 03-dashboard-cash-flow
plan: "04"
subsystem: dashboard
tags: [dashboard, metrics, billing-data, metric-card, loading-skeleton]
dependency_graph:
  requires: ["03-02"]
  provides: [dashboard-financial-operator-view]
  affects: [src/app/(app)/app/page.tsx, src/components/app/metric-card.tsx, src/app/(app)/app/loading.tsx, src/components/documents/document-summary-row.tsx]
tech_stack:
  added: []
  patterns: [rsc-data-fetch, promise-all-parallel, emDash-zero-state, conditional-section-render]
key_files:
  created:
    - src/components/app/metric-card.tsx
  modified:
    - src/app/(app)/app/page.tsx
    - src/app/(app)/app/loading.tsx
    - src/components/documents/document-summary-row.tsx
decisions:
  - "EmptyState uses title/description props (not heading/body) — matched actual component API"
  - "userId guard: context.userId ?? '' to satisfy string type for billing-data functions"
  - "DocumentSummaryRow amount prop added as optional — extends existing component without breaking callers"
metrics:
  duration: "~150s"
  completed: "2026-04-08"
  tasks_completed: 2
  files_changed: 4
---

# Phase 03 Plan 04: Dashboard Financial Operator View Summary

Dashboard rebuilt from a setup-focused landing into a financial operator console with live billing metrics, quick actions, recent document columns, and conditional overdue section via MetricCard component and restructured loading skeleton.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Create MetricCard component and update dashboard loading skeleton | cfa3148 | metric-card.tsx, loading.tsx |
| 2 | Rebuild dashboard page with financial metrics, quick actions, recent docs, overdue | 2cee5b5 | page.tsx, document-summary-row.tsx |

## What Was Built

**MetricCard component** (`src/components/app/metric-card.tsx`):
- Props: `label`, `value`, `accent?: boolean`
- Styling per UI-SPEC: `rounded-[1.1rem] border border-black/7 bg-surface p-4 sm:p-5`
- Label: `text-xs text-muted uppercase tracking-[0.18em]`
- Value: `text-2xl font-semibold tracking-tight` — `text-success` when `accent=true`

**Dashboard loading skeleton** (`src/app/(app)/app/loading.tsx`):
- Page header, metric strip (4 cards `grid-cols-2 md:grid-cols-4`), quick actions, 2-column recent doc skeletons
- All shimmer: `animate-pulse bg-black/6` per Phase 1 UI-SPEC

**Dashboard page** (`src/app/(app)/app/page.tsx`):
- Layout per D-07: PageHeader → Metric strip → Quick actions → Recent docs → Overdue → SetupChecklist
- Data: `getDashboardMetrics` + `listRecentInvoices` + `listRecentQuotations` + `listOverdueInvoices` via `Promise.all`
- Metric strip: 4 MetricCard tiles (total billed, collected, outstanding, collection rate)
- Quick actions: 3 secondary buttons linking to `/app/invoices/new`, `/app/quotations/new`, `/app/clients/new`
- Recent columns: `DocumentSummaryRow` with `EmptyState` for zero-data users
- Overdue section: conditionally rendered only when `overdueInvoices.length > 0`, amber warning treatment
- Zero-state values: `"\u2014"` (em dash) per DASH-04

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Added `amount` prop to DocumentSummaryRow**
- Found during: Task 2
- Issue: Plan interface contract specifies `amount?: string` on `DocumentSummaryRow`, but the component only had `href`, `documentNumber`, `subtitle`, `status`. The dashboard needed to display formatted amounts in each row.
- Fix: Added optional `amount` prop — renders as `text-sm font-semibold text-foreground` alongside the status badge. Added `min-w-0` + `truncate` on document number for overflow safety.
- Files modified: `src/components/documents/document-summary-row.tsx`
- Commit: 2cee5b5

**2. [Rule 1 - Bug] TypeScript guard for `context.userId`**
- Found during: Task 2 (TypeScript compile error)
- Issue: `AppContext.userId` is `string | undefined` but billing-data functions require `string`
- Fix: `const userId = context.userId ?? ""` before `Promise.all` — consistent with how billing-data functions handle empty/missing auth gracefully
- Files modified: `src/app/(app)/app/page.tsx`
- Commit: 2cee5b5

**3. [Rule 1 - Bug] EmptyState prop name correction**
- Found during: Task 2
- Issue: Plan spec referenced `heading` and `body` props for EmptyState, but actual component API uses `title` and `description`
- Fix: Used correct prop names (`title` and `description`) per actual component implementation
- Files modified: `src/app/(app)/app/page.tsx`
- Commit: 2cee5b5

## Known Stubs

None — all financial data is wired to live billing-data functions. MetricCard values display em-dash for zero/null states, not placeholder strings.

## Verification

- TypeScript: `npx tsc --noEmit` — no errors
- Tests: 83 tests passing (11 test files)
- MetricCard acceptance criteria: all 5 checks pass
- Dashboard acceptance criteria: all 19 checks pass (no StatStrip, no countBusinessFields)

## Self-Check: PASSED

- [x] `src/components/app/metric-card.tsx` — created and contains required patterns
- [x] `src/app/(app)/app/loading.tsx` — updated with animate-pulse and metric strip skeleton
- [x] `src/app/(app)/app/page.tsx` — rebuilt with all required imports, MetricCard x4, overdue section, SetupChecklist
- [x] Commits cfa3148 and 2cee5b5 — both exist in git history
- [x] 83 tests passing — no regressions
