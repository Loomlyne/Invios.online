# Roadmap: Invios

## Milestones

- ✅ **v1.0 MVP** — Phases 1–5 (shipped 2026-04-14)
- 🚧 **v1.1 Client Import & Analytics** — Phases 6–7 (in progress)
- 📋 **v1.2 Settings UX Redesign** — Phases 8–12 (planned)

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

<details>
<summary>🚧 v1.1 Client Import & Analytics (Phases 6–7) — in progress</summary>

- [x] **Phase 6: CSV Client Import** — User can import clients in bulk from a CSV file with field mapping, validation, and duplicate detection (completed 2026-04-14)
- [ ] **Phase 7: Analytics Dashboard** — User can view revenue trends, receivables aging, and period-over-period metric changes on the dashboard

</details>

### 📋 v1.2 Settings UX Redesign (Planned)

**Milestone Goal:** Convert the monolithic settings workspace into a sidebar-based hub with eight dedicated sections, per-section independent save, full keyboard accessibility, and a mobile-responsive section picker.

- [ ] **Phase 8: Settings Foundation** — Shell, sidebar, URL-synced routing, mobile nav, and shared primitives replace the monolith skeleton
- [ ] **Phase 9: Branding & Business Info** — Branding panel migrated from `/app/branding` into settings; Business Info panel with bank/payment details added; old route redirected
- [ ] **Phase 10: Profile Tab** — Personal info, avatar upload with initials fallback, hourly rate, password change, and danger zone
- [ ] **Phase 11: General & Emails** — Document preferences, date format, doc numbering, notification toggles; Supabase schema migration for email preference columns
- [ ] **Phase 12: Integrations, Billing & Cleanup** — Placeholder panels for Integrations and Billing; monolith files deleted; final accessibility audit

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
**Plans**: TBD
**UI hint**: yes

### Phase 8: Settings Foundation
**Goal**: Users can navigate settings via a sidebar-based shell with URL-synced section routing and a mobile section picker — the load-bearing structure every subsequent panel depends on
**Depends on**: Phase 1 (app shell and auth middleware)
**Requirements**: NAV-01, NAV-02, NAV-03, NAV-04, NAV-05, A11Y-01, A11Y-02, A11Y-03
**Success Criteria** (what must be TRUE):
  1. User can see a vertical sidebar listing all settings sections with icons and labels; the active section is visually highlighted with an `aria-current="page"` indicator
  2. User can navigate directly to any section by URL (e.g. `/app/settings?section=profile`) and use browser back/forward without history pollution
  3. User on mobile can open a section picker and switch sections without losing scroll position or triggering a full page reload
  4. User can navigate all sidebar items using keyboard arrow keys with a visible focus ring on each item
  5. Every settings form field has an associated label; each section has its own independent Save button (no global save across sections)
**Plans**: 3 plans

Plans:
- [x] 08-01-PLAN.md — SETTINGS_SECTIONS const, SettingsSection type, Section/Field primitives, SaveButton
- [x] 08-02-PLAN.md — Settings sidebar with keyboard nav, shell layout, page.tsx swap
- [ ] 08-03-PLAN.md — Mobile section picker, 7 placeholder panels, branding nav update

**UI hint**: yes

### Phase 9: Branding & Business Info
**Goal**: Users can manage all branding and business configuration from within Settings — the `/app/branding` route is retired and all links updated on day one of this phase
**Depends on**: Phase 8
**Requirements**: BRAND-01, BRAND-02, BRAND-03, BRAND-04, BRAND-05, BRAND-06, BIZ-01, BIZ-02, BIZ-03, BIZ-04, BIZ-05
**Success Criteria** (what must be TRUE):
  1. User can upload or replace logo and header cover image from the Branding tab inside Settings; changes reflect in invoice previews immediately
  2. User can select an invoice layout template from visual thumbnail previews and customize font color and background color within the same tab
  3. User can set a page background (solid color, image, or video) for the document editor from the Branding tab
  4. Navigating to `/app/branding` redirects the user to `/app/settings?section=branding` — no dead-end routes remain
  5. User can enter and save business name, address, phone, website, VAT/TRN, and payment details (bank name, account name, IBAN, SWIFT) from the Business Info tab
**Plans**: TBD
**UI hint**: yes

### Phase 10: Profile Tab
**Goal**: Users can manage their personal identity — avatar, name, hourly rate, password, and account deletion — all from a single Profile section
**Depends on**: Phase 8, Phase 9 (upload pattern validated in production)
**Requirements**: PROF-01, PROF-02, PROF-03, PROF-04, PROF-05, PROF-06, PROF-07, A11Y-04
**Success Criteria** (what must be TRUE):
  1. User can edit their full name and see their email address displayed as read-only in the Profile section
  2. User can click to upload an avatar image; the new image is previewed immediately client-side before saving; when no avatar exists, the user's initials appear in its place
  3. User can set a default hourly rate and save it independently from other profile fields
  4. User can change their password using current/new/confirm fields; the form requires typed confirmation before submitting
  5. User can delete their account via a danger zone that requires typing a confirmation phrase; the action is irreversible and presented with a clear warning dialog
**Plans**: TBD
**UI hint**: yes

### Phase 11: General & Emails
**Goal**: Users can configure all document preferences and control exactly which email notifications they receive — backed by a Supabase schema migration that provisions the new columns
**Depends on**: Phase 8
**Requirements**: GEN-01, GEN-02, GEN-03, GEN-04, GEN-05, GEN-06, GEN-07, GEN-08, GEN-09, GEN-10, EMAIL-01, EMAIL-02, EMAIL-03, EMAIL-04, EMAIL-05, EMAIL-06, EMAIL-07
**Success Criteria** (what must be TRUE):
  1. User can set default language, currency, tax rate, date format, and payment terms — all from the General tab with a single Save per preference group
  2. User can configure document numbering independently for invoices, quotes, and receipts (prefix and next number for each type), with the option to include the date in the number
  3. User can toggle auto-generate receipt on payment and revoke-public-link on payment from the General tab
  4. User can toggle each email notification event independently (acceptance, payment received, Stripe payment, project activity, chat from customer, chat to customer, auto reminder) — toggles update local state only; one explicit Save commits all preferences
  5. After the Supabase migration runs, notification preference columns exist in `user_settings` and toggled values persist across sessions
**Plans**: TBD
**UI hint**: yes

### Phase 12: Integrations, Billing & Cleanup
**Goal**: The settings hub is complete — placeholder sections for Integrations and Billing are in place, the legacy monolith files are deleted, and an accessibility audit confirms all panels meet the bar
**Depends on**: Phase 8, Phase 9, Phase 10, Phase 11
**Requirements**: INT-01, BILL-01
**Success Criteria** (what must be TRUE):
  1. User can navigate to the Integrations section and see a "Coming soon" card grid that communicates upcoming third-party connection support without dead ends
  2. User can navigate to the Billing section and see their current plan status displayed with a "Coming soon" message for plan management
  3. The legacy `settings-workspace.tsx` and `branding-workspace.tsx` files are deleted and no remaining imports reference them anywhere in the codebase
**Plans**: TBD
**UI hint**: yes

## Progress

| Phase | Milestone | Plans | Status | Completed |
|-------|-----------|-------|--------|-----------|
| 1. Foundation & Onboarding | v1.0 | 3/3 | ✅ Complete | 2026-04-07 |
| 2. Clients & Document Engine | v1.0 | 6/6 | ✅ Complete | 2026-04-09 |
| 3. Dashboard & Cash Flow | v1.0 | 5/5 | ✅ Complete | 2026-04-10 |
| 4. Public Trust Surfaces | v1.0 | 7/7 | ✅ Complete | 2026-04-12 |
| 5. Automation & Recovery | v1.0 | 7/7 | ✅ Complete | 2026-04-12 |
| 6. CSV Client Import | v1.1 | 3/3 | Complete | 2026-04-14 |
| 7. Analytics Dashboard | v1.1 | 0/? | Not started | — |
| 8. Settings Foundation | v1.2 | 2/3 | In Progress|  |
| 9. Branding & Business Info | v1.2 | 0/? | Not started | — |
| 10. Profile Tab | v1.2 | 0/? | Not started | — |
| 11. General & Emails | v1.2 | 0/? | Not started | — |
| 12. Integrations, Billing & Cleanup | v1.2 | 0/? | Not started | — |
