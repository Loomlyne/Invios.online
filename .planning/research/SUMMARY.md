# RESEARCH SUMMARY

## Stack

Use the mandated modern web stack as-is:
- Next.js 15 App Router
- TypeScript
- Tailwind 4
- shadcn/ui
- Supabase Auth + Postgres + Storage
- `@supabase/ssr` for cookie-based auth clients
- Vercel deployment

This is the right stack for a CRUD-heavy, trust-heavy SaaS with public pages and authenticated operator views.

## Table Stakes

- Auth
- Branding setup
- Clients
- Quotations
- Invoices
- PDF export
- Public share links
- Dashboard totals
- Payment tracking
- Mobile-responsive experience

## Differentiators

- Premium branded document presentation
- Public client experiences that feel polished
- UAE-ready tax invoice support
- Invoice profitability
- Version history + safe restore
- Recurring and reminder workflows

## Watch Out For

1. Scope creep into full accounting or CRM
2. Preview/PDF/public rendering drift
3. Manual status logic instead of computed financial state
4. Late UAE compliance modeling
5. Generic dashboard UI
6. Duplicate reminder sends

## Planning Implication

The roadmap should not be split by database tables.
It should be split by operator workflow:
1. get set up
2. create/send documents
3. track cash and profit
4. automate repeat work
5. polish public trust surfaces
