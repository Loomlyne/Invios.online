# Project Retrospective

*A living document updated after each milestone. Lessons feed forward into future planning.*

## Milestone: v1.0 — MVP

**Shipped:** 2026-04-14
**Phases:** 5 | **Plans:** 28 | **Commits:** 168 | **Timeline:** 9 days (Apr 5–14, 2026)

### What Was Built

- **Auth + Onboarding**: Full sign-up → onboarding → branded workspace flow, installable PWA shell, mobile nav
- **Document Engine**: Quotation and invoice builders with live preview, line items, PDF export, public share links, quotation-to-invoice conversion
- **Financial Console**: Payments and expenses per invoice, automatic status computation (draft/sent/partial/paid/overdue/overpaid), profit/margin display, MetricCard dashboard
- **Public Trust Surfaces**: Branded public invoice/quotation pages, client portal, accept/reject quotation from public page, bilingual EN/AR rendering with RTL safety, UAE TRN compliance, slug-based URLs with alias redirect
- **Automation**: JSONB version snapshots on every invoice save with safe restore, recurring billing cron (creates drafts for human review), reminder email cron with 24-hour deduplication via `reminder_logs`

### What Worked

- **Phased Wave 0 test scaffolds**: Writing RED test cases first in Wave 0 plans established behavioral contracts before implementation, catching schema mistakes before code was written. This pattern held well across all 5 phases.
- **Deploy-as-phase-completion**: Making Vercel deploy a required step in every phase's final plan forced real production validation. Caught 6 build-blocking bugs in Phase 5 alone that wouldn't surface until push time.
- **Supabase MCP for migrations**: Using the Supabase MCP server to apply migrations directly bypassed `npx` auth issues and worked reliably in all phases.
- **`computeAndWriteInvoiceStatus` pattern**: Centralizing status computation so server actions call one function with an injected Supabase client made testing deterministic and avoided double-session bugs.
- **HSL-derived brand color token family**: Generating 11 CSS tokens from a single HSL input (brand color) meant per-user theming worked at zero per-component cost. Very high ROI.
- **Worktree parallel execution**: Running plans in isolated git worktrees avoided merge conflicts and allowed Wave 1–4 plans to execute without blocking each other.

### What Was Inefficient

- **Dynamic import isolation in Vitest**: `await import()` inside tests doesn't isolate module state reliably in Vitest. Three separate phases hit this — Phase 4 required switching from dynamic to static imports + `vi.mock()` hoisting, losing time. The fix is now documented but wasn't anticipated early.
- **REQUIREMENTS.md checkbox drift**: 5 implemented requirements went unchecked because the plans that implemented them (Phase 4 PUB-01/PUB-02/UX-03, Phase 2 PDF) didn't update the tracking file. Adds noise to milestone completion.
- **`git push` hanging in sandbox**: Every phase's final deploy step required user action in their terminal because `git push` reliably hangs in the Claude shell (HTTPS auth in non-interactive context). Using `vercel --prod` directly works but leaves `main` behind on GitHub until user pushes.
- **Supabase migration history divergence**: Dashboard-created migrations not tracked locally caused `db push` to abort and required `migration repair` commands. Three phases hit this.
- **`use-server` constant export bug in Phase 5**: Next.js 15 forbids non-async exports from `use-server` files. `MAX_VERSIONS` and `InvoiceSnapshot` were placed in `versions.ts` with `"use server"` and had to be moved to `billing.ts`. This caused 5 extra fix commits and multiple failed deploy attempts.

### Patterns Established

- **Cron endpoint pattern**: auth check (`isCronAuthenticated`) → admin client → query with error propagation → per-item try/catch → summary JSON response
- **Static import + `vi.mock()` hoisting**: Only reliable way to mock Supabase server client in Vitest
- **UTC date arithmetic**: `T00:00:00Z` suffix + `setUTCDate`/`setUTCMonth` for all cron date math — prevents DST off-by-one errors
- **`printf '%s'` for Vercel env vars**: `echo` adds trailing newline that breaks HTTP header validation; `printf '%s'` is safe
- **Admin client cast to `any` for new tables**: Until generated types are regenerated, new tables require explicit `as any` cast on the Supabase client — pattern is intentional and documented
- **`use-server` rule**: Constants and interfaces must not live in `"use server"` files — only async functions

### Key Lessons

1. **Write one-liner summaries that extract cleanly**: SUMMARY.md `one_liner` fields are extracted by tooling for MILESTONES.md. Fields from plans where the summary had loose structure (Phase 4 plan 05) produced garbage entries. Keep one-liner fields a single clean sentence.
2. **Check generated types after DB migrations**: Supabase auto-generated types don't include new tables until explicitly regenerated. Any new table access in TypeScript should be cast to `any` and documented, then regenerated at next deploy checkpoint.
3. **`git push` must be user-initiated**: Do not include `git push` as an automated step in any plan — it always hangs. Add it to the human verification checklist instead.
4. **Phase deploy plans are worth it**: Phase 5's deploy plan (05-06) caught 6 bugs in one session that would have created production incidents. The cost of the plan is always less than debugging post-deploy.
5. **Design token pass as a dedicated plan**: Phase 4 plan 05 (UX-03 visual pass) eliminated 20+ hardcoded hex values in one focused session. Doing this as a separate plan (vs. fixing inline) produced cleaner, more auditable changes.

### Cost Observations

- Model mix: Primarily claude-sonnet-4-6 (this project's default)
- Sessions: Multiple across 9 days, each scoped to 1–3 plans
- Notable: Yolo mode + parallel worktree execution were the biggest velocity multipliers. Asking for confirmation on every step would have tripled calendar time.

---

## Cross-Milestone Trends

### Process Evolution

| Milestone | Commits | Phases | Key Change |
|-----------|---------|--------|------------|
| v1.0 | 168 | 5 | First milestone — established all core patterns |

### Cumulative Quality

| Milestone | Tests | Final Count | Zero Breaking Deploys |
|-----------|-------|-------------|----------------------|
| v1.0 | Wave 0 per phase | ~119 | ✓ (all caught pre-deploy) |

### Top Lessons (Verified Across Milestones)

1. Deploy as a phase requirement, not an afterthought — production has different constraints than local.
2. Wave 0 RED test scaffolds establish behavioral contracts that catch schema errors before implementation begins.
3. `git push` must be user-initiated in this environment — never automate it.
