---
phase: 03-dashboard-cash-flow
plan: 01
subsystem: database
tags: [supabase, postgres, zod, typescript, vitest, payments, expenses, rls]

# Dependency graph
requires:
  - phase: 02-clients-document-engine
    provides: invoices table and invoice_status type that payments+expenses reference

provides:
  - payments and expenses PostgreSQL tables with RLS policies and indexes
  - paymentFormSchema and expenseFormSchema Zod validators
  - PaymentRecord and ExpenseRecord TypeScript interfaces
  - computePaymentStatus pure function (injected today for testability)
  - computeProfit pure function (profit + margin)
  - computeCollectionRate pure function (null for zero-state)
  - 38 passing unit tests covering all edge cases

affects: [03-02, 03-03, 03-04, 03-05]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Pure functions with injected today string for deterministic date testing"
    - "Zod schema tests as pure import tests — no server action mocking"
    - "Payments/expenses as add/delete-only rows (no updated_at, no UPDATE policy)"

key-files:
  created:
    - supabase/migrations/20260407120000_phase3_payments_expenses.sql
    - src/actions/payments.test.ts
    - src/actions/expenses.test.ts
  modified:
    - src/lib/billing.ts
    - src/lib/billing-utils.ts
    - src/lib/billing-utils.test.ts

key-decisions:
  - "payments and expenses use CHECK constraint on method column, not PostgreSQL ENUM — avoids migration complexity for a short fixed list"
  - "No updated_at on payments or expenses — rows are add/delete only, no UPDATE RLS policy needed"
  - "computePaymentStatus injects today as a string parameter — enables deterministic unit testing without mocking Date"
  - "Draft invoices never transition to overdue automatically — status lock protects uncommitted documents"
  - "computeCollectionRate returns null (not 0) when totalBilled === 0 — callers can display '—' vs '0%' correctly"

patterns-established:
  - "today: string injection pattern for all date-dependent pure functions"
  - "Zod .coerce.number() for form amount fields (handles string-from-HTML-form inputs)"

requirements-completed: [OPS-01, OPS-02, OPS-03, OPS-04, OPS-05, DASH-01]

# Metrics
duration: 3min
completed: 2026-04-08
---

# Phase 03 Plan 01: Data Foundation Summary

**Supabase migration for payments+expenses tables with RLS, Zod validation schemas, and pure testable computation functions for invoice status, profit, and collection rate**

## Performance

- **Duration:** ~3 min
- **Started:** 2026-04-08T01:04:06Z
- **Completed:** 2026-04-08T01:07:11Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments

- Created Supabase migration with payments and expenses tables, composite indexes, and owner-only RLS (select/insert/delete — no update)
- Extended billing.ts with paymentFormSchema, expenseFormSchema, PaymentRecord, ExpenseRecord interfaces and PaymentMethod type
- Added three pure computation functions to billing-utils.ts: computePaymentStatus, computeProfit, computeCollectionRate
- 38 new unit tests covering all status-transition edge cases, profit/margin arithmetic, collection rate zero-state, and Zod schema validation

## Task Commits

1. **Task 1: DB migration + Zod schemas + TypeScript interfaces** — `f285db4` (feat)
2. **Task 2: Pure computation functions + comprehensive tests** — `3bd8898` (feat)

## Files Created/Modified

- `supabase/migrations/20260407120000_phase3_payments_expenses.sql` — payments + expenses tables, indexes, RLS policies
- `src/lib/billing.ts` — paymentFormSchema, expenseFormSchema, PaymentRecord, ExpenseRecord, PaymentMethod appended
- `src/lib/billing-utils.ts` — computePaymentStatus, computeProfit, computeCollectionRate added
- `src/lib/billing-utils.test.ts` — 12 new tests for the three computation functions appended
- `src/actions/payments.test.ts` — 9 tests for paymentFormSchema (new)
- `src/actions/expenses.test.ts` — 9 tests for expenseFormSchema (new)

## Decisions Made

- **CHECK constraint over ENUM for payment methods** — `cash`, `bank_transfer`, `cheque`, `other` is a short fixed list; CHECK avoids ALTER TYPE migrations if the set never changes
- **No UPDATE RLS on payments/expenses** — rows are immutable after insert; delete and re-add is the intended mutation path
- **today injected as string** — makes computePaymentStatus deterministic and side-effect-free without needing vi.useFakeTimers
- **computeCollectionRate returns null at zero** — callers distinguish "no data yet" from "0% collected" for display purposes

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

The migration file is ready but must be applied to Supabase. To apply:
```
supabase db push
```
or deploy via Vercel integration to pick up the migration automatically.

## Next Phase Readiness

- All downstream plans (03-02 through 03-05) can now import paymentFormSchema, expenseFormSchema, computePaymentStatus, computeProfit, computeCollectionRate
- DB tables are defined and ready for server actions
- No blockers

---
*Phase: 03-dashboard-cash-flow*
*Completed: 2026-04-08*
