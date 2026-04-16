# Phase 7: Analytics Dashboard - Pattern Map

**Mapped:** 2026-04-16
**Files analyzed:** 5 (2 new components, 2 modified files, 1 new helper set)
**Analogs found:** 5 / 5

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `src/components/app/revenue-chart.tsx` | component | transform (aggregation → render) | `src/components/app/metric-card.tsx` | role-match (client component, dashboard data) |
| `src/components/app/aging-chart.tsx` | component | transform (aggregation → render) | `src/components/app/metric-card.tsx` | role-match (client component, dashboard data) |
| `src/components/app/metric-card.tsx` (modify) | component | request-response | itself | exact |
| `src/lib/dashboard.ts` (modify) | utility | transform (batch) | itself (existing `buildDashboardMetrics`) | exact |
| `src/app/(app)/app/page.tsx` (modify) | page (Server Component) | CRUD / request-response | itself | exact |

---

## Pattern Assignments

### `src/components/app/revenue-chart.tsx` (client component, transform)

**Analog:** `src/components/app/metric-card.tsx`

This is a new `"use client"` component loaded via `next/dynamic` with `ssr: false` from the dashboard page. No existing chart component exists in the project — this is the first Recharts integration. The closest structural analog is MetricCard (client component receiving pre-computed data as props, renders inside a Card).

**Imports pattern** — copy from `metric-card.tsx` lines 1–5 and extend:
```typescript
"use client";

import { TrendingUp } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { EmptyState } from "@/components/app/empty-state";
```

**Props interface pattern** — mirror how MetricCard defines its prop shape as an inline type (lines 7–20 of metric-card.tsx):
```typescript
export interface RevenueTrendMonth {
  month: string;      // "Jan", "Feb", ... "Dec"
  billed: number;
  collected: number;
}

export function RevenueChart({ data }: { data: RevenueTrendMonth[] }) {
```

**Empty state pattern** — copy from `src/app/(app)/app/page.tsx` lines 193–197, the drilldown empty state branch:
```tsx
const hasData = data.some((m) => m.billed > 0 || m.collected > 0);
if (!hasData) {
  return (
    <EmptyState
      title="No revenue data yet."
      description="Issue your first invoice to start tracking trends."
    />
  );
}
```

**Chart color pattern** — derived from design tokens in `src/app/globals.css` lines 3–12:
```typescript
// Billed bar: --muted-strong at 60% opacity
const BILLED_FILL = "rgba(58,50,44,0.60)";
// Collected bar: --accent (CSS var reference via chart.tsx token wiring)
const COLLECTED_FILL = "var(--color-accent)"; // #ca8a04
```

**Responsive container pattern** (per UI-SPEC.md Interaction Contract):
```tsx
<div role="img" aria-label="Revenue trend: billed vs collected over 12 months">
  <ResponsiveContainer width="100%" height={260}>
    <BarChart data={data} barGap={2} barCategoryGap="30%">
      <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
      <XAxis dataKey="month" tick={{ fontSize: 12, fill: "var(--color-muted)" }} axisLine={false} tickLine={false} />
      <YAxis tickFormatter={(v) => v >= 1000 ? `${Math.round(v / 1000)}K` : String(v)} tick={{ fontSize: 12, fill: "var(--color-muted)" }} axisLine={false} tickLine={false} />
      <Tooltip ... />
      <Legend wrapperStyle={{ fontSize: 12 }} />
      <Bar dataKey="billed" name="Billed" fill={BILLED_FILL} radius={[3, 3, 0, 0]} />
      <Bar dataKey="collected" name="Collected" fill={COLLECTED_FILL} radius={[3, 3, 0, 0]} />
    </BarChart>
  </ResponsiveContainer>
</div>
```

---

### `src/components/app/aging-chart.tsx` (client component, transform)

**Analog:** `src/components/app/metric-card.tsx` (client component shape) + `src/app/(app)/app/page.tsx` lines 162–176 (insight strip cells as layout reference)

**Imports pattern:**
```typescript
"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LabelList,
} from "recharts";
import { EmptyState } from "@/components/app/empty-state";
```

**Props interface:**
```typescript
export interface AgingBucket {
  label: string;      // "0-30d", "31-60d", "61-90d", "90+d"
  amount: number;
  count: number;
  fill: string;
}

export function AgingChart({ buckets }: { buckets: AgingBucket[] }) {
```

**Color constants** (from UI-SPEC.md Color section, all sourced from globals.css tokens):
```typescript
const AGING_FILLS = [
  "var(--color-surface-strong)",          // 0-30d: #f1e9dc
  "rgba(202,138,4,0.28)",                 // 31-60d: accent-glow level
  "rgba(202,138,4,0.55)",                 // 61-90d: denser amber
  "var(--color-danger)",                  // 90+d: #8d3d2e
] as const;
```

**Empty state pattern** — same as revenue-chart, use EmptyState:
```tsx
const hasData = buckets.some((b) => b.amount > 0);
if (!hasData) {
  return (
    <EmptyState
      title="No outstanding receivables."
      description="All invoices are either paid or in draft."
    />
  );
}
```

**Compact responsive container** (per UI-SPEC.md — 120px height for ~40% column):
```tsx
<div role="img" aria-label="Receivables aging breakdown by days outstanding">
  <ResponsiveContainer width="100%" height={120}>
    <BarChart data={[buckets]} layout="vertical" barSize={32}>
      <XAxis type="number" hide />
      <YAxis type="category" hide />
      <Tooltip ... />
      {buckets.map((bucket, idx) => (
        <Bar key={bucket.label} dataKey={bucket.label} stackId="aging" fill={AGING_FILLS[idx]} radius={...}>
          <LabelList ... />
        </Bar>
      ))}
    </BarChart>
  </ResponsiveContainer>
</div>
```

---

### `src/components/app/metric-card.tsx` (modify — add MoM badge)

**Analog:** itself (lines 1–75 are the base; new optional prop added below value line)

**Current prop interface** (lines 7–21) — extend with new optional prop:
```typescript
// Add to existing prop destructuring:
momBadge?: {
  delta: number | null;
  unit: "currency" | "percent" | "pp";
};
```

**Badge render pattern** — insert between the value `<p>` (line 45–51) and the interactive hint `<p>` (lines 53–57). The badge is conditional on `momBadge && momBadge.delta !== null`:
```tsx
{momBadge && momBadge.delta !== null ? (
  <div
    className={cn(
      "mt-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium tabular-nums",
      momBadge.delta >= 0
        ? "bg-[rgba(36,88,58,0.10)] text-success"
        : "bg-[rgba(141,61,46,0.10)] text-danger",
    )}
  >
    {momBadge.delta >= 0 ? (
      <TrendingUp className="size-3" aria-hidden="true" />
    ) : (
      <TrendingDown className="size-3" aria-hidden="true" />
    )}
    {momBadge.delta >= 0 ? "+" : ""}
    {momBadge.unit === "pp"
      ? `${momBadge.delta}pp`
      : momBadge.unit === "percent"
        ? `${momBadge.delta}%`
        : formatCurrency(momBadge.delta, currency)}
  </div>
) : null}
```

**Import additions** — TrendingUp/TrendingDown from lucide-react (already in project), import cn from `@/lib/utils` is already present (line 5).

---

### `src/lib/dashboard.ts` (modify — new exported functions)

**Analog:** itself — `buildDashboardMetrics` (lines 181–197) as the structural pattern for new pure computation functions.

**New function pattern — buildRevenueTrend** (modeled after `buildDashboardMetrics` lines 181–197):
```typescript
export interface RevenueTrendMonth {
  month: string;
  billed: number;
  collected: number;
}

/**
 * Aggregate billed and collected amounts into 12 monthly buckets.
 * All 12 slots are always present; months with no data show zero values.
 * @param rows - output of buildDashboardInvoiceRows (all time, not range-filtered)
 * @param today - "YYYY-MM-DD" — never call new Date() internally
 */
export function buildRevenueTrend(
  rows: DashboardInvoiceRow[],
  today: string,
): RevenueTrendMonth[] {
```

Key implementation notes from existing patterns:
- Use the `toDateOnly()` private helper pattern (line 74–77) — extract month via `.slice(0, 7)` (YYYY-MM)
- Use `roundCurrency()` from `@/lib/billing-utils` (already imported line 9) for all summed values
- Produce exactly 12 entries by pre-building slots from `today` backwards 11 months, same loop direction as `buildRangeStart` 12m logic (lines 96–98)
- `today` parameter — never `new Date()` inside (same rule as all existing dashboard functions)

**New function pattern — buildAgingBuckets** (same structure):
```typescript
export interface AgingBucket {
  label: string;   // "0–30d" | "31–60d" | "61–90d" | "90+d"
  amount: number;
  count: number;
}

/**
 * Bucket all outstanding invoice amounts by days overdue from today.
 * Only includes non-draft invoices with outstandingAmount > 0.
 */
export function buildAgingBuckets(
  rows: DashboardInvoiceRow[],
  today: string,
): AgingBucket[] {
```
Uses `dayDifference()` private helper (lines 117–122) — this function already exists.

**New function pattern — buildMomDeltas** (same structure):
```typescript
export interface MomDeltas {
  totalBilled: number | null;
  totalCollected: number | null;
  outstanding: number | null;
  collectionRate: number | null;  // in percentage points
}

/**
 * Compute period-over-period deltas for MetricCard MoM badges.
 * Compares current range metrics to the equivalent prior period.
 * Returns null for each metric when no prior-period data exists.
 * @param rows - output of buildDashboardInvoiceRows (full dataset, all invoices)
 * @param range - current selected range key
 * @param today - "YYYY-MM-DD"
 */
export function buildMomDeltas(
  rows: DashboardInvoiceRow[],
  range: DashboardRangeKey,
  today: string,
): MomDeltas {
```
Prior period computed by shifting `buildRangeStart(range, today)` back by the same interval. For `range === "all"`, return all-null MomDeltas (no prior period to compare).

---

### `src/app/(app)/app/page.tsx` (modify — add AnalyticsRow, wire MoM badges)

**Analog:** itself — existing section pattern used throughout (lines 111–614).

**next/dynamic import pattern** — add at top of file alongside existing named imports:
```typescript
import dynamic from "next/dynamic";

const RevenueChart = dynamic(
  () => import("@/components/app/revenue-chart").then((m) => m.RevenueChart),
  { ssr: false, loading: () => <div className="h-[260px] animate-pulse rounded-[var(--radius-inner)] bg-surface-strong" /> },
);

const AgingChart = dynamic(
  () => import("@/components/app/aging-chart").then((m) => m.AgingChart),
  { ssr: false, loading: () => <div className="h-[120px] animate-pulse rounded-[var(--radius-inner)] bg-surface-strong" /> },
);
```

**Data computation additions** — inside the existing `Promise.all` block or after it (no new DB calls — computed from existing `rows` already returned by `getDashboardDataset`). Add to `getDashboardDataset` return value OR compute inline using exported helpers:
```typescript
// After existing data fetches:
import {
  buildRevenueTrend,
  buildAgingBuckets,
  buildMomDeltas,
} from "@/lib/dashboard";

// Inside the Server Component, after getDashboardDataset resolves:
const today = new Date().toISOString().split("T")[0]; // consistent with existing billing-data.ts pattern (line 672)
const revenueTrend = buildRevenueTrend(rows, today);
const agingBuckets = buildAgingBuckets(rows, today);
const momDeltas = buildMomDeltas(rows, currentRange, today);
```

Note: `rows` is already available inside `getDashboardDataset` (line 734). The cleanest pattern is to expose `rows` from `getDashboardDataset` (it's currently returned, line 749) and call new builders in the page.

**AnalyticsRow insertion point** — after the insight strip (lines 162–176), before the drilldown Card (line 179). Follows the exact same grid pattern as the insight strip:
```tsx
{/* Analytics row — Revenue trend + Aging breakdown */}
<div className="grid gap-[var(--space-grid)] md:grid-cols-[3fr_2fr]">
  <Card>
    <CardHeader>
      <CardTitle>Revenue trend</CardTitle>
      <CardDescription>Billed vs. collected over the last 12 months.</CardDescription>
    </CardHeader>
    <CardContent className="min-h-[240px] md:min-h-[280px]">
      <RevenueChart data={revenueTrend} />
    </CardContent>
  </Card>

  <Card>
    <CardHeader>
      <CardTitle>Receivables aging</CardTitle>
      <CardDescription>Outstanding amounts by how overdue they are.</CardDescription>
    </CardHeader>
    <CardContent className="min-h-[240px] md:min-h-[280px]">
      <AgingChart buckets={agingBuckets} />
    </CardContent>
  </Card>
</div>
```

**MoM badge wire-up** — pass to each MetricCard (lines 130–158), copy pattern:
```tsx
<MetricCard
  label="Total billed"
  value={formatMetricValue(metrics.totalBilled, currency)}
  interactive
  active={currentMetric === "total-billed"}
  href={buildDashboardHref("total-billed", currentRange)}
  momBadge={momDeltas.totalBilled !== null
    ? { delta: momDeltas.totalBilled, unit: "currency" }
    : undefined}
/>
```

---

## Shared Patterns

### Design Token Usage
**Source:** `src/app/globals.css` lines 3–34
**Apply to:** All new component files

All colors via CSS variables — never raw hex inside component code except where CSS vars are not available in Recharts props (fill attributes accept only resolved values). Use the pattern:
- In JSX className: `text-success`, `text-danger`, `bg-surface-strong` (Tailwind mapped via `@theme inline`)
- In Recharts fill props: resolve to string literals matching token values (e.g., `"var(--color-accent)"` for SVG fill support, or direct hex `"#ca8a04"` when CSS vars not supported in SVG context)

### Insight Strip Cell Pattern (inline divs, not Cards)
**Source:** `src/app/(app)/app/page.tsx` lines 162–176
**Apply to:** Any compact stats row within chart cards
```tsx
<div className="rounded-[var(--radius-inner)] border border-black/7 bg-[#FFF8EE] px-4 py-4">
  <p className="text-xs uppercase tracking-[0.18em] text-muted">{label}</p>
  <p className="mt-2 text-base font-semibold text-foreground">{value}</p>
</div>
```

### Section Eyebrow Label Pattern
**Source:** `src/app/(app)/app/page.tsx` lines 335, 403
**Apply to:** Section headers above chart row (if a label is desired — per UI-SPEC.md, chart cards are self-labeled via CardTitle, so no eyebrow needed)
```tsx
<p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-muted">Label</p>
```

### Empty State Usage
**Source:** `src/components/app/empty-state.tsx` (full file, 34 lines)
**Apply to:** `RevenueChart` and `AgingChart` zero-data branches
```tsx
<EmptyState
  title="No revenue data yet."
  description="Issue your first invoice to start tracking trends."
/>
```
No `actions` prop needed — per UI-SPEC.md, no CTA inside chart card empty states.

### tabular-nums Pattern
**Source:** `src/components/app/metric-card.tsx` line 47
**Apply to:** MoM badge delta value, chart axis tick labels, aging segment labels
```tsx
className="tabular-nums"
```

### Pure Computation Function Signature
**Source:** `src/lib/dashboard.ts` lines 181–197 (`buildDashboardMetrics`)
**Apply to:** `buildRevenueTrend`, `buildAgingBuckets`, `buildMomDeltas` in dashboard.ts
- Accept typed params object (not individual args)
- Accept `today: string` — never call `new Date()` internally
- Return typed interface (not raw object)
- Use `roundCurrency()` for all summed amounts

### Dashboard Data Fetch Pattern (cache + Promise.all)
**Source:** `src/lib/billing-data.ts` lines 670–763 (`getDashboardDataset`)
**Apply to:** No new DB fetch functions needed — new analytics are computed from existing `rows` already fetched
- New helpers (`buildRevenueTrend`, `buildAgingBuckets`, `buildMomDeltas`) are pure functions over `rows`
- They slot in after the existing `getDashboardDataset` call, computed in the Server Component

---

## No Analog Found

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| `src/components/ui/chart.tsx` | ui (shadcn) | n/a | Does not exist yet — must be scaffolded via `pnpm dlx shadcn@latest add chart` before authoring chart components. Recharts is installed as a side effect. No existing chart component exists in the project. |

---

## Metadata

**Analog search scope:** `/Users/koss/Desktop/Develop/INV/src/` — components/app, lib, app/(app)/app
**Files scanned:** 9 source files read directly
**Key constraint:** `next/dynamic` with `ssr: false` is mandatory for both chart components — Recharts uses ResizeObserver and DOM APIs. No existing `next/dynamic` usage found in the app components directory; the pattern is established in this phase.
**Pattern extraction date:** 2026-04-16
