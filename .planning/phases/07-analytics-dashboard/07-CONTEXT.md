# Phase 7: Analytics Dashboard - Context

**Gathered:** 2026-04-16
**Status:** Ready for planning

<domain>
## Phase Boundary

Users can view revenue trends, receivables aging, and period-over-period momentum directly from the dashboard. Three new visualization surfaces are added to the existing dashboard page — no new routes, no new data models, no new API endpoints beyond analytics computation helpers.

</domain>

<decisions>
## Implementation Decisions

### Chart Placement & Layout
- **D-01:** Revenue trend chart sits below the existing profitability insight strip (expenses/profit/avg), above the drilldown card. Flow: MetricCards → Insight strip → Analytics charts → Drilldown → Needs attention → Recent work → Deep dive.
- **D-02:** Revenue trend chart and aging breakdown share a single row on desktop — revenue trend ~60% width, aging ~40% width. On mobile they stack vertically (trend first, aging below).

### Revenue Trend Chart
- **D-03:** Side-by-side bar chart — two bars per month (billed and collected) across 12 months. Clear comparison, easy to spot collection gaps.
- **D-04:** All 12 month slots always present, zero-padded. Months with no data show flat/zero bars to preserve the timeline shape and make gaps visible.

### Aging Breakdown Display
- **D-05:** Horizontal stacked bar chart showing four colored segments for 0-30, 31-60, 61-90, and 90+ day buckets. Compact enough for the ~40% column width.
- **D-06:** Each bucket shows both the total outstanding amount (AED) and the invoice count. Amounts labeled on/near each segment.

### MoM Indicators
- **D-07:** Colored pill badge below the metric value on each MetricCard — '+12%' (green-tinted) or '-8%' (red-tinted) with a tiny arrow icon. When no prior data exists (null delta), the badge is hidden entirely.
- **D-08:** MoM compares the current selected range to the equivalent prior period (e.g., last 30d vs previous 30d).

### Claude's Discretion
- **D-09:** Collection rate MoM format — Claude will pick the clearest approach for showing change on a card that already displays a percentage (likely percentage-point change '+3pp' or absolute delta).
- **D-10:** Exact color palette for chart bars and aging segments — should derive from the existing HSL token family and warm cream design system.
- **D-11:** Chart empty state design — when no non-draft invoices exist, show a deliberate empty state (required by success criteria SC-4).

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Dashboard data layer
- `src/lib/dashboard.ts` — Core computation: `buildDashboardInvoiceRows`, `buildDashboardMetrics`, `buildDashboardInsights`, `DashboardInvoiceRow` interface with `collectedAmount`, `outstandingAmount`, `issuedInRange`
- `src/lib/billing-data.ts` — Server-side data fetching: `getDashboardMetrics`, `getDashboardInsights`, `getDashboardDrilldown`
- `src/lib/billing.ts` — Type definitions: `DashboardMetricKey`, `DashboardRangeKey`, `InvoiceRecord`, `PaymentRecord`, `ExpenseRecord`
- `src/lib/billing-utils.ts` — Utility functions: `computeCollectionRate`, `computeProfit`, `roundCurrency`

### Dashboard page
- `src/app/(app)/app/page.tsx` — Existing dashboard Server Component with MetricCards, insight strip, drilldown, follow-up queue, top clients, recent activity

### Components
- `src/components/app/metric-card.tsx` — MetricCard component (needs MoM badge extension)
- `src/components/app/dashboard-range-toggle.tsx` — Range toggle (30d/90d/12m/all)
- `src/components/app/empty-state.tsx` — EmptyState component for zero-data states
- `src/components/ui/card.tsx` — shadcn Card used for all dashboard sections

### Requirements
- `.planning/REQUIREMENTS.md` — DASH-05, DASH-06, DASH-07 acceptance criteria

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `buildDashboardInvoiceRows()` — Already computes per-invoice `outstandingAmount`, `collectedAmount`, `issuedInRange`, `collectedInRangeAmount` — can be reused for both trend and aging calculations
- `MetricCard` component — Needs extension with an optional MoM badge prop, but the base component is ready
- `EmptyState` component — Reusable for chart empty states
- `DashboardRangeToggle` — Range selection already wired and passed to all data functions
- `isDateInDashboardRange()` / `buildRangeStart()` — Date range utilities for filtering

### Established Patterns
- Dashboard data flows through Server Component: `getAppContext()` + parallel `Promise.all()` for data fetching
- All dashboard computations receive `today: string` parameter — never call `new Date()` internally
- Currency formatting via `formatCurrency(value, currency)` from `src/lib/utils`
- Responsive pattern: mobile card list + desktop table/grid, breakpoint at `xl:` or `md:`
- Design tokens: `--space-section`, `--space-grid`, `--radius-inner`, `--radius-card`, warm cream `#FFF8EE`/`#FFF7EA` backgrounds

### Integration Points
- New chart components integrate into `src/app/(app)/app/page.tsx` between the insight strip and drilldown card
- New analytics helper functions extend `src/lib/dashboard.ts` (trend aggregation, aging bucketing, MoM computation)
- `MetricCard` in `src/components/app/metric-card.tsx` needs a new optional prop for the MoM badge
- Chart components loaded via `next/dynamic` with `ssr: false` (Recharts uses ResizeObserver/DOM)

</code_context>

<specifics>
## Specific Ideas

No specific external references — decisions based on existing dashboard patterns and operator-console aesthetic.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 07-analytics-dashboard*
*Context gathered: 2026-04-16*
