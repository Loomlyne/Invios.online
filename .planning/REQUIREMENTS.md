# REQUIREMENTS

## v1.1 Requirements (shipped)

### Clients

- [x] **CLNT-05**: User can upload a CSV file, map columns to client fields, preview validated rows, and import clients in batch with duplicate detection and import summary.

### Dashboard & Analytics

- [x] **DASH-05**: User can view a 12-month revenue trend chart (billed vs collected per month).
- [x] **DASH-06**: User can view receivables aging buckets (0–30, 31–60, 61–90, 90+ days).
- [x] **DASH-07**: User can see month-over-month change indicators on dashboard metrics.

---

## v1.2 Requirements — Settings UX Redesign

### Layout & Navigation

- [x] **NAV-01**: Vertical sidebar with labeled section links and icons
- [x] **NAV-02**: Active section highlighted with visual focus indicator
- [x] **NAV-03**: URL-synced section routing (browser back/forward works)
- [x] **NAV-04**: Mobile section picker via dropdown/sheet
- [x] **NAV-05**: Keyboard navigation on sidebar items

### Profile (Phase 10)

- [ ] **PROF-01**: Edit full name in Profile section
- [ ] **PROF-02**: Email displayed read-only
- [ ] **PROF-03**: Upload profile avatar with click-to-upload
- [ ] **PROF-04**: Initials fallback when no avatar
- [ ] **PROF-05**: Set default hourly rate for time tracking
- [ ] **PROF-06**: Change password with current/new/confirm fields
- [ ] **PROF-07**: Delete account via danger zone with typed confirmation
- [ ] **A11Y-04**: Destructive actions use confirmation dialogs with clear warnings

### Branding (Phase 9)

- [ ] **BRAND-01**: Upload/change business logo in Branding tab
- [ ] **BRAND-02**: Upload header cover image for invoices
- [ ] **BRAND-03**: Select invoice layout template from visual previews
- [ ] **BRAND-04**: Customize invoice font and background colors
- [ ] **BRAND-05**: Select page background (color, image, or video) for editor
- [ ] **BRAND-06**: `/app/branding` redirects to settings Branding section

### Business Info (Phase 9)

- [ ] **BIZ-01**: Edit business name, email, phone, website, address
- [ ] **BIZ-02**: Enter Tax ID / VAT number
- [ ] **BIZ-03**: Toggle payment details visibility on invoices
- [ ] **BIZ-04**: Select default payment method
- [ ] **BIZ-05**: Enter bank name, account name, account number/IBAN, routing/SWIFT

### General (Phase 11)

- [ ] **GEN-01**: Default invoice language (EN, AR, Bilingual)
- [ ] **GEN-02**: Default currency with flag indicator
- [ ] **GEN-03**: Default tax rate percentage
- [ ] **GEN-04**: Toggle include-date-in-number for document numbering
- [ ] **GEN-05**: Prefix and next number per doc type (invoice, quote, receipt)
- [ ] **GEN-06**: Default payment terms and quote valid-until days
- [ ] **GEN-07**: Date format presets
- [ ] **GEN-08**: Default invoice notes
- [ ] **GEN-09**: Auto-generate receipt when invoice marked paid
- [ ] **GEN-10**: Toggle revoke public link on payment

### Emails (Phase 11)

- [ ] **EMAIL-01**: Toggle acceptance notification when client accepts quote
- [ ] **EMAIL-02**: Toggle payment received thank-you email
- [ ] **EMAIL-04**: Toggle project activity notifications
- [ ] **EMAIL-05**: Toggle chat message from customer notifications
- [ ] **EMAIL-06**: Toggle chat message to customer notifications
- [ ] **EMAIL-07**: Toggle auto payment reminder emails

### Integrations & Billing stubs (Phase 12)

- [ ] **INT-01**: Integrations section with structured placeholder (upgraded in Phase 19)
- [ ] **BILL-01**: Billing section display-only — plan info without Stripe (no payment collection)

### Accessibility (Phase 8 — complete)

- [x] **A11Y-01**: Form fields have labels and ARIA attributes
- [x] **A11Y-02**: Save feedback uses aria-live regions
- [x] **A11Y-03**: Per-section independent save buttons

---

## v2.0 Requirements — Operator Power

### Client Portal v2 (Phase 13)

- [ ] **PORT-01**: Operator has a public `operatorSlug` derived from business name (unique, editable)
- [ ] **PORT-02**: Each client has a `portalSlug` derived from client name (unique per operator)
- [ ] **PORT-03**: Client portal accessible at `/portal/[operatorSlug]/[portalSlug]` showing all quotations and invoices
- [ ] **PORT-04**: Portal shows document status, totals, overdue indicators, and branded owner logo/colors
- [ ] **PORT-05**: Operator can copy/share named portal link from client detail page
- [ ] **PORT-06**: Legacy `portal_token` URLs redirect to named slug URL when slug exists

### Client Intelligence (Phase 14)

- [ ] **CRM-01**: Client detail shows lifetime value (total collected from client)
- [ ] **CRM-02**: Client detail shows average days-to-pay and payment reliability score
- [ ] **CRM-03**: Client detail shows health indicator (healthy / at-risk / overdue-heavy)
- [ ] **CRM-04**: Client detail shows suggested actions (e.g. send reminder, follow up on quote)
- [ ] **CRM-05**: Intelligence metrics exclude draft documents and handle partial payments correctly

### Time Tracking (Phase 15)

- [ ] **TIME-01**: User can log time entries with description, date, duration, and optional client
- [ ] **TIME-02**: User can mark entries billable/non-billable
- [ ] **TIME-03**: User can view and filter time entries by client and date range
- [ ] **TIME-04**: User can convert selected billable entries to invoice line items using profile hourly rate
- [ ] **TIME-05**: Converted entries are locked (cannot double-bill to another invoice)

### Automation Rules (Phase 16)

- [ ] **AUTO-06**: Recurring invoices can auto-send on schedule when operator enables per schedule
- [ ] **AUTO-07**: User can create automation rules with trigger + one or more actions
- [ ] **AUTO-08**: Supported triggers include: quotation accepted, invoice overdue, days-before-due
- [ ] **AUTO-09**: Supported actions include: create invoice from quote, send reminder email, mark sent
- [ ] **AUTO-10**: Automation run log shows last execution per rule with success/failure
- [ ] **EMAIL-07**: (activated) Auto payment reminder emails respect user toggle and dedup rules

### Cash Flow Forecast (Phase 17)

- [ ] **FCST-01**: Dashboard shows 30/60/90-day projected cash position chart
- [ ] **FCST-02**: Forecast uses recurring schedules, aging buckets, and historical collection rate
- [ ] **FCST-03**: Forecast shows assumption labels (expected / conservative ranges)
- [ ] **FCST-04**: Empty state when insufficient data for projection
- [ ] **DASH-08**: User can filter analytics by custom date range (feeds forecast inputs)

### Proposals & Approval (Phase 18)

- [ ] **PROP-01**: User can mark a quotation as a formal proposal with approval tracking
- [ ] **PROP-02**: Client can accept or reject proposal from public page with confirmation step
- [ ] **PROP-03**: System records acceptance metadata (timestamp, name, email, IP)
- [ ] **PROP-04**: Operator receives notification when proposal is accepted/rejected
- [ ] **PROP-05**: Accepted proposal can trigger automation rule (create invoice) when AUTO-07 enabled

### Integrations Hub (Phase 19)

- [ ] **INT-03**: User can register outbound webhook URLs for document events
- [ ] **INT-04**: Webhook payloads are signed with HMAC secret
- [ ] **INT-05**: User can export clients/invoices to CSV from integrations panel
- [ ] **INT-06**: User can view integration connection status and last webhook delivery
- [ ] **INT-07**: Calendar export placeholder (ICS feed for due dates) — optional stub with clear label

### AI Co-pilot (Phase 20)

- [ ] **AI-01**: User can paste client brief/email and generate structured quote or invoice draft
- [ ] **AI-02**: AI draft opens in editor for review before save (never auto-send)
- [ ] **AI-03**: User can run invoice/quote review for TRN, math, and profitability flags
- [ ] **AI-04**: System suggests reminder timing copy based on client payment reliability
- [ ] **AI-05**: User can enable/disable AI features in settings (opt-in toggle)

---

## Deferred / Future (not v2.0)

- [ ] **AUTH-05**: OAuth sign-in (Google, GitHub) — future milestone
- [ ] **CLNT-06**: Import from HoneyBook/FreshBooks formats — future
- [ ] **BILL-02**: Subscription plan management with usage — when monetization ships

## Explicitly Out of Scope (user constraint)

- **OPS-06**: Online payment collection via integrated payment links — **no Stripe account**
- **INT-02**: Stripe payment link integration — blocked by OPS-06
- **EMAIL-03**: Stripe payment notification toggle — stub/hidden until payments exist

## Out of Scope (product)

- Full accounting suite, payroll, tax filing
- Team collaboration, multi-user workspaces
- Marketplace, deep CRM pipelines
- Offline-first behavior
- Legal-grade e-sign (DocuSign parity)

---

## Traceability

| Requirement ID | Phase | Milestone | Status |
|----------------|-------|-----------|--------|
| CLNT-05 | 6 | v1.1 | Complete |
| DASH-05 | 7 | v1.1 | Complete |
| DASH-06 | 7 | v1.1 | Complete |
| DASH-07 | 7 | v1.1 | Complete |
| NAV-01–05, A11Y-01–03 | 8 | v1.2 | Complete |
| BRAND-01–06, BIZ-01–05 | 9 | v1.2 | Pending |
| PROF-01–07, A11Y-04 | 10 | v1.2 | Pending |
| GEN-01–10, EMAIL-01–02,04–07 | 11 | v1.2 | Pending |
| INT-01, BILL-01 | 12 | v1.2 | Pending |
| PORT-01–06 | 13 | v2.0 | Pending |
| CRM-01–05 | 14 | v2.0 | Pending |
| TIME-01–05 | 15 | v2.0 | Pending |
| AUTO-06–10, EMAIL-07 | 16 | v2.0 | Pending |
| FCST-01–04, DASH-08 | 17 | v2.0 | Pending |
| PROP-01–05 | 18 | v2.0 | Pending |
| INT-03–07 | 19 | v2.0 | Pending |
| AI-01–05 | 20 | v2.0 | Pending |
| OPS-06, INT-02, EMAIL-03 | — | — | Out of scope |
| AUTH-05 | — | future | Deferred |
