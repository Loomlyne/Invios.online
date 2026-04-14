---
phase: 04
plan: 06
type: summary
wave: 4
completed_at: "2026-04-12T04:15:00.000Z"
tasks_completed: 1
---

# Phase 4 Plan 06 — Supabase Migration + Production Deploy

## Objective ✓ Complete

Apply Phase 4 Supabase migration, fix all test failures, and deploy to Vercel production.

## Tasks Completed

### Task 1: Test suite, migration, and production deploy ✓

#### Test Fixes (pre-existing failures resolved)

**src/actions/invoices.test.ts**
- Updated `invoiceStatuses` test: "contains the five expected statuses" → "contains the six expected statuses"
- Added `"overpaid"` to the expected array (added in Phase 3 but test not updated)

**src/actions/clients.test.ts**
- Updated `clientStatuses` test: was asserting `["lead", "active"]`, updated to all 6: `["lead", "in_review", "approved", "active", "rejected", "canceled"]`

**src/lib/billing.ts**
- Added `.trim()` to `paymentFormSchema` description field — tests expected trimming, schema didn't do it

**src/components/status-badges.test.ts**
- Added `import React from "react"` — test calls React components as plain functions; requires React in scope in Vitest test environment

**src/components/clients/client-status-badge.tsx**
**src/components/documents/document-status-badge.tsx**
- Added `import React from "react"` to both — JSX compilation requires React in scope when components called directly as functions in tests

**src/lib/billing-data.test.ts**
- Root cause: `billing-data.ts` imports `createSupabaseServerClient` from `server.ts`, which imports `cookies` from `next/headers`. Dynamic imports (`await import(...)`) caused the module chain to resolve with unmocked server dependencies, hanging on Next.js async APIs outside of request context
- Fix: Added `vi.mock("@/lib/supabase/server", ...)` to mock the server module path
- Changed dynamic `await import(...)` inside each test to static top-level imports (more reliable — dynamic imports don't actually isolate module state in Vitest without `vi.resetModules()`)

**Test result: 119/119 passing ✓**

#### Supabase Migration

Applied via MCP (Supabase CLI pooler circuit-breaker was open from failed npx auth attempts):

```sql
create table public.document_slug_aliases (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('invoice', 'quotation')),
  old_slug text not null,
  document_id uuid not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create index idx_slug_aliases_lookup on public.document_slug_aliases (kind, old_slug);
-- + RLS policies for select and insert
```

Verified: `document_slug_aliases` table live with 6 columns ✓

#### Vercel Production Deploy

- Command: `vercel --prod`
- Build: ✓ compiled in 13.2s
- 28 routes built (static + dynamic)
- Deployment URL: `https://invios-phase1-koss-n5mxmngmd-koussays.vercel.app`
- Aliased to: `https://www.invios.online`
- Status: READY

## Acceptance Criteria Met

- ✓ `pnpm test` — 119/119 passing
- ✓ `pnpm typecheck` — no type errors
- ✓ `document_slug_aliases` table exists in production Supabase (6 cols, RLS enabled)
- ✓ Vercel deployment succeeded and aliased to invios.online

## Files Modified

1. src/actions/invoices.test.ts — updated invoiceStatuses assertion
2. src/actions/clients.test.ts — updated clientStatuses assertion
3. src/lib/billing.ts — added .trim() to paymentFormSchema description
4. src/components/status-badges.test.ts — added React import
5. src/components/clients/client-status-badge.tsx — added React import
6. src/components/documents/document-status-badge.tsx — added React import
7. src/lib/billing-data.test.ts — added server mock, static imports

## Requirements Coverage

All Phase 4 requirements shipped to production:
- ✓ PUB-01: Public invoice page (no auth required)
- ✓ PUB-02: Public quotation page (no auth required)
- ✓ PUB-03: Branded public pages (logo, color, business name)
- ✓ PUB-04: Client portal (document list, links)
- ✓ PUB-05: Accept/reject quotation from public page
- ✓ SET-03: TRN display for UAE compliance
- ✓ SET-04: Bilingual EN/AR and RTL rendering
- ✓ UX-03: Visual quality pass across all views
- ✓ UX-04: Slug-based URLs with alias redirects

## Next Steps

Task 2: Human production verification (invios.online).
After sign-off: Phase 4 complete → ready for Phase 5 (Automation & Recovery).
