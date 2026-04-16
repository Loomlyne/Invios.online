# Phase 7: Analytics Dashboard - Research

**Researched:** 2026-04-16
**Domain:** Recharts (via shadcn chart), dashboard computation layer, MetricCard extension
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Revenue trend chart sits below the profitability insight strip, above the drilldown card.
- **D-02:** Revenue trend (~60% width) and aging breakdown (~40% width) share a single row on desktop; stack vertically on mobile.
- **D-03:** Side-by-side bar chart — two bars per month (billed and collected) across 12 months.
- **D-04:** All 12 month slots always present, zero-padded; gaps show flat/zero bars.
- **D-05:** Horizontal stacked bar chart for aging, four colored segments (0-30, 31-60, 61-90, 90+ days).
- **D-06:** Each aging bucket shows total outstanding AED and invoice count.
- **D-07:** Colored pill badge below metric value on each MetricCard; hidden when prior data is null.
- **D-08:** MoM compares current selected range to equivalent prior period.

### Claude's Discretion
- **D-09:** Collection rate MoM format (likely percentage-point change "+3pp").
- **D-10:** Exact color palette for chart bars and aging segments (must derive from existing HSL token family).
- **D-11:** Chart empty state design (deliberate, not blank/broken).

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| DASH-05 | 12-month revenue trend chart showing total billed vs collected per month | `buildRevenueTrend()` new fn in dashboard.ts; shadcn chart BarChart via next/dynamic |
| DASH-06 | Receivables aging breakdown in 0-30/31-60/61-90/90+ day buckets, partial-payment-aware | `buildAgingBuckets()` new fn using `DashboardInvoiceRow.outstandingAmount` + `dueDate` diff from `today` |
| DASH-07 | Period-over-period change indicators on billed, collected, outstanding MetricCards | `buildMoMDeltas()` new fn; MetricCard extended with optional `momDelta` prop |
</phase_requirements>

---

## Summary

Phase 7 adds three analytics surfaces to the existing dashboard page with zero new routes or DB queries. All data already flows through `getDashboardDataset()` — the cached server function that fetches all invoices, payments, and expenses in a single parallel fetch. New pure-TypeScript computation functions (`buildRevenueTrend`, `buildAgingBuckets`, `buildMoMDeltas`) are added to `src/lib/dashboard.ts` and receive the already-computed `DashboardInvoiceRow[]` array plus `today` and `range` parameters.

Charts use Recharts via the shadcn chart scaffold (`pnpm dlx shadcn@latest add chart`). This is the locked approach from STATE.md. The scaffold creates `src/components/ui/chart.tsx` and wires Recharts to the existing HSL CSS token system automatically. Chart components are loaded via `next/dynamic` with `ssr: false` to avoid the ResizeObserver/DOM hydration issue.

The MetricCard component at `src/components/app/metric-card.tsx` needs a single new optional prop (`momDelta?: number | null`) which renders a colored pill badge below the value. The dashboard page passes deltas computed server-side — no client-side state changes needed.

**Primary recommendation:** Scaffold shadcn chart first (Wave 0), then add computation functions to `dashboard.ts`, then build chart components as `"use client"` modules loaded via `next/dynamic`, then wire everything into the dashboard page.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Revenue trend aggregation | API/Backend (dashboard.ts) | — | Pure computation over existing DashboardInvoiceRow data; no new DB queries |
| Aging bucket computation | API/Backend (dashboard.ts) | — | Requires `outstandingAmount` and date arithmetic against `today`; already available |
| MoM delta computation | API/Backend (dashboard.ts) | — | Prior period needs separate `buildDashboardInvoiceRows` pass over the same invoice dataset |
| Chart rendering | Browser/Client | — | Recharts requires DOM/ResizeObserver; must be "use client" + next/dynamic ssr:false |
| MetricCard badge | Browser/Client | — | Already a "use client" component; prop extension only |
| Dashboard page wiring | Frontend Server (SSR) | — | Existing Server Component; computes data, passes to client chart components as serializable props |

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| recharts | 3.8.1 | BarChart, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer | Locked in STATE.md; installed via shadcn chart scaffold |
| shadcn chart scaffold | latest | `src/components/ui/chart.tsx` with ChartContainer, ChartTooltip, ChartLegend | Wires Recharts to CSS HSL token system; avoids manual color config |

**Version verified:** `npm view recharts version` → `3.8.1` [VERIFIED: npm registry]

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| next/dynamic | built-in (Next 15) | ssr:false import for chart components | Every chart component wrapper in the dashboard page |
| lucide-react | 0.469.0 (already installed) | TrendingUp / TrendingDown arrow icons for MoM badge | Tiny arrow on pill badge |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| shadcn chart (Recharts) | Chart.js / Victory | shadcn chart is locked decision; Recharts has native HSL token wiring |

**Installation:**
```bash
pnpm dlx shadcn@latest add chart
```

This creates `src/components/ui/chart.tsx`. Do NOT run `pnpm add recharts` separately — the shadcn scaffold manages the dependency.

---

## Architecture Patterns

### System Architecture Diagram

```
Dashboard Server Component (app/page.tsx)
  │
  ├─ getDashboardDataset(userId, range)  ← already cached; no new DB queries
  │    └─ returns { rows: DashboardInvoiceRow[], ... }
  │
  ├─ buildRevenueTrend(rows, today)        → RevenueTrendPoint[12]
  ├─ buildAgingBuckets(rows, today)        → AgingBucket[4]
  ├─ buildMoMDeltas(rows, range, today)    → MoMDeltas { billed, collected, outstanding }
  │
  ├─ <MetricCard momDelta={deltas.billed} ... />   (extended, "use client" already)
  │
  └─ Analytics Row (60/40 desktop grid, stacked mobile)
       ├─ <RevenueTrendChart data={trendPoints} />   ← next/dynamic, ssr:false
       └─ <AgingChart data={agingBuckets} />          ← next/dynamic, ssr:false
```

### Recommended Project Structure

```
src/
├── lib/
│   └── dashboard.ts          # + buildRevenueTrend, buildAgingBuckets, buildMoMDeltas
├── components/
│   ├── ui/
│   │   └── chart.tsx         # NEW — scaffolded by shadcn
│   └── app/
│       ├── metric-card.tsx   # EXTEND — add optional momDelta prop
│       ├── revenue-trend-chart.tsx  # NEW — "use client", Recharts BarChart
│       └── aging-chart.tsx          # NEW — "use client", Recharts BarChart horizontal stacked
└── app/(app)/app/
    └── page.tsx              # EXTEND — wire analytics row + pass deltas to MetricCards
```

### Pattern 1: Revenue Trend Aggregation

**What:** Build 12 calendar-month slots (always present) with total billed and total collected per month.
**When to use:** Called from dashboard Server Component, result passed as serializable prop.

```typescript
// src/lib/dashboard.ts (new export)
export interface RevenueTrendPoint {
  month: string;       // "Jan", "Feb", etc. — display label
  monthKey: string;    // "YYYY-MM" — for zero-padding logic
  billed: number;
  collected: number;
}

export function buildRevenueTrend(
  rows: DashboardInvoiceRow[],
  today: string,
): RevenueTrendPoint[] {
  // Always generate all 12 slots going back 11 months from today
  // Use today.substring(0, 7) pattern for month keying — never new Date(issueDate)
  // Billed: sum row.total where row.issueDate.substring(0,7) === monthKey
  // Collected: sum payment amounts where datePaid.substring(0,7) === monthKey
  //   NOTE: payments are NOT on DashboardInvoiceRow; need raw payment data passed in
  //   OR sum row.collectedAmount where issueDate month matches (less accurate for cross-month)
  // DECISION NEEDED: see Open Questions #1
}
```

**Key constraint:** `issueDate.substring(0, 7)` for month key grouping — never `new Date(issueDate)` which drifts by timezone [CITED: STATE.md key decision].

### Pattern 2: MoM Delta Computation

**What:** Compare current period metrics to the equivalent prior period of same length.
**When to use:** Called from dashboard Server Component alongside main metrics.

```typescript
export interface MoMDeltas {
  billed: number | null;      // null when prior period billed = 0
  collected: number | null;
  outstanding: number | null;
}

export function buildMoMDeltas(
  rows: DashboardInvoiceRow[],  // ALL non-draft rows (no range filter applied)
  range: DashboardRangeKey,
  today: string,
): MoMDeltas {
  // Compute "prior range start" and "prior range end" from range
  // Run buildDashboardMetrics on rows filtered to prior range
  // Run buildDashboardMetrics on rows filtered to current range
  // Delta = ((current - prior) / prior) * 100, return null if prior === 0
  // For "all" range: return { billed: null, collected: null, outstanding: null }
}
```

**Rule:** Return `null` (not 0%) when prior period value is zero — avoids division-by-zero display [CITED: STATE.md key decision].

### Pattern 3: Aging Bucket Computation

**What:** Group outstanding invoices by days overdue into four buckets.
**When to use:** Operates on all non-draft rows regardless of range (aging is current state, not time-windowed).

```typescript
export interface AgingBucket {
  label: string;      // "0-30d", "31-60d", "61-90d", "90+d"
  days: string;       // same — for display
  amount: number;     // sum of outstandingAmount in bucket
  count: number;      // invoice count in bucket
}

export function buildAgingBuckets(
  rows: DashboardInvoiceRow[],
  today: string,
): AgingBucket[] {
  // Filter to rows with outstandingAmount > 0 (excludes paid invoices)
  // daysOverdue = dayDifference(row.dueDate, today) — positive means past due
  // Bucket by: 0-30, 31-60, 61-90, 90+
  // Use row.outstandingAmount (not row.total) — correctly accounts for partial payments
}
```

**Critical:** Use `outstandingAmount`, not invoice total — partial payments are already computed in `DashboardInvoiceRow` [CITED: CONTEXT.md code_context].

### Pattern 4: MetricCard MoM Badge Extension

**What:** Add optional `momDelta` prop; render a pill badge below the value.
**When to use:** Extended MetricCard — backward-compatible (no breaking changes to existing usages).

```typescript
// Extend existing props interface:
momDelta?: number | null;  // percentage change e.g. 12.5 = +12%, -8 = -8%

// Render only when momDelta is not null and not undefined:
{momDelta != null && (
  <span className={cn(
    "mt-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
    momDelta >= 0
      ? "bg-success/10 text-success"
      : "bg-danger/10 text-danger",
  )}>
    {momDelta >= 0 ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
    {momDelta >= 0 ? "+" : ""}{momDelta.toFixed(1)}%
  </span>
)}
```

### Pattern 5: Chart Component Loading

**What:** Wrap chart components in `next/dynamic` with `ssr: false`.
**When to use:** Every Recharts component — prevents hydration mismatch and keeps bundle clean.

```typescript
// In app/page.tsx (Server Component):
import dynamic from "next/dynamic";

const RevenueTrendChart = dynamic(
  () => import("@/components/app/revenue-trend-chart"),
  { ssr: false }
);
const AgingChart = dynamic(
  () => import("@/components/app/aging-chart"),
  { ssr: false }
);
```

[CITED: STATE.md — "Chart components via `next/dynamic` with `ssr: false`"]

### Pattern 6: shadcn ChartContainer Usage

**What:** Wrap Recharts chart in `<ChartContainer config={...}>` which injects CSS vars for colors.
**When to use:** Every chart component; config maps logical names to HSL token values.

```typescript
// In revenue-trend-chart.tsx:
"use client";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer } from "recharts";

const chartConfig = {
  billed: { label: "Billed", color: "var(--accent)" },       // warm gold
  collected: { label: "Collected", color: "var(--success)" }, // dark green
};

export function RevenueTrendChart({ data }: { data: RevenueTrendPoint[] }) {
  return (
    <ChartContainer config={chartConfig} className="h-[220px] w-full">
      <BarChart data={data}>
        <XAxis dataKey="month" />
        <Bar dataKey="billed" fill="var(--color-billed)" radius={[3,3,0,0]} />
        <Bar dataKey="collected" fill="var(--color-collected)" radius={[3,3,0,0]} />
        <ChartTooltip content={<ChartTooltipContent />} />
      </BarChart>
    </ChartContainer>
  );
}
```

[ASSUMED: ChartContainer API surface — based on shadcn chart documentation pattern. Verify exact props after running `pnpm dlx shadcn@latest add chart`.]

### Anti-Patterns to Avoid

- **Calling `new Date(issueDate)` for month grouping:** Use `issueDate.substring(0, 7)` — timezone drift corrupts month assignment.
- **Calling `new Date()` inside analytics helpers:** Thread `today: string` as parameter — all existing dashboard helpers follow this rule.
- **Rendering Recharts without `next/dynamic ssr:false`:** ResizeObserver is not available in SSR context; causes hydration mismatch.
- **Returning 0% when prior period is zero:** Return `null` — the badge hides itself when delta is null.
- **Using invoice.total for aging:** Use `outstandingAmount` — partial payments must be accounted for.
- **Importing recharts directly without shadcn scaffold:** shadcn chart scaffold wires CSS token colors; direct imports require manual color management.
- **Aging filtered to current range:** Aging is a current state (how old is the outstanding balance today), not time-windowed. Apply no range filter to aging.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Chart color theming | Manual CSS vars per chart | shadcn ChartContainer config | Automatic CSS custom property injection from config object |
| Chart tooltip | Custom HTML tooltip | ChartTooltipContent from shadcn chart | Pre-styled, accessible, format-aware |
| Responsive chart sizing | Manual window resize listener | ResponsiveContainer from Recharts | Built-in; wrapped by ChartContainer |
| MoM percentage format | Custom rounding logic | `.toFixed(1)` + sign prefix | Simple; consistent with existing `roundCurrency` precision |

**Key insight:** The shadcn chart scaffold exists specifically to prevent hand-wiring Recharts to a design token system. Running the scaffold command is the entire setup — don't replicate what it produces.

---

## Common Pitfalls

### Pitfall 1: Collected-per-month Data Source

**What goes wrong:** `DashboardInvoiceRow` has `collectedInRangeAmount` (payments within selected range) and `collectedAmount` (all-time collected), but neither gives "payments made in calendar month X" across all ranges.

**Why it happens:** The revenue trend chart is always 12-month and always shows all-time monthly totals regardless of the dashboard range toggle. The `collectedInRangeAmount` field is filtered to `range`, not to a calendar month.

**How to avoid:** `buildRevenueTrend` needs access to raw payment data (not just the aggregated row amounts). The simplest approach is to add a `payments: PaymentRecord[]` parameter to `buildRevenueTrend` and sum `payment.amount` where `payment.datePaid.substring(0, 7) === monthKey`. The `getDashboardDataset` function already fetches all payments — they can be passed through.

**Warning signs:** If collected per month always equals billed per month, payments are being mapped to invoice issue month instead of payment date month.

### Pitfall 2: MoM for "all" Range

**What goes wrong:** When `range === "all"`, the prior period is undefined — there is no previous "all" period.

**Why it happens:** `buildMoMDeltas` must handle the "all" range as a special case.

**How to avoid:** Return `{ billed: null, collected: null, outstanding: null }` when `range === "all"`. The badge hides when `momDelta` is null.

### Pitfall 3: Aging vs Range Toggle

**What goes wrong:** Aging shows zero when user selects "30d" range because aging is filtered to the current range, hiding long-overdue invoices.

**Why it happens:** Aging is a current state snapshot ("how old are my outstanding receivables today"), not a time-windowed metric.

**How to avoid:** `buildAgingBuckets` always operates on ALL non-draft rows with `outstandingAmount > 0`, regardless of `range`. Do not pass the range parameter to aging computation.

### Pitfall 4: shadcn chart scaffold overwrites existing files

**What goes wrong:** Running `pnpm dlx shadcn@latest add chart` without checking whether `chart.tsx` already exists (it doesn't — confirmed via Glob search).

**How to avoid:** No action needed — chart.tsx is not yet present. Safe to scaffold.

### Pitfall 5: MoM displayed on Collection Rate card

**What goes wrong:** Collection rate is a percentage (0-100). Showing "+12%" MoM on a card that already displays "85%" is ambiguous — is it 85% → 97% or 85% → 85%×1.12=95.2%?

**How to avoid:** Per D-09, use percentage-point change format for collection rate: "+3pp" rather than "+3%". Use a different `momFormat` prop or derive the format from the metric key in the parent.

---

## Code Examples

### Month key generation (12-slot scaffold)

```typescript
// Source: STATE.md + existing dashboard.ts patterns
function buildMonthSlots(today: string): string[] {
  const slots: string[] = [];
  const current = new Date(`${today}T00:00:00`);
  for (let i = 11; i >= 0; i--) {
    const d = new Date(current);
    d.setMonth(d.getMonth() - i);
    slots.push(d.toISOString().slice(0, 7)); // "YYYY-MM"
  }
  return slots;
}
```

### Prior period computation for MoM

```typescript
// Compute the prior range window equivalent to the current range
function buildPriorRangeWindow(range: DashboardRangeKey, today: string): { start: string; end: string } | null {
  if (range === "all") return null;
  const days = range === "30d" ? 30 : range === "90d" ? 90 : 365;
  const currentEnd = new Date(`${today}T00:00:00`);
  const currentStart = new Date(currentEnd);
  currentStart.setDate(currentStart.getDate() - (days - 1));
  const priorEnd = new Date(currentStart);
  priorEnd.setDate(priorEnd.getDate() - 1);
  const priorStart = new Date(priorEnd);
  priorStart.setDate(priorStart.getDate() - (days - 1));
  return {
    start: priorStart.toISOString().slice(0, 10),
    end: priorEnd.toISOString().slice(0, 10),
  };
}
```

### Dashboard page: analytics row placement

```tsx
{/* Insight strip (already exists) */}
<div className="grid gap-[var(--space-grid)] sm:grid-cols-3">
  {/* ... expenses, net profit, avg invoice */}
</div>

{/* NEW: Analytics row — trend 60%, aging 40% */}
<div className="grid gap-[var(--space-grid)] lg:grid-cols-[1.5fr_1fr]">
  <Card>
    <CardHeader><CardTitle>Revenue trend</CardTitle></CardHeader>
    <CardContent>
      {hasChartData
        ? <RevenueTrendChart data={trendPoints} currency={currency} />
        : <EmptyState title="No invoices yet" description="..." />}
    </CardContent>
  </Card>
  <Card>
    <CardHeader><CardTitle>Receivables aging</CardTitle></CardHeader>
    <CardContent>
      {hasChartData
        ? <AgingChart data={agingBuckets} currency={currency} />
        : <EmptyState title="No outstanding invoices" description="..." />}
    </CardContent>
  </Card>
</div>

{/* Drilldown (already exists) */}
<Card>...</Card>
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Manual recharts install + color wiring | shadcn `add chart` scaffold | shadcn v2+ | CSS token wiring is automatic |
| `new Date(dateString)` for month grouping | `substring(0, 7)` | Identified in v1.1 | Prevents TZ drift in month assignment |

**Deprecated/outdated:**
- Direct `recharts` install via `pnpm add recharts`: shadcn chart scaffold handles the dep; direct install works but skips the token wiring scaffold.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | pnpm dlx shadcn | ✓ | (project already running) | — |
| pnpm | shadcn scaffold | ✓ | (project already using) | — |
| recharts | chart components | Not yet installed | — | Installed by scaffold |
| @/components/ui/chart.tsx | chart components | Not yet present | — | Created by scaffold |

**Missing dependencies with no fallback:**
- `src/components/ui/chart.tsx` — must be created by running `pnpm dlx shadcn@latest add chart` as Wave 0 task

**Missing dependencies with fallback:**
- None

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest ^3.2.4 |
| Config file | (none — package.json script `vitest run`) |
| Quick run command | `pnpm test -- --reporter=verbose src/lib/dashboard.test.ts` |
| Full suite command | `pnpm test` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| DASH-05 | `buildRevenueTrend` returns 12 slots always, zero-pads months with no data, sums billed correctly | unit | `pnpm test -- src/lib/dashboard.test.ts` | ✅ (extend existing) |
| DASH-05 | `buildRevenueTrend` sums collected from payments by payment date month, not invoice month | unit | `pnpm test -- src/lib/dashboard.test.ts` | ✅ (extend existing) |
| DASH-06 | `buildAgingBuckets` correctly buckets overdue amounts, uses `outstandingAmount`, excludes paid invoices | unit | `pnpm test -- src/lib/dashboard.test.ts` | ✅ (extend existing) |
| DASH-06 | `buildAgingBuckets` reflects partial payments (invoice with 40% paid appears in bucket at 60% outstanding) | unit | `pnpm test -- src/lib/dashboard.test.ts` | ✅ (extend existing) |
| DASH-07 | `buildMoMDeltas` returns null for "all" range | unit | `pnpm test -- src/lib/dashboard.test.ts` | ✅ (extend existing) |
| DASH-07 | `buildMoMDeltas` returns null when prior period billed is zero | unit | `pnpm test -- src/lib/dashboard.test.ts` | ✅ (extend existing) |
| DASH-07 | `buildMoMDeltas` returns correct signed percentage for positive and negative trends | unit | `pnpm test -- src/lib/dashboard.test.ts` | ✅ (extend existing) |
| DASH-05/06 | Empty state shown when `hasChartData = false` (no non-draft invoices) | visual/manual | — | manual-only (JSX rendering) |

### Sampling Rate

- **Per task commit:** `pnpm test -- src/lib/dashboard.test.ts`
- **Per wave merge:** `pnpm test`
- **Phase gate:** Full suite green before `/gsd-verify-work`

### Wave 0 Gaps

- [ ] Run `pnpm dlx shadcn@latest add chart` — creates `src/components/ui/chart.tsx`
- [ ] No new test files needed — all new functions extend `src/lib/dashboard.test.ts`

---

## Open Questions (RESOLVED)

1. **Revenue trend: collected data source** — RESOLVED: Pass `payments: PaymentRecord[]` to `buildRevenueTrend` and sum by `payment.datePaid.substring(0, 7)`. Implemented in Plan 07-01 Task 1.
   - What we know: `DashboardInvoiceRow` has `collectedInRangeAmount` (filtered to dashboard range) and `collectedAmount` (all-time). Neither gives per-calendar-month payment totals for a fixed 12-month window.
   - Resolution: Pass raw `PaymentRecord[]` to `buildRevenueTrend`. The dataset is already fetched in `getDashboardDataset` — thread it through. This is the accurate approach.

2. **Aging: not-yet-overdue vs current outstanding** — RESOLVED: Include not-yet-due invoices via `Math.max(0, daysOverdue)` in 0-30d bucket. Implemented in Plan 07-01 Task 1.
   - What we know: 0-30 bucket should include invoices 0-30 days past due date. But what about invoices that are not yet due (future due date)?
   - Resolution: Include all invoices with `outstandingAmount > 0` regardless of whether they're overdue yet. Use `max(0, dayDifference(dueDate, today))` to place not-yet-due invoices at 0 days. Shows total exposure, not just overdue exposure.

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | ChartContainer from shadcn chart accepts `config` object mapping keys to `{ label, color }` | Code Examples | Minor: adjust config shape after scaffolding; no architectural impact |
| A2 | `pnpm dlx shadcn@latest add chart` adds recharts as a dependency automatically | Standard Stack | Low: if not, run `pnpm add recharts` separately |
| A3 | Aging 0-30 bucket includes not-yet-overdue outstanding balances | Open Questions | Medium: affects bucket semantics; clarify in planning if needed |

---

## Sources

### Primary (HIGH confidence)
- `src/lib/dashboard.ts` — verified `DashboardInvoiceRow` fields, `buildDashboardInvoiceRows`, existing patterns
- `src/lib/billing-data.ts` — verified `getDashboardDataset` caching pattern, data flow
- `src/components/app/metric-card.tsx` — verified current props interface, render structure
- `src/app/(app)/app/page.tsx` — verified existing section order and layout patterns
- `src/app/globals.css` — verified design token names (`--accent`, `--success`, `--danger`, `--surface`, etc.)
- `.planning/phases/07-analytics-dashboard/07-CONTEXT.md` — verified all locked decisions
- npm registry `npm view recharts version` → 3.8.1 [VERIFIED: npm registry]

### Secondary (MEDIUM confidence)
- STATE.md key decisions — `substring(0,7)` date pattern, `next/dynamic ssr:false`, MoM null-on-zero rule, shadcn chart install command [CITED: STATE.md]

### Tertiary (LOW confidence)
- shadcn chart `ChartContainer` API shape [ASSUMED: based on shadcn documentation conventions; verify after scaffold]

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — recharts version verified, shadcn chart install command confirmed in STATE.md
- Architecture: HIGH — all data flows traced through existing source; no new DB queries required
- Computation patterns: HIGH — existing `buildDashboardInvoiceRows` interface fully read; new functions are pure TS transforms
- Chart component API: MEDIUM — ChartContainer props assumed from convention; verify after scaffold
- Pitfalls: HIGH — derived from existing codebase patterns and STATE.md locked decisions

**Research date:** 2026-04-16
**Valid until:** 2026-05-16 (recharts 3.x stable; shadcn chart scaffold unlikely to break)
