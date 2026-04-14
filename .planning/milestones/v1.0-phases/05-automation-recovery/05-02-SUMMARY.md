---
phase: 05-automation-recovery
plan: "02"
subsystem: database
tags: [supabase, versioning, jsonb, server-actions, vitest]

requires:
  - phase: 03-dashboard-cash-flow
    provides: computeAndWriteInvoiceStatus — called after restore to recompute payment status

provides:
  - snapshotInvoiceVersion server-action helper (src/actions/versions.ts)
  - restoreInvoiceVersionAction server action (src/actions/versions.ts)
  - listInvoiceVersions cached data fetcher (src/lib/billing-data.ts)
  - snapshotInvoiceVersion integrated into updateInvoiceAction (src/actions/invoices.ts)

affects:
  - 05-03 (VersionHistoryPanel UI panel that calls listInvoiceVersions and restoreInvoiceVersionAction)

tech-stack:
  added: []
  patterns:
    - snapshotInvoiceVersion receives session supabase client from caller to avoid double-session
    - Rolling cap enforced post-insert by fetching ordered list and deleting slice beyond MAX_VERSIONS
    - Restore pattern — overwrite invoice fields, recompute status, keep payments/expenses intact

key-files:
  created:
    - src/actions/versions.ts
    - src/actions/versions.test.ts
    - src/lib/billing-data.test.ts
  modified:
    - src/actions/invoices.ts (added snapshotInvoiceVersion call in updateInvoiceAction)
    - src/lib/billing-data.ts (added listInvoiceVersions)

key-decisions:
  - "MAX_VERSIONS=10 defined as exported constant for future subscription-tier configurability"
  - "snapshotInvoiceVersion called after successful DB write only — not in error paths (D-01 anti-pattern guidance)"
  - "restoreInvoiceVersionAction does NOT restore invoice_number (stays immutable) — only mutable invoice fields"
  - "listInvoiceVersions uses cache() and reads user_id from auth.getUser() — no userId argument needed at call site"
  - "billing-data.test.ts uses static vi.mock() hoisting per project pattern (dynamic imports unreliable in Vitest)"

patterns-established:
  - "Version snapshot helper receives supabase from caller to avoid requireSession double-call"
  - "Rolling cap = insert first, then fetch + conditionally delete oldest"

requirements-completed: [AUTO-01, AUTO-02]

duration: 45min
completed: 2026-04-12
---

# Phase 05 Plan 02: Version Snapshot and Restore Summary

**JSONB version snapshots captured automatically on every invoice save, with ownership-scoped restore that recomputes payment status while preserving financial records**

## Performance

- **Duration:** ~45 min
- **Started:** 2026-04-12T13:00:00Z
- **Completed:** 2026-04-12T13:45:00Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments
- `snapshotInvoiceVersion` inserts a JSONB snapshot into `invoice_versions` and enforces a rolling 10-version cap by deleting oldest entries beyond `MAX_VERSIONS`
- `restoreInvoiceVersionAction` applies snapshot fields back to the invoice, recomputes payment status via `computeAndWriteInvoiceStatus`, and preserves all existing payments and expenses
- `listInvoiceVersions` cached fetcher returns up to 10 versions ordered by `created_at desc` for the VersionHistoryPanel (plan 05-03)
- `updateInvoiceAction` now calls `snapshotInvoiceVersion` after every successful update (AUTO-01 complete)
- 9 new tests: 5 for versions.ts (snapshot insert, cap enforcement, restore success/error), 4 for billing-data.ts (list success, null client, no auth, DB error)

## Task Commits

Each task was committed atomically:

1. **Task 1: Version actions — snapshot and restore (AUTO-01, AUTO-02)** - `f508cff` (feat)
2. **Task 2: Version data fetcher in billing-data.ts** - `7d9be4f` (feat)

## Files Created/Modified
- `src/actions/versions.ts` — `snapshotInvoiceVersion`, `restoreInvoiceVersionAction`, `MAX_VERSIONS`, `InvoiceSnapshot` interface
- `src/actions/versions.test.ts` — 5 tests for snapshot and restore behavior using static vi.mock pattern
- `src/actions/invoices.ts` — added import and `await snapshotInvoiceVersion(supabase, data.id, userId, snapshot)` after successful update
- `src/lib/billing-data.ts` — added `listInvoiceVersions` cache function at end of file
- `src/lib/billing-data.test.ts` — 4 tests for listInvoiceVersions (success, null supabase, no auth, DB error)

## Decisions Made
- `MAX_VERSIONS = 10` exported as a named constant so future subscription tiers can raise the cap without code changes (D-04)
- `snapshotInvoiceVersion` placed AFTER the `if (error) { throw }` guard — snapshot only on confirmed successful writes, never on rollback (anti-pattern from research)
- `invoice_number` is NOT restored from the snapshot (invoice number stays immutable); all other mutable fields are restored
- `listInvoiceVersions` fetches `user_id` from `supabase.auth.getUser()` internally rather than accepting a parameter — consistent with other `cache()` data fetchers in the file

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] node_modules missing from worktree — symlinked to main project**
- **Found during:** Task 1 verification
- **Issue:** Worktree had no `node_modules`; `pnpm test` failed with `vitest: command not found`
- **Fix:** Created symlink: `ln -sf /Users/koss/Desktop/Develop/INV/node_modules /Users/koss/Desktop/Develop/INV/.claude/worktrees/agent-afdc4cab/node_modules`
- **Files modified:** Symlink only (no source files)
- **Verification:** Tests ran successfully from within worktree after symlink

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Worktree symlink is a one-time infra fix needed for all worktree test runs. No scope creep.

## Issues Encountered
- Parallel agent test runs caused esbuild "service stopped" crashes (exit code 1) and OOM kills (exit code 137) from resource contention. Tests verified with isolated single-file runs — first successful run (b0dajlwyh.output) confirmed all 5 version tests passed.
- Vitest dynamic imports (`await import()` in tests) are unreliable per project MEMORY — rewrote tests to use static imports with `vi.mock()` hoisting.

## Known Stubs
None — `listInvoiceVersions` returns real data from Supabase. No hardcoded empty arrays or placeholders in the shipped code paths.

## Next Phase Readiness
- `listInvoiceVersions` and `restoreInvoiceVersionAction` are the exact APIs needed by plan 05-03 (VersionHistoryPanel UI)
- `invoice_versions` table must exist in Supabase (migration is in plan 05-00 or 05-01 — confirm before running 05-03)
- No blockers for 05-03 beyond the DB migration dependency

---
*Phase: 05-automation-recovery*
*Completed: 2026-04-12*
