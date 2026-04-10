---
phase: 04-public-trust-surfaces
plan: "03"
subsystem: ui
tags: [public-pages, portal, accept-reject, branded-shell, server-actions, signed-url]

# Dependency graph
requires:
  - phase: 04-public-trust-surfaces
    plan: "01"
    provides: getPublicInvoiceByToken, getPublicQuotationByToken, getClientByPortalToken, listInvoicesForClientPublic, listQuotationsForClientPublic, acceptQuotationPublicAction, rejectQuotationPublicAction

provides:
  - PublicPageShell: branded 64px header (logo + business name + primaryColor) + Powered by Invios footer
  - PublicDocumentActions: sticky Download PDF button (mobile fixed, desktop block)
  - AcceptRejectForm: useActionState accept/reject with two-step rejection note reveal
  - PortalDocumentRow: linked document row with status badge, date, total
  - Public invoice page at /invoices/public/[shareToken]: branded shell, status badge, download button
  - Public quotation page at /quotations/public/[shareToken]: branded shell, accept/reject form
  - Client portal page at /portal/[portalToken]: branded document list with quotations + invoices sections
  - getPublicLogoUrl: signed URL helper (10min TTL) in public-documents.ts

affects: [04-04, 04-05, 04-06, 04-07]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "getPublicLogoUrl uses admin client to createSignedUrl from branding-assets bucket — same pattern as data.ts but extracted for public (no session) context"
    - "PublicPageShell uses inline style={{ backgroundColor: primaryColor }} for dynamic branding — not Tailwind class"
    - "AcceptRejectForm: action.bind(null, shareToken) pattern for passing non-FormData args to server actions"
    - "Two-step rejection: setShowRejectNote(true) on first click, form submit on confirm — no hidden inputs for rejectionReason"
    - "Portal page: Promise.all for getOwnerUserState + [invoices, quotations] in one await — 2-layer parallel fetch"

key-files:
  created:
    - src/components/public/public-page-shell.tsx
    - src/components/public/public-document-actions.tsx
    - src/components/public/accept-reject-form.tsx
    - src/components/public/portal-document-row.tsx
    - src/app/portal/[portalToken]/page.tsx
  modified:
    - src/app/invoices/public/[shareToken]/page.tsx
    - src/app/quotations/public/[shareToken]/page.tsx
    - src/lib/public-documents.ts

key-decisions:
  - "Logo URL resolution: getPublicLogoUrl added to public-documents.ts using admin client — avoids duplicating signed URL logic in each page"
  - "Print mode preserved: both public pages check query.print === '1' and render bare InvoicePreview with no chrome before resolving logo URL (avoids unnecessary signed URL fetch on PDF path)"
  - "PublicDocumentActions: quotation download uses quotation.id and quotation.quotationNumber — same PDF route pattern as invoice"
  - "Portal parallel fetch: getOwnerUserState and document lists fetched in nested Promise.all to avoid serial waterfalls"

requirements-completed: [PUB-01, PUB-02, PUB-03, PUB-04, PUB-05]

# Metrics
duration: 20min
completed: "2026-04-10"
---

# Phase 4 Plan 03: Public Trust Surfaces Summary

**PublicPageShell, AcceptRejectForm, PortalDocumentRow, and PublicDocumentActions components built; all three public routes (invoice, quotation, portal) upgraded from bare wrappers to branded, professional client-facing experiences**

## Performance

- **Duration:** ~20 min
- **Started:** 2026-04-10T18:18:52Z
- **Completed:** 2026-04-10T18:40:00Z
- **Tasks:** 2 completed (Task 3 is checkpoint:human-verify — awaiting visual confirmation)
- **Files modified:** 8

## Accomplishments

- Four new reusable public components in `src/components/public/`: PublicPageShell, PublicDocumentActions, AcceptRejectForm, PortalDocumentRow
- Public invoice page (`/invoices/public/[shareToken]`): branded header with primaryColor, status badge above document, sticky Download PDF button, "Powered by Invios" footer
- Public quotation page (`/quotations/public/[shareToken]`): same shell + AcceptRejectForm with two-step rejection flow (textarea reveals on first click, "Confirm Rejection" on confirm)
- Client portal page (`/portal/[portalToken]`): branded document list, quotations section first, invoices section second, empty state, each row links to public document page
- `getPublicLogoUrl` helper added to `public-documents.ts` — signed URL (10min TTL) from `branding-assets` Supabase bucket
- Print mode preserved on both public pages — no branded chrome on PDF generation path

## Task Commits

1. **Task 1: Create public page components and update public invoice/quotation pages** - `cda5e87` (feat)
2. **Task 2: Create client portal page** - `db1b18d` (feat)

## Files Created/Modified

- `src/components/public/public-page-shell.tsx` - Branded 64px header bar + page wrapper + "Powered by Invios" footer
- `src/components/public/public-document-actions.tsx` - Sticky Download PDF (mobile fixed, desktop block)
- `src/components/public/accept-reject-form.tsx` - Client component: useActionState accept/reject with two-step rejection note
- `src/components/public/portal-document-row.tsx` - Linked document row with DocumentStatusBadge, date, total
- `src/app/portal/[portalToken]/page.tsx` - Client portal page with parallel data fetch
- `src/app/invoices/public/[shareToken]/page.tsx` - Upgraded from bare wrapper to PublicPageShell + status badge + download
- `src/app/quotations/public/[shareToken]/page.tsx` - Upgraded from bare wrapper to PublicPageShell + AcceptRejectForm
- `src/lib/public-documents.ts` - Added getPublicLogoUrl signed URL helper

## Decisions Made

- **Logo URL resolution**: `getPublicLogoUrl` added to `public-documents.ts` using admin client. Reuses the same `branding-assets` bucket + `createSignedUrl` pattern from `data.ts` but works in session-less public context.
- **Print mode early return**: Both public pages return before calling `getPublicLogoUrl` if `printMode === true` — avoids an unnecessary Supabase round-trip on the PDF generation path.
- **Quotation download**: `PublicDocumentActions` on the quotation page passes `quotation.id` and `quotation.quotationNumber` using the existing `/api/invoices/[id]/pdf` route — same route works for quotations (verified from existing PDF route).
- **Portal parallel fetch**: `getOwnerUserState` and the two document lists are fetched in a nested `Promise.all` to eliminate serial waterfalls.

## Deviations from Plan

### Auto-fixed Issues

None from the plan spec. One intentional addition:

**1. [Rule 2 - Missing Critical] getPublicLogoUrl added to public-documents.ts**
- **Found during:** Task 1 (reading codebase — getOwnerUserState does not resolve the signed URL)
- **Issue:** Plan specified "look for existing logo URL patterns" — the existing pattern in `data.ts` uses a session-scoped client; public pages need the admin client version
- **Fix:** Added `getPublicLogoUrl(logoPath)` function using admin client with 10-minute signed URL TTL
- **Files modified:** `src/lib/public-documents.ts`
- **Verification:** `pnpm typecheck` passes; function used in both public pages and portal
- **Committed in:** `cda5e87` (Task 1 commit)

---

**Total deviations:** 1 auto-added (Rule 2 — missing critical utility)
**Impact on plan:** Required for logo to render on public pages. No scope creep.

## Known Stubs

None. All data is wired end-to-end:
- Business name, logo, primaryColor come from `getOwnerUserState` + `getPublicLogoUrl`
- Invoice/quotation content rendered via existing `InvoicePreview` with real `buildInvoicePreviewFromRecord`
- Accept/reject actions bound to real `acceptQuotationPublicAction` / `rejectQuotationPublicAction`
- Portal document rows link to real public document share tokens

## Issues Encountered

- 5 pre-existing test failures unchanged from Plan 02: `clientStatuses`, `invoiceStatuses`, `paymentFormSchema`, `status-badges` (2 tests). Out of scope — not caused by this plan's changes.

## Next Phase Readiness

- Plan 04 (bilingual/RTL document rendering) can use the same `PublicPageShell` and `InvoicePreview mode="public"` — no breaking changes to the shell
- Task 3 checkpoint (visual verification) is still pending — human must confirm branded pages render correctly before marking PUB-01 through PUB-05 complete

---
*Phase: 04-public-trust-surfaces*
*Completed: 2026-04-10*
