# Roadmap: Invios

## Milestones

- ✅ **v1.0 MVP** — Phases 1–5 (shipped 2026-04-14)
- ✅ **v1.1** — Phases 6–7 (shipped 2026-04-16)
- ✅ **v1.2 Settings UX** — Phases 8–12 (shipped 2026-06-10)
- 📋 **v2.0 Operator Power** — Phases 13–19 (planned — AI co-pilot deferred)

## Phases

<details>
<summary>✅ v1.0 MVP (Phases 1–5) — SHIPPED 2026-04-14</summary>

- [x] Phase 1: Foundation & Onboarding (3/3 plans) — app shell, onboarding wizard, auth, mobile nav, settings
- [x] Phase 2: Clients & Document Engine (6/6 plans) — client CRUD, quotation/invoice builders, PDF export, share, conversion
- [x] Phase 3: Dashboard & Cash Flow (5/5 plans) — payments, expenses, profit/margin, MetricCard dashboard
- [x] Phase 4: Public Trust Surfaces (7/7 plans) — public pages, client portal, bilingual/RTL, TRN, slug URLs, visual polish
- [x] Phase 5: Automation & Recovery (7/7 plans) — version history, recurring billing, reminder emails, cron infrastructure

See archive: `.planning/milestones/v1.0-ROADMAP.md`

</details>

### ✅ v1.1 (Shipped)

- [x] **Phase 6: CSV Client Import** — completed 2026-04-14
- [x] **Phase 7: Analytics Dashboard** — completed 2026-04-16

### ✅ v1.2 Settings UX (Shipped 2026-06-10)

- [x] **Phase 8: Settings Foundation** — sidebar nav, URL routing, panel shell, placeholders (completed 2026-04-15)
- [x] **Phase 9: Branding + Business Info** — logo, templates, colors, business profile fields
- [x] **Phase 10: Profile Panel** — avatar, hourly rate, password, account deletion
- [x] **Phase 11: General + Emails** — defaults, numbering, email notification toggles
- [x] **Phase 12: Integrations + Billing Stubs** — structured placeholders (no Stripe)

### 📋 v2.0 Operator Power (Planned)

- [ ] **Phase 13: Client Portal v2** — named URL `/portal/[operatorSlug]/[portalSlug]`, full client history
- [ ] **Phase 14: Client Intelligence** — LTV, payment reliability, health signals
- [ ] **Phase 15: Time Tracking** — entries, billable flag, convert to invoice line items
- [ ] **Phase 16: Automation Rules** — triggers/actions, AUTO-06 recurring auto-send, EMAIL-07
- [ ] **Phase 17: Cash Flow Forecast** — 30/60/90-day projection, DASH-08 date ranges
- [ ] **Phase 18: Proposals & Approval** — formal proposals, client accept/reject, audit trail
- [ ] **Phase 19: Integrations Hub** — webhooks, CSV export, delivery logs (no Stripe)

> Phase 20 (AI Co-pilot) removed from v2.0 scope — requirements AI-01–05 deferred.

## Phase Details

### Phase 6: CSV Client Import
**Goal**: Users can bring their existing client roster into Invios without manual data entry
**Depends on**: Phase 2 (client data model and slug infrastructure)
**Requirements**: CLNT-05
**Success Criteria** (what must be TRUE):
  1. User can download a CSV template with the exact column headers the importer expects, reducing format errors before upload
  2. User can upload a CSV, see columns auto-mapped to client fields (name, company, email, phone, address, trn), and manually override any mapping before committing
  3. User can preview all rows with per-row validation errors highlighted before confirming the import
  4. After confirming, valid rows are inserted in batch; duplicate emails are skipped; user sees a summary of how many clients were imported, skipped, and failed
  5. Partial failures do not block the import — valid rows go through even when some rows contain errors
**Plans**: 3 plans

Plans:
- [x] 06-01-PLAN.md — Config, types, schema, helpers, and importClientsAction server action
- [x] 06-02-PLAN.md — Unit tests and wizard shell with Upload + Map steps
- [x] 06-03-PLAN.md — Preview + Result steps, page wiring, and end-to-end verification

**UI hint**: yes

### Phase 7: Analytics Dashboard
**Goal**: Users can read revenue trends, aging exposure, and month-over-month momentum directly from the dashboard
**Depends on**: Phase 3 (dashboard data model and getDashboardDataset), Phase 6
**Requirements**: DASH-05, DASH-06, DASH-07
**Success Criteria** (what must be TRUE):
  1. User can see a 12-month bar or area chart showing total billed vs total collected per calendar month, with all 12 slots always present (zero-padded for months with no data)
  2. User can see a receivables aging breakdown with outstanding amounts grouped into 0–30, 31–60, 61–90, and 90+ day buckets — excluding paid invoices and reflecting partial payments correctly
  3. User can see month-over-month change indicators (e.g. +12%, -8%) on the billed, collected, and outstanding metric cards on the dashboard
  4. All three analytics surfaces show a deliberate empty state when no non-draft invoices exist — no broken or blank charts
**Plans**: 2 plans

Plans:
- [x] 07-01-PLAN.md — Scaffold shadcn chart, computation functions (trend/aging/MoM), unit tests
- [x] 07-02-PLAN.md — Chart components, MetricCard MoM badge, dashboard page wiring

**UI hint**: yes

### Phase 8: Settings Foundation
**Goal**: Settings uses vertical sidebar navigation with URL-synced sections and placeholder panels
**Depends on**: Phase 1 (settings route exists)
**Requirements**: NAV-01–05, A11Y-01–03
**Success Criteria**:
  1. User navigates settings via sidebar with active section highlight
  2. Section changes sync to URL query param; back/forward works
  3. Mobile uses section picker drawer
  4. Seven placeholder panels render with per-section save pattern
**Plans**: 3 plans (complete)

### Phase 9: Branding + Business Info
**Goal**: Operator configures visual brand and business identity in settings
**Depends on**: Phase 8
**Requirements**: BRAND-01–06, BIZ-01–05
**Success Criteria**:
  1. Logo and cover upload persist and appear on documents
  2. Template and color choices apply to live preview
  3. Business fields save independently with validation
  4. `/app/branding` redirects to settings branding section
**Plans**: TBD

**UI hint**: yes

### Phase 10: Profile Panel
**Goal**: Operator manages personal profile, hourly rate, and account security
**Depends on**: Phase 8
**Requirements**: PROF-01–07, A11Y-04
**Success Criteria**:
  1. Name and avatar save with initials fallback
  2. Hourly rate stored on profile for Phase 15 time billing
  3. Password change requires current password and confirmation dialog
  4. Account deletion requires typed confirmation
**Plans**: TBD

**UI hint**: yes

### Phase 11: General + Emails
**Goal**: Operator configures document defaults and email notification preferences
**Depends on**: Phase 8
**Requirements**: GEN-01–10, EMAIL-01–02, EMAIL-04–07
**Success Criteria**:
  1. All general defaults persist and apply to new documents
  2. Email toggles save per notification type
  3. EMAIL-07 toggle present (execution wired in Phase 16)
**Plans**: TBD

### Phase 12: Integrations + Billing Stubs
**Goal**: Structured placeholders for integrations and billing without Stripe
**Depends on**: Phase 8
**Requirements**: INT-01, BILL-01
**Success Criteria**:
  1. Integrations panel explains upcoming webhooks (Phase 19)
  2. Billing panel shows plan/usage display-only — no payment collection
  3. No Stripe keys or payment flows introduced
**Plans**: TBD

### Phase 13: Client Portal v2
**Goal**: Each client has a human-readable portal URL showing their full document history
**Depends on**: Phase 4 (portal exists), Phase 9 (branding on portal)
**Requirements**: PORT-01–06
**Success Criteria**:
  1. Portal URL format: `/portal/[operatorSlug]/[portalSlug]`
  2. Portal lists all invoices and quotations with status and totals
  3. Operator copies named link from client page
  4. Legacy token URLs 301 redirect when slug exists
**Plans**: TBD

**UI hint**: yes

### Phase 14: Client Intelligence
**Goal**: Operator sees CRM-style health metrics per client
**Depends on**: Phase 3 (payments), Phase 7 (analytics patterns)
**Requirements**: CRM-01–05
**Success Criteria**:
  1. Client detail shows LTV, avg days-to-pay, reliability score
  2. Health badge and suggested actions visible
  3. Metrics handle partial payments and exclude drafts
**Plans**: TBD

**UI hint**: yes

### Phase 15: Time Tracking
**Goal**: Operator logs time and converts billable hours to invoice line items
**Depends on**: Phase 10 (hourly rate), Phase 2 (invoice builder)
**Requirements**: TIME-01–05
**Success Criteria**:
  1. CRUD time entries with client association
  2. Billable toggle and date-range filter
  3. Convert selected entries to invoice lines at profile hourly rate
  4. Converted entries cannot be re-billed
**Plans**: TBD

**UI hint**: yes

### Phase 16: Automation Rules
**Goal**: Operator defines if-this-then-that rules beyond recurring cron
**Depends on**: Phase 5 (reminders), Phase 18 (quote accepted trigger optional)
**Requirements**: AUTO-06–10, EMAIL-07
**Success Criteria**:
  1. Recurring invoices auto-send when enabled per schedule
  2. Rule builder: trigger + actions with validation
  3. Run log shows last execution per rule
  4. Reminder emails respect EMAIL-07 toggle and dedup
**Plans**: TBD

### Phase 17: Cash Flow Forecast
**Goal**: Operator sees projected cash position 30/60/90 days ahead
**Depends on**: Phase 7 (analytics), Phase 5 (recurring), Phase 16 (optional)
**Requirements**: FCST-01–04, DASH-08
**Success Criteria**:
  1. Forecast chart on dashboard with three horizons
  2. Uses recurring + aging + collection rate assumptions
  3. Custom date range filter for analytics inputs
  4. Clear empty state when data insufficient
**Plans**: TBD

**UI hint**: yes

### Phase 18: Proposals & Approval
**Goal**: Formal proposals with client acceptance workflow and audit trail
**Depends on**: Phase 4 (public quote pages), Phase 16 (automation hook)
**Requirements**: PROP-01–05
**Success Criteria**:
  1. Proposal mode on quotations with approval tracking
  2. Client accept/reject with confirmation on public page
  3. Acceptance metadata recorded
  4. Operator notified on status change
**Plans**: TBD

**UI hint**: yes

### Phase 19: Integrations Hub
**Goal**: Operator connects outbound webhooks and exports data (no Stripe)
**Depends on**: Phase 12 (stub upgrade)
**Requirements**: INT-03–07
**Success Criteria**:
  1. Register webhook URLs with HMAC signing
  2. Events fire on document lifecycle changes
  3. CSV export for clients and invoices
  4. Delivery log with last status per endpoint
**Plans**: TBD

### Phase 20: AI Co-pilot
**Goal**: AI assists draft creation and document review — always human-in-the-loop
**Depends on**: Phases 2, 14, 16 (context for suggestions)
**Requirements**: AI-01–05
**Success Criteria**:
  1. Brief-to-quote/invoice draft opens in editor for review
  2. Review flags TRN, math, margin issues
  3. Reminder copy suggestions use CRM reliability data
  4. Opt-in toggle in settings; no auto-send
**Plans**: TBD

## Progress

| Phase | Milestone | Plans | Status | Completed |
|-------|-----------|-------|--------|-----------|
| 1. Foundation & Onboarding | v1.0 | 3/3 | ✅ Complete | 2026-04-07 |
| 2. Clients & Document Engine | v1.0 | 6/6 | ✅ Complete | 2026-04-09 |
| 3. Dashboard & Cash Flow | v1.0 | 5/5 | ✅ Complete | 2026-04-10 |
| 4. Public Trust Surfaces | v1.0 | 7/7 | ✅ Complete | 2026-04-12 |
| 5. Automation & Recovery | v1.0 | 7/7 | ✅ Complete | 2026-04-12 |
| 6. CSV Client Import | v1.1 | 3/3 | ✅ Complete | 2026-04-14 |
| 7. Analytics Dashboard | v1.1 | 2/2 | ✅ Complete | 2026-04-16 |
| 8. Settings Foundation | v1.2 | 3/3 | ✅ Complete | 2026-04-15 |
| 9. Branding + Business Info | v1.2 | 0/? | Pending | — |
| 10. Profile Panel | v1.2 | 0/? | Pending | — |
| 11. General + Emails | v1.2 | 0/? | Pending | — |
| 12. Integrations + Billing | v1.2 | 0/? | Pending | — |
| 13. Client Portal v2 | v2.0 | 0/? | Planned | — |
| 14. Client Intelligence | v2.0 | 0/? | Planned | — |
| 15. Time Tracking | v2.0 | 0/? | Planned | — |
| 16. Automation Rules | v2.0 | 0/? | Planned | — |
| 17. Cash Flow Forecast | v2.0 | 0/? | Planned | — |
| 18. Proposals & Approval | v2.0 | 0/? | Planned | — |
| 19. Integrations Hub | v2.0 | 0/? | Planned | — |
| 20. AI Co-pilot | v2.0 | 0/? | Planned | — |

## Research

v2.0 research artifacts: `.planning/research/v2.0-*.md`
Milestone context: `.planning/MILESTONE-v2.0-CONTEXT.md`
