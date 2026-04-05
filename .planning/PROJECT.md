# Invios

## What This Is

Invios is a premium, installable web invoicing SaaS for freelancers, solo operators, and small agencies. It combines branded quotations and invoices, client management, payment tracking, expense tracking, reminders, recurring billing, public share experiences, and profitability visibility in one operator-style console. It is built for service businesses that currently run billing manually across chat, notes, spreadsheets, PDFs, and design tools.

## Core Value

Make it dead simple for a service business to send a polished branded quote or invoice and reliably know what has been paid, what is still due, and what profit remains.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] User can sign up, sign in, and complete onboarding with business branding and default invoice settings.
- [ ] User can create, edit, preview, save, share, and export branded quotations and invoices.
- [ ] User can manage clients and see all quotations and invoices tied to each client.
- [ ] User can track payments, expenses, outstanding balances, and profit per invoice.
- [ ] User can convert quotations into invoices and preserve document history safely.
- [ ] User can share polished public document links and client portal links.
- [ ] User can configure reminders and recurring billing for repeat invoicing workflows.
- [ ] User can operate the product comfortably on mobile-sized screens and install it from the web.
- [ ] User can issue UAE-friendly tax invoices with AED, TRN, and bilingual English/Arabic document support.

### Out of Scope

- Full accounting suite, bookkeeping, payroll, tax filing, and general ledger workflows — this is a billing operator console, not accounting software.
- Team collaboration complexity, permissions matrix, and large-organization workflows in v1 — too much surface area for a side-project launch.
- Literal one-to-one HoneyBook parity — the product can borrow the model, but must ship in phased slices.
- Marketplace, vendor ecosystem, or deep CRM automations in early phases — these dilute the core billing loop.

## Context

- The project started from direct founder pain: manual tracking, chat labels, and design-tool-based invoice creation.
- A prior related design, `Loomlyne-Brand-Invoice-Exporter`, established a strong design-first invoicing thesis for UAE freelancers. Invios expands that into a broader operator console.
- The target shape is "HoneyBook-style," but the product should feel sharper, more modern, and more focused on invoicing, quotations, and client billing operations.
- The most important product risk is scope explosion. The biggest execution win is phased delivery with a strong Phase 1.
- The product must feel premium, mobile-responsive, and trustworthy. No placeholder UI and no generic dashboard skin.

## Constraints

- **Tech stack**: Next.js App Router, TypeScript, Tailwind CSS, shadcn/ui, Supabase Auth, Supabase Postgres, Vercel, GitHub — mandated by project rules.
- **Product scope**: Web app only, installable from the browser — keeps delivery focused and matches the current product vision.
- **Market context**: UAE-aware from day 1 with AED, TRN, tax invoice support, and bilingual document rendering — avoids rewriting core document architecture later.
- **Build reality**: Side project, not immediate business validation — design can be ambitious, but implementation still needs ruthless phasing.
- **Quality bar**: Public-facing documents and links must feel polished enough to send to real clients — trust is part of the product.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Build a web app, not mobile native | The user explicitly wants an installable web app with strong mobile responsiveness | — Pending |
| Use a HoneyBook-style product model | The desired product is broader than invoice generation and includes operator-console workflows | — Pending |
| Treat invoicing workflow as the core, not accounting | Keeps the product differentiated and small-business relevant without bloating into bookkeeping | — Pending |
| Support UAE tax-document structure from the start | Document architecture is expensive to retrofit later | — Pending |
| Build in phased slices even if the long-term vision is large | This is the only sane way to ship a side-project with HoneyBook-level ambitions | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition:**
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone:**
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-04-05 after initialization*
