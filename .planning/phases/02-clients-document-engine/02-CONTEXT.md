# Phase 2: Clients & Document Engine - Context

**Gathered:** 2026-04-06
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 2 delivers the primary product loop: create a client, build a quotation or invoice with structured line items, preview it live, export it to PDF, and share it via a public link. It covers the full lifecycle of quotations (draft → sent → accepted/rejected/expired) and invoices (draft → sent), including converting accepted quotations into invoices. It does not include payment tracking, expense recording, dashboard metrics, recurring billing, reminders, or versioning — those belong to later phases.

</domain>

<decisions>
## Implementation Decisions

### Share & Export UX
- **D-01:** Clicking "Share" on an invoice or quotation detail page opens a share modal (dialog) with the public URL displayed, a one-click "Copy" button, and a secondary "Open in new tab" link. The user stays in context rather than navigating away.
- **D-02:** Clicking "PDF" on a detail page triggers a direct file download via the existing Playwright API route (`/api/invoices/[id]/pdf` or `/api/quotations/[id]/pdf`). No print preview step — the browser downloads the rendered PDF.

### Status Transition Flow
- **D-03:** Document statuses advance via contextual action buttons on the detail page, not via a free dropdown in the builder. The builder always saves documents as "draft". Status-aware actions on the detail page include: "Mark as sent" (when draft), "Mark as accepted" / "Mark as rejected" (when sent, quotations only), "Mark as expired" (when past expiry, quotations only).
- **D-04:** The builder's current `<select>` dropdown for status should be removed or replaced with a read-only status badge. Status changes happen exclusively on the detail page.
- **D-05:** After saving or creating a document in the builder, the user is redirected to the document's detail page. This puts them in the review/action context where they can mark status, share, export, or edit further.

### Quotation-to-Invoice Conversion
- **D-06:** Clicking "Convert to invoice" on an accepted quotation's detail page immediately creates a new draft invoice record (all line items, dates, client, tax, terms copied over via `mapQuotationToInvoiceInput`) and redirects the user to the new invoice's builder page for review. No confirmation modal — the flow is direct and fast.
- **D-07:** After conversion, the source quotation is locked against editing. Its status is set to "accepted" (if not already) and the Edit button on the detail page becomes disabled with a "Converted" indication. This prevents the quotation from drifting out of sync with the generated invoice.

### Client Detail Depth
- **D-08:** The client detail page displays linked invoices and quotations as simple summary cards — each showing document number, status badge, date, and total. No DataView (list/kanban/table), no search, no view-switching within the client detail. The full DataView experience lives on the main list pages.
- **D-09:** The client detail page shows two headline financial stats: total billed (sum of invoice totals) and total quoted (sum of quotation totals). No status-based breakdowns — deeper financial metrics (collected, outstanding, collection rate) come in Phase 3 when payment tracking is added.

### Claude's Discretion
- Exact visual design of the share modal (size, layout, copy-success feedback animation)
- Empty state messaging for clients with no documents yet on the detail page
- DataView default view mode per list page (list vs table vs kanban) — pick what suits each entity best
- Mobile builder layout details (Dialog preview trigger placement, form section ordering)
- Exact disabled-state treatment for locked quotations (tooltip text, visual style)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Core Phase Definition
- `.planning/ROADMAP.md` — Phase 2 scope, goal, and success criteria
- `.planning/REQUIREMENTS.md` — `CLNT-01..04`, `QUOT-01..07`, `INV-01..08`
- `.planning/PROJECT.md` — product thesis, stack constraints, quality bar

### Prior Phase Context
- `.planning/phases/01-foundation-onboarding/01-CONTEXT.md` — Phase 1 decisions (auth flow, onboarding structure, mobile shell, branding/preview)

### Design Direction
- `/Users/koss/.gstack/projects/INV/koss-unknown-design-20260405-144707.md` — approved primary design doc for Invios

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `DocumentBuilder` (`src/components/documents/document-builder.tsx`): Shared client component for invoices and quotations. Split-view on xl (form left, 480px preview right), Dialog preview on mobile. Needs status dropdown removal per D-04.
- `InvoicePreview` (`src/components/invoice/invoice-preview.tsx`): Reusable branded document preview component used in builder, detail pages, and public pages.
- `DataView` system (`src/components/data-view/`): Multi-view renderer (list/kanban/table) with toolbar (search, status filter, view switcher). Already integrated into clients, invoices, and quotations list pages.
- `DocumentStatusBadge` (`src/components/documents/document-status-badge.tsx`): Status badge component for document statuses.
- `ClientStatusBadge` (`src/components/clients/client-status-badge.tsx`): Status badge for client records.
- 3 document templates: classic, executive, minimal (`src/lib/document-templates.ts`)
- PDF generation: Playwright + Chromium rendering via API route (`src/lib/document-pdf.ts`)
- Share tokens: Generated at document creation (`createShareToken` in `src/lib/billing-utils.ts`)
- Conversion utility: `mapQuotationToInvoiceInput` in `src/lib/billing-utils.ts`

### Established Patterns
- Server actions pattern: form-based with Zod validation, `requireSession()` for auth, `revalidatePath` + `redirect` after mutations
- Slug-based routing for clients (`/app/clients/[slug]`), ID-based for documents (`/app/invoices/[id]`)
- `getAppContext()` provides user state (branding, settings) to builder and preview components
- Public pages use `getOwnerUserState()` via admin Supabase client to load document owner's branding
- Line items: structured with description, quantity, unitPrice, notes, arabicDescription

### Integration Points
- Detail pages already import status actions (`setInvoiceStatusAction`, `setQuotationStatusAction`) — wire up contextual buttons per D-03
- `convertQuotationToInvoiceAction` exists in `src/actions/quotations.ts` — ensure it redirects to builder per D-06
- Public share pages exist at `/invoices/public/[shareToken]` and `/quotations/public/[shareToken]`
- PDF API routes exist at `/api/invoices/[id]/pdf` and `/api/quotations/[id]/pdf`

</code_context>

<specifics>
## Specific Ideas

- The share modal should feel premium and on-brand — not a generic browser prompt. One-click copy with clear visual feedback (e.g., "Copied!" state on the button).
- Status transitions should feel intentional — contextual buttons that guide the user through the natural document lifecycle rather than exposing all states as a free-form dropdown.
- Quotation-to-invoice conversion should feel seamless and fast — no friction, just a direct redirect to the pre-filled builder.
- Client detail stays lean — this is a billing relationship overview, not a CRM. Deeper analytics come in Phase 3.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 02-clients-document-engine*
*Context gathered: 2026-04-06*
