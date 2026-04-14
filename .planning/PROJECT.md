# Invios

## What This Is

Invios is a premium, installable web invoicing SaaS for freelancers, solo operators, and small agencies. It combines branded quotations and invoices, client management, payment tracking, expense tracking, automated reminders, recurring billing, version history, public share experiences, client portals, bilingual document rendering, and profitability visibility in one operator-style console. Built for UAE-based and internationally mobile service businesses that currently run billing manually across chat, notes, spreadsheets, PDFs, and design tools.

## Core Value

Make it dead simple for a service business to send a polished branded quote or invoice and reliably know what has been paid, what is still due, and what profit remains.

## Requirements

### Validated

- ✓ User can sign up, sign in, and complete onboarding with business branding and default invoice settings. — v1.0
- ✓ User can create, edit, preview, save, share, and export branded quotations and invoices. — v1.0
- ✓ User can manage clients and see all quotations and invoices tied to each client. — v1.0
- ✓ User can track payments, expenses, outstanding balances, and profit per invoice. — v1.0
- ✓ User can convert quotations into invoices and preserve document history safely. — v1.0
- ✓ User can share polished public document links and client portal links. — v1.0
- ✓ User can configure reminders and recurring billing for repeat invoicing workflows. — v1.0
- ✓ User can operate the product comfortably on mobile-sized screens and install it from the web. — v1.0
- ✓ User can issue UAE-friendly tax invoices with AED, TRN, and bilingual English/Arabic document support. — v1.0

### Active

- [ ] User can sign in with OAuth providers (AUTH-05).
- [ ] Recurring invoices can auto-send on schedule without manual review (AUTO-06).
- [ ] User can collect invoice payment online via integrated payment links (OPS-06).
- [ ] User can import clients from CSV or external sources (CLNT-05).
- [ ] User can view richer analytics across time windows, client cohorts, and profitability trends (DASH-05).

### Out of Scope

- Full accounting suite, bookkeeping, payroll, tax filing, and general ledger workflows — this is a billing operator console, not accounting software.
- Team collaboration complexity, permissions matrix, and large-organization workflows in v1 — too much surface area for a side-project launch.
- Literal one-to-one HoneyBook parity — the product borrows the model but ships in phased slices.
- Marketplace, vendor ecosystem, or deep CRM automations in early phases — dilute the core billing loop.
- Offline-first product behavior — real-time is core value.

## Context

- **v1.0 shipped 2026-04-14**: 5 phases, 28 plans, 168 commits, ~22,900 LOC TypeScript in 9 days.
- **Tech stack**: Next.js 15 App Router, TypeScript, Tailwind CSS, shadcn/ui, Supabase Auth + Postgres, Vercel, Resend, Playwright — deployed at invios.online.
- **Product maturity**: Full billing lifecycle from onboarding → client creation → quotation/invoice → payment tracking → PDF export → public share → recurring schedule → reminder automation. All core surfaces are live and professional-grade.
- **Design system**: HSL-derived CSS token family (11 vars from brand color), `--surface-warm` tokens, `--accent`/`--accent-strong`/`--danger` semantic colors, glass-panel patterns, fluid responsive layout with CSS clamp().
- **Localization**: Bilingual EN/AR rendering (side-by-side columns or full RTL), conditional Arabic font loading, UAE TRN compliance, AED currency throughout.
- **Automation**: Version history snapshots on every save, restore with payment-status recomputation, recurring schedule cron, reminder cron with 24-hour dedup.
- The project started from direct founder pain: manual tracking, chat labels, and design-tool-based invoice creation. A prior design `Loomlyne-Brand-Invoice-Exporter` established the invoicing thesis for UAE freelancers. Invios expands that into a full operator console.
- The most important product risk going forward is scope expansion. v1.0 proved the core billing loop. v1.1 should deepen UX quality and automate revenue collection, not widen surface area.

## Constraints

- **Tech stack**: Next.js App Router, TypeScript, Tailwind CSS, shadcn/ui, Supabase Auth, Supabase Postgres, Vercel, GitHub — mandated by project rules.
- **Product scope**: Web app only, installable from the browser — keeps delivery focused and matches the current product vision.
- **Market context**: UAE-aware from day 1 with AED, TRN, tax invoice support, and bilingual document rendering.
- **Build reality**: Side project, not immediate business validation — design can be ambitious, but implementation still needs ruthless phasing.
- **Quality bar**: Public-facing documents and links must feel polished enough to send to real clients — trust is part of the product.
- **Design workflow**: All frontend design work must start with `aidesigner-frontend` and `ui-ux-pro-max` — user explicitly requested this workflow for the project.
- **Execution workflow**: Every phase assumes Supabase backend + Vercel hosting, checks both in parallel during planning/execution, and biases toward deployed-and-verified output.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Build a web app, not mobile native | The user explicitly wants an installable web app with strong mobile responsiveness | ✓ Good — mobile bottom nav + vaul sheets + viewport-fit work well as PWA |
| Use a HoneyBook-style product model | The desired product is broader than invoice generation and includes operator-console workflows | ✓ Good — operator console framing shaped the dashboard, kanban, and client detail pages well |
| Treat invoicing workflow as the core, not accounting | Keeps the product differentiated and small-business relevant without bloating into bookkeeping | ✓ Good — payment + expense tracking gives profitability visibility without ledger complexity |
| Support UAE tax-document structure from the start | Document architecture is expensive to retrofit later | ✓ Good — bilingual rendering, TRN, AED all shipped in Phase 4 without major rework |
| Build in phased slices even if the long-term vision is large | This is the only sane way to ship a side-project with HoneyBook-level ambitions | ✓ Good — 5 phases in 9 days proved the model works |
| Treat deployment as part of phase completion | The user wants each finished phase checked through the real hosting path, not left as local-only work | ✓ Good — caught multiple production-specific bugs (use-server exports, Supabase migration drift, CRON_SECRET format) |
| Use slug-based URLs with alias redirects instead of UUID routes | Client-facing links must be human-readable; slugs change when names change | ✓ Good — 301 alias pattern means links survive renames |
| Fold PUB-05 (accept/reject quotation) into Phase 4 | Natural fit with public quotation page build | ✓ Good — shipped as part of Phase 4 without a dedicated phase |
| Brand color as full HSL-derived CSS token family | Single brand color input generates 11 semantic tokens for gradient, surface, accent, border | ✓ Good — enables per-user theming at zero per-component cost |
| Recurring billing as cron-only (no auto-send) | Auto-send is a v2 capability; v1 cron creates drafts for human review | ✓ Good — reduces financial risk for v1; AUTO-06 is a clear v2 target |
| Version restore recomputes payment status | Restoring an old invoice state should not silently corrupt financial records | ✓ Good — safe restore path confirmed in Phase 5 |

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
*Last updated: 2026-04-14 after v1.0 milestone — full product loop shipped across 5 phases*
