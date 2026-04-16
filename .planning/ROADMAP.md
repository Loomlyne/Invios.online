# Roadmap: Invios

## Milestones

- ✅ **v1.0 MVP** — Phases 1–5 (shipped 2026-04-14)
- 📋 **v1.1** — Phases 6–7 (planned)

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

### 📋 v1.1 (Planned)

- [x] **Phase 6: CSV Client Import** — User can import clients in bulk from a CSV file with field mapping, validation, and duplicate detection (completed 2026-04-14)
- [x] **Phase 7: Analytics Dashboard** — User can view revenue trends, receivables aging, and period-over-period metric changes on the dashboard (completed 2026-04-16)

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

## Progress

| Phase | Milestone | Plans | Status | Completed |
|-------|-----------|-------|--------|-----------|
| 1. Foundation & Onboarding | v1.0 | 3/3 | ✅ Complete | 2026-04-07 |
| 2. Clients & Document Engine | v1.0 | 6/6 | ✅ Complete | 2026-04-09 |
| 3. Dashboard & Cash Flow | v1.0 | 5/5 | ✅ Complete | 2026-04-10 |
| 4. Public Trust Surfaces | v1.0 | 7/7 | ✅ Complete | 2026-04-12 |
| 5. Automation & Recovery | v1.0 | 7/7 | ✅ Complete | 2026-04-12 |
| 6. CSV Client Import | v1.1 | 3/3 | Complete   | 2026-04-14 |
| 7. Analytics Dashboard | v1.1 | 2/2 | Complete   | 2026-04-16 |
