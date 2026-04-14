---
phase: 03-dashboard-cash-flow
plan: "03"
subsystem: ui
tags: [react, next.js, server-actions, useActionState, inline-ledger, payments, expenses, profit]

requires:
  - phase: 03-02
    provides: addPaymentAction, deletePaymentAction, addExpenseAction, deleteExpenseAction, listPaymentsForInvoice, listExpensesForInvoice
  - phase: 03-01
    provides: PaymentRecord, ExpenseRecord, computeProfit, paymentFormSchema, expenseFormSchema

provides:
  - ProfitSummary server component (profit + margin bar above ledger tables)
  - PaymentsTable client component (inline ledger with add/delete row via useActionState)
  - ExpensesTable client component (inline ledger with add/delete row via useActionState)
  - Invoice detail page extended with financial sections (payments, expenses, profit)

affects:
  - dashboard (plan 03-04 — displays invoice metrics)
  - invoice-detail (already wired in this plan)

tech-stack:
  added: []
  patterns:
    - "useActionState pattern for server action form submission with inline error display and form reset on success"
    - "Server component data loading via Promise.all after notFound() guard"
    - "Inline ledger table: header / empty-state / data-rows / add-row / error-state layered inside a single rounded container"

key-files:
  created:
    - src/components/documents/profit-summary.tsx
    - src/components/documents/payments-table.tsx
    - src/components/documents/expenses-table.tsx
  modified:
    - src/app/(app)/app/invoices/[id]/page.tsx

key-decisions:
  - "DocumentSummaryRow amount prop was already added by a parallel agent — no redundant edit needed"
  - "ProfitSummary uses Unicode minus sign (U+2212) for negative profit display, not hyphen"

patterns-established:
  - "useActionState<ActionState, FormData> with explicit generic typing for server action forms"
  - "formRef.current?.reset() in useEffect on state.status === 'success' to clear add-row"
  - "deletePaymentAction / deleteExpenseAction called from async form action (no useTransition needed)"

requirements-completed: [OPS-01, OPS-02, OPS-05, UX-02]

duration: 3min
completed: "2026-04-08"
---

# Phase 03 Plan 03: Invoice Detail Financial Sections Summary

**Inline payment and expense ledgers with profit summary wired into the invoice detail page using useActionState for server action mutation and server-side Promise.all data loading**

## Performance

- **Duration:** 3 min
- **Started:** 2026-04-08T01:15:56Z
- **Completed:** 2026-04-08T01:18:43Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments

- ProfitSummary server component renders profit value (success/danger color) and margin percentage above ledger tables
- PaymentsTable client component with inline add row (date, amount, method), empty state, error state, and per-row delete via form action
- ExpensesTable client component with inline add row (date, amount, description, vendor), empty state, error state, and per-row delete via form action
- Invoice detail page extended with server-side data loading (listPaymentsForInvoice + listExpensesForInvoice via Promise.all) and three new sections rendered below the existing document card

## Task Commits

1. **Task 1: Create ProfitSummary, PaymentsTable, ExpensesTable components** - `63abc38` (feat)
2. **Task 2: Wire payments, expenses, and profit into the invoice detail page** - `ba5da3c` (feat)

**Plan metadata:** (docs commit below)

## Files Created/Modified

- `src/components/documents/profit-summary.tsx` - Server component: computes profit/margin via computeProfit, renders styled inline bar with success/danger coloring
- `src/components/documents/payments-table.tsx` - Client component: useActionState + addPaymentAction, list of PaymentRecord rows, delete via deletePaymentAction, empty state, error state
- `src/components/documents/expenses-table.tsx` - Client component: useActionState + addExpenseAction, list of ExpenseRecord rows, delete via deleteExpenseAction, empty state, error state
- `src/app/(app)/app/invoices/[id]/page.tsx` - Extended with listPaymentsForInvoice + listExpensesForInvoice data loading and three new financial sections

## Decisions Made

- `DocumentSummaryRow` already had the `amount?: string` prop added by a parallel agent running plan 03-04 — no redundant edit was needed.
- Used Unicode minus sign (`\u2212`) for negative profit display per UI-SPEC to avoid confusing a hyphen with subtraction in financial context.

## Deviations from Plan

None - plan executed exactly as written. The `document-summary-row.tsx` `amount` prop was already present (added by parallel agent), which is a valid outcome in parallel execution.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Invoice detail page now shows profit, payments, and expenses for every invoice
- OPS-01 (payment recording), OPS-02 (expense tracking), OPS-05 (profit visibility), UX-02 (inline ledger UX) are all fulfilled
- Ready for plan 03-04 (dashboard metrics) which aggregates payment data across invoices

---
*Phase: 03-dashboard-cash-flow*
*Completed: 2026-04-08*
