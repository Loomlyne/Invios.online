---
phase: 05-automation-recovery
plan: 01
subsystem: database, infra
tags: [supabase, migration, rls, vitest, vercel-cron, typescript]

# Dependency graph
requires:
  - phase: 04-public-trust-surfaces
    provides: invoices table with slug-based routing that recurring schedules reference

provides:
  - invoice_versions table with RLS for snapshot history
  - recurring_schedules table with RLS for cron-driven invoice cloning
  - reminder_logs table with RLS for deduplication tracking
  - user_settings reminder columns (reminder_enabled, reminder_days_before, etc.)
  - cron-utils.ts with advanceNextDueDate and shouldSendReminder pure functions
  - env.ts cronSecret field and isCronAuthenticated helper
  - vercel.json cron schedule declarations for /api/cron/recurring and /api/cron/reminders

affects:
  - 05-02 (recurring invoice cron handler uses recurring_schedules + advanceNextDueDate)
  - 05-03 (reminder cron handler uses reminder_logs + shouldSendReminder)
  - 05-04 (invoice versions UI reads invoice_versions table)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - UTC-only date math via T00:00:00Z suffix + setUTCDate/setUTCMonth for timezone safety
    - isCronAuthenticated helper centralizes Bearer token auth for all cron route handlers
    - CREATE TABLE IF NOT EXISTS + ADD COLUMN IF NOT EXISTS for idempotent migrations

key-files:
  created:
    - supabase/migrations/20260412000000_phase5_automation.sql
    - src/lib/cron-utils.ts
    - src/lib/cron-utils.test.ts
    - vercel.json
  modified:
    - src/lib/env.ts

key-decisions:
  - "UTC date arithmetic: T00:00:00Z suffix on string→Date conversion + setUTCDate/setUTCMonth prevents DST-related off-by-one errors in date math"
  - "isCronAuthenticated in env.ts: centralizes Bearer token validation so all cron route handlers share one auth check instead of duplicating it"
  - "reminder_logs has no UPDATE/DELETE RLS — write-once rows; cron handler uses admin client which bypasses RLS"

patterns-established:
  - "UTC date math pattern: new Date(dateStr + 'T00:00:00Z') then setUTC* methods for all date arithmetic"
  - "Cron auth pattern: import isCronAuthenticated from env.ts, check request Authorization header"

requirements-completed: [AUTO-01, AUTO-03, AUTO-04, AUTO-05]

# Metrics
duration: 22min
completed: 2026-04-12
---

# Phase 05 Plan 01: Automation Infrastructure Summary

**Phase 5 schema foundation shipped: 3 RLS-protected tables, 5 reminder settings columns, UTC-safe cron utility functions with 16 passing tests, and Vercel cron schedule declarations**

## Performance

- **Duration:** 22 min
- **Started:** 2026-04-12T08:58:22Z
- **Completed:** 2026-04-12T09:20:43Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments

- Migration file creates invoice_versions, recurring_schedules, and reminder_logs tables with full RLS coverage and optimized indexes
- cron-utils.ts implements advanceNextDueDate (weekly/monthly/quarterly) and shouldSendReminder (4 reminder types) as pure UTC-safe functions
- 16 tests pass covering all frequency/reminder combinations including edge cases (month-end rollover, custom day counts, remindOnDueDate=false)
- vercel.json declares both daily cron schedules, env.ts gets cronSecret + isCronAuthenticated helper

## Task Commits

Each task was committed atomically:

1. **Task 1: Database migration for Phase 5 tables** - `bef28b9` (feat)
2. **Task 2: Cron utilities, env config, vercel.json, and GREEN tests** - `2be7c1e` (feat)

**Plan metadata:** (docs commit below)

## Files Created/Modified

- `supabase/migrations/20260412000000_phase5_automation.sql` - 3 new tables + indexes + RLS + 5 reminder columns on user_settings
- `src/lib/cron-utils.ts` - advanceNextDueDate and shouldSendReminder pure functions with ReminderType and RecurringFrequency types
- `src/lib/cron-utils.test.ts` - 16 tests covering all frequency/reminder paths and edge cases
- `src/lib/env.ts` - Added cronSecret field and isCronAuthenticated helper function
- `vercel.json` - Cron schedule declarations for /api/cron/recurring (6am UTC) and /api/cron/reminders (7am UTC)

## Decisions Made

- UTC date arithmetic uses `T00:00:00Z` suffix when parsing date strings and `setUTCDate`/`setUTCMonth` for mutation — prevents DST-driven off-by-one errors in date comparison logic
- `isCronAuthenticated` lives in `env.ts` rather than a separate middleware file — all cron handlers can import it with one line, avoids duplication across 2+ route files
- `reminder_logs` has no UPDATE or DELETE RLS policies — rows are write-once audit records; the cron handler uses the admin client which bypasses RLS entirely

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

- `pnpm test` was hanging due to Vitest startup time (~300s transform duration). Used background bash execution and file-read polling to capture results. Tests ultimately passed 16/16.
- Parallel git agents caused occasional index.lock contention; resolved by retrying commits after lock cleared.

## User Setup Required

One environment variable must be added to the Vercel dashboard before cron handlers are deployed:

- `CRON_SECRET` — a random secret string (e.g., `openssl rand -hex 32`). Vercel automatically injects this as the `Authorization: Bearer <token>` header on cron invocations.

Without `CRON_SECRET`, `isCronAuthenticated` will return `false` for all requests and cron handlers will reject every invocation.

## Next Phase Readiness

- Schema foundation complete — plans 05-02 through 05-05 can proceed
- `advanceNextDueDate` and `shouldSendReminder` are importable from `@/lib/cron-utils`
- `isCronAuthenticated` is importable from `@/lib/env`
- Both cron paths declared in vercel.json; actual route handlers are created in 05-02 and 05-03

---
*Phase: 05-automation-recovery*
*Completed: 2026-04-12*
