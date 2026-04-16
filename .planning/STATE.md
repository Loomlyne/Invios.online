---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
status: verifying
stopped_at: "Completed 07-02-PLAN.md — awaiting checkpoint:human-verify at https://invios.online/app"
last_updated: "2026-04-16T22:06:25.969Z"
last_activity: 2026-04-16
progress:
  total_phases: 2
  completed_phases: 2
  total_plans: 5
  completed_plans: 5
  percent: 100
---

# STATE

## Project Reference

See: .planning/PROJECT.md (updated 2026-04-14)

**Core value:** Make it dead simple for a service business to send a polished branded quote or invoice and reliably know what has been paid, what is still due, and what profit remains.
**Current focus:** Phase 7 — analytics-dashboard

## Current Position

Phase: 7 (analytics-dashboard) — EXECUTING
Plan: 2 of 2
Status: Phase complete — ready for verification
Last activity: 2026-04-16
Stopped at: Completed 07-02-PLAN.md — awaiting checkpoint:human-verify at https://invios.online/app

```
Progress: [███████░░░] 67% — 2/3 plans complete in Phase 06
```

## Current Status

- ✅ v1.0 MVP shipped 2026-04-14 — archived in .planning/milestones/
- ✅ v1.1 roadmap created — Phases 6 and 7 defined
- Phase 6 (CSV Client Import) ready to plan: CLNT-05
- Phase 7 (Analytics Dashboard) ready to plan: DASH-05, DASH-06, DASH-07
- Next: `/gsd:plan-phase 6`

## Key Decisions (carry-forward from v1.0)

- **use-server rule**: Only async functions may be exported from `"use server"` files
- **Admin client for new tables**: Cast to `any` until types are regenerated via `supabase gen types`
- **UTC date arithmetic**: `T00:00:00Z` + `setUTCDate`/`setUTCMonth` for cron date math
- **git push**: Must be user-initiated — always hangs in Claude's shell
- **Supabase migration drift**: Resolve with `supabase migration repair` before `db push`
- **Vitest module isolation**: Static imports + `vi.mock()` hoisting, not `await import()`
- **`printf '%s'` for Vercel env vars**: `echo` adds trailing newline that breaks HTTP header validation

## Key Decisions (v1.1 additions)

- **Next.js body size config first**: `proxyClientMaxBodySize` + `serverActions.bodySizeLimit` must be set in `next.config.ts` before any upload action is written — Next.js 15 silently truncates FormData over 1MB
- **CSV parsed client-side**: PapaParse runs in `"use client"` components; Server Action receives only a clean validated array, never raw CSV bytes
- **Batch insert, not row-by-row**: Single `supabase.insert([...rows])` call; slug dedup via one pre-fetch + accumulated running Set across the loop
- **Cap at 200 rows**: Enforced before Server Action to stay well under Vercel Hobby 10-second limit
- **Application-level duplicate detection**: Fetch existing emails, diff in memory, insert only new rows — avoid Supabase upsert which silently fails when RLS covers only one operation
- **Chart components via `next/dynamic` with `ssr: false`**: Recharts uses ResizeObserver/DOM internally; prevents hydration mismatch and excludes ~150KB from initial bundle
- **Month grouping by substring**: Use `issue_date.substring(0, 7)` for month grouping — never `new Date(issue_date)` which drifts by timezone
- **`today` string threaded through analytics**: All date computations receive `today: string` as parameter; never call `new Date()` inside analytics helpers
- **Aging uses `outstandingAmount`**: Use `DashboardInvoiceRow.outstandingAmount` (not invoice total) to correctly account for partial payments
- **MoM delta returns null on zero prior**: When prior period value is zero, return null rather than 0% to avoid division-by-zero display errors
- **recharts installed via shadcn**: `pnpm dlx shadcn@latest add chart` — not a direct recharts install; scaffolds `src/components/ui/chart.tsx` wired to existing HSL tokens

## Performance Metrics

- v1.0: 5 phases, 28 plans, 168 commits, ~22,900 LOC TypeScript, 9 days
- 06-01: 3 tasks, 4 files, 12 min — CSV data layer (csv-import.ts, importClientsAction, body size config)
- 06-02: 2 tasks, 4 files, 13 min — Unit tests (16 passing) + wizard shell + StepUpload + StepMap
- 07-01: 2 tasks, 4 files, 37 min — shadcn chart scaffold + buildRevenueTrend/buildAgingBuckets/buildMomDeltas + 19 unit tests

## Key Decisions (07 additions)

- **buildRevenueTrend uses raw PaymentRecord[]**: Receives payments array directly for per-calendar-month collected totals — collectedInRangeAmount is range-filtered, not calendar-month accurate
- **buildMomDeltas null on all/zero**: Returns null for all fields when range is 'all'; null per-metric when prior period value is zero (avoids division-by-zero)
- **collectionRate MoM is pp-difference**: Percentage-point difference (current% minus prior%), not percent-of-percent — per D-09
- **shadcn overwrites card.tsx**: Running `pnpm dlx shadcn@latest add chart` also overwrites existing card.tsx — always revert after scaffold

## Accumulated Context

### Blockers

None

### Todos

- [ ] `/gsd:plan-phase 6` — CSV Client Import
- [ ] `/gsd:plan-phase 7` — Analytics Dashboard
