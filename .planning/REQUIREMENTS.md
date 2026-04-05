# REQUIREMENTS

## v1 Requirements

### Authentication

- [ ] **AUTH-01**: User can create an account with email and password.
- [ ] **AUTH-02**: User can sign in and remain authenticated across sessions.
- [ ] **AUTH-03**: User can sign out from the authenticated app.
- [ ] **AUTH-04**: Unauthenticated users cannot access private operator routes.

### Onboarding & Business Setup

- [ ] **ONB-01**: First-time user is redirected into onboarding after first sign-in until setup is complete.
- [ ] **ONB-02**: User can enter business name, contact details, address, and default invoice settings.
- [ ] **ONB-03**: User can upload logo and signature assets for document branding.
- [ ] **ONB-04**: User can choose primary branding color and see a live branded invoice preview during onboarding.
- [ ] **ONB-05**: User can set default currency, tax, notes, and terms preferences.

### Dashboard

- [ ] **DASH-01**: User can view total billed, total collected, outstanding amount, and collection rate on the dashboard.
- [ ] **DASH-02**: User can view recent invoices, recent quotations, and overdue items on the dashboard.
- [ ] **DASH-03**: User can access quick actions for new invoice, new quotation, new client, and branding from the dashboard.
- [ ] **DASH-04**: New users with no data see useful empty states and a setup checklist.

### Clients

- [ ] **CLNT-01**: User can create, edit, and archive a client record.
- [ ] **CLNT-02**: User can store client name, company, email, phone, address, tax info, and status.
- [ ] **CLNT-03**: User can view all quotations and invoices associated with a client on the client detail page.
- [ ] **CLNT-04**: User can generate new quotations and invoices directly from a client detail page.

### Quotations

- [ ] **QUOT-01**: User can create, edit, save, and delete quotation drafts.
- [ ] **QUOT-02**: User can add structured line items with description, quantity, unit price, and total to a quotation.
- [ ] **QUOT-03**: User can set issue date, expiry date, discount, tax, notes, terms, and language on a quotation.
- [ ] **QUOT-04**: User can preview quotation output live while editing.
- [ ] **QUOT-05**: User can mark a quotation as sent, accepted, rejected, or expired.
- [ ] **QUOT-06**: User can share a public quotation link by secure token.
- [ ] **QUOT-07**: User can export a quotation to PDF.

### Invoices

- [ ] **INV-01**: User can create, edit, save, and delete invoice drafts.
- [ ] **INV-02**: User can add structured line items with description, quantity, unit price, and total to an invoice.
- [ ] **INV-03**: User can set invoice type, issue date, due date, discount, tax, notes, terms, and language on an invoice.
- [ ] **INV-04**: User can preview invoice output live while editing.
- [ ] **INV-05**: User can mark an invoice as sent.
- [ ] **INV-06**: User can share a public invoice link by secure token.
- [ ] **INV-07**: User can export an invoice to PDF.
- [ ] **INV-08**: User can convert an accepted quotation into an invoice.

### Payments & Expenses

- [ ] **OPS-01**: User can record one or more payment entries against an invoice.
- [ ] **OPS-02**: User can record one or more expense entries against an invoice.
- [ ] **OPS-03**: Invoice collected amount and outstanding amount are computed from invoice total and payment records.
- [ ] **OPS-04**: Invoice payment status updates automatically to `partial_paid`, `paid`, or `overdue` based on financial state and due date.
- [ ] **OPS-05**: User can view profit amount and margin per invoice based on invoice total and direct expenses.

### Public Experiences

- [ ] **PUB-01**: Client can open a public invoice page without authentication using a secure token.
- [ ] **PUB-02**: Client can open a public quotation page without authentication using a secure token.
- [ ] **PUB-03**: Public document pages display branding, line items, totals, status, and download action clearly.
- [ ] **PUB-04**: User can create a client portal link that shows all invoices and quotations for that client.

### Versioning, Recurring, Reminders

- [ ] **AUTO-01**: System creates invoice version snapshots on save.
- [ ] **AUTO-02**: User can view invoice version history and restore a prior version safely.
- [ ] **AUTO-03**: User can configure an invoice as recurring with weekly, monthly, or quarterly frequency.
- [ ] **AUTO-04**: User can configure reminder timing rules for invoices.
- [ ] **AUTO-05**: Reminder sends are logged so duplicate reminders can be prevented.

### Settings, Localization, Compliance

- [ ] **SET-01**: User can manage business profile, branding, bank details, and footer details in settings.
- [ ] **SET-02**: User can configure invoice prefix, quotation prefix, default terms, default notes, and tax settings in settings.
- [ ] **SET-03**: User can issue UAE-friendly tax invoices with AED currency and TRN support.
- [ ] **SET-04**: User can render documents with English/Arabic bilingual support and RTL-safe layout behavior.

### UX & Reliability

- [ ] **UX-01**: Core app screens remain usable on small mobile widths.
- [ ] **UX-02**: Product exposes clear loading, empty, success, validation, and error states throughout core flows.
- [ ] **UX-03**: Public and private document views maintain a premium, trustworthy visual quality rather than generic admin styling.
- [ ] **UX-04**: Canonical slug-based URLs are supported for clients and documents, with alias support for redirects when slugs change.

## v2 Requirements

- [ ] **AUTH-05**: User can sign in with OAuth providers.
- [ ] **PUB-05**: Client can explicitly accept or reject quotations from the public quotation page.
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
| AUTH-01 | TBD |
| AUTH-02 | TBD |
| AUTH-03 | TBD |
| AUTH-04 | TBD |
| ONB-01 | TBD |
| ONB-02 | TBD |
| ONB-03 | TBD |
| ONB-04 | TBD |
| ONB-05 | TBD |
| DASH-01 | TBD |
| DASH-02 | TBD |
| DASH-03 | TBD |
| DASH-04 | TBD |
| CLNT-01 | TBD |
| CLNT-02 | TBD |
| CLNT-03 | TBD |
| CLNT-04 | TBD |
| QUOT-01 | TBD |
| QUOT-02 | TBD |
| QUOT-03 | TBD |
| QUOT-04 | TBD |
| QUOT-05 | TBD |
| QUOT-06 | TBD |
| QUOT-07 | TBD |
| INV-01 | TBD |
| INV-02 | TBD |
| INV-03 | TBD |
| INV-04 | TBD |
| INV-05 | TBD |
| INV-06 | TBD |
| INV-07 | TBD |
| INV-08 | TBD |
| OPS-01 | TBD |
| OPS-02 | TBD |
| OPS-03 | TBD |
| OPS-04 | TBD |
| OPS-05 | TBD |
| PUB-01 | TBD |
| PUB-02 | TBD |
| PUB-03 | TBD |
| PUB-04 | TBD |
| AUTO-01 | TBD |
| AUTO-02 | TBD |
| AUTO-03 | TBD |
| AUTO-04 | TBD |
| AUTO-05 | TBD |
| SET-01 | TBD |
| SET-02 | TBD |
| SET-03 | TBD |
| SET-04 | TBD |
| UX-01 | TBD |
| UX-02 | TBD |
| UX-03 | TBD |
| UX-04 | TBD |
