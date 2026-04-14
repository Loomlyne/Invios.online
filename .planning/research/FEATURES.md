# Feature Research: v1.1 Client Import & Analytics

**Domain:** B2B invoicing SaaS — freelancers and small agencies
**Researched:** 2026-04-14
**Milestone:** v1.1 — CSV Client Import + Dashboard Analytics

---

## CSV Client Import

### Table Stakes

- **Downloadable CSV template**: A pre-formatted template with exactly the columns Invios expects. Without this, users will produce mismatched headers and hit the import wall immediately. This is the single highest-ROI table-stakes feature — it deflects the majority of format errors before they happen.

- **Column header auto-mapping**: After upload, automatically match CSV headers to Invios fields using case-insensitive fuzzy matching (e.g., "Client Name" → `name`, "E-mail" → `email`, "Company Name" → `company`). Show the user what was matched automatically and let them confirm or override. Auto-map reduces the perceived complexity of the mapping step from intimidating to trivial.

- **Manual field mapping UI**: When auto-mapping fails or is ambiguous, present a select per CSV column so the user can assign it to the correct Invios field. Must clearly show "Not imported" as an explicit no-op option so users know unmapped columns won't silently corrupt anything.

- **Row-level validation with inline errors**: After mapping, validate every row against required/format rules before writing anything to the database. Each bad row must show which field failed and why (e.g., "Row 4: email must be a valid address"). Block import of invalid rows individually, not the whole file.

- **Preview before commit**: Show a table of the first N rows post-mapping so the user can see what the data will look like inside Invios before any records are created. Catching "I uploaded the wrong file" at preview is far cheaper than post-import undo.

- **Duplicate detection on email + name**: Before inserting, check if a client with the same email or (name + company) already exists for this user. Surface conflicts clearly: "3 rows match existing clients." Let the user choose: skip duplicates, update existing, or import as new. No silent overwrite.

- **Import result summary**: After completion, show exactly how many rows were imported successfully, how many were skipped (duplicate), and how many failed with reasons. Not just "Import complete."

- **Required fields clearly marked**: The `name` field is the only hard-required field on the clients table. `status` defaults to `lead`. Everything else is optional. The mapping UI must visually distinguish required vs optional fields so users don't abandon the flow thinking they need all columns populated.

### Differentiators

- **Partial import on validation errors**: Rather than rejecting the whole file when some rows are bad, import the valid rows and report the failed ones. This is the gold standard — FreshBooks and HoneyBook typically fail the whole batch, which is punishing for large imports with one bad email address.

- **Error export / download failed rows**: Provide a "Download failed rows as CSV" link after import so the user can fix and re-import only the problematic records. Eliminates the manual reconciliation step.

- **Status field mapping**: Allow the CSV's status column to map to Invios `lead` or `active` values. Users migrating from another CRM will have status data; discarding it forces them to manually re-tag all clients after import.

- **Company field as secondary identity**: If the CSV has a `company` column, surface it as a distinct field separate from `name`. The clients table has both — using them correctly pays off immediately when filtering the client list by company.

### Anti-features (avoid)

- **Full-file rejection on any error**: Rejecting a 500-row import because row 7 has a bad phone number is hostile UX. Over 50% of self-service CSV uploads fail due to format issues. The fix is partial import, not all-or-nothing gating.

- **Requiring all optional columns to be present**: The CSV template should have optional columns documented but the import must not require them. A user pasting from their contacts app will not have TRN or portal_token columns, and that is fine.

- **Undo/rollback import**: At Invios scale (single-user, dozens to hundreds of clients), "delete all clients imported in the last session" is engineering complexity with near-zero real demand. The result summary + error report covers the real recovery path.

- **Excel (.xlsx) support in v1.1**: Excel parsing adds a non-trivial dependency (SheetJS or similar). The user base is technical enough to export CSV from any spreadsheet tool. Defer .xlsx support to a later enhancement.

- **AI/LLM column matching**: Overkill for a product where the template removes the matching problem entirely. Fuzzy string matching on headers is sufficient and has no API cost or latency.

- **Progress bar for small imports**: At the scale of a solo freelancer's client list (typically 20-200 contacts), import is instantaneous. A fake progress animation adds complexity with no functional value. A loading spinner is sufficient.

---

## Analytics Dashboard

### Table Stakes

- **Monthly revenue trend chart (12 months)**: A bar or area chart showing billed amount per calendar month for the trailing 12 months. This is the single most-requested "why am I not making more money?" visualization. Uses `issue_date` from the invoices table grouped by `DATE_TRUNC('month', issue_date)`. No new DB columns needed — the data already exists.

- **Billed vs. collected overlay**: The trend chart must show both billed and collected on the same axis (grouped bars or dual-line) so the user can see their collection gap visually. A billed-only chart hides the cash reality. The collected series uses `payments.date_paid` grouped by month.

- **Receivables aging buckets**: A grouped display showing total outstanding across four buckets: Current (not yet due), 1-30 days overdue, 31-60 days, 61-90 days, 90+ days. Computed entirely in JS from existing `invoices.due_date`, `invoices.total`, and `payments.amount` — no DB migration. The color progression (green → yellow → orange → red) is table stakes for any AR aging widget.

- **MoM delta indicators on metric cards**: The four existing metric cards (Billed, Collected, Outstanding, Collection Rate) need a secondary line showing the change vs. the same metric last month. Format: `+12%` in green or `-8%` in red. Requires computing the same metrics for the prior calendar month using data already loaded. No additional queries if the data window is extended.

- **"No data" empty state**: All three new visualizations must have an intentional empty state (not a broken chart) when there are no non-draft invoices in the trailing 12 months.

### Differentiators

- **Aging bucket amounts as click-through**: Each aging bucket should be clickable and drill into the same follow-up table that already exists on the dashboard, filtered to that bucket. Connects the visualization to the action.

- **Trend chart range toggle (6M / 12M)**: Let the user switch between 6-month and 12-month windows on the trend chart. 12 months is default; 6 months is useful for spotting recent seasonality. This is a single prop change to the chart data slice — low cost.

- **Collected-only trend option**: A toggle to flip the trend chart from "billed vs collected" to "collected only" for users who invoice on a project basis and find the billed line misleading when large invoices skew a month. Simple filter on the pre-computed data array.

- **Net profit trend line**: Adding a third series to the trend chart (net profit = collected − expenses per month) gives profitability visibility over time. The expenses table has `date` per record, making this computable. This is medium complexity (grouping expenses by month) but high signal for the target user.

### Anti-features (avoid)

- **Server-side aggregation SQL for trend data**: The current dashboard pattern loads all invoices + payments into memory on the server and computes in JS. For a single-user SaaS with hundreds of invoices, this is fine and keeps the computation co-located with existing dashboard logic. Introducing separate aggregate SQL queries (DATE_TRUNC GROUP BY) adds complexity and drift from the established pattern — only worth it if row counts become a performance problem, which is not the case at this scale.

- **Date range picker on trend chart**: The trend chart's value is its fixed 12-month window — it shows seasonality at a glance. A custom date range picker adds UI complexity and destroys the "quick scan" purpose of the chart. The existing dashboard range selector (30d/90d/12m/all) is sufficient for the metric cards; the trend chart should always show 12 months.

- **Forecasting / projected revenue**: ML-adjacent features are out of scope and would require significantly more data than a new Invios user has. Empty or sparse data makes any forecast meaningless or misleading. This is v3+ territory.

- **Client-level aging detail in the aging widget**: The aging widget answers "how much is overdue and how old?" — not "which client owes it?" The follow-up queue and top-clients table already answer the client question. Combining them creates a dense, confusing widget.

- **Export to PDF/CSV for charts**: Dashboard charts are screen-resident analytics, not reports. The user's accountant does not need a PNG of a bar chart. If export is eventually needed, it belongs in a dedicated reports section, not bolted onto the dashboard charts.

- **Pie chart for aging buckets**: Pie charts encode proportions — aging buckets encode both amount and urgency. A horizontal bar chart (one bar per bucket, amount-labelled, color-coded) is strictly more informative and matches the HighRadius / Orb / Upflow patterns observed in B2B AR tooling.

---

## Data Dependencies (DB query map)

### CSV Import
- **Read**: `clients` filtered by `user_id` for duplicate detection (email exact match, name ilike match)
- **Write**: bulk `INSERT INTO clients` with conflict handling per-row
- **No migration needed**: all import fields (`name`, `company`, `email`, `phone`, `address`, `trn`, `status`) exist on the current `clients` table

### Revenue Trend Chart
- **Source**: existing `invoices` (filtered: `user_id`, `status != 'draft'`) + `payments`
- **Computation**: group by `DATE_TRUNC('month', issue_date)` for billed; group by `DATE_TRUNC('month', date_paid)` for collected
- **Pattern**: can be computed in the same JS pass as existing dashboard logic — no new DB query needed if trailing 12 months data is loaded
- **Risk**: if `limit(200)` applied to invoices query in the perf pass catches old invoices, the 12-month trend may be incomplete — verify the limit doesn't truncate the date range

### Receivables Aging
- **Source**: same invoice + payment rows already loaded for dashboard
- **Computation**: for each non-draft invoice with outstanding > 0, compute `days_overdue = today - due_date`, bucket accordingly
- **No DB changes**: entirely derived from existing data

### MoM Comparison
- **Source**: same invoice + payment dataset
- **Computation**: run `buildDashboardMetrics` twice — once for current month, once for prior month — and diff the four metric values
- **Dependency**: the current data load must include invoices from the prior calendar month. If the user has "30d" range selected, this is guaranteed. For "all" range it is also guaranteed. Verify the "90d" and "12m" ranges include enough history.

---

## Complexity Notes

| Feature | Complexity | Notes |
|---------|------------|-------|
| CSV template download | Low | Static file or dynamic string generation |
| Column auto-mapping | Low | Fuzzy string match on header names |
| Field mapping UI | Medium | Controlled selects, state management per column |
| Row validation | Low-Medium | Zod schema per row, collect errors array |
| Duplicate detection | Medium | Two DB queries (email exact, name ilike) before bulk insert |
| Partial import | Medium | Per-row insert with individual error capture vs. batch |
| Revenue trend chart | Low-Medium | shadcn/ui chart (Recharts) + data grouping by month |
| Aging buckets | Low | Pure JS computation on already-loaded invoice rows |
| MoM delta indicators | Low | Second pass over loaded data for prior month window |

---

## Sources

- [Data import UX: designing spreadsheet imports users don't hate](https://www.importcsv.com/blog/data-import-ux)
- [Designing an attractive and usable data importer for your app — Smashing Magazine](https://www.smashingmagazine.com/2020/12/designing-attractive-usable-data-importer-app/)
- [Best practices for handling large CSV files — Dromo](https://dromo.io/blog/best-practices-handling-large-csv-files)
- [Building a seamless CSV import experience — Flatfile](https://flatfile.com/blog/optimizing-csv-import-experiences-flatfile-portal/)
- [10 advanced CSV import features — OneSchema](https://www.oneschema.co/blog/advanced-csv-import-features)
- [Accounts receivable aging report — HighRadius](https://www.highradius.com/resources/Blog/accounts-receivable-aging-report/)
- [Aging of receivables method for SaaS — Orb](https://www.withorb.com/blog/aging-of-receivables-method)
- [AR metrics and accounts receivables analysis — Upflow](https://upflow.io/blog/ar-metrics/accounts-receivables-analysis)
- [shadcn/ui charts (Recharts v3)](https://ui.shadcn.com/docs/components/radix/chart)
- [Which chart should you use — Metabase](https://www.metabase.com/learn/metabase-basics/querying-and-dashboards/visualization/chart-guide)
- [Accounts receivable aging in Power BI — SQLBI](https://www.sqlbi.com/articles/account-receivable-aging-in-power-bi/)
