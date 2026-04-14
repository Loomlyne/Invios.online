---
phase: 02-clients-document-engine
plan: 01
subsystem: ui
tags: [react, radix-dialog, server-actions, lucide-react]

requires:
  - phase: 01-onboarding-billing-core
    provides: DocumentStatusBadge, Button, Dialog, Card UI primitives
provides:
  - ShareModal client component with clipboard copy and public URL display
  - DocumentStatusActions server component with contextual status buttons
  - DocumentSummaryRow server component with status badge for client detail
affects: [02-03, 02-04]

tech-stack:
  added: []
  patterns:
    - "Client island pattern — ShareModal is 'use client', StatusActions and SummaryRow are server components"
    - "Inline server actions in form action props for status mutations"

key-files:
  created:
    - src/components/documents/share-modal.tsx
    - src/components/documents/document-status-actions.tsx
    - src/components/documents/document-summary-row.tsx
  modified: []

key-decisions:
  - "ShareModal uses plain HTML elements inside DialogContent (no DialogTitle/DialogDescription — not exported by project's dialog.tsx)"
  - "DocumentStatusActions is a server component with inline 'use server' form actions, not a client component with useTransition"
  - "DocumentSummaryRow replaces ArrowRight with DocumentStatusBadge — minimal change, maximum information density"

patterns-established:
  - "Share modal pattern: client component wrapping Dialog with clipboard API and copy-success feedback"
  - "Status action pattern: server component rendering forms with inline server actions per document kind and status"

requirements-completed: [QUOT-05, QUOT-06, INV-05, INV-06, CLNT-03]

duration: 0min
completed: 2026-04-06
---

# Plan 02-01: Reusable Document Components Summary

**Three leaf UI components — ShareModal (clipboard copy dialog), DocumentStatusActions (contextual status buttons), DocumentSummaryRow (linked card with status badge)**

## Performance

- **Duration:** Pre-existing (code already implemented)
- **Tasks:** 3
- **Files modified:** 3

## Accomplishments
- ShareModal renders a Dialog with copyable public URL, copy-success feedback (idle/copied states with prefers-reduced-motion support), and "Open in new tab" link
- DocumentStatusActions renders contextual status buttons matching UI-SPEC transition tables for both invoice and quotation kinds via inline server actions
- DocumentSummaryRow renders a linked document card with document number, subtitle, and DocumentStatusBadge

## Files Created/Modified
- `src/components/documents/share-modal.tsx` - Client component with clipboard copy dialog
- `src/components/documents/document-status-actions.tsx` - Server component with status transition forms
- `src/components/documents/document-summary-row.tsx` - Server component with linked status card

## Decisions Made
None - followed plan as specified.

## Deviations from Plan
None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All three components ready for consumption by Plans 02-03 (detail pages) and 02-04 (client detail)

---
*Phase: 02-clients-document-engine*
*Completed: 2026-04-06*
