# Performance & Speed Audit — Invios

**Scope:** Database (Supabase Postgres), data-access layer, rendering/caching strategy, middleware, serverless functions, and asset delivery.
**Date:** 2026-06-22 · **Branch reviewed:** `main` @ `b1d6eaa` · **Reviewer:** automated deep audit
**Status:** Analysis only — **no code or infrastructure changes were made.**

Current scale is tiny (52 users, 46 invoices, 86 clients), so **nothing is slow today**. This audit is about (a) inefficiencies that already cost latency/money on every request and (b) what will break first as data grows. Severities reflect impact-at-scale + current waste.

| Severity | Count | Headline |
|---|---|---|
| 🟠 Medium | 4 | RLS re-evaluates `auth.uid()` per row (40+ policies) · 8 unindexed FKs · `force-dynamic` + 60s polling everywhere · `getUser()` network call on every request |
| 🟡 Low | 5 | Dashboard loads all rows + aggregates in JS · 200-row fetch then JS search · Chromium boot per PDF (no cache) · Region mismatch (functions vs DB) · `next/image` remote optimization |

---

## 🟠 Medium

### S1 — RLS policies re-evaluate `auth.uid()` for every row (40+ policies)
Supabase performance advisor `0003 auth_rls_initplan` flags **40+ policies** across `profiles, branding, user_settings, clients, invoices, quotations, payments, expenses, invoice_versions, recurring_schedules, reminder_logs, document_counters, document_slug_aliases, subscriptions`. Each uses `auth.uid() = user_id` directly, so Postgres re-runs the auth function **per row** instead of once per query.
**Impact:** Sub-linear today, but on any owner with thousands of invoices/payments every scan pays the function-call tax repeatedly. This is the single biggest DB-side scalability item.
**Fix pattern:** wrap the call so it's evaluated once: `... USING ((select auth.uid()) = user_id)`.
Remediation: https://supabase.com/docs/guides/database/postgres/row-level-security#call-functions-with-select

### S2 — Eight foreign keys have no covering index
Advisor `0001 unindexed_foreign_keys`:
`document_slug_aliases.user_id`, `expenses.user_id`, `invoice_versions.user_id`, `payments.user_id`, `quotations.converted_to_invoice_id`, `recurring_schedules.source_invoice_id`, `recurring_schedules.user_id`, `reminder_logs.user_id`.
**Impact:** The hottest queries filter exactly on these columns — e.g. `payments.eq(user_id)` and `.eq(invoice_id)` in the dashboard and CSV export (`src/lib/billing-data.ts:706`, `src/app/api/export/invoices/route.ts:27`), and `reminder_logs`/`recurring_schedules` scans in the crons. Without indexes these become sequential scans as tables grow, and FK-cascade checks on delete get slow.
**Fix:** add btree indexes on each FK column (and the `(invoice_id)` lookups). Remediation: https://supabase.com/docs/guides/database/database-linter?lint=0001_unindexed_foreign_keys

### S3 — Nothing is cached: `force-dynamic` + a 60-second client poll on the dashboard
- Public pages (`/`, `/pricing`, `/terms`, `/privacy`, `/refund`) and `/app` use `export const dynamic = "force-dynamic"` (per commits `5c2847f`, `e21f94b`), setting `Cache-Control: private, no-store`. Every hit is fully server-rendered + DB-queried.
- `DashboardRefresher` calls `router.refresh()` **every 60s** for each open tab (commit `e21f94b`), re-running the entire dashboard server fetch continuously.

**Impact:** Constant Vercel function invocations and Supabase queries even when nothing changes — latency on every navigation and a recurring cost floor that scales with open tabs, not value. The marketing pages especially have no reason to be `no-store`.
**Fix:** Cache the static marketing pages (they're auth-aware only via nav — use a small client/edge check or `revalidate` + per-segment dynamic nav rather than blanket `force-dynamic`). Replace the 60s poll with on-focus revalidation or Supabase Realtime so refreshes happen on actual change.

### S4 — `supabase.auth.getUser()` runs on (almost) every request in middleware
The middleware matcher covers all routes except static assets, and it calls `await supabase.auth.getUser()` on each (`src/lib/supabase/middleware.ts:112`). `getUser()` validates the JWT **against the Supabase Auth server**, i.e. a network round-trip per navigation. Premium API routes add a **second** round-trip via `checkPaidSubscription` (an un-pooled admin query, `middleware.ts:60`).
**Impact:** Every page load and asset-adjacent request inherits Auth-server latency; the eu-north-1 ↔ function-region hop (S8) compounds it.
**Fix:** Where a verified session isn't strictly required, prefer `getClaims()`/local JWT verification; cache the subscription check (short TTL / cookie claim) instead of a DB hit per premium request.

---

## 🟡 Low

### S5 — Dashboard loads the full dataset and aggregates in JavaScript
`getDashboardDataset` fetches **all** invoices, payments, expenses, and quotations for the user — each with the full `invoiceSelect`/`quotationSelect` join on `clients` — then sorts and computes metrics/insights in JS (`src/lib/billing-data.ts:699-765`). No pagination, no SQL aggregation.
**Impact:** Memory + transfer grow linearly with account history; the joins pull client rows repeatedly. Fine at 46 invoices, painful at 10k.
**Fix:** Push aggregation into SQL (views / `rpc` returning metrics), select only needed columns, and paginate drill-downs. `(select auth.uid())` RLS (S1) helps here too.

### S6 — List endpoints fetch 200 rows then filter search client-side
`listInvoices`/`listQuotations` pull up to 200 rows and run substring search in JS (`billing-data.ts:342-355,427-441`); `listClients` caps at 200 with a DB `ilike` (better). Search misses rows beyond 200 and transfers more than needed.
**Fix:** Do search/pagination in Postgres (`ilike`/`pg_trgm`), return only the page.

### S7 — Each PDF/PNG boots headless Chromium; results are never cached
`/api/invoices/[id]/pdf` (and PNG/quotation variants) launch `@sparticuz/chromium` + `playwright-core` to render the public print page on **every** request (`src/app/api/invoices/[id]/pdf/route.ts`, `maxDuration = 60`). The `invoices.pdf_url` column exists but the route ignores it and always regenerates.
**Impact:** Multi-second cold starts, high function cost/memory, and a cheap DoS/cost vector (see Security M6). 
**Fix:** Cache rendered PDFs (store to Supabase Storage, reuse via `pdf_url`, invalidate on document edit); reuse a warm browser where possible; add rate limiting.

### S8 — Compute/region mismatch likely adds a transatlantic hop per query
Supabase is in **eu-north-1**. Vercel functions default to **us-east** (iad1) unless pinned, and `vercel.json` sets no `regions`. Every DB query (and the per-request `getUser()`/subscription checks) may cross the Atlantic.
**Impact:** Tens of ms added to *each* query; multiplied by the several sequential queries per page (S4/S5) it's real.
**Fix:** Pin Vercel functions to an EU region (`fra1`/`arn1`) near the DB, or move the DB — and use Supabase connection pooling for serverless.

### S9 — Remote image optimization unconfigured
Tenant logos render via `next/image` from Supabase signed URLs with no `images.remotePatterns` (`next.config.ts`). Beyond the correctness risk (Functionality L4), if it does work it's likely re-fetching/optimizing short-TTL signed URLs repeatedly.
**Fix:** Configure `remotePatterns` (or `unoptimized`) and cache logo URLs for the render window.

---

## Quick wins vs. structural work

**Quick wins (low effort, immediate):**
- S2 — add the 8 FK indexes (one migration).
- S1 — rewrite RLS predicates to `(select auth.uid())` (one migration; large but mechanical).
- S3 — drop `force-dynamic` on the static marketing pages; soften the 60s poll.
- S8 — pin functions to an EU region + enable pooling.

**Structural (plan it):**
- S5/S6 — move aggregation/search/pagination into Postgres.
- S7 — PDF caching pipeline + warm browser + rate limit.
- S4 — local JWT verification + cached entitlement instead of network calls per request.

## What's missing / what to add
- **No bundle/route size budget or Lighthouse/Web-Vitals tracking** — there's no measurement, so regressions are invisible. Add Vercel Speed Insights / a Lighthouse CI step.
- **No Supabase connection pooling note** for serverless (each function instance opening connections is a known scaling cliff).
- **No CDN caching strategy** for the genuinely-static surfaces.
- **No DB query observability** (`pg_stat_statements` is installed — use it to confirm the hot queries above before/after the index + RLS changes).
