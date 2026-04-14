# Research Summary: v1.1 Client Import & Analytics

**Synthesized:** 2026-04-14
**Milestone:** CSV Client Import (Phase 1) + Dashboard Analytics (Phase 2)

---

## Stack Additions

- **`papaparse@5.5.3` + `@types/papaparse@5.5.2`** — the only viable browser-side CSV parser; handles BOM, quoted fields, header auto-detect, and streaming with zero dependencies. Install via `pnpm add papaparse && pnpm add -D @types/papaparse`.
- **`recharts@3.8.1` via `pnpm dlx shadcn@latest add chart`** — preferred install path scaffolds `src/components/ui/chart.tsx` (ChartContainer, ChartTooltip, ChartLegend) which wires the existing HSL CSS token system automatically. React 19 is explicitly in peer range.
- **`next.config.ts` body size config (no new package)** — must add `experimental.proxyClientMaxBodySize: "10mb"` and `serverActions.bodySizeLimit: "5mb"` before writing any upload action; Next.js 15.5.14 has a 1MB proxy limit that silently truncates FormData.

---

## CSV Import — Table Stakes

- **Downloadable CSV template** — highest-ROI deflector of format errors; must reflect the exact column names the auto-mapper expects. Without it, the majority of first-time imports fail before reaching validation.
- **Column auto-mapping + manual override UI** — case-insensitive fuzzy match on upload maps common header variants ("Client Name" → `name`, "E-mail" → `email`); show matched result and allow per-column override via select. Make "Not imported" an explicit option so users know unmapped columns are safe to ignore.
- **Row-level validation with partial import** — validate every row with Zod before any DB write, surface which field failed and why per row, import valid rows and report failed ones separately. Never reject the whole file for one bad email address.
- **Duplicate detection + import summary** — before inserting, check existing clients by email (exact) and name (ilike). Surface the conflict count, let the user choose skip/update/import-as-new. After completion, show exactly how many were imported, skipped, and failed.

---

## Analytics — Table Stakes

- **Monthly revenue trend chart (12 months, billed + collected overlay)** — bar or area chart grouped by `issue_date.substring(0, 7)` for billed and `date_paid.substring(0, 7)` for collected; both series on same axis so the collection gap is visible. All 12 month slots must be explicitly padded to 0 when no data exists — missing months produce silent chart gaps.
- **Receivables aging buckets** — four buckets (Current, 1-30d, 31-60d, 61-90d, 90+d) using outstanding amount (not invoice total) from the already-computed `DashboardInvoiceRow.outstandingAmount`. Color-coded green to red. Excludes paid invoices entirely.
- **MoM delta indicators on metric cards** — run `buildDashboardMetrics` twice (current month, prior month) over already-loaded data; display `+12%` / `-8%` on each metric card. Requires a single stable `today: string` parameter passed through both computations.
- **Empty state for all three visualizations** — intentional designed state when no non-draft invoices exist in the trailing 12 months; a broken/empty chart is not acceptable.

---

## Architecture Decisions

- **Parse client-side, write server-side** — PapaParse runs in a `"use client"` component: `FileReader` → parse → column mapping UI → Zod row validation → user confirms → Server Action receives a clean validated array for batch DB insert only. The action never touches raw CSV bytes.
- **Single batch INSERT, not row-by-row** — pass the full validated-rows array to Supabase `.insert([...rows])` in one call. Slug generation must fetch all existing slugs once, then accumulate generated slugs in a running `Set` during the loop — no per-row DB reads.
- **Non-async helpers in `src/lib/`, not in actions files** — `"use server"` files may only export async functions. CSV schemas, type guards, field mapping constants, and Zod schemas belong in `src/lib/csv-import.ts` (or similar), matching the existing pattern where `clientFormSchema` lives in `src/lib/billing.ts`.
- **Chart components via `next/dynamic` with `ssr: false`** — Recharts uses `ResizeObserver`/DOM internally; SSR renders at 0x0 causing hydration mismatch. Dynamic import with a skeleton `loading` prop solves both the hydration and bundle-split problems simultaneously.
- **Data fetching stays in Server Components** — keep aggregation logic in `src/lib/dashboard.ts`, pass pre-computed `{ month: string; billed: number; collected: number }[]` as serializable props to thin `"use client"` chart wrappers. Never fetch inside the chart component.
- **`today` string threaded through all analytics** — all date computations (MoM, aging, range) must receive `today: string` as a parameter; never call `new Date()` inside analytics helpers. The existing `dashboard.ts` already enforces this — do not break the convention for new analytics functions.

---

## Critical Pitfalls (must address in planning)

- **Next.js 15.5.14 proxy truncates FormData over 1MB** — configure `proxyClientMaxBodySize` and `serverActions.bodySizeLimit` in `next.config.ts` as the very first action of Phase 1, before any upload code is written. Silent data corruption is the failure mode, not a thrown error.
- **Slug N+1 or collision in batch import** — fetch all existing client slugs once pre-loop; maintain a running accumulated `Set` of newly generated slugs within the loop; pass the full combined set to `buildUniqueSlug` for every row. Skipping the accumulation produces identical slugs for same-name clients, causing a unique constraint error on the second insert.
- **Upsert RLS requires both INSERT and UPDATE policies** — avoid Supabase upsert for duplicate handling; use application-level diff (select existing emails, diff against CSV, insert only new rows). Upsert silently fails with 403 when only one RLS policy covers the operation.
- **Vercel Hobby 10-second Server Action timeout** — the batch insert must be a single Supabase call, not a loop of individual inserts. At 200 rows with sequential inserts and slug lookups, the action will time out. One slug SELECT + one batch INSERT stays well under 2 seconds.
- **Recharts bundle impact on dashboard first load** — the dashboard already carries GSAP and DnD Kit. Recharts adds ~150KB gzipped if imported directly. Use `next/dynamic` with `ssr: false` so chart JS is excluded from the initial bundle and loaded only when the analytics section renders.
- **Aging buckets must use `outstandingAmount`, not invoice total** — partial-paid invoices have a computed outstanding that differs from their total. Using the raw total double-counts partial payments and inflates aging figures. The value already exists on `DashboardInvoiceRow` — reuse it rather than re-querying invoices raw.

---

## Build Order

1. **Add `next.config.ts` body size config** — prerequisite for any upload action; do this before any other Phase 1 code.
2. **Install `papaparse` + types** — add the dependency before building the import component.
3. **Build CSV template download** — static file or string generation; low complexity; defines the canonical field list that the rest of the feature depends on.
4. **Build client-side parse + column mapping UI** — `"use client"` component: file input → PapaParse → mapping selects → preview table. FileReader abort cleanup on unmount.
5. **Build row validation layer** — Zod schema per row in `src/lib/`; collect per-row errors; determine valid vs failed sets.
6. **Build duplicate detection + batch import Server Action** — one slug SELECT, one email SELECT, in-memory diff, single batch INSERT. Return structured result (imported/skipped/failed counts).
7. **Build import result summary + failed-row CSV download** — close the import flow with clear feedback; provide the failed-rows download link.
8. **Install recharts via `pnpm dlx shadcn@latest add chart`** — installs dependency and scaffolds the chart wrapper component.
9. **Extend `dashboard.ts` with chart data builder** — add `buildRevenueTrendSeries()` (12-month padded array, billed + collected) and `buildAgingBuckets()` reusing `outstandingAmount`; thread `today` through both functions.
10. **Add MoM delta computation** — second pass over loaded data for prior month window; add delta fields to existing metric card data shape.
11. **Build chart components with `next/dynamic`** — thin `"use client"` wrappers for trend chart and aging display; skeleton loading states; explicit container height for `ChartContainer`.
12. **Wire analytics section into dashboard page** — integrate all three visualizations with empty states; run visual QA on empty, sparse, and full-data user states.
