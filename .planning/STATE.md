---
gsd_state_version: 1.0
milestone: v1.1
milestone_name: next
status: v1.0 milestone complete — planning next milestone
last_updated: "2026-04-14T09:51:13.428Z"
progress:
  total_phases: 5
  completed_phases: 5
  total_plans: 28
  completed_plans: 28
---

# STATE

## Project Reference

See: .planning/PROJECT.md (updated 2026-04-14)

**Core value:** Make it dead simple for a service business to send a polished branded quote or invoice and reliably know what has been paid, what is still due, and what profit remains.
**Current focus:** v1.0 milestone complete — planning v1.1

## Current Status

- ✅ v1.0 MVP shipped 2026-04-14 — 5 phases, 28 plans, 168 commits, invios.online live
- ✅ All 54 v1 requirements validated and archived
- ✅ Phase 1: Foundation & Onboarding — app shell, onboarding, auth, mobile nav, settings
- ✅ Phase 2: Clients & Document Engine — full document engine, PDF export, share, conversion
- ✅ Phase 3: Dashboard & Cash Flow — payments, expenses, profit/margin, MetricCard dashboard
- ✅ Phase 4: Public Trust Surfaces — public pages, client portal, bilingual/RTL, TRN, slugs, visual polish
- ✅ Phase 5: Automation & Recovery — version history, recurring billing, reminder emails, cron infra
- Ready for: `/gsd:new-milestone` to plan v1.1

## Key Decisions (active carry-forward)

- **use-server rule**: Only async functions may be exported from `"use server"` files — constants and interfaces must live in non-server modules (e.g. `billing.ts`)
- **Admin client for new tables**: Cast Supabase admin client to `any` after new table migrations until types are regenerated via `supabase gen types`
- **UTC date arithmetic**: Always use `T00:00:00Z` suffix + `setUTCDate`/`setUTCMonth` for cron date math — prevents DST off-by-one errors
- **git push**: Must be user-initiated — always hangs in Claude's shell environment (HTTPS auth non-interactive context)
- **Supabase migration drift**: Dashboard-created migrations not tracked locally; resolve with `supabase migration repair` before `db push`
- **Vitest module isolation**: Use static imports + `vi.mock()` hoisting, not `await import()` inside test bodies
- **`printf '%s'` for Vercel env vars**: `echo` adds trailing newline that breaks HTTP header validation

## Session State

- v1.0 milestone complete and archived
- ROADMAP.md reorganized with milestone grouping
- RETROSPECTIVE.md created
- PROJECT.md fully evolved (all 9 active requirements validated, v2 requirements moved to Active)
- REQUIREMENTS.md archived to milestones/v1.0-REQUIREMENTS.md and deleted
- Next: `/gsd:new-milestone` to scope v1.1
