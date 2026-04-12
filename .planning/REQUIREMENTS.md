# REQUIREMENTS

## v1 Requirements

### Authentication

- [x] **AUTH-01**: User can create an account with email and password.
- [x] **AUTH-02**: User can sign in and remain authenticated across sessions.
- [x] **AUTH-03**: User can sign out from the authenticated app.
- [x] **AUTH-04**: Unauthenticated users cannot access private operator routes.

### Onboarding & Business Setup

- [x] **ONB-01**: First-time user is redirected into onboarding after first sign-in until setup is complete.
- [x] **ONB-02**: User can enter business name, contact details, address, and default invoice settings.
- [x] **ONB-03**: User can upload logo and signature assets for document branding.
- [x] **ONB-04**: User can choose primary branding color and see a live branded invoice preview during onboarding.
- [x] **ONB-05**: User can set default currency, tax, notes, and terms preferences.

### Dashboard

- [x] **DASH-01**: User can view total billed, total collected, outstanding amount, and collection rate on the dashboard.
- [x] **DASH-02**: User can view recent invoices, recent quotations, and overdue items on the dashboard.
- [x] **DASH-03**: User can access quick actions for new invoice, new quotation, new client, and branding from the dashboard.
- [x] **DASH-04**: New users with no data see useful empty states and a setup checklist.

### Clients

- [x] **CLNT-01**: User can create, edit, and archive a client record.
- [x] **CLNT-02**: User can store client name, company, email, phone, address, tax info, and status.
- [x] **CLNT-03**: User can view all quotations and invoices associated with a client on the client detail page.
- [x] **CLNT-04**: User can generate new quotations and invoices directly from a client detail page.

### Quotations

- [x] **QUOT-01**: User can create, edit, save, and delete quotation drafts.
- [x] **QUOT-02**: User can add structured line items with description, quantity, unit price, and total to a quotation.
- [x] **QUOT-03**: User can set issue date, expiry date, discount, tax, notes, terms, and language on a quotation.
- [x] **QUOT-04**: User can preview quotation output live while editing.
- [ ] **QUOT-05**: User can mark a quotation as sent, accepted, rejected, or expired.
- [ ] **QUOT-06**: User can share a public quotation link by secure token.
- [x] **QUOT-07**: User can export a quotation to PDF.

### Invoices

- [x] **INV-01**: User can create, edit, save, and delete invoice drafts.
- [x] **INV-02**: User can add structured line items with description, quantity, unit price, and total to an invoice.
- [x] **INV-03**: User can set invoice type, issue date, due date, discount, tax, notes, terms, and language on an invoice.
- [x] **INV-04**: User can preview invoice output live while editing.
- [x] **INV-05**: User can mark an invoice as sent.
- [ ] **INV-06**: User can share a public invoice link by secure token.
- [ ] **INV-07**: User can export an invoice to PDF.
- [x] **INV-08**: User can convert an accepted quotation into an invoice.

### Payments & Expenses

- [x] **OPS-01**: User can record one or more payment entries against an invoice.
- [x] **OPS-02**: User can record one or more expense entries against an invoice.
- [x] **OPS-03**: Invoice collected amount and outstanding amount are computed from invoice total and payment records.
- [x] **OPS-04**: Invoice payment status updates automatically to `partial_paid`, `paid`, or `overdue` based on financial state and due date.
- [x] **OPS-05**: User can view profit amount and margin per invoice based on invoice total and direct expenses.

### Public Experiences

- [x] **PUB-01**: Client can open a public invoice page without authentication using a secure token.
- [x] **PUB-02**: Client can open a public quotation page without authentication using a secure token.
- [x] **PUB-03**: Public document pages display branding, line items, totals, status, and download action clearly.
- [x] **PUB-04**: User can create a client portal link that shows all invoices and quotations for that client.

### Versioning, Recurring, Reminders

- [x] **AUTO-01**: System creates invoice version snapshots on save.
- [x] **AUTO-02**: User can view invoice version history and restore a prior version safely.
- [x] **AUTO-03**: User can configure an invoice as recurring with weekly, monthly, or quarterly frequency.
- [x] **AUTO-04**: User can configure reminder timing rules for invoices.
- [x] **AUTO-05**: Reminder sends are logged so duplicate reminders can be prevented.

### Settings, Localization, Compliance

- [x] **SET-01**: User can manage business profile, branding, bank details, and footer details in settings.
- [x] **SET-02**: User can configure invoice prefix, quotation prefix, default terms, default notes, and tax settings in settings.
- [x] **SET-03**: User can issue UAE-friendly tax invoices with AED currency and TRN support.
- [x] **SET-04**: User can render documents with English/Arabic bilingual support and RTL-safe layout behavior.

### UX & Reliability

- [x] **UX-01**: Core app screens remain usable on small mobile widths.
- [x] **UX-02**: Product exposes clear loading, empty, success, validation, and error states throughout core flows.
- [ ] **UX-03**: Public and private document views maintain a premium, trustworthy visual quality rather than generic admin styling.
- [x] **UX-04**: Canonical slug-based URLs are supported for clients and documents, with alias support for redirects when slugs change.

## v2 Requirements

- [ ] **AUTH-05**: User can sign in with OAuth providers.
- [x] **PUB-05**: Client can explicitly accept or reject quotations from the public quotation page.
- [ ] **AUTO-06**: Recurring invoices can auto-send on schedule without manual review.
- [ ] **OPS-06**: User can collect invoice payment online via integrated payment links.
- [ ] **CLNT-05**: User can import clients from CSV or external sources.
- [ ] **DASH-05**: User can view richer analytics across time windows, client cohorts, and profitability trends.

## Out of Scope

- Full accounting, ledger, bookkeeping, and tax filing workflows
- Team roles, permissions matrix, and enterprise collaboration features
- Offline-first product behavior
- Marketplace ecosystem and third-party app platform

## Traceability

| Requirement ID | Planned Phase |
|----------------|---------------|
| AUTH-01 | Phase 1 |
| AUTH-02 | Phase 1 |
| AUTH-03 | Phase 1 |
| AUTH-04 | Phase 1 |
| ONB-01 | Phase 1 |
| ONB-02 | Phase 1 |
| ONB-03 | Phase 1 |
| ONB-04 | Phase 1 |
| ONB-05 | Phase 1 |
| DASH-01 | Phase 3 |
| DASH-02 | Phase 3 |
| DASH-03 | Phase 3 |
| DASH-04 | Phase 3 |
| CLNT-01 | Phase 2 |
| CLNT-02 | Phase 2 |
| CLNT-03 | Phase 2 |
| CLNT-04 | Phase 2 |
| QUOT-01 | Phase 2 |
| QUOT-02 | Phase 2 |
| QUOT-03 | Phase 2 |
| QUOT-04 | Phase 2 |
| QUOT-05 | Phase 2 |
| QUOT-06 | Phase 2 |
| QUOT-07 | Phase 2 |
| INV-01 | Phase 2 |
| INV-02 | Phase 2 |
| INV-03 | Phase 2 |
| INV-04 | Phase 2 |
| INV-05 | Phase 2 |
| INV-06 | Phase 2 |
| INV-07 | Phase 2 |
| INV-08 | Phase 2 |
| OPS-01 | Phase 3 |
| OPS-02 | Phase 3 |
| OPS-03 | Phase 3 |
| OPS-04 | Phase 3 |
| OPS-05 | Phase 3 |
| PUB-01 | Phase 4 |
| PUB-02 | Phase 4 |
| PUB-03 | Phase 4 |
| PUB-04 | Phase 4 |
| AUTO-01 | Phase 5 |
| AUTO-02 | Phase 5 |
| AUTO-03 | Phase 5 |
| AUTO-04 | Phase 5 |
| AUTO-05 | Phase 5 |
| SET-01 | Phase 1 |
| SET-02 | Phase 1 |
| SET-03 | Phase 4 |
| SET-04 | Phase 4 |
| UX-01 | Phase 1 |
| UX-02 | Phase 3 |
| UX-03 | Phase 4 |
| UX-04 | Phase 4 |
