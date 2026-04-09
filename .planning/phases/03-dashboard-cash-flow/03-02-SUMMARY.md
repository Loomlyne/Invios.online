---
phase: 03-dashboard-cash-flow
plan: 02
subsystem: payments
tags: [supabase, server-actions, zod, react-cache, postgres]

# Dependency graph
requires:
  - phase: 03-01
    provides: paymentFormSchema, expenseFormSchema, PaymentRecord, ExpenseRecord, computePaymentStatus from billing.ts and billing-utils.ts
provides:
  - addPaymentAction and deletePaymentAction server actions with status write-back
  - addExpenseAction and deleteExpenseAction server actions with path revalidation
  - computeAndWriteInvoiceStatus — recomputes and writes invoice status after payment mutations
  - syncOverdueStatuses — bulk overdue sync on data load (never touches drafts/paid)
  - getDashboardMetrics — totalBilled, totalCollected, outstanding, collectionRate
  - listPaymentsForInvoice and listExpensesForInvoice with cache() wrappers
  - listRecentInvoices, listRecentQuotations, listOverdueInvoices for dashboard
affects: [03-03, 03-04, 03-05]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - server action wraps requireSession then Zod parse then DB insert then revalidatePath
    - computeAndWriteInvoiceStatus receives supabase client from caller (avoids double session)
    - Payment mutations trigger status recompute; expense mutations do not
    - cache() wraps read-only data loaders; async functions used for writes/aggregation

key-files:
  created:
    - src/actions/payments.ts
    - src/actions/expenses.ts
  modified:
    - src/lib/billing-data.ts

key-decisions:
  - "Expense actions do NOT call computeAndWriteInvoiceStatus — expenses affect profit display only, not payment status"
  - "computeAndWriteInvoiceStatus accepts supabase client as parameter from caller to avoid creating a second session"
  - "syncOverdueStatuses filters .in('status', ['sent','partial_paid']) — never marks drafts or paid invoices overdue"
  - "getDashboardMetrics excludes drafts from totalBilled with .not('status', 'eq', 'draft')"

patterns-established:
  - "Server action pattern: use server + requireSession + Zod safeParse + DB op + revalidatePath triple (/detail, /list, /app)"
  - "Numeric cast pattern: Number(row.amount) on all numeric(12,2) columns returning as strings from Supabase"
  - "Status write-back: always conditional — only UPDATE if newStatus !== invoice.status"

requirements-completed: [OPS-01, OPS-02, OPS-03, OPS-04]

# Metrics
duration: 2min
completed: 2026-04-08
---

# Phase 03 Plan 02: Server Actions and Data Layer Summary

**Four CRUD server actions for payments and expenses, with invoice status write-back, overdue sync, and dashboard aggregation via Supabase**

## Performance

- **Duration:** 2 min
- **Started:** 2026-04-08T01:09:53Z
- **Completed:** 2026-04-08T01:12:00Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments

- Payment server actions recompute and write invoice status to DB after every insert/delete
- Expense server actions revalidate paths without touching payment status (expenses affect profit only)
- Data loaders with `cache()` wrappers, `Number()` casts on all Supabase numeric strings
- `syncOverdueStatuses` safely bulk-marks overdue without touching drafts or paid invoices
- `getDashboardMetrics` aggregates all-time billed/collected/outstanding/collectionRate, syncing overdue first
- 83 tests passing (up from 38 after 03-01)

## Task Commits

1. **Task 1: Payment and expense server actions** - `62ae1ea` (feat)
2. **Task 2: billing-data loaders, status write-back, dashboard metrics** - `5c75cae` (feat)

## Files Created/Modified

- `src/actions/payments.ts` — addPaymentAction, deletePaymentAction (with status recompute)
- `src/actions/expenses.ts` — addExpenseAction, deleteExpenseAction (revalidate only)
- `src/lib/billing-data.ts` — +225 lines: PaymentRow/ExpenseRow types, mappers, 8 new exports

## Decisions Made

- Expense actions do not call `computeAndWriteInvoiceStatus` — per plan spec (D-03/D-09), expenses affect profit display only, not payment status
- `computeAndWriteInvoiceStatus` receives the `supabase` client from the calling action rather than creating a new server client — avoids double session overhead
- Status write-back is conditional: only runs the UPDATE query when `newStatus !== invoice.status`
- `getDashboardMetrics` calls `syncOverdueStatuses` internally so callers don't need to chain it

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- All server actions and data loaders are ready for UI consumption in 03-03 and 03-04
- `listPaymentsForInvoice`, `listExpensesForInvoice`, `getDashboardMetrics`, `listRecentInvoices`, `listRecentQuotations`, `listOverdueInvoices` are all exported and typed
- TypeScript compiles clean, 83 tests passing

---
*Phase: 03-dashboard-cash-flow*
*Completed: 2026-04-08*
