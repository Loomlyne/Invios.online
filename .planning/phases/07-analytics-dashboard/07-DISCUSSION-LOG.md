# Phase 7: Analytics Dashboard - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-16
**Phase:** 07-analytics-dashboard
**Areas discussed:** Chart placement & layout, Revenue trend chart style, Aging breakdown display, MoM indicator design

---

## Chart Placement & Layout

### Revenue chart position

| Option | Description | Selected |
|--------|-------------|----------|
| Below insight strip (Recommended) | Chart sits between profitability strip and drilldown card | ✓ |
| Replace insight strip | Chart replaces expenses/profit/avg strip entirely | |
| Collapsible section at top | Full-width chart after MetricCards with show/hide toggle | |

**User's choice:** Below insight strip
**Notes:** Natural flow: KPIs → trend context → detailed drill

### Aging placement

| Option | Description | Selected |
|--------|-------------|----------|
| Same row, side-by-side (Recommended) | Revenue trend ~60% and aging ~40% share one row on desktop | ✓ |
| Separate section below | Aging gets its own full-width section | |
| Inside the insight strip | Aging buckets replace/extend the existing strip | |

**User's choice:** Same row, side-by-side
**Notes:** On mobile they stack vertically

---

## Revenue Trend Chart Style

### Chart type

| Option | Description | Selected |
|--------|-------------|----------|
| Side-by-side bars (Recommended) | Two bars per month — billed and collected | ✓ |
| Stacked area chart | Smooth filled areas with collected layered on billed | |
| Combined bar + line | Bars for billed, line overlay for collected | |

**User's choice:** Side-by-side bars
**Notes:** Matches operator-console aesthetic

### Empty months

| Option | Description | Selected |
|--------|-------------|----------|
| Show as zero bars (Recommended) | All 12 slots present, zero months show flat bars | ✓ |
| Show with subtle pattern | Dashed outline or diagonal fill for zero months | |

**User's choice:** Show as zero bars
**Notes:** Preserves timeline shape

---

## Aging Breakdown Display

### Aging format

| Option | Description | Selected |
|--------|-------------|----------|
| Horizontal stacked bar (Recommended) | Single bar divided into colored segments per bucket | ✓ |
| Four metric cards | Small cards in a row, one per bucket | |
| Donut chart | Pie/donut showing proportional breakdown | |

**User's choice:** Horizontal stacked bar
**Notes:** Compact, fits ~40% column width

### Aging detail level

| Option | Description | Selected |
|--------|-------------|----------|
| Amount + count (Recommended) | Each bucket shows outstanding amount and invoice count | ✓ |
| Amount only | Just AED totals, cleaner | |

**User's choice:** Amount + count
**Notes:** More useful for deciding collection focus

---

## MoM Indicator Design

### MoM appearance

| Option | Description | Selected |
|--------|-------------|----------|
| Colored badge below value (Recommended) | Pill badge below metric with arrow, green/red tint | ✓ |
| Inline after value | Percentage on same line as metric value | |
| Tooltip only | MoM data appears on hover/tap only | |

**User's choice:** Colored badge below value
**Notes:** Hidden entirely when no prior data (null delta)

### Collection rate MoM format

| Option | Description | Selected |
|--------|-------------|----------|
| Percentage point change (Recommended) | Show '+3pp' or '-5pp' for rate changes | |
| Same % format as others | Show '+12%' meaning relative change | |
| You decide | Claude picks clearest approach | ✓ |

**User's choice:** You decide
**Notes:** Claude has discretion on collection rate MoM format

---

## Claude's Discretion

- Collection rate MoM format (percentage points vs relative percentage)
- Exact chart color palette (derive from HSL token family)
- Chart empty state design

## Deferred Ideas

None
