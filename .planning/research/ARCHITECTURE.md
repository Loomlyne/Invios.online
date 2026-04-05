# ARCHITECTURE

## Major Components

1. **Marketing Surface**
   - Landing page
   - Pricing / positioning later
   - Install CTA and trust framing

2. **Authentication Layer**
   - Email/password auth
   - Session handling
   - Onboarding gate

3. **Core App Shell**
   - Dashboard
   - Navigation
   - Global actions
   - Mobile action patterns

4. **Business Setup Domain**
   - Branding
   - User settings
   - Tax defaults

5. **Client Domain**
   - Client records
   - Client detail views
   - Client portal tokens

6. **Document Domain**
   - Quotations
   - Invoices
   - Line items
   - Shared rendering engine
   - Slug + token public access

7. **Operations Domain**
   - Payments
   - Expenses
   - Profit metrics
   - Status automation

8. **Automation Domain**
   - Recurring configs
   - Reminder configs
   - Reminder logs

9. **Public Experience Domain**
   - Public invoice pages
   - Public quotation pages
   - Client portal pages

## Data Flow

- User configures brand and business defaults.
- Those defaults seed quotation/invoice builders.
- Builders write normalized document rows plus line items.
- Public and PDF renderers read from the same canonical document model.
- Payments and expenses mutate invoice-derived operational metrics.
- Dashboard aggregates from invoices, payments, expenses, and quotations.

## Boundaries

- Keep builder logic and renderer logic separated, but powered by one canonical document schema.
- Keep public-token access isolated from authenticated app reads.
- Keep automation scheduling separate from core invoice CRUD so failed reminders do not corrupt financial state.

## Suggested Build Order

1. Auth + onboarding + branding
2. Clients
3. Quotations + invoices + shared builder
4. Public pages + PDF path
5. Dashboard metrics
6. Payments + expenses + auto status
7. Quote-to-invoice conversion
8. Versioning
9. Recurring + reminders
10. Client portal depth + polish

## Architecture Recommendation

Derive roadmap phases from user workflow, not from database tables:
- get set up
- create/send documents
- track money
- automate follow-up
- polish public experiences

That ordering matches real operator behavior and keeps the app demoable throughout development.

## Sources

- Next.js App Router docs: https://nextjs.org/docs/app
- Next.js mutations and revalidation: https://nextjs.org/learn/dashboard-app/mutating-data
- Supabase SSR for Next.js: https://supabase.com/docs/guides/auth/server-side/nextjs
