# Phase 4: Public Trust Surfaces - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-08
**Phase:** 04-public-trust-surfaces
**Areas discussed:** Public document pages, Client portal, UAE compliance & bilingual, Canonical URLs & visual quality

---

## Public Document Pages

### Q1: How should the public document page feel?

| Option | Description | Selected |
|--------|-------------|----------|
| Branded landing page | Lightweight branded page with logo/name header, centered document, sticky Download PDF, subtle footer | :white_check_mark: |
| Clean document viewer | Minimal chrome — just document on clean background with floating download button | |
| Full portal experience | Header + document + sidebar with status, payment info, related documents | |

**User's choice:** Branded landing page
**Notes:** Professional feel without over-engineering. Header, document, download, footer.

### Q2: What actions on the public page?

| Option | Description | Selected |
|--------|-------------|----------|
| Download PDF | Direct PDF download via existing Playwright route | :white_check_mark: |
| Print | Browser print action (page supports ?print=1) | |
| Accept/Reject (quotations) | Let clients accept or reject quotations from public page (PUB-05, originally v2) | :white_check_mark: |

**User's choice:** Download PDF + Accept/Reject (multi-select)
**Notes:** User pulled PUB-05 into Phase 4 scope. Print not selected.

### Q3: Accept/Reject flow for quotations

| Option | Description | Selected |
|--------|-------------|----------|
| One-click with optional note | Buttons update status immediately, optional textarea revealed after click | :white_check_mark: |
| Confirm with required reason on reject | Accept is one-click, reject requires brief reason | |
| Simple one-click, no notes | Just buttons, instant update, no messaging | |

**User's choice:** One-click with optional note
**Notes:** Low friction for the client. Note is optional, not pre-shown.

### Q4: Show payment status on public invoice pages?

| Option | Description | Selected |
|--------|-------------|----------|
| Show status badge | Visible badge (Draft, Sent, Partial Paid, Paid, Overdue) | :white_check_mark: |
| Hide status | No status info on public page | |
| Show status + payment summary | Badge plus total/paid/remaining breakdown | |

**User's choice:** Show status badge
**Notes:** Builds trust. Clients know where they stand.

### Q5: Branding on the public page header

| Option | Description | Selected |
|--------|-------------|----------|
| Fully white-labeled | Header shows only business logo/name, no Invios branding anywhere | |
| Subtle "Powered by Invios" footer | White-labeled header, tiny footer credit | :white_check_mark: |
| You decide | Claude picks | |

**User's choice:** Subtle "Powered by Invios" footer
**Notes:** Organic growth mechanism. Professional credit, not an ad.

---

## Client Portal

### Q1: What should the client portal show?

| Option | Description | Selected |
|--------|-------------|----------|
| Document list only | Branded page with all invoices + quotations in a clean list | :white_check_mark: |
| Document list + financial summary | Same list plus total billed/paid/outstanding header | |
| Mini workspace | List + summary + status filtering | |

**User's choice:** Document list only
**Notes:** Simple and immediately useful. No financial summary.

### Q2: How should the portal be accessed?

| Option | Description | Selected |
|--------|-------------|----------|
| Token URL — /portal/[portalToken] | Direct token-based URL, no login required | :white_check_mark: |
| Token URL + email magic link | Token URL plus email invitation with branded link | |

**User's choice:** Token URL only
**Notes:** Same pattern as public document links. User shares via email/WhatsApp.

### Q3: Portal branding

| Option | Description | Selected |
|--------|-------------|----------|
| Yes, fully branded | Logo + business name in header with accent color | :white_check_mark: |
| Minimal — name only | Just business name, no logo/color | |
| You decide | Claude picks | |

**User's choice:** Fully branded
**Notes:** Consistent with public document page branding. Reinforces professional feel.

---

## UAE Compliance & Bilingual

### Q1: Bilingual document layout

| Option | Description | Selected |
|--------|-------------|----------|
| Side-by-side columns | English left, Arabic RTL right. Standard UAE tax invoice pattern. | :white_check_mark: |
| Stacked — English above Arabic | Each section shows English first, Arabic below | |
| Arabic primary with English footnotes | RTL-first layout, English as secondary text | |

**User's choice:** Side-by-side columns
**Notes:** Standard UAE practice. Document stays LTR overall, Arabic flows RTL within its column.

### Q2: TRN display format

| Option | Description | Selected |
|--------|-------------|----------|
| Labeled field in header | "TRN: 100XXXXXXXXX" in business info section | :white_check_mark: |
| Tax footer section | Dedicated tax compliance footer | |
| Both header + footer | TRN in header, detailed tax section in footer | |

**User's choice:** Labeled field in header
**Notes:** Standard UAE practice. Show both user TRN and client TRN if available.

### Q3: RTL layout for Arabic-only documents

| Option | Description | Selected |
|--------|-------------|----------|
| Full RTL flip | dir="rtl" on container, text right-aligned, sections mirrored, numbers stay LTR | :white_check_mark: |
| Partial RTL — text only | Keep layout LTR, only text direction RTL for Arabic blocks | |
| You decide | Claude picks based on InvoicePreview structure | |

**User's choice:** Full RTL flip
**Notes:** Authentic Arabic reading experience. Numbers stay LTR per convention.

---

## Canonical URLs & Visual Quality

### Q1: Document route strategy

| Option | Description | Selected |
|--------|-------------|----------|
| Slug-based for private views | Change /app/invoices/[id] to /app/invoices/[slug]. Old IDs redirect. | :white_check_mark: |
| Keep ID-based, add slug aliases | Keep current routes, add /by-slug/[slug] alias | |
| You decide | Claude picks minimal risk approach | |

**User's choice:** Slug-based for private views
**Notes:** Cleaner URLs, consistent with client routing pattern.

### Q2: Visual quality scope

| Option | Description | Selected |
|--------|-------------|----------|
| Polish public pages + document preview | Focus on client-facing surfaces only | |
| Full visual pass across all views | Polish both public and private views | :white_check_mark: |
| Document preview only | Focus only on InvoicePreview templates | |

**User's choice:** Full visual pass across all views
**Notes:** Comprehensive quality upgrade. Cross from "functional" to "trustworthy."

### Q3: Slug alias redirect handling

| Option | Description | Selected |
|--------|-------------|----------|
| 301 redirect from old slug | Store previous slugs as aliases, permanent redirect | :white_check_mark: |
| 404 old slugs | Only current slug works, old URLs break | |
| You decide | Claude picks | |

**User's choice:** 301 redirect from old slug
**Notes:** Standard SEO-friendly approach. Shared links keep working.

---

## Claude's Discretion

- Exact header bar layout and styling for branded landing page
- Empty state for client portal
- Slug alias storage mechanism
- Specific visual improvements in UX-03 pass
- Mobile adaptations for public pages and portal
- Font loading strategy for Arabic text

## Deferred Ideas

None — discussion stayed within phase scope. PUB-05 was folded into Phase 4 from v2 requirements.
