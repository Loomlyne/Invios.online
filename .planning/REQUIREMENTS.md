# REQUIREMENTS

## v1.1 Requirements (carry-forward)

### Clients

- [x] **CLNT-05**: User can upload a CSV file, map columns to client fields (name, company, email, phone, address, trn), preview validated rows with per-row error display, and import clients in batch — with duplicate detection by email and an import summary showing inserted, skipped, and errored rows.

### Dashboard & Analytics (deferred to future milestone)

- [ ] **DASH-05**: User can view a 12-month revenue trend chart showing total billed vs total collected per month.
- [ ] **DASH-06**: User can view a receivables aging breakdown showing outstanding invoice amounts bucketed by how overdue they are (0-30, 31-60, 61-90, and 90+ days).
- [ ] **DASH-07**: User can see period-over-period (month-over-month) change indicators on key dashboard metrics (billed, collected, outstanding).

## v1.2 Requirements — Settings UX Redesign

### Layout & Navigation

- [x] **NAV-01**: User can navigate settings via a vertical sidebar with labeled section links and icons
- [x] **NAV-02**: User can see the active section highlighted in the sidebar with visual focus indicator
- [x] **NAV-03**: User can switch sections via URL-synced routing (browser back/forward works correctly)
- [x] **NAV-04**: User can switch sections on mobile via a dropdown/sheet section picker
- [x] **NAV-05**: User can navigate sidebar items with keyboard arrow keys and focus ring indicators

### Profile

- [ ] **PROF-01**: User can view and edit their full name in the Profile section
- [ ] **PROF-02**: User can see their email address displayed (read-only) in the Profile section
- [ ] **PROF-03**: User can upload a profile avatar image with click-to-upload interaction
- [ ] **PROF-04**: User sees initials-based fallback when no avatar is uploaded
- [ ] **PROF-05**: User can set a default hourly rate for time tracking cost calculations
- [ ] **PROF-06**: User can change their account password with current/new/confirm fields
- [ ] **PROF-07**: User can delete their account via a danger zone with typed confirmation

### Branding

- [ ] **BRAND-01**: User can upload and change their business logo within the settings Branding tab
- [ ] **BRAND-02**: User can upload a header cover image for invoices
- [ ] **BRAND-03**: User can select an invoice layout template from visual previews
- [ ] **BRAND-04**: User can customize invoice font color and background color
- [ ] **BRAND-05**: User can select a page background (color, image, or video) for the editor
- [ ] **BRAND-06**: Old /app/branding route redirects to the new settings Branding section

### Business Info

- [ ] **BIZ-01**: User can edit business name, email, phone, website, and address
- [ ] **BIZ-02**: User can enter a Tax ID / VAT number
- [ ] **BIZ-03**: User can toggle whether payment details appear on invoices
- [ ] **BIZ-04**: User can select a default payment method (Bank Transfer, etc.)
- [ ] **BIZ-05**: User can enter bank name, account name, account number/IBAN, and routing/SWIFT code

### General

- [ ] **GEN-01**: User can set default invoice language (English, Arabic, Bilingual)
- [ ] **GEN-02**: User can set default currency (with flag indicator)
- [ ] **GEN-03**: User can set default tax rate percentage
- [ ] **GEN-04**: User can toggle include-date-in-number for document numbering
- [ ] **GEN-05**: User can configure prefix and next number for invoices, quotes, and receipts independently
- [ ] **GEN-06**: User can set default payment terms (days) and quote valid-until (days)
- [ ] **GEN-07**: User can select a date format from presets
- [ ] **GEN-08**: User can write default invoice notes
- [ ] **GEN-09**: User can toggle auto-generate receipt when invoice is marked paid
- [ ] **GEN-10**: User can toggle revoke public link on payment

### Emails

- [ ] **EMAIL-01**: User can toggle acceptance notification (when client accepts proposal/quote)
- [ ] **EMAIL-02**: User can toggle payment received thank-you email
- [ ] **EMAIL-03**: User can toggle Stripe payment notification
- [ ] **EMAIL-04**: User can toggle project activity notifications (notes, files, tasks)
- [ ] **EMAIL-05**: User can toggle chat message from customer email notifications
- [ ] **EMAIL-06**: User can toggle chat message to customer email notifications
- [ ] **EMAIL-07**: User can toggle auto payment reminder emails

### Integrations

- [ ] **INT-01**: User can view an Integrations section with a coming-soon placeholder

### Billing

- [ ] **BILL-01**: User can view a Billing section with a coming-soon placeholder

### Accessibility & Polish

- [x] **A11Y-01**: All form fields have associated labels and appropriate ARIA attributes
- [x] **A11Y-02**: Save feedback uses aria-live regions for screen reader announcements
- [x] **A11Y-03**: Each section has its own independent save button (no global save)
- [ ] **A11Y-04**: Destructive actions (password change, account deletion) use confirmation dialogs with clear warnings

## Future Requirements

- [ ] **AUTH-05**: User can sign in with OAuth providers (Google, GitHub). — deferred past v1.1
- [ ] **AUTO-06**: Recurring invoices can auto-send on schedule without manual review. — deferred past v1.1
- [ ] **OPS-06**: User can collect invoice payment online via integrated payment links. — deferred past v1.1
- [ ] **CLNT-06**: User can import clients from external sources (HoneyBook, FreshBooks CSV formats). — future
- [ ] **DASH-08**: User can view analytics across client cohorts and custom date ranges. — future
- [ ] **INT-02**: Stripe payment link integration. — when OPS-06 ships
- [ ] **INT-03**: OAuth provider connections. — when AUTH-05 ships
- [ ] **BILL-02**: Subscription plan management with usage display. — when monetization ships

## Out of Scope

- Full accounting suite, bookkeeping, payroll, tax filing — billing operator console only
- Team collaboration, permissions matrix, multi-user workspaces
- Marketplace, vendor ecosystem, deep CRM automations
- Offline-first behavior
- Live autosave (adds race conditions for independent sections)
- Image crop modal for avatar (overkill for solo operator)
- Global save across all sections (retiring this pattern)

## Traceability

| Requirement ID | Planned Phase | Status |
|----------------|---------------|--------|
| CLNT-05 | Phase 6 | Complete |
| DASH-05 | Phase 7 | Deferred |
| DASH-06 | Phase 7 | Deferred |
| DASH-07 | Phase 7 | Deferred |
| NAV-01 | Phase 8 | Complete |
| NAV-02 | Phase 8 | Complete |
| NAV-03 | Phase 8 | Complete |
| NAV-04 | Phase 8 | Complete |
| NAV-05 | Phase 8 | Complete |
| A11Y-01 | Phase 8 | Complete |
| A11Y-02 | Phase 8 | Complete |
| A11Y-03 | Phase 8 | Complete |
| BRAND-01 | Phase 9 | Pending |
| BRAND-02 | Phase 9 | Pending |
| BRAND-03 | Phase 9 | Pending |
| BRAND-04 | Phase 9 | Pending |
| BRAND-05 | Phase 9 | Pending |
| BRAND-06 | Phase 9 | Pending |
| BIZ-01 | Phase 9 | Pending |
| BIZ-02 | Phase 9 | Pending |
| BIZ-03 | Phase 9 | Pending |
| BIZ-04 | Phase 9 | Pending |
| BIZ-05 | Phase 9 | Pending |
| PROF-01 | Phase 10 | Pending |
| PROF-02 | Phase 10 | Pending |
| PROF-03 | Phase 10 | Pending |
| PROF-04 | Phase 10 | Pending |
| PROF-05 | Phase 10 | Pending |
| PROF-06 | Phase 10 | Pending |
| PROF-07 | Phase 10 | Pending |
| A11Y-04 | Phase 10 | Pending |
| GEN-01 | Phase 11 | Pending |
| GEN-02 | Phase 11 | Pending |
| GEN-03 | Phase 11 | Pending |
| GEN-04 | Phase 11 | Pending |
| GEN-05 | Phase 11 | Pending |
| GEN-06 | Phase 11 | Pending |
| GEN-07 | Phase 11 | Pending |
| GEN-08 | Phase 11 | Pending |
| GEN-09 | Phase 11 | Pending |
| GEN-10 | Phase 11 | Pending |
| EMAIL-01 | Phase 11 | Pending |
| EMAIL-02 | Phase 11 | Pending |
| EMAIL-03 | Phase 11 | Pending |
| EMAIL-04 | Phase 11 | Pending |
| EMAIL-05 | Phase 11 | Pending |
| EMAIL-06 | Phase 11 | Pending |
| EMAIL-07 | Phase 11 | Pending |
| INT-01 | Phase 12 | Pending |
| BILL-01 | Phase 12 | Pending |
