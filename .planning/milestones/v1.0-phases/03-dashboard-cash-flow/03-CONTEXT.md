# Phase 3: Dashboard & Cash Flow - Context

**Gathered:** 2026-04-07
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 3 turns Invios into an operator financial console. It adds per-invoice payment recording and expense tracking, computes collected/outstanding/profit automatically, auto-updates invoice payment status (partial_paid, paid, overdue) based on payment records and due dates, and rebuilds the dashboard to expose cash flow at a glance. It does not add public document links, compliance/localization, recurring billing, versioning, or reminder automation — those belong to later phases.

</domain>

<decisions>
## Implementation Decisions

### Payment Recording UX
- **D-01:** Payments are recorded as inline rows directly on the invoice detail page — no modal, no sidebar. A payments table renders below the invoice totals with existing rows and an empty add row at the bottom (date, amount, method columns + delete action).
- **D-02:** Payment entry fields: date paid, amount, payment method (cash / bank transfer / cheque / other). No notes field.
- **D-03:** Status updates automatically server-side on every payment mutation: `paid` when collected ≥ total, `partial_paid` when 0 < collected < total. No user confirmation step — the computation runs immediately on save.

### Expense Tracking
- **D-04:** Expenses appear on the invoice detail page as a separate inline table from payments — same section, two distinct tables. Both are visible at the same level of hierarchy; neither is collapsed by default.
- **D-05:** Expense entry fields: description, amount, date, vendor.

### Dashboard Layout & Metrics
- **D-06:** Dashboard metrics (billed, collected, outstanding, collection rate) are all-time totals — no time filter, no period selector. Simple, accurate, zero UI overhead.
- **D-07:** Dashboard layout order:
  1. Metric strip — billed, collected, outstanding, collection rate (all-time)
  2. Quick actions — new invoice, new quotation, new client
  3. Recent invoices + recent quotations (side-by-side columns)
  4. Overdue invoices list (only shown when overdue items exist)
  5. Setup checklist (only for users with incomplete setup — already exists)

### Overdue & Status Automation
- **D-08:** Invoice `overdue` status is computed on page load / data fetch (server-side). No cron job. Each time the invoices list or dashboard loads, due_date is compared to today and overdue records are updated inline.
- **D-09:** Full payment status logic (server-side, runs on every payment mutation and on data load):
  - `paid`: collected amount ≥ invoice total
  - `partial_paid`: 0 < collected amount < invoice total
  - `overdue`: invoice is unpaid or partial_paid AND due_date < today
  - Status is written back to the `invoices` table on computation — not derived at query time.

### Claude's Discretion
- Exact visual treatment of the inline payments/expenses tables (row height, column widths, add-row affordance)
- Empty state for the overdue section and each recent-documents column
- Profit/margin display location on the invoice detail page (above or below the payments/expenses section)
- Whether collection rate on the dashboard rounds to the nearest integer or shows one decimal place

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Core Phase Definition
- `.planning/ROADMAP.md` — Phase 3 scope, goal, and success criteria
- `.planning/REQUIREMENTS.md` — `DASH-01..04`, `OPS-01..05`, `UX-02`
- `.planning/PROJECT.md` — product thesis, stack constraints, quality bar

### Prior Phase Context
- `.planning/phases/01-foundation-onboarding/01-CONTEXT.md` — Phase 1 decisions (auth, onboarding, mobile shell)
- `.planning/phases/02-clients-document-engine/02-CONTEXT.md` — Phase 2 decisions (status flow, detail page patterns, D-09 client financial stats deferred here)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `StatStrip` (`src/components/app/stat-strip.tsx`): Already used in the dashboard page for inline dot-separated metric rows. Can be upgraded or replaced for the new headline metrics section.
- `Card`, `CardContent`, `CardHeader`, `CardTitle` (`src/components/ui/card.tsx`): Already used extensively in the dashboard page.
- `Badge` (`src/components/ui/badge.tsx`): Available for status display and overdue alerts.
- `EmptyState` (`src/components/app/empty-state.tsx`): Available for empty overdue and recent document states.
- `SetupChecklist` (`src/components/app/setup-checklist.tsx`): Already conditionally rendered in dashboard — keep as-is.
- `updateDocumentStatusAction` (`src/actions/status.ts`): Generic status updater for any table — can be called after payment computation to write the new status.
- `DocumentStatusBadge` (`src/components/documents/document-status-badge.tsx`): Status badge for invoices in recent/overdue lists.

### Established Patterns
- Server actions: `requireSession()` + Zod validation + `revalidatePath` + `redirect` after mutations
- No payment or expense DB tables exist yet — Phase 3 adds both
- `invoice_status` enum already includes `partial_paid`, `paid`, `overdue` in the DB schema
- `getAppContext()` (`src/lib/data.ts`) is the main server-side data loader for the dashboard page — Phase 3 will extend this with financial aggregates

### Integration Points
- Invoice detail page: payments and expenses tables are new sections added below the existing line items / totals area
- Dashboard `page.tsx` (`src/app/(app)/app/page.tsx`): Replace current setup-focused StatStrip with financial metrics; add quick actions, recent documents, and overdue sections
- New DB tables needed: `payments` (invoice_id, user_id, amount, date, method) and `expenses` (invoice_id, user_id, amount, date, description, vendor)
- Status computation function runs after every payment/expense mutation and also as part of the invoices list / dashboard data load

</code_context>

<specifics>
## Specific Ideas

- The inline payment row table should feel like a lightweight ledger — not a heavy form. Same add-row-at-bottom pattern as a spreadsheet.
- "Collection rate" on the dashboard = (total collected / total billed) × 100, displayed as a percentage.
- Profit per invoice = invoice total − sum of direct expenses (not payments — expenses are costs, payments are revenue receipts).

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 03-dashboard-cash-flow*
*Context gathered: 2026-04-07*
