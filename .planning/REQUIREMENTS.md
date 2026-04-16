# REQUIREMENTS

## v1.1 Requirements

### Clients

- [x] **CLNT-05**: User can upload a CSV file, map columns to client fields (name, company, email, phone, address, trn), preview validated rows with per-row error display, and import clients in batch — with duplicate detection by email and an import summary showing inserted, skipped, and errored rows.

### Dashboard & Analytics

- [x] **DASH-05**: User can view a 12-month revenue trend chart showing total billed vs total collected per month.
- [x] **DASH-06**: User can view a receivables aging breakdown showing outstanding invoice amounts bucketed by how overdue they are (0–30, 31–60, 61–90, and 90+ days).
- [x] **DASH-07**: User can see period-over-period (month-over-month) change indicators on key dashboard metrics (billed, collected, outstanding).

## Future Requirements

- [ ] **AUTH-05**: User can sign in with OAuth providers (Google, GitHub). — deferred past v1.1
- [ ] **AUTO-06**: Recurring invoices can auto-send on schedule without manual review. — deferred past v1.1
- [ ] **OPS-06**: User can collect invoice payment online via integrated payment links. — deferred past v1.1
- [ ] **CLNT-06**: User can import clients from external sources (HoneyBook, FreshBooks CSV formats). — future
- [ ] **DASH-08**: User can view analytics across client cohorts and custom date ranges. — future

## Out of Scope

- Full accounting suite, bookkeeping, payroll, tax filing — billing operator console only
- Team collaboration, permissions matrix, multi-user workspaces
- Marketplace, vendor ecosystem, deep CRM automations
- Offline-first behavior

## Traceability

| Requirement ID | Planned Phase | Status |
|----------------|---------------|--------|
| CLNT-05 | Phase 6 | Complete |
| DASH-05 | Phase 7 | Complete |
| DASH-06 | Phase 7 | Complete |
| DASH-07 | Phase 7 | Complete |
