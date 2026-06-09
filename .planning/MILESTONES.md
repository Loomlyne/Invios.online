# Milestones

## v1.0 MVP (Shipped: 2026-04-14)

**Delivered:** Full billing lifecycle shipped — from onboarding and branded document creation through payment tracking, public share, version history, recurring billing, and reminder automation, live on invios.online.

**Phases completed:** 5 phases (1–5), 28 plans, 55 tasks

**Stats:**
- ~22,900 lines TypeScript
- 168 commits
- 9 days (2026-04-05 → 2026-04-14)
- Git range: initial commit → `feat: full site brand color theming via HSL-derived CSS token family`

**Key accomplishments:**
- **Phase 1:** Installable app shell, onboarding wizard with live branded preview, mobile-first navigation, auth middleware, and Settings persistence
- **Phase 2:** Full document engine — client management, quotation/invoice builders with live preview, ShareModal, DocumentStatusActions, PDF export, and quotation-to-invoice conversion
- **Phase 3:** Financial operator console — payments + expenses tracking, auto invoice status computation, profit/margin per invoice, MetricCard dashboard with collection rate and overdue visibility
- **Phase 4:** Public trust surfaces — public invoice/quotation pages with secure token, client portal, bilingual EN/AR rendering, RTL-safe layout, UAE TRN compliance, slug-based URLs with alias redirects, visual design token pass
- **Phase 5:** Automation — JSONB invoice version snapshots with safe restore, recurring billing cron, reminder email automation with 24-hour dedup, 3 new Supabase tables live in production

**What's next:** v1.1 — client import, richer analytics (delivered below)

---

## v1.1 (Shipped: 2026-04-16)

**Delivered:** CSV client import wizard and analytics dashboard with revenue trend, aging buckets, and month-over-month deltas.

**Phases completed:** 2 phases (6–7)

**Key accomplishments:**
- **Phase 6:** CSV import with column mapping, validation preview, batch insert, duplicate detection
- **Phase 7:** Revenue trend chart, receivables aging, MoM delta indicators on dashboard metrics

**What's next:** v1.2 Settings UX redesign

---

## v1.2 Settings UX (In Progress)

**Goal:** Break monolithic settings into sidebar-navigated sections with polished, accessible panels.

**Phases:** 8–12

**Progress:**
- ✅ Phase 8: Settings foundation (sidebar, URL routing, placeholder panels)
- ⏳ Phase 9–12: Branding, Profile, General/Emails, Integrations/Billing stubs

**Constraint:** No Stripe — Billing tab is display-only.

**What's next:** `/gsd:plan-phase 9`

---

## v2.0 Operator Power (Planned — research complete 2026-06-10)

**Goal:** Operator power platform — named client portals, CRM intelligence, time tracking, automation, forecasting, proposals, integrations hub, AI co-pilot.

**Phases:** 13–20 (8 phases)

**Research artifacts:**
- `.planning/MILESTONE-v2.0-CONTEXT.md`
- `.planning/research/v2.0-SUMMARY.md`
- `.planning/research/v2.0-FEATURES.md`
- `.planning/research/v2.0-ARCHITECTURE.md`
- `.planning/research/v2.0-STACK.md`
- `.planning/research/v2.0-PITFALLS.md`

**All user-approved suggestions included:**
1. AI co-pilot (Phase 20)
2. Time tracking → auto-billing (Phase 15)
3. Client intelligence / mini-CRM (Phase 14)
4. Automation rules engine + AUTO-06 + EMAIL-07 (Phase 16)
5. Cash flow forecasting + DASH-08 (Phase 17)
6. Proposals + lightweight approval (Phase 18)
7. Integrations hub — webhooks/exports, **not Stripe** (Phase 19)
8. Advanced client portal — `/portal/[operatorSlug]/[portalSlug]` (Phase 13)

**Explicitly excluded:** OPS-06, INT-02, Stripe payment collection (no Stripe account).

**Dependency order:** Portal + CRM → Time (needs hourly rate from v1.2 Phase 10) → Automation → Forecast → Proposals → Integrations → AI last.

**What's next:** Ship v1.2 first, then `/gsd:discuss-phase 13` → `/gsd:plan-phase 13`

---
