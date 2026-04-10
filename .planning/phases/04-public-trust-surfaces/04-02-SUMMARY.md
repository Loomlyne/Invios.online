---
phase: 04-public-trust-surfaces
plan: "02"
subsystem: routing
tags: [slug-routing, redirect, uuid-fallback, alias-redirect, server-actions, revalidatePath]

# Dependency graph
requires:
  - phase: 04-public-trust-surfaces
    plan: "01"
    provides: getInvoiceBySlug, getQuotationBySlug, getSlugAliasRedirect, getInvoiceById, getQuotationById, isUuid

provides:
  - Slug-based invoice detail route (app/invoices/[slug]) with UUID fallback + alias redirect
  - Slug-based invoice edit route (app/invoices/[slug]/edit) with same redirect logic
  - Slug-based quotation detail route (app/quotations/[slug]) with UUID fallback + alias redirect
  - Slug-based quotation edit route (app/quotations/[slug]/edit) with same redirect logic
  - All server actions use document.slug in redirectTo and revalidatePath
  - All list views, configs, dashboard links use document.slug

affects: [04-03, 04-04, 04-05, 04-06, 04-07]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "permanentRedirect (308) for UUID-to-slug and alias-to-slug rewrites"
    - "isUuid() guard at top of page component before slug lookup"
    - "Three-stage slug resolution: UUID check → primary lookup → alias redirect → notFound"
    - "Server actions: select('id,slug') to get slug from insert/update return for revalidatePath"
    - "payments/expenses actions: getInvoiceById lookup to resolve slug before revalidatePath"

key-files:
  created: []
  modified:
    - src/app/(app)/app/invoices/[slug]/page.tsx
    - src/app/(app)/app/invoices/[slug]/edit/page.tsx
    - src/app/(app)/app/quotations/[slug]/page.tsx
    - src/app/(app)/app/quotations/[slug]/edit/page.tsx
    - src/actions/invoices.ts
    - src/actions/quotations.ts
    - src/actions/payments.ts
    - src/actions/expenses.ts
    - src/lib/dashboard.ts
    - src/components/data-view/configs/invoice-config.tsx
    - src/components/data-view/configs/quotation-config.tsx
    - src/app/(app)/app/clients/[slug]/page.tsx
    - src/app/(app)/app/page.tsx

key-decisions:
  - "Route directories renamed [id] -> [slug] atomically via mv; .next/types cache cleared to remove stale type references"
  - "payments.ts and expenses.ts import getInvoiceById to resolve slug for revalidatePath — adds one extra query per action but keeps correctness without architectural change"
  - "setInvoiceStatusAction/setQuotationStatusAction chain .select('slug').single() on the update call to avoid a separate round trip"
  - "convertQuotationToInvoiceAction: removed revalidatePath('/app/quotations/[quotationId]') since that path no longer updates after conversion; kept list revalidation only"
  - "dashboard.ts recentActivity hrefs now use row.slug / quotation.slug from InvoiceRecord / QuotationRecord which already include the slug field"

# Metrics
duration: 15min
completed: "2026-04-10"
---

# Phase 4 Plan 02: Slug-Based Route Migration Summary

**Rename [id] → [slug] route directories, wire UUID/alias 308 redirects on detail and edit pages, update all 9 callsite files so zero .id-based document URLs remain**

## Performance

- **Duration:** ~15 min
- **Started:** 2026-04-10T22:05:00Z
- **Completed:** 2026-04-10T22:20:00Z
- **Tasks:** 2
- **Files modified:** 13

## Accomplishments

- Renamed `src/app/(app)/app/invoices/[id]` → `[slug]` and `quotations/[id]` → `[slug]` (git detects as renames at 80–100% similarity)
- Invoice detail page: three-stage resolution — UUID check → `getInvoiceBySlug` → `getSlugAliasRedirect` → `permanentRedirect` or `notFound`
- Invoice edit page: same resolution pattern; back link uses `invoice.slug`
- Quotation detail and edit pages: identical pattern with `getQuotationBySlug` / `getSlugAliasRedirect("quotation")`
- All server actions (`createInvoiceAction`, `updateInvoiceAction`, `setInvoiceStatusAction`, `createQuotationAction`, `updateQuotationAction`, `setQuotationStatusAction`, `convertQuotationToInvoiceAction`) now use `data.slug` in `redirectTo` and `revalidatePath`
- `addPaymentAction`, `deletePaymentAction`, `addExpenseAction`, `deleteExpenseAction` import and call `getInvoiceById` to resolve the invoice slug before `revalidatePath`
- `dashboard.ts` `recentActivity` hrefs switch from `row.id` / `quotation.id` to `row.slug` / `quotation.slug`
- `invoiceConfig.getHref` and `quotationConfig.getHref` both use `.slug`
- `clients/[slug]/page.tsx` document summary row hrefs use `.slug`
- `app/page.tsx` (dashboard): all 6 invoice and quotation link sites updated to use `.slug`
- Grep confirms zero remaining `app/invoices/${*.id}` or `app/quotations/${*.id}` patterns in `src/`

## Task Commits

1. **Task 1: Rename route directories and update invoice/quotation detail pages** - `e64fbcf` (feat)
2. **Task 2: Update all callsites from document.id to document.slug in URLs** - `789a454` (feat)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Stale .next/types cache referenced old [id] route paths**
- **Found during:** Task 1 verification (`pnpm typecheck`)
- **Issue:** After renaming `[id]` → `[slug]`, `.next/types/` still contained generated type files referencing the old paths, causing 12 TypeScript errors on `Cannot find module`
- **Fix:** `rm -rf .next/types` — Next.js rebuilds these on next build/typecheck
- **Verification:** `pnpm typecheck` clean pass after cache clear
- **Committed in:** `e64fbcf` (Task 1 commit, part of the rename workflow)

**2. [Rule 1 - Bug] payments.ts and expenses.ts had no slug available for revalidatePath**
- **Found during:** Task 2 (reviewing revalidatePath callsites)
- **Issue:** These actions receive `invoiceId` (UUID) but `revalidatePath` now needs the slug. No slug is available in action scope without a lookup.
- **Fix:** Import `getInvoiceById` and resolve the invoice before revalidating. If the invoice is not found (already deleted), skip the detail revalidation safely.
- **Files modified:** `src/actions/payments.ts`, `src/actions/expenses.ts`
- **Committed in:** `789a454` (Task 2 commit)

**3. [Rule 1 - Bug] convertQuotationToInvoiceAction revalidatePath('/app/quotations/${quotationId}') used UUID**
- **Found during:** Task 2 (reviewing quotations.ts)
- **Issue:** The action had `revalidatePath('/app/quotations/${quotationId}')` where `quotationId` is a UUID — wrong path after slug migration and unnecessary since the quotation detail is being replaced by conversion
- **Fix:** Removed the detail-level revalidation; kept only list-level `revalidatePath("/app/quotations")` and `revalidatePath("/app/invoices")`
- **Files modified:** `src/actions/quotations.ts`
- **Committed in:** `789a454` (Task 2 commit)

---

**Total deviations:** 3 auto-fixed (Rule 3, Rule 1, Rule 1)
**Impact on plan:** All fixes needed for correctness. No scope creep.

## Known Stubs

None. All document URLs are fully wired to `.slug` values that come from the database.

## Issues Encountered

- 5 pre-existing test failures (clientStatuses, invoiceStatuses, paymentFormSchema, status-badges) confirmed unchanged from before this plan. Out of scope.

## Next Phase Readiness

- Plan 03 can build the public quotation page at `app/q/[token]` — no changes to slug routing needed
- Plan 04 can build the client portal at `app/p/[token]` — slug URLs will render correctly in portal document lists (they already use `.slug`)
- All 114 Wave 0 + regression tests pass

## Self-Check: PASSED

- invoices/[slug]/page.tsx: FOUND
- invoices/[slug]/edit/page.tsx: FOUND
- quotations/[slug]/page.tsx: FOUND
- quotations/[slug]/edit/page.tsx: FOUND
- [id] directory removed: CONFIRMED
- Commit e64fbcf: FOUND
- Commit 789a454: FOUND
- permanentRedirect in invoice page: CONFIRMED
- isUuid in invoice page: CONFIRMED
- getInvoiceBySlug in invoice page: CONFIRMED
- getSlugAliasRedirect in invoice page: CONFIRMED
- data.slug in invoices.ts: CONFIRMED
- inv.slug in invoice-config.tsx: CONFIRMED

---
*Phase: 04-public-trust-surfaces*
*Completed: 2026-04-10*
