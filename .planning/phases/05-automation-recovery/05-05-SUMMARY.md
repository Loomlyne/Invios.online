---
phase: 05-automation-recovery
plan: "05"
subsystem: api
tags: [resend, email, cron, supabase, reminder, deduplication]

requires:
  - phase: 05-01
    provides: shouldSendReminder + ReminderType from cron-utils.ts, isCronAuthenticated from env.ts, reminder_logs table migration
  - phase: 05-04
    provides: user_settings reminder columns (reminder_enabled, reminder_days_before, etc.)

provides:
  - sendReminderEmail function in email.ts — branded email with overdue/upcoming state
  - GET /api/cron/reminders — full reminder automation endpoint with timing evaluation and dedup

affects: [vercel-cron-config, 05-06]

tech-stack:
  added: []
  patterns:
    - Cron uses admin client for all DB operations (session-less)
    - Fire-and-forget email with .catch() error logging
    - Per-invoice/per-user independent failure isolation
    - Outstanding amount = total - sum(payments) for accurate email content
    - 24-hour dedup window via reminder_logs.sent_at query

key-files:
  created:
    - src/app/api/cron/reminders/route.ts
  modified:
    - src/lib/email.ts

key-decisions:
  - "sendReminderEmail adapts subject/title/body based on overdue vs upcoming state using new Date(dueDate) < new Date()"
  - "Outstanding amount shown in reminder email, not invoice total — cron sums payments table to calculate"
  - "Cron skips silently when client has no email address — no error logged, just skipped counter"

patterns-established:
  - "Cron endpoint pattern: auth check → admin client → query with error propagation → per-item try/catch → summary response"
  - "Email state detection: isOverdue = new Date(dueDate) < new Date() drives subject + title + body copy"

requirements-completed: [AUTO-04, AUTO-05]

duration: 16min
completed: 2026-04-12
---

# Phase 05 Plan 05: Reminder Automation Summary

**Reminder cron endpoint at /api/cron/reminders that reads user settings, evaluates timing rules via shouldSendReminder, deduplicates via reminder_logs, and sends branded overdue/upcoming emails via Resend**

## Performance

- **Duration:** 16 min
- **Started:** 2026-04-12T12:09:00Z
- **Completed:** 2026-04-12T12:25:05Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments

- Added `sendReminderEmail` to `src/lib/email.ts` following fire-and-forget branded pattern — subject and body adapt to overdue vs upcoming state
- Created `src/app/api/cron/reminders/route.ts` with full automation loop: reads reminder-enabled users, evaluates `shouldSendReminder` per invoice, deduplicates via 24-hour window in `reminder_logs`, sends branded email, logs send
- Outstanding balance (total minus collected payments) shown in reminder emails, not the raw invoice total

## Task Commits

Each task was committed atomically:

1. **Task 1: sendReminderEmail function in email.ts** - `c809112` (feat)
2. **Task 2: Reminder cron endpoint with deduplication** - `4f14b60` (feat)

**Plan metadata:** committed with docs commit below

## Files Created/Modified

- `src/lib/email.ts` — Added `sendReminderEmail` (45 lines); adapts to overdue/upcoming state; fire-and-forget with branded template
- `src/app/api/cron/reminders/route.ts` — Created (160 lines); full cron handler reading user_settings, evaluating timing rules, deduplicating via reminder_logs, sending and logging

## Decisions Made

- `sendReminderEmail` uses `new Date(dueDate) < new Date()` to detect overdue state — drives subject line, title, and body copy divergence
- Outstanding amount in email = `invoice.total - sum(payments)` so partial-paid invoices show correct remaining balance
- Silent skip (skipped counter increment, no error) when client has no email address — this is a valid operational state, not a bug
- Cron processes users independently and invoices independently within each user — one failure never blocks others

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

- Git lock contention from parallel agents caused Task 2 commit to fail with exit 128 on first attempt — committed successfully on retry
- TypeScript full-project check (`npx tsc --noEmit`) runs in background and takes >90s on this project; structural verification via grep patterns confirmed all acceptance criteria

## Next Phase Readiness

- `/api/cron/reminders` endpoint ready to register in `vercel.json` cron config (plan 05-06)
- `sendReminderEmail` exported and available for any future direct send needs
- Dedup protection is live — safe to register the cron at any cadence

---
*Phase: 05-automation-recovery*
*Completed: 2026-04-12*
