# Phase 2: Clients & Document Engine - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-06
**Phase:** 02-clients-document-engine
**Areas discussed:** Share & export UX, Status transition flow, Quotation → Invoice conversion, Client detail depth

---

## Share & Export UX

### Share link trigger

| Option | Description | Selected |
|--------|-------------|----------|
| Share modal | Open a dialog with public URL, one-click Copy button, and "Open in new tab" link | ✓ |
| Open directly | Open the public page in a new tab; user copies URL from browser bar | |

**User's choice:** Share modal
**Notes:** Keeps the user in context. Matches the pattern used by HoneyBook, Bonsai, and Invoice Ninja.

### PDF export trigger

| Option | Description | Selected |
|--------|-------------|----------|
| Button → new tab print view | Open public page with ?print=1 for browser print/save | |
| Button → download directly | Hit /api/[kind]/[id]/pdf to trigger file download via Playwright | ✓ |

**User's choice:** Button → download directly
**Notes:** Uses the existing Playwright API route. No intermediate print preview step.

---

## Status Transition Flow

### Status management approach

| Option | Description | Selected |
|--------|-------------|----------|
| Contextual buttons on detail page | Builder saves as draft; detail page shows status-aware action buttons (Mark as sent, Mark as accepted, etc.) | ✓ |
| Free dropdown in builder | User picks any status via a <select> in the builder form | |

**User's choice:** Contextual buttons on detail page
**Notes:** Builder dropdown removed. Status changes are intentional actions, not form field changes.

### Post-save destination

| Option | Description | Selected |
|--------|-------------|----------|
| Detail page | Redirect to invoice/quotation detail page after save | ✓ |
| Stay in builder | Stay on the builder page for continued editing | |

**User's choice:** Detail page
**Notes:** Puts user in the review/action context immediately after saving.

---

## Quotation → Invoice Conversion

### Conversion flow

| Option | Description | Selected |
|--------|-------------|----------|
| Direct to pre-filled builder | Creates invoice record immediately, redirects to builder for review | ✓ |
| Confirmation modal first | Shows a confirmation dialog before creating the invoice | |

**User's choice:** Direct to pre-filled builder
**Notes:** Fast, no friction. All line items, dates, client copied over. Invoice starts as draft in the builder.

### Source quotation locking

| Option | Description | Selected |
|--------|-------------|----------|
| Lock it | Set quotation to accepted, disable Edit on detail page after conversion | ✓ |
| Keep it editable | Leave quotation editable after conversion | |

**User's choice:** Lock it
**Notes:** Prevents source doc from drifting out of sync with the generated invoice. Edit button greyed out with "Converted" indication.

---

## Client Detail Depth

### Document display

| Option | Description | Selected |
|--------|-------------|----------|
| Simple summary cards | Document number, status badge, date, and total per card. No DataView. | ✓ |
| Full DataView per section | List/kanban/table + search + filter within the client detail page | |
| Tabbed document list | Single tabbed section (Invoices | Quotations) with filtered list | |

**User's choice:** Simple summary cards
**Notes:** Full DataView lives on the main list pages. Client detail stays lightweight.

### Financial summary

| Option | Description | Selected |
|--------|-------------|----------|
| Billed + Quoted totals | Two headline numbers: total billed, total quoted | ✓ |
| Extended breakdown | Add status-based breakdowns (draft/sent/paid invoice totals, etc.) | |

**User's choice:** Billed + Quoted totals
**Notes:** Deeper financial metrics come in Phase 3 when payment tracking is added.

---

## Claude's Discretion

- Share modal visual design (size, layout, copy-success animation)
- Empty states on client detail for zero documents
- DataView default view per list page
- Mobile builder layout details
- Locked quotation visual treatment

## Deferred Ideas

None — discussion stayed within phase scope.
