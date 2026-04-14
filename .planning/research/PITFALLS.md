# Pitfalls Research: v1.1 Client Import & Analytics

**Project:** Invios v1.1  
**Researched:** 2026-04-14  
**Confidence:** HIGH (verified against official Next.js docs, Supabase docs, and known codebase patterns)

---

## CSV Import Pitfalls

### 1. Server Action 1MB Body Limit Silently Truncates CSV Files

**Risk:** Next.js 15.5+ (this project is on 15.5.14) introduced an internal proxy layer with its own body size limit defaulting to 1MB, separate from `serverActions.bodySizeLimit`. A CSV with 500+ clients could easily exceed 1MB. The proxy truncates the binary FormData silently before the Server Action receives it — no error thrown, just corrupt or empty data on the action side. The existing `next.config.ts` has no body size configuration.

**Prevention:** Set both limits in `next.config.ts` before writing any upload Server Action:
```ts
const nextConfig: NextConfig = {
  typedRoutes: true,
  experimental: {
    proxyClientMaxBodySize: "10mb",
  },
  serverActions: {
    bodySizeLimit: "5mb",
  },
};
```
`proxyClientMaxBodySize` must be >= `serverActions.bodySizeLimit` or the proxy truncates regardless.

**Phase:** Phase 1 — configure before writing the upload action, not after debugging data loss.

---

### 2. N+1 Slug Generation for Batch Inserts

**Risk:** The existing `createClientAction` calls `getExistingClientSlugs()` (one DB round-trip) then `buildUniqueSlug()` per client. For a batch import this pattern must fetch all existing slugs once upfront and pass the full set to `buildUniqueSlug` for every row sequentially, accumulating generated slugs in memory. If you fetch slugs per-row (N round-trips) a 100-row import becomes 100 SELECT queries. If you fetch once but don't accumulate generated slugs in the loop, two rows with identical names will collide and produce the same slug — Supabase will throw a unique constraint error on the second insert.

**Prevention:** Fetch all existing slugs once. Maintain a running `Set` that grows as each slug is generated during the loop iteration. Pass the full in-memory set to `buildUniqueSlug` for every subsequent row. `buildUniqueSlug` already accepts `takenSlugs: string[]` — just ensure the accumulated slugs are included each iteration.

**Phase:** Phase 1 — must be in the core batch insert logic from the start.

---

### 3. Upsert RLS Requires Both INSERT and UPDATE Policies

**Risk:** Duplicate detection for CSV import may use Supabase upsert (`insert ... on conflict do update`) to avoid re-importing existing clients matched by email. Supabase RLS evaluates INSERT policy first, even when the row already exists and the operation will resolve as an UPDATE via conflict. If the INSERT policy passes but there's no UPDATE policy (or vice versa), the upsert fails with a 403. The existing clients table uses `user_id` RLS — verify both INSERT and UPDATE policies are present before using upsert.

**Prevention:** Use explicit duplicate detection in application code instead of upsert: select existing emails for the user, diff against CSV rows, insert only new rows. This is more predictable, avoids RLS interaction complexity, and gives the user a clear "X already exist, Y will be imported" preview. If upsert is used, confirm both INSERT and UPDATE RLS policies exist on the `clients` table.

**Phase:** Phase 1 — decide the duplicate strategy before writing the action; do not discover this in production.

---

### 4. CSV Parsing Must Happen Client-Side Before FormData Submission

**Risk:** PapaParse and native `FileReader` are browser-only APIs. If parsing is attempted in a Server Action (e.g., receiving a raw `File` from FormData and calling PapaParse inside the action), it fails. Conversely, if a Server Component receives a CSV file upload, the parsing cannot happen there either. The correct boundary: parse in a `"use client"` component, validate rows in-component with Zod, then POST validated rows (as JSON or structured FormData) to the Server Action.

**Prevention:** Keep the multi-step flow entirely client-side until the final confirmed import: `FileReader` → PapaParse → column mapping UI → row validation → user confirms → `"use server"` action receives clean validated array. The `"use server"` action only handles DB inserts, not parsing.

**Phase:** Phase 1 — architectural decision that shapes the component tree.

---

### 5. Vercel Hobby Plan 10-Second Server Action Timeout

**Risk:** Server Actions on Vercel Hobby are limited to 10 seconds. A 200-row batch import doing sequential slug lookups or individual inserts will exceed this. The project is deployed to Vercel (invios.online) and the plan tier is not confirmed as Pro.

**Prevention:** Use a single batch Supabase insert (pass an array to `.insert([...rows])`) rather than sequential individual inserts. Slug generation runs entirely in memory (no per-row DB calls after the initial full fetch). With one slug SELECT + one batch INSERT, a 200-row import should complete in under 2 seconds. If larger imports are required later, chunk at 100 rows and return partial-success state.

**Phase:** Phase 1 — design the action to be batch-first, not row-iteration-first.

---

### 6. "use server" Files Cannot Export Non-Async Helpers

**Risk:** The existing actions pattern (e.g., `src/actions/clients.ts`) places `"use server"` at the file level. If CSV-specific helper functions (e.g., a Zod schema object, a type guard, a constants map for field mapping) are placed in the same file, Next.js throws at build time: `A "use server" file can only export async functions`. This is a known Next.js constraint that has burned the project before (mentioned in project history).

**Prevention:** Put all CSV validation schemas, type definitions, and non-async helpers in `src/lib/` (no `"use server"`). Only the batch import action itself goes in an actions file. This matches the existing pattern where `clientFormSchema` lives in `src/lib/billing.ts`, not in `src/actions/clients.ts`.

**Phase:** Phase 1 — follow the existing pattern, do not co-locate non-async exports with server actions.

---

### 7. FileReader Memory Leak on Unmount Without Abort

**Risk:** If the import dialog is dismissed mid-parse (user closes modal, navigates away), an in-flight `FileReader` callback fires against unmounted component state. In React 19 this can trigger "Can't perform a React state update on an unmounted component" warnings. For large CSVs being chunked, multiple readers may be left alive.

**Prevention:** Store the `FileReader` instance in a `useRef`. In the `useEffect` cleanup (or on dialog close), call `fileReader.abort()`. Use a single reader per parse operation, not one per chunk.

**Phase:** Phase 1 — add cleanup when building the upload component.

---

## Analytics Charting Pitfalls

### 1. Recharts Is Not in the Bundle Yet — Bundle Size Impact

**Risk:** Recharts is not currently a dependency (confirmed from `package.json`). The full Recharts barrel import (`import { BarChart, LineChart } from "recharts"`) pulls the entire library (~150KB gzipped). For a dashboard page that already has GSAP and DnD Kit, this is a significant first-load JS addition that degrades the dashboard paint time.

**Prevention:** Import only specific chart components using subpath imports where Recharts supports it, or use `next/dynamic` with `ssr: false` to lazy-load the chart wrapper component. Since charts render zero meaningful content server-side (they require browser dimensions), dynamic import with `ssr: false` is legitimate here and also solves the hydration problem simultaneously. Define a skeleton placeholder as the `loading` prop.

**Phase:** Phase 2 — set the import pattern correctly when adding the dependency.

---

### 2. ResponsiveContainer Renders at 0x0 on Server, Causes Hydration Mismatch

**Risk:** `ResponsiveContainer` uses `ResizeObserver` internally to detect parent dimensions. On the server there is no DOM, so width and height resolve to 0 or -1. When the client hydrates, the dimensions change immediately, causing a mismatch. Recharts logs: "The width(-1) and height(-1) of chart should be greater than 0". In `"use client"` components with SSR enabled (which is the default even with `"use client"`), this produces a visible flash and console error.

**Prevention:** Wrap all Recharts chart components in `next/dynamic` with `ssr: false`, or provide explicit fallback dimensions via `initialWidth`/`initialHeight` props (available in Recharts 2.x+). The dynamic import approach is cleaner and also ensures the chart JS is not in the initial bundle.

**Phase:** Phase 2 — apply this pattern when first adding any chart component.

---

### 3. "use client" Propagation — Data Fetching Gets Pulled into the Client Bundle

**Risk:** Recharts requires `"use client"`. A common mistake is placing data fetching logic (Supabase queries, date aggregation) inside the same component that renders the chart. This drags all data logic into the client bundle and requires either prop drilling from a Server Component parent or client-side fetching with loading states. The project's existing pattern is: Server Component fetches, passes serializable data to Client Component. Breaking this for charts defeats the RSC model.

**Prevention:** Keep data fetching in a Server Component (or in `src/lib/dashboard.ts` called from a Server Component). Pass pre-computed chart data (`{ month: string; billed: number; collected: number }[]`) as a serializable prop to a thin `"use client"` chart wrapper. The chart component should only render, not fetch.

**Phase:** Phase 2 — enforce the data/render boundary from the start.

---

### 4. Monthly Revenue Aggregation Timezone Drift

**Risk:** Supabase stores timestamps in UTC by default. If invoices are created at e.g. 22:00 GST (UTC+4), they are stored as 18:00 UTC of the same day. A `date_trunc('month', issue_date)` grouping in Postgres (or string-slicing `issue_date.substring(0, 7)` in JS) on UTC timestamps will assign that invoice to the wrong calendar month from the user's perspective. A UAE user creating invoices in November after 20:00 GST will see them grouped into October on the chart.

**Prevention:** The existing `dashboard.ts` already slices dates using `toDateOnly()` (string match on `YYYY-MM-DD`). The `issue_date` column stores `DATE` type (not `TIMESTAMPTZ`), which avoids the UTC offset problem. Confirm the chart aggregation uses the same string-based month extraction (`issue_date.substring(0, 7)`) rather than JS `Date` object month parsing (which applies local timezone). If data is fetched from Supabase as ISO strings, aggregate in JS via `row.issue_date.substring(0, 7)` — do not construct `new Date(row.issue_date).getMonth()`.

**Phase:** Phase 2 — validate against the actual column type before writing aggregation logic.

---

### 5. Chart Data for Empty Months Must Be Explicitly Padded

**Risk:** If there are no invoices in a given month, Supabase returns no row for that month. A chart expecting 12 data points for the trailing 12 months will silently receive fewer points. Recharts renders whatever data it receives — missing months mean gaps in the line/bar chart with no warning. A new user with 2 months of data sees a 2-bar chart labeled only with those 2 months.

**Prevention:** In the data-building layer (`src/lib/dashboard.ts`), generate all 12 month labels from `today` going back 12 months, then merge actual invoice data by month key, defaulting missing months to `{ billed: 0, collected: 0 }`. This is a pure JS array operation; no DB changes required. This is the same pattern as `buildRangeStart` already in `dashboard.ts` — extend it for chart series.

**Phase:** Phase 2 — must be in the initial chart data builder, not added after seeing broken charts.

---

### 6. Recharts CustomTooltip TypeScript Typing Is Fragile

**Risk:** Recharts v2 types for `TooltipProps` require importing from both `recharts` and `recharts/types/component/DefaultTooltipContent`. The generic signature `TooltipProps<ValueType, NameType>` is easy to get wrong, and incorrect payload destructuring (accessing `payload[0].value` without null-checking) causes runtime errors when the user hovers over an empty chart area. Recharts v3 changed the tooltip formatter API, removing some v2 patterns.

**Prevention:** Type the custom tooltip as `(props: TooltipProps<number, string>) => ReactElement | null`. Always null-check `props.active && props.payload && props.payload.length > 0` before accessing payload values. Check which Recharts major version is installed before writing tooltip code — the installed version will be v2.x or v3.x and the API differs.

**Phase:** Phase 2 — write the tooltip type-safely from the start, do not coerce with `any`.

---

### 7. Receivables Aging Computed in JS Must Use Outstanding Amount, Not Invoice Total

**Risk:** Aging buckets (0-30, 31-60, 61-90, 90+ days overdue) are based on `due_date` minus today for unpaid/partial-paid invoices. The existing `dashboard.ts` already computes `outstandingAmount` per invoice using payment records. A naive aging calculation that reads only `due_date` and ignores `partial_paid` invoices will double-count partially paid invoices as fully overdue. Similarly, "paid" invoices must be excluded entirely — a 90+ day paid invoice is not in the receivables aging report.

**Prevention:** Apply aging buckets only to invoices where `status` is `sent`, `overdue`, or `partial_paid`. Use the already-computed `outstandingAmount` (from `DashboardInvoiceRow`) as the aging bucket value, not the full invoice amount. This reuses `buildDashboardInvoiceRows` output rather than querying invoices raw.

**Phase:** Phase 2 — the aging computation must reuse existing financial row builders, not bypass them.

---

### 8. Period-Over-Period Comparison Requires a Stable "Today" Reference

**Risk:** MoM change indicators require comparing the current period vs the previous period. If "today" is computed twice (once for current period, once for previous), and a test or cron runs across midnight, the periods drift. The existing `dashboard.ts` pattern already accepts `today: string` as a parameter to avoid this — the analytics computation must follow the same convention.

**Prevention:** Pass a single `today` string (ISO date, e.g. `"2026-04-14"`) through all analytics computations, both current and prior period. Never call `new Date()` inside analytics helper functions. This matches the existing `isDateInDashboardRange` and `buildRangeStart` signatures already in `dashboard.ts`.

**Phase:** Phase 2 — the existing pattern already enforces this; do not break it for new analytics functions.

---

## Phase-Specific Warning Summary

| Phase | Topic | Likely Pitfall | Mitigation |
|-------|-------|---------------|------------|
| Phase 1 | CSV upload action | 1MB proxy truncation (Next.js 15.5.14) | Add both body size configs to `next.config.ts` first |
| Phase 1 | Batch slug generation | N+1 queries or slug collision | Fetch all slugs once, accumulate in loop |
| Phase 1 | Duplicate detection | Upsert RLS INSERT+UPDATE both required | Use app-level diff; avoid upsert |
| Phase 1 | CSV parsing location | PapaParse browser-only | Parse client-side only, action receives validated array |
| Phase 1 | Import action timeout | Vercel 10s Hobby limit | Single batch INSERT, not row-by-row |
| Phase 1 | Server action helpers | `"use server"` only exports async functions | Keep helpers in `src/lib/`, not in actions file |
| Phase 2 | Chart bundle size | Recharts ~150KB first load | `next/dynamic` with `ssr: false`, lazy load |
| Phase 2 | ResponsiveContainer | 0x0 SSR dimensions, hydration mismatch | `ssr: false` dynamic import |
| Phase 2 | Chart data fetching | Data logic pulled into client bundle | Fetch in Server Component, pass serializable props |
| Phase 2 | Month grouping | UTC offset shifts months for UAE users | Use `issue_date.substring(0, 7)`, not `new Date()` |
| Phase 2 | Empty months | Missing months produce chart gaps | Pad all 12 months with 0 values in JS |
| Phase 2 | Aging buckets | Full invoice amount used instead of outstanding | Use `outstandingAmount` from existing row builder |

## Sources

- [Next.js serverActions bodySizeLimit config](https://nextjs.org/docs/app/api-reference/config/next-config-js/serverActions)
- [Next.js proxyClientMaxBodySize config](https://nextjs.org/docs/app/api-reference/config/next-config-js/proxyClientMaxBodySize)
- [Next.js 15.5 FormData drops binary data — vercel/next.js Discussion #86985](https://github.com/vercel/next.js/discussions/86985)
- [Server Action Body Size Limit does not apply in production — vercel/next.js Discussion #77505](https://github.com/vercel/next.js/discussions/77505)
- [Supabase upsert RLS: INSERT policy required even on conflict — Discussion #28122](https://github.com/orgs/supabase/discussions/28122)
- [Recharts ResponsiveContainer SSR/Next.js App Router — app-generator.dev guide](https://app-generator.dev/docs/technologies/nextjs/integrate-recharts.html)
- [Server Action timeout vs Route Handler — vercel/next.js Discussion #64437](https://github.com/vercel/next.js/discussions/64437)
- [A "use server" file can only export async functions — vercel/next.js Issue #62926](https://github.com/vercel/next.js/issues/62926)
- [Supabase date_trunc timezone — Operating in User's time zone Discussion #14084](https://github.com/orgs/supabase/discussions/14084)
- [Recharts CustomTooltip TypeScript typing — recharts Discussion #3677](https://github.com/recharts/recharts/discussions/3677)
