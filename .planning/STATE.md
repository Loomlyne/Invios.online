---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
status: Executing Phase 04
last_updated: "2026-04-10T18:42:00.000Z"
progress:
  total_phases: 5
  completed_phases: 3
  total_plans: 21
  completed_plans: 19
---

# STATE

## Project Reference

See: .planning/PROJECT.md (updated 2026-04-05)

**Core value:** Make it dead simple for a service business to send a polished branded quote or invoice and reliably know what has been paid, what is still due, and what profit remains.
**Current focus:** Phase 04 — public-trust-surfaces

## Current Status

- Project initialized
- Research complete
- Requirements defined
- Roadmap created
- Phase 1 context captured
- Phase 1 UI-SPEC approved (all 6 dimensions passed)
- Phase 1 Plan 01 complete (app shell, onboarding wizard, settings workspace, mobile nav)
- Phase 1 Plan 02 complete (D-09 redirect wired, UX-01/SET-01/SET-02 verified)
- Phase 1 Plan 03 complete (AUTH-03 E2E sign-out test, Vercel deployment human-verified) — Phase 1 DONE
- Phase 2 context captured (9 decisions: share modal, direct PDF download, contextual status buttons, builder→detail redirect, direct conversion, source lock, simple client cards, billed+quoted totals)
- Phase 2 Plan 00 complete (Wave 0 Zod schema test scaffolds: clients, quotations, invoices — 49 tests passing)

## Decisions

- **D-09 redirect**: `router.push("/app/invoices/new")` on `completeOnboardingAction` success; `setPendingStep("")` only in error branch so wizard unmounts naturally on success
- **D-16 SUPERSEDED**: mobile nav uses horizontal scroll chips (`overflow-x-auto` + `shrink-0`), no bottom tab bar introduced
- **Settings action names**: persistence is via `saveBusinessProfileAction`, `saveBrandingStepAction`, `saveDefaultsAction` (not `update*` prefix)
- [Phase 01-foundation-onboarding]: Sign-out E2E uses createConfirmedUser+signIn to avoid onboarding wizard obscuring the sign-out button
- [Phase 02-clients-document-engine]: documentLineItemSchema requires id field (z.string().min(1)) — test fixtures must include id
- [Phase 02-clients-document-engine]: Wave 0 schema tests use pure Zod validation without server action mocking — import from @/lib/billing directly
- [Phase 02-clients-document-engine]: D-04: builder status is read-only via hidden input, no dropdown exposed
- [Phase 02-clients-document-engine]: D-06: conversion redirect goes to /edit for review, not detail page
- [Phase 03-dashboard-cash-flow]: payments and expenses use CHECK constraint (not ENUM) — avoids ALTER TYPE migrations
- [Phase 03-dashboard-cash-flow]: No UPDATE RLS on payments/expenses — rows are add/delete only
- [Phase 03-dashboard-cash-flow]: computePaymentStatus injects today string — deterministic testing without mocking Date
- [Phase 03-dashboard-cash-flow]: computeCollectionRate returns null (not 0) at totalBilled=0 — callers display '—' vs '0%'
- [Phase 03-dashboard-cash-flow]: Expense actions do not call computeAndWriteInvoiceStatus — expenses affect profit only, not payment status
- [Phase 03-dashboard-cash-flow]: computeAndWriteInvoiceStatus receives supabase client from caller — avoids double session
- [Phase 03-dashboard-cash-flow]: Dashboard rebuilt as financial operator console: MetricCard grid replaces StatStrip, live billing metrics wired via getDashboardMetrics, DocumentSummaryRow extended with optional amount prop
- [Phase 03-dashboard-cash-flow]: DocumentSummaryRow amount prop already added by parallel agent — no redundant edit needed in plan 03-03
- [Phase 04-public-trust-surfaces]: PUB-05 (Accept/Reject from public page) folded in from v2 — natural fit with public quotation page build
- [Phase 04-public-trust-surfaces]: Bilingual layout = side-by-side columns (EN left, AR right), full RTL flip for Arabic-only docs
- [Phase 04-public-trust-surfaces]: Document routes switch from ID-based to slug-based with 301 redirect aliases
- [Phase 04-public-trust-surfaces]: UX-03 visual pass covers ALL views (public + private), not just client-facing surfaces
- [Phase 04-public-trust-surfaces]: Wave 0 tests use dynamic imports (await import) to isolate RED state per test without module caching issues
- [Phase 04-public-trust-surfaces]: getSlugAliasRedirect test uses call-count mock pattern for multi-table Supabase queries
- [Phase 04-public-trust-surfaces]: getSlugAliasRedirect uses single .eq('old_slug') call to match Wave 0 test mock chain — kind filter deferred to second table lookup
- [Phase 04-public-trust-surfaces]: Admin client update() TypeScript fix: cast supabase as any before .from() since untyped createClient infers never for update payload
- [Phase 04-public-trust-surfaces]: Route migration [id]→[slug] requires clearing .next/types cache — stale generated type files reference old [id] paths
- [Phase 04-public-trust-surfaces]: payments/expenses actions import getInvoiceById to resolve slug for revalidatePath — one extra query per action, acceptable tradeoff
- [Phase 04-public-trust-surfaces]: convertQuotationToInvoiceAction removed detail-level revalidatePath for quotation; list revalidation sufficient since the quotation is locked after conversion
- [Phase 04-public-trust-surfaces]: getPublicLogoUrl uses admin client to create signed URLs from branding-assets bucket — session-less equivalent of data.ts pattern for public pages
- [Phase 04-public-trust-surfaces]: Print mode early return on public pages skips getPublicLogoUrl call — avoids unnecessary Supabase round-trip on PDF generation path

## Session State

- Completed: 04-03-PLAN.md all tasks including checkpoint approval
- Ready for: Phase 4 Plan 04 execution
- Latest artifacts:
  - `.planning/phases/04-public-trust-surfaces/04-03-SUMMARY.md`
  - `src/components/public/public-page-shell.tsx`
  - `src/components/public/accept-reject-form.tsx`
  - `src/components/public/portal-document-row.tsx`
  - `src/components/public/public-document-actions.tsx`
  - `src/app/portal/[portalToken]/page.tsx`
  - `src/app/invoices/public/[shareToken]/page.tsx`
  - `src/app/quotations/public/[shareToken]/page.tsx`
