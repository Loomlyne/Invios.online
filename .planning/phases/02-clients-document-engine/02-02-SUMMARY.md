---
phase: 02-clients-document-engine
plan: "02"
subsystem: ui
tags: [next.js, react, document-builder, server-actions, vercel]

# Dependency graph
requires:
  - phase: 02-clients-document-engine
    provides: Document builder component, quotation/invoice server actions, PDF route handlers

provides:
  - DocumentBuilder with status managed via hidden input only (D-04 implemented)
  - Read-only DocumentStatusBadge in builder header
  - convertQuotationToInvoiceAction redirects to /app/invoices/{id}/edit per D-06
  - PDF routes with maxDuration = 60 for Vercel cold-start tolerance

affects: [02-clients-document-engine, document-builder, quotations, invoices]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Status immutability in builder: hidden input preserves status, no dropdown"
    - "Read-only badge in builder header to communicate current status"
    - "maxDuration = 60 on PDF routes for Playwright/Chromium cold-start tolerance"

key-files:
  created: []
  modified:
    - src/components/documents/document-builder.tsx
    - src/actions/quotations.ts
    - src/app/api/invoices/[id]/pdf/route.ts
    - src/app/api/quotations/[id]/pdf/route.ts

key-decisions:
  - "D-04 enforced: builder status is read-only via hidden input; no dropdown exposed to user"
  - "D-06 enforced: conversion redirect goes to /edit (builder) for review, not detail page"
  - "maxDuration=60 chosen for PDF routes: Playwright+Chromium cold start can take 15-30s, Vercel Hobby default 10s insufficient"

patterns-established:
  - "Builder status pattern: hidden input with initialValue?.status ?? 'draft' — new=draft, edit=preserve"
  - "Read-only status display: DocumentStatusBadge in header alongside builder type Badge"

requirements-completed:
  - QUOT-01
  - QUOT-02
  - QUOT-03
  - QUOT-04
  - INV-01
  - INV-02
  - INV-03
  - INV-04

# Metrics
duration: 25min
completed: 2026-04-06
---

# Phase 02 Plan 02: Document Builder D-04/D-06 Fixes Summary

**Status dropdown removed from document builder and replaced with hidden input + read-only badge; conversion redirect fixed to /edit; PDF routes hardened with 60s maxDuration**

## Performance

- **Duration:** ~25 min
- **Started:** 2026-04-06T23:30:00Z
- **Completed:** 2026-04-06T23:55:00Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments

- D-04 implemented: builder status `<select>` removed, replaced with `<input type="hidden" name="status">` that submits "draft" for new documents and preserves existing status on edit
- D-04 UX: read-only `DocumentStatusBadge` added to CardHeader so users can see current status without being able to mutate it from the builder
- D-06 implemented: `convertQuotationToInvoiceAction` now redirects to `/app/invoices/${invoiceData.id}/edit` instead of the detail page, so users can review the auto-generated invoice before committing
- PDF routes: `export const maxDuration = 60` added to both invoice and quotation PDF routes to prevent Vercel serverless timeouts during Playwright/Chromium cold starts

## Task Commits

Each task was committed atomically:

1. **Task 1: Remove builder status dropdown and add read-only badge (D-04)** - `c9e6fd7` (feat)
2. **Task 2: Fix D-06 conversion redirect + PDF route timeouts** - `b3a1aef` (feat)

## Files Created/Modified

- `src/components/documents/document-builder.tsx` - Removed status select (lines 197-223), removed `statusValue` state, added hidden status input, added `DocumentStatusBadge` import and render in CardHeader, updated preview `statusLabel` to use `initialValue?.status ?? "draft"`
- `src/actions/quotations.ts` - Fixed `convertQuotationToInvoiceAction` redirect from `/app/invoices/${id}` to `/app/invoices/${id}/edit`
- `src/app/api/invoices/[id]/pdf/route.ts` - Added `export const maxDuration = 60`
- `src/app/api/quotations/[id]/pdf/route.ts` - Added `export const maxDuration = 60`

## Decisions Made

- **D-04 implementation approach**: Used a plain `<input type="hidden" name="status">` rather than any React-controlled state. This ensures the FormData always carries a `status` field without any possibility of user mutation through the builder UI. The `parseQuotationPayload` / `parseInvoicePayload` parsers already read `status` from FormData, so no server-side changes were needed.
- **Badge placement**: `DocumentStatusBadge` was placed in a `flex flex-wrap items-center gap-3` container alongside the existing "Invoice builder"/"Quotation builder" Badge in the CardHeader. This puts status where the user expects to see it without requiring new layout regions.
- **maxDuration = 60**: Chosen as the maximum allowed for Vercel Pro/Hobby hobby tier. Playwright + Chromium PDF rendering takes 15-30s on cold start. The existing 10s default is guaranteed to timeout on cold starts.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Builder D-04 and D-06 are locked in. Status can only be mutated via contextual action buttons (setQuotationStatusAction, setInvoiceStatusAction), never through the builder form.
- PDF generation routes are now resilient to Vercel cold starts.
- Plan 02-03 (client CRUD, quotation/invoice CRUD pages, detail pages) can proceed without builder regressions.

---
*Phase: 02-clients-document-engine*
*Completed: 2026-04-06*
