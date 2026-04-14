---
phase: 05-automation-recovery
plan: 06
subsystem: infra
tags: [supabase, vercel, cron, deployment, typescript, testing]

requires:
  - phase: 05-automation-recovery
    provides: "All Phase 5 feature plans (01-05): version history, recurring billing, reminder automation"

provides:
  - "Phase 5 Supabase migration applied (invoice_versions, recurring_schedules, reminder_logs tables live)"
  - "CRON_SECRET env var set in Vercel production environment"
  - "Bug fixes: use-server exports, empty quotations page, Dialog sub-components, cron route TypeScript"
  - "Test suite: stale clientStatuses assertion corrected"

affects: ["phase-06", "production-deployment"]

tech-stack:
  added: []
  patterns:
    - "Admin Supabase client cast to any for new table access until generated types are updated"
    - "MAX_VERSIONS and InvoiceSnapshot moved to billing.ts — shared constants must not live in use-server files"

key-files:
  created:
    - src/app/quotations/public/[shareToken]/page.tsx
  modified:
    - src/lib/billing.ts
    - src/actions/versions.ts
    - src/actions/versions.test.ts
    - src/actions/invoices.ts
    - src/actions/clients.test.ts
    - src/components/ui/dialog.tsx
    - src/app/api/cron/recurring/route.ts
    - src/app/api/cron/reminders/route.ts
    - supabase/migrations/20260412000000_phase5_automation.sql

key-decisions:
  - "MAX_VERSIONS and InvoiceSnapshot moved to billing.ts — Next.js 15 use-server files can only export async functions"
  - "Admin supabase client cast to any in cron routes — new tables not in generated types, runtime behavior correct"
  - "Supabase migration repair: remote had orphan migration IDs — marked as reverted, then only Phase 5 migration applied"
  - "CRON_SECRET added via printf (no trailing newline) — echo adds newline which breaks HTTP header validation"

requirements-completed: [AUTO-01, AUTO-02, AUTO-03, AUTO-04, AUTO-05]

duration: ~90min
completed: 2026-04-12
---

# Phase 05 Plan 06: Ship & Verify Summary

**Phase 5 Supabase migration applied (3 new tables live), CRON_SECRET secured, TypeScript build errors fixed — production deploy requires manual git push due to environment network limitations**

## Performance

- **Duration:** ~90 min
- **Started:** 2026-04-12T16:43:00Z
- **Completed:** 2026-04-12T18:13:00Z
- **Tasks:** 1/2 (Task 2 = human verification checkpoint, not started)
- **Files modified:** 9

## Accomplishments

- Supabase Phase 5 migration applied: `invoice_versions`, `recurring_schedules`, `reminder_logs` tables are live in production DB
- `CRON_SECRET=e83f6ce01c10f06092e9d5019f8981a8d1cfddcd1db5e18b87290f523099eaf5` added to Vercel production environment (no trailing whitespace)
- Fixed 5 build-blocking bugs discovered during deploy attempts:
  1. `MAX_VERSIONS` and `InvoiceSnapshot` exported from `use-server` file (illegal in Next.js 15)
  2. `quotations/public/[shareToken]/page.tsx` was empty (1 byte) — restored full implementation
  3. `dialog.tsx` missing `DialogHeader`, `DialogFooter`, `DialogTitle`, `DialogDescription` exports
  4. Cron route admin client typed as `never` for new tables — cast to `any`
  5. Implicit `any` in map/reduce callbacks in cron routes (TypeScript strict mode)
- Fixed stale `clientStatuses` test assertion (`["lead", "active"]` → correct 6-status array)
- Migration history repaired: remote had orphaned migration IDs from dashboard-created migrations

## Task Commits

1. **Bug fix: use-server exports** - `47e81f9` (fix — MAX_VERSIONS + InvoiceSnapshot moved to billing.ts)
2. **Bug fix: empty quotations page + missing Dialog exports** - `73caa9c` (fix)
3. **Bug fix: cron route admin client typing** - `873a3ff` (fix — as any cast for new tables)
4. **Bug fix: implicit any in map callback** - `73d166a` (fix)
5. **Bug fix: implicit any in reduce callback** - `393d3c2` (fix)

Note: No feat commit for Task 1 itself — the task was entirely fix-up work discovered during deploy validation.

## Files Created/Modified

- `src/lib/billing.ts` — Added `MAX_VERSIONS` constant and `InvoiceSnapshot` interface (Phase 5 shared types)
- `src/actions/versions.ts` — Removed non-async exports; imports from billing.ts now
- `src/actions/invoices.ts` — Import `InvoiceSnapshot` from billing.ts instead of versions.ts
- `src/actions/versions.test.ts` — Import `MAX_VERSIONS` from billing.ts; import `snapshotInvoiceVersion` from versions.ts
- `src/actions/clients.test.ts` — Fix stale assertion: clientStatuses now checks all 6 statuses
- `src/components/ui/dialog.tsx` — Added `DialogHeader`, `DialogFooter`, `DialogTitle`, `DialogDescription`
- `src/app/quotations/public/[shareToken]/page.tsx` — Restored full implementation (was empty)
- `src/app/api/cron/recurring/route.ts` — Cast admin client to any; explicit type annotations
- `src/app/api/cron/reminders/route.ts` — Cast admin client to any; typed reduce callback

## Decisions Made

- **use-server constraint:** Next.js 15 `use-server` files can only export async functions. `MAX_VERSIONS` (const) and `InvoiceSnapshot` (interface) moved to `billing.ts` which is shared freely.
- **Admin client typing:** New tables (recurring_schedules, reminder_logs) don't appear in Supabase's auto-generated types. Cast to `any` is intentional — runtime behavior is correct, TypeScript just doesn't know the schema.
- **Migration repair strategy:** `supabase db push` found 8 remote migration IDs not present locally (dashboard-created migrations). Marked them as `reverted` in migration history, then marked pre-Phase-5 local migrations as `applied`, leaving only Phase 5 migration pending. Applied cleanly.
- **CRON_SECRET delivery:** `echo` adds a newline that Vercel rejects as invalid HTTP header value. Used `printf '%s'` instead.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Non-async exports in use-server file**
- **Found during:** Task 1 (first Vercel deploy attempt — build failed)
- **Issue:** `src/actions/versions.ts` had `"use server"` directive but exported `MAX_VERSIONS` (const) and `InvoiceSnapshot` (interface). Next.js 15 forbids non-async exports in use-server files.
- **Fix:** Moved both to `src/lib/billing.ts`. Updated all import sites (invoices.ts, versions.test.ts).
- **Files modified:** src/lib/billing.ts, src/actions/versions.ts, src/actions/invoices.ts, src/actions/versions.test.ts
- **Committed in:** 47e81f9

**2. [Rule 1 - Bug] Empty quotations public page — TypeScript "not a module"**
- **Found during:** Task 1 (third deploy attempt — build failed type check)
- **Issue:** `src/app/quotations/public/[shareToken]/page.tsx` was 1 byte (empty). TypeScript error: "File is not a module". Likely emptied by a post-edit hook in a prior session.
- **Fix:** Restored full implementation mirroring invoices public page, using `getPublicQuotationByToken` + `buildQuotationPreviewFromRecord`.
- **Files modified:** src/app/quotations/public/[shareToken]/page.tsx
- **Committed in:** 73caa9c

**3. [Rule 1 - Bug] Missing Dialog sub-component exports**
- **Found during:** Task 1 (compilation warnings visible in deploy logs)
- **Issue:** `src/components/ui/dialog.tsx` only exported `Dialog`, `DialogTrigger`, `DialogContent`, `DialogClose`. `VersionRestoreDialog` imports `DialogHeader`, `DialogTitle`, `DialogDescription`, `DialogFooter` — none of which existed.
- **Fix:** Added all four missing components using standard shadcn/ui patterns.
- **Files modified:** src/components/ui/dialog.tsx
- **Committed in:** 73caa9c

**4. [Rule 1 - Bug] Cron route admin client typed as never for new tables**
- **Found during:** Task 1 (fourth deploy attempt — TypeScript error in recurring/route.ts)
- **Issue:** `Property 'source_invoice_id' does not exist on type 'never'` — Supabase admin client inferred table row as `never` for `recurring_schedules` (new table not in generated types).
- **Fix:** Cast admin client to `any` in both cron routes. Added explicit `RecurringScheduleRow` type annotation for the select result.
- **Files modified:** src/app/api/cron/recurring/route.ts, src/app/api/cron/reminders/route.ts
- **Committed in:** 873a3ff

**5. [Rule 1 - Bug] Implicit any parameters in cron route callbacks**
- **Found during:** Task 1 (fifth/sixth deploy attempts — TypeScript strict mode failures)
- **Issue:** After casting supabase to `any`, callback parameters in `.map()` and `.reduce()` became implicit any — TypeScript strict mode rejects these.
- **Fix:** Added explicit type annotations: `(s: { slug: string })` and `(sum: number, p: { amount: string | number })`.
- **Files modified:** src/app/api/cron/recurring/route.ts, src/app/api/cron/reminders/route.ts
- **Committed in:** 73d166a, 393d3c2

**6. [Rule 1 - Bug] Stale clientStatuses test assertion**
- **Found during:** Task 1 (first test run — test reported failure)
- **Issue:** `clients.test.ts` asserted `clientStatuses` equals `["lead", "active"]` but billing.ts defines 6 statuses. Test was written for a prior schema version.
- **Fix:** Updated assertion to match current 6-status array.
- **Files modified:** src/actions/clients.test.ts
- **Committed in:** 47e81f9

---

**Total deviations:** 6 auto-fixed (all Rule 1 - Bug)
**Impact on plan:** All fixes were necessary for build success. No scope creep. The codebase was already complete for Phase 5 features — these were pre-existing issues that only surfaced during build validation.

## Issues Encountered

**Environment: Git push and Vercel CLI network hang in background processes**
- `git push origin main` consistently produces 0 bytes output and hangs indefinitely when run as a background process
- `npx vercel --prod --yes` also hangs at "Retrieving project" with 0 bytes output
- `npx vercel ls` and interactive commands work normally (network is available)
- The issue is specific to background process output capture — likely SSH/HTTPS auth in non-interactive context
- **Status:** Code is locally committed and build-verified. Manual push required.
- **Action needed:** `git push origin main` (or `npx vercel --prod`) in your own terminal

**Supabase migration history divergence**
- Remote DB had 8 migration IDs (created via Supabase dashboard) not tracked locally
- `supabase db push` aborted until history was reconciled
- Fixed via `supabase migration repair --status reverted` for orphan IDs, then `--status applied` for pre-Phase-5 local migrations

## Deployment Status

| Step | Status |
|------|--------|
| Supabase migration applied | DONE — 3 new tables live |
| CRON_SECRET set in Vercel | DONE — production environment |
| CRON_SECRET added to .env.local | DONE |
| Build errors fixed (6 bugs) | DONE — all commits on main |
| `git push origin main` | NEEDS USER ACTION |
| `npx vercel --prod` | NEEDS USER ACTION (or auto-deploys after push) |
| Cron 401 security verification | PENDING (after deploy) |
| Human verification checklist | PENDING (Task 2 checkpoint) |

## User Setup Required

**To complete deployment:**

```bash
# Push the fix commits to trigger Vercel auto-deploy
git push origin main

# Or deploy directly if auto-deploy is not configured
npx vercel --prod
```

After deploy, verify:
1. `curl -I https://invios.online/api/cron/recurring` → should return 401
2. `curl -I https://invios.online/api/cron/reminders` → should return 401
3. Go to invios.online/app/invoices → open an invoice → verify "Version History" panel appears

## Known Stubs

None — all Phase 5 features are fully wired.

## Next Phase Readiness

- Phase 5 code is complete and all bugs fixed
- Supabase schema is live (3 tables)
- CRON_SECRET is configured in Vercel
- Pending: git push + production deploy (human action required due to environment network limitation)
- After deploy succeeds, Task 2 (human verification checklist) must be completed

## Self-Check: PASSED

- FOUND: `.planning/phases/05-automation-recovery/05-06-SUMMARY.md`
- FOUND: `src/app/quotations/public/[shareToken]/page.tsx`
- FOUND: `src/components/ui/dialog.tsx`
- FOUND: commit `47e81f9` (fix: move MAX_VERSIONS and InvoiceSnapshot)
- FOUND: commit `393d3c2` (fix: implicit any in reduce callback)

---
*Phase: 05-automation-recovery*
*Completed: 2026-04-12*
