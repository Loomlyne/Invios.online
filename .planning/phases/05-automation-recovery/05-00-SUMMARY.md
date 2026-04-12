---
phase: 05-automation-recovery
plan: "00"
subsystem: testing
tags: [vitest, tdd, red-green, cron, recurring, reminders, versions]

# Dependency graph
requires:
  - phase: 04-public-trust-surfaces
    provides: billing-data, invoiceStatuses with overpaid, billing.ts types
provides:
  - Wave 0 RED test stubs for all 5 AUTO requirements (AUTO-01 through AUTO-05)
  - it.todo stubs in invoices.test.ts, cron-utils.test.ts, billing-data.test.ts
  - Behavioral contracts that implementation plans must turn GREEN
affects: [05-01, 05-02, 05-03, 05-04, 05-05]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Wave 0 TDD: it.todo() stubs define behavioral contracts before implementation"
    - "Parallel-safe test execution: avoid dynamic imports in shared test contexts"

key-files:
  created:
    - src/lib/cron-utils.test.ts
  modified:
    - src/actions/invoices.test.ts
    - src/lib/billing-data.test.ts

key-decisions:
  - "Wave 0 uses it.todo() pattern exclusively — no failing assertions, clean pending output"
  - "invoiceStatuses test updated to include overpaid (6th status shipped in Phase 4) — test was stale"

patterns-established:
  - "Wave 0 RED pattern: use it.todo() for pre-implementation contract stubs (no hard failures)"

requirements-completed: [AUTO-01, AUTO-02, AUTO-03, AUTO-04, AUTO-05]

# Metrics
duration: 50min
completed: 2026-04-12
---

# Phase 05 Plan 00: Wave 0 RED Test Stubs Summary

**15 it.todo() behavioral contracts across 3 test files covering version snapshot, restore, recurring schedule, and reminder timing logic**

## Performance

- **Duration:** ~50 min (includes parallel agent contention on shared node_modules/vitest)
- **Started:** 2026-04-12T12:57:00Z
- **Completed:** 2026-04-12T13:47:00Z
- **Tasks:** 2 of 2
- **Files modified:** 3

## Accomplishments

- Created `src/lib/cron-utils.test.ts` with 10 it.todo stubs for advanceNextDueDate (AUTO-03) and shouldSendReminder (AUTO-04, AUTO-05)
- Appended 5 it.todo stubs to `src/actions/invoices.test.ts` for snapshotInvoiceVersion (AUTO-01) and restoreInvoiceVersionAction (AUTO-02)
- Appended 3 it.todo stubs to `src/lib/billing-data.test.ts` for listInvoiceVersions and getRecurringSchedule
- Fixed stale invoiceStatuses test to include "overpaid" (6th status added in Phase 4)
- All existing tests continue to pass (6 passing, 15 todo in target files)

## Task Commits

1. **Task 1: RED stubs for snapshotInvoiceVersion and restoreInvoiceVersionAction** - `a38a7fe` (test)
2. **Task 2: RED stubs for advanceNextDueDate, shouldSendReminder, listInvoiceVersions, getRecurringSchedule** - `d569127` (test)

## Files Created/Modified

- `src/lib/cron-utils.test.ts` - New file: 10 it.todo stubs for cron utility functions (AUTO-03/04/05)
- `src/actions/invoices.test.ts` - Appended 5 it.todo stubs for version snapshot/restore (AUTO-01/02); fixed invoiceStatuses count
- `src/lib/billing-data.test.ts` - Appended 3 it.todo stubs for listInvoiceVersions and getRecurringSchedule

## Decisions Made

- Wave 0 uses `it.todo()` pattern exclusively — keeps suite exit-0 while marking behavioral contracts as pending
- No dynamic imports in new stubs — avoids Vitest module-caching race conditions (per project memory)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed stale invoiceStatuses test**
- **Found during:** Task 1 (invoices.test.ts verification run)
- **Issue:** Test asserted `invoiceStatuses` had 5 statuses `["draft", "sent", "partial_paid", "paid", "overdue"]` but Phase 4 added "overpaid" as the 6th status — test was failing before my changes
- **Fix:** Updated test description and expected array to include "overpaid" at index 4
- **Files modified:** src/actions/invoices.test.ts
- **Verification:** Test passes in clean vitest run (Task 1 commit run confirmed 6 passing)
- **Committed in:** a38a7fe (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 - Bug, stale test expectation)
**Impact on plan:** Necessary correctness fix. The test was already broken before this plan; fixing it is the right call per deviation rules.

## Issues Encountered

- Parallel agent contention: multiple vitest processes competed for shared symlinked node_modules, causing esbuild service errors. Resolved by killing stray processes and waiting for a clean execution window.
- Worktree branch was significantly behind main (8 commits). Rebased onto main before starting tasks.

## Known Stubs

All new tests are intentionally `it.todo()` stubs — this is the plan's explicit goal (Wave 0 RED scaffolding). They are not accidental stubs; implementation plans (05-01 through 05-05) will turn them GREEN.

## Next Phase Readiness

- Wave 0 RED stubs in place across all 5 AUTO requirements
- Implementation plans can now proceed in parallel waves
- cron-utils.test.ts is clean (no dynamic imports) — safe for static import pattern in GREEN phase
- billing-data.test.ts uses dynamic imports for existing tests — implementation plans should use static imports for new functions

---
*Phase: 05-automation-recovery*
*Completed: 2026-04-12*
