# FEATURES

## Table Stakes

- Email/password auth
- Business onboarding
- Client management
- Quotation creation and editing
- Invoice creation and editing
- PDF export
- Public share links
- Payment tracking
- Status visibility: draft, sent, partial, paid, overdue / accepted, rejected, expired
- Dashboard totals: billed, collected, due, overdue
- Mobile responsiveness

## Strong Differentiators

- Premium branded document presentation
- Public client-facing pages that look trustworthy, not like dumped PDFs
- Quote-to-invoice conversion
- Expense tracking against invoices
- Profitability per invoice
- UAE-aware tax invoice support
- Bilingual English/Arabic document rendering
- Version history and safe restore

## Advanced But Valuable

- Client portal across documents
- Reminder rules + reminder logs
- Recurring invoice templates
- Embedded payment collection later
- Richer acceptance / rejection events on quotations

## Anti-Features

- Full bookkeeping / accounting suite
- Full CRM pipeline with heavy sales automation
- Team permissions complexity in early versions
- Generic SMB feature creep that weakens the freelance / service-business billing loop

## Complexity Notes

- **Low / Medium**: auth, onboarding, clients, quotations, invoices, dashboard shell
- **Medium**: public share pages, quote-to-invoice conversion, PDF generation
- **Medium / High**: payment tracking with automatic status computation
- **High**: invoice version snapshots + restore
- **High**: recurring billing and reminder execution
- **High**: bilingual / RTL-safe PDF and public rendering

## Dependencies

- Clients must exist before documents are meaningful
- Shared document engine should exist before PDF/public pages
- Payment and expense flows depend on invoice totals being stable
- Version history should build on a stable invoice shape
- Recurring and reminders should follow a trusted invoice lifecycle

## Key Product Insight

Users will try the app because the document looks better and feels easier.
They will keep using it because it reduces follow-up chaos and makes cash flow visible.

## Sources

- HoneyBook pricing/features: https://www.honeybook.com/pricing
- HoneyBook payment reminders: https://www.honeybook.com/payment-reminders
- HoneyBook reminder help article: https://help.honeybook.com/en/articles/2209077/
- HoneyBook payments/autopay FAQ: https://help.honeybook.com/en/articles/2209040-honeybook-payments-faq
