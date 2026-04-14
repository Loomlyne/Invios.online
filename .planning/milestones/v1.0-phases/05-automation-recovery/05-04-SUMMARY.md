---
phase: 05-automation-recovery
plan: 04
subsystem: api
tags: [recurring-billing, cron, supabase, server-actions, radix-ui, shadcn, zod]

requires:
  - phase: 05-01
    provides: advanceNextDueDate, isCronAuthenticated, RecurringFrequency type

provides:
  - createRecurringScheduleAction, updateRecurringScheduleAction, cancelRecurringScheduleAction
  - getRecurringSchedule data fetcher
  - RecurringConfigForm component (frequency pills + DatePicker, inline + dialog modes)
  - RecurringButton client component for invoice detail page
  - Vercel cron endpoint GET /api/cron/recurring
  - Switch UI component (@radix-ui/react-switch)

affects:
  - invoice builder (DocumentBuilder)
  - invoice detail page
  - cron scheduling (vercel.json or dashboard config)

tech-stack:
  added:
    - "@radix-ui/react-switch": "^1.2.6"
  patterns:
    - Recurring schedule CRUD via zod-validated server actions with RLS ownership checks
    - Cron endpoint uses createSupabaseAdminClient (service role, no session)
    - Builder recurring config submitted as hidden inputs read by createInvoiceAction
    - RecurringConfigForm supports dual mode — inline (hidden inputs) and dialog (own save button)

key-files:
  created:
    - src/actions/recurring.ts
    - src/components/documents/recurring-config-form.tsx
    - src/components/ui/switch.tsx
    - src/app/(app)/app/invoices/[slug]/recurring-button.tsx
    - src/app/api/cron/recurring/route.ts
  modified:
    - src/lib/billing-data.ts
    - src/lib/billing-data.test.ts
    - src/components/documents/document-builder.tsx
    - src/app/(app)/app/invoices/[slug]/page.tsx
    - src/actions/invoices.ts
    - package.json

key-decisions:
  - "Recurring schedule creation from builder uses hidden inputs read inside createInvoiceAction, keeping the one-action form submit pattern"
  - "createInvoiceAction fires recurring schedule creation after successful insert with fire-and-forget .catch() to avoid failing invoice creation on schedule error"
  - "Switch component hand-authored using @radix-ui/react-switch, matching project's existing Radix + cn() pattern, instead of shadcn CLI which had env issues"
  - "RecurringConfigForm uses dual mode — inline for builder (hidden inputs + parent-controlled state) and dialog for detail page (own action buttons)"

patterns-established:
  - "Cron routes: createSupabaseAdminClient + isCronAuthenticated, per-record try/catch, processed/errors JSON response"
  - "Server action ownership: always .eq('user_id', user.id) on every mutation"

requirements-completed: [AUTO-03]

duration: 16min
completed: 2026-04-12
---

# Phase 05 Plan 04: Recurring Billing Summary

**Recurring billing — schedule CRUD actions, cron draft generator, frequency pill UI, and builder toggle wired end-to-end from creation through detail page**

## Performance

- **Duration:** 16 min
- **Started:** 2026-04-12T11:36:22Z
- **Completed:** 2026-04-12T11:52:10Z
- **Tasks:** 2
- **Files modified:** 11

## Accomplishments

- Three recurring schedule server actions with Zod validation and RLS ownership enforcement
- `getRecurringSchedule` data fetcher with 4 test cases (13 total billing-data tests pass)
- `RecurringConfigForm` with Weekly/Monthly/Quarterly frequency pills and DatePicker, dual inline/dialog mode
- Invoice builder (`DocumentBuilder`) shows "Repeat this invoice" toggle for invoices — submits recurring config alongside invoice creation
- Invoice detail page adds "Make recurring" / "Recurring: Monthly" button to actions row
- Cron route at `/api/cron/recurring` processes all due schedules, creates draft copies, advances `next_due_date`
- Switch component authored with `@radix-ui/react-switch` matching project's Radix pattern

## Task Commits

1. **Task 1: Recurring schedule server actions and data fetcher** - `8b20316` (feat)
2. **Task 2: RecurringConfigForm, builder integration, detail page, cron route** - `9cd2053` (feat)

## Files Created/Modified

- `src/actions/recurring.ts` — createRecurringScheduleAction, updateRecurringScheduleAction, cancelRecurringScheduleAction
- `src/lib/billing-data.ts` — getRecurringSchedule function + RecurringFrequency import
- `src/lib/billing-data.test.ts` — 4 real tests replacing it.todo stubs for getRecurringSchedule
- `src/components/documents/recurring-config-form.tsx` — frequency pills, DatePicker, dual inline/dialog mode
- `src/components/ui/switch.tsx` — Radix Switch component with project tokens
- `src/components/documents/document-builder.tsx` — recurring toggle section (invoices only)
- `src/actions/invoices.ts` — reads recurringFrequency/recurringNextDate after successful insert
- `src/app/(app)/app/invoices/[slug]/page.tsx` — getRecurringSchedule in Promise.all, RecurringButton in actions row
- `src/app/(app)/app/invoices/[slug]/recurring-button.tsx` — client component opening Dialog with RecurringConfigForm
- `src/app/api/cron/recurring/route.ts` — GET handler, auth gate, per-schedule draft creation, next_due_date advance
- `package.json` — added @radix-ui/react-switch

## Decisions Made

- **Builder submit pattern:** Hidden inputs (`recurringFrequency`, `recurringNextDate`) read inside `createInvoiceAction` after the invoice insert. This keeps the single-action form submit pattern intact and avoids a two-step flow.
- **Fire-and-forget schedule creation:** In `createInvoiceAction`, the recurring schedule insert uses `.catch(() => {})` so a schedule creation failure never fails the invoice creation.
- **Switch component:** Hand-authored using `@radix-ui/react-switch` instead of shadcn CLI (CLI had npm exec latency issues in this environment). Follows identical `cn()` + CSS variable pattern as the rest of the project.
- **Dual-mode RecurringConfigForm:** Inline mode uses parent-controlled state + hidden inputs for builder; dialog mode has own action buttons for detail page. Single component handles both surfaces.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Hand-authored Switch component instead of shadcn CLI**
- **Found during:** Task 2 (Switch component installation)
- **Issue:** `npx shadcn@latest add switch` ran in background but did not complete in time; switch.tsx was absent when needed
- **Fix:** Created switch.tsx directly using `@radix-ui/react-switch` + `pnpm add @radix-ui/react-switch`, matching the project's existing Radix UI pattern from button.tsx
- **Files modified:** src/components/ui/switch.tsx, package.json, pnpm-lock.yaml
- **Verification:** File exists, @radix-ui/react-switch in package.json at ^1.2.6
- **Committed in:** 9cd2053 (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (blocking)
**Impact on plan:** Switch component is functionally identical to what shadcn would produce. No scope creep.

## Issues Encountered

- Detail page had already been modified by a parallel plan 05-03 agent (added `listInvoiceVersions` and `VersionHistoryPanel`). Merged changes cleanly — added `getRecurringSchedule` to the existing Promise.all and `RecurringButton` to the actions row.

## Known Stubs

None. All recurring config form fields are wired to real state. The cron endpoint processes live data. No placeholder data in any rendered UI.

## Next Phase Readiness

- AUTO-03 requirement complete — recurring schedule CRUD and cron draft generation fully implemented
- Vercel cron schedule entry (`vercel.json` `crons` array) should be added pointing to `/api/cron/recurring` with daily frequency and `CRON_SECRET` set in Vercel env vars
- The `recurring_schedules` Supabase table must exist (expected from plan 05-01 migration)

---
*Phase: 05-automation-recovery*
*Completed: 2026-04-12*
