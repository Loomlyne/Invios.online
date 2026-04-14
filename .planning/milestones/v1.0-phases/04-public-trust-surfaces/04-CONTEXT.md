# Phase 4: Public Trust Surfaces - Context

**Gathered:** 2026-04-08
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 4 makes every client-facing surface professional and trustworthy: public document pages (invoices and quotations), a client portal link, UAE tax invoice compliance with bilingual English/Arabic rendering, canonical slug-based URLs for documents, and a full visual quality pass across public and private views. It does not add versioning, recurring billing, reminders, or any automation — those belong to Phase 5.

</domain>

<decisions>
## Implementation Decisions

### Public Document Pages
- **D-01:** Public document pages render as a branded landing page: business logo/name in a header bar, the document preview centered, a sticky "Download PDF" button, and a subtle "Powered by Invios" footer link.
- **D-02:** Download PDF triggers a direct file download via the existing Playwright PDF route. No print preview step — same pattern as Phase 2.
- **D-03:** Public invoice pages show a visible status badge (Draft, Sent, Partial Paid, Paid, Overdue) so clients know where they stand.
- **D-04:** Public quotation pages include Accept/Reject buttons (PUB-05 pulled forward from v2). Accept and Reject are one-click actions that update the quotation status immediately. After clicking, an optional "Add a note" textarea is revealed — not required, but available.
- **D-05:** The rejection note (if provided) is stored as `rejection_reason` on the quotation record (field already exists in schema).

### Client Portal
- **D-06:** Client portal is a branded page at `/portal/[portalToken]` showing all invoices and quotations for that client in a clean document list — each row shows document number, status badge, date, and total. Each row links to the corresponding public document page.
- **D-07:** Portal access is via token URL only — no login, no email magic link. The user copies the portal URL from the client detail page and shares it via email/WhatsApp.
- **D-08:** The portal page shows the user's business branding: logo and business name in a header bar using the accent color. Consistent with the branded landing page pattern on public document pages.

### UAE Compliance & Bilingual Rendering
- **D-09:** Bilingual documents (language="bilingual") use a side-by-side column layout: English on the left, Arabic (RTL) on the right. Line items show both `description` and `arabicDescription`. The document stays LTR overall but Arabic content flows RTL within its column.
- **D-10:** TRN is displayed as a labeled field in the business info header section of the document: "TRN: 100XXXXXXXXX". Both the user's TRN and the client's TRN (if available) are shown.
- **D-11:** Arabic-only documents (language="ar") get a full RTL flip: dir="rtl" on the document container, text right-aligned, sections reordered. Numbers remain LTR (standard Arabic number rendering convention).

### Canonical URLs & Visual Quality
- **D-12:** Document routes switch from ID-based (`/app/invoices/[id]`) to slug-based (`/app/invoices/[slug]`) for private views. Public pages remain token-based. Old ID-based URLs redirect to the slug version.
- **D-13:** When a document slug changes (e.g., client name update), old slugs are stored as aliases and serve 301 permanent redirects to the current slug. Requires a slug alias tracking mechanism (table or history column).
- **D-14:** UX-03 visual quality pass covers all views — both public-facing surfaces (public document pages, client portal, InvoicePreview) and private views (list pages, detail pages, dashboard). Comprehensive polish, not just client-facing surfaces.

### Claude's Discretion
- Exact header bar layout and styling for the branded landing page (size, spacing, logo treatment)
- Empty state for client portal when no documents exist for that client
- Slug alias storage mechanism (separate table vs. JSONB history column)
- Specific visual improvements in the UX-03 pass — Claude identifies the highest-impact polish areas
- Mobile-specific adaptations for the public document page and client portal
- Font loading strategy for Arabic text in bilingual documents

### Folded Todos
- **PUB-05 (Accept/Reject quotations from public page):** Originally v2, folded into Phase 4 because the public quotation page is being built here and the accept/reject actions are a natural extension of the public experience.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Core Phase Definition
- `.planning/ROADMAP.md` — Phase 4 scope, goal, and success criteria
- `.planning/REQUIREMENTS.md` — `PUB-01..04`, `SET-03..04`, `UX-03`, `UX-04` (also `PUB-05` folded in)
- `.planning/PROJECT.md` — product thesis, stack constraints, quality bar

### Prior Phase Context
- `.planning/phases/01-foundation-onboarding/01-CONTEXT.md` — Phase 1 decisions (auth, onboarding, mobile shell, branding)
- `.planning/phases/02-clients-document-engine/02-CONTEXT.md` — Phase 2 decisions (share modal, status flow, detail page patterns, public page foundation)
- `.planning/phases/03-dashboard-cash-flow/03-CONTEXT.md` — Phase 3 decisions (payment/expense tracking, status computation, dashboard layout)

### Design Direction
- `/Users/koss/.gstack/projects/INV/koss-unknown-design-20260405-144707.md` — approved primary design doc for Invios

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `InvoicePreview` (`src/components/invoice/invoice-preview.tsx`): Already supports `mode="public"` and `mode="print"`. Receives `language`, `trn`, `currency`, `arabicDescription` on line items. Needs RTL/bilingual rendering logic added.
- Public pages (`src/app/invoices/public/[shareToken]/page.tsx`, `src/app/quotations/public/[shareToken]/page.tsx`): Bare wrappers around InvoicePreview. Need branded landing page chrome added around them.
- `getOwnerUserState()` (`src/lib/public-documents.ts`): Fetches branding + settings for document owner via admin Supabase client. Reusable for portal page.
- `getPublicInvoiceByToken()`, `getPublicQuotationByToken()` (`src/lib/billing-data.ts`): Token-based document lookup. Reusable for portal's document links.
- `createShareToken()` (`src/lib/billing-utils.ts`): Crypto-random token generator. Same pattern can generate portal tokens.
- `portalToken` field already exists on client records and is shown on the client detail page.
- `DocumentStatusBadge` (`src/components/documents/document-status-badge.tsx`): Status badge component. Reusable on public pages and portal.
- `slug` field already exists on both invoice and quotation DB records. `buildUniqueSlug()` utility exists in `src/lib/billing-utils.ts`.
- Client routing already uses slug-based pattern (`/app/clients/[slug]`).

### Established Patterns
- Server actions: `requireSession()` + Zod validation + `revalidatePath` + `redirect` after mutations
- Public pages use `getOwnerUserState()` via admin Supabase client for unauthenticated branding access
- `BrandingSettings` type includes `arabicBusinessName`, `arabicAddress`, `customFonts`
- `UserSettings.defaultLanguage` supports `"en" | "ar" | "bilingual"`
- `InvoicePreviewLineItem` includes `arabicDescription` field

### Integration Points
- Public pages: add branded header/footer chrome, Download PDF button, Accept/Reject for quotations
- New route: `/portal/[portalToken]` — public client portal page
- InvoicePreview: add RTL/bilingual rendering branches based on `language` prop
- Document routes: migrate from `/app/invoices/[id]` to `/app/invoices/[slug]` with ID redirect compatibility
- DB: may need slug_aliases table for 301 redirect tracking
- Quotation status: public accept/reject action (new server action without requireSession, using token-based auth instead)

</code_context>

<specifics>
## Specific Ideas

- The branded landing page should feel professional enough to send to a real client — not a raw file viewer. The header bar, download button, and document preview should form a cohesive, polished experience.
- "Powered by Invios" in the footer is a subtle organic growth mechanism — small text, not a banner. Should feel like a professional tool credit, not an ad.
- The accept/reject flow on public quotation pages should feel low-friction for the client. One-click action with optional (not required) note. The note textarea slides in after the click — it's not pre-shown.
- The side-by-side bilingual layout is the standard UAE tax invoice pattern. English left, Arabic right. The document width may need to be wider to accommodate both columns.
- The full visual polish pass (UX-03) should make every view feel premium. This is the phase where the product crosses from "functional" to "trustworthy."

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope. PUB-05 was folded into this phase from v2 scope.

</deferred>

---

*Phase: 04-public-trust-surfaces*
*Context gathered: 2026-04-08*
