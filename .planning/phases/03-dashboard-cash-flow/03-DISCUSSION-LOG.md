# Phase 3: Dashboard & Cash Flow - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-07
**Phase:** 03-dashboard-cash-flow
**Areas discussed:** Payment recording UX, Expense tracking depth, Dashboard layout & metrics, Overdue & status automation

---

## Payment Recording UX

| Option | Description | Selected |
|--------|-------------|----------|
| Modal on detail page | Share modal pattern from Phase 2 — button opens modal with payment form, history below | |
| Inline row entry | Editable table rows directly on detail page — no modal. Date, amount, method columns. | ✓ |
| Sidebar / drawer panel | Slide-in panel from the right when payments section is clicked | |

**User's choice:** Inline row entry

---

### Payment fields

| Option | Description | Selected |
|--------|-------------|----------|
| Date + amount + method | Three fields covering 95% of real-world tracking | ✓ |
| Date + amount only | Minimal, no method | |
| Date + amount + method + notes | Full entry with reference number notes | |

**User's choice:** Date + amount + method (recommended)

---

### Status auto-update on payment save

| Option | Description | Selected |
|--------|-------------|----------|
| Auto-update immediately | Status flips server-side on every payment mutation, no user step | ✓ |
| User confirms the status change | Prompt after recording: "Mark as paid?" | |
| Manual status stays separate | Payments tracked but status manual | |

**User's choice:** Auto-update immediately (recommended)

---

## Expense Tracking Depth

### Expense prominence

| Option | Description | Selected |
|--------|-------------|----------|
| Same section, separate table | Two distinct inline tables on detail page — payments and expenses both visible | ✓ |
| Secondary, collapsed by default | Expenses behind an expand toggle | |
| Same table, different row types | Mixed ledger with type column | |

**User's choice:** Same section, separate table (recommended)

---

### Expense fields

| Option | Description | Selected |
|--------|-------------|----------|
| Description + amount | Minimal, fast | |
| Description + amount + date + vendor | Full accounting-friendly record | ✓ |
| Description + amount + category | With category tag for grouping | |

**User's choice:** Description + amount + date + vendor

---

## Dashboard Layout & Metrics

### Time window

| Option | Description | Selected |
|--------|-------------|----------|
| All-time, no filter | Total workspace lifetime numbers, no UI overhead | ✓ |
| Current month + period selector | Defaults to this month, switchable | |
| Rolling 30 days | Last 30 days, no filter | |

**User's choice:** All-time, no filter (recommended)

---

### Dashboard structure

| Option | Description | Selected |
|--------|-------------|----------|
| Metric strip → quick actions → recent + overdue | Headline numbers, then action buttons, then two-column recent docs, then overdue | ✓ |
| Metric cards → overdue alert → unified feed | Larger cards, overdue banner, then mixed chronological activity feed | |

**User's choice:** Metric strip → quick actions → recent + overdue (recommended)

---

## Overdue & Status Automation

### When overdue flips

| Option | Description | Selected |
|--------|-------------|----------|
| On page load / data fetch | Server-side check on every data load, no cron needed | ✓ |
| Daily Vercel cron job | Bulk update at midnight, always accurate without user login | |
| On explicit user action only | User manually marks overdue | |

**User's choice:** On page load / data fetch (recommended)

---

### Payment status trigger logic

| Option | Description | Selected |
|--------|-------------|----------|
| Computed automatically server-side | paid/partial_paid/overdue all derived from payment records + due date, written on mutation | ✓ |
| User-assisted with auto-suggestions | System suggests, user confirms | |
| Payments tracked, status manual | Records stored, status stays manual | |

**User's choice:** Computed automatically server-side (recommended)

---

## Claude's Discretion

- Exact visual treatment of inline payments/expenses tables
- Empty states for overdue section and recent document columns
- Profit/margin display location on invoice detail page
- Collection rate rounding (integer vs one decimal)
