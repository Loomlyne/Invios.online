---
phase: 4
slug: public-trust-surfaces
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-09
---

# Phase 4 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest (node environment) |
| **Config file** | `vitest.config.ts` |
| **Quick run command** | `pnpm test` |
| **Full suite command** | `pnpm test && pnpm typecheck` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `pnpm test`
- **After every plan wave:** Run `pnpm test && pnpm typecheck`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 04-00-01 | 00 | 0 | PUB-01 | unit | `pnpm test -- --reporter=verbose src/lib/billing-data.test.ts` | ❌ W0 | ⬜ pending |
| 04-00-02 | 00 | 0 | PUB-02 | unit | `pnpm test -- --reporter=verbose src/lib/billing-data.test.ts` | ❌ W0 | ⬜ pending |
| 04-00-03 | 00 | 0 | PUB-04 | unit | `pnpm test -- --reporter=verbose src/lib/billing-data.test.ts` | ❌ W0 | ⬜ pending |
| 04-00-04 | 00 | 0 | PUB-05 | unit | `pnpm test -- --reporter=verbose src/actions/public-quotations.test.ts` | ❌ W0 | ⬜ pending |
| 04-00-05 | 00 | 0 | PUB-05 | unit | `pnpm test -- --reporter=verbose src/actions/public-quotations.test.ts` | ❌ W0 | ⬜ pending |
| 04-xx-01 | xx | 1 | UX-04 | unit | `pnpm test -- --reporter=verbose src/lib/billing-utils.test.ts` | ✅ extend | ⬜ pending |
| 04-xx-02 | xx | 1 | SET-03 | unit | `pnpm test -- --reporter=verbose src/lib/billing-utils.test.ts` | ✅ extend | ⬜ pending |
| 04-xx-03 | xx | 1 | SET-04 | unit | `pnpm test -- --reporter=verbose src/lib/billing-utils.test.ts` | ✅ extend | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/lib/billing-data.test.ts` — unit tests for `getClientByPortalToken`, slug alias lookup (pure schema/logic, mock Supabase)
- [ ] `src/actions/public-quotations.test.ts` — unit tests for Accept/Reject action guard logic
- Note: Pure function / guard tests only. No live Supabase instance required.

*Existing infrastructure covers remaining phase requirements.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Branded landing page visual quality | PUB-03, UX-03 | Visual design quality not automatable | Open public invoice/quotation links, verify branded header, centered preview, sticky PDF button, footer |
| Side-by-side bilingual layout rendering | SET-04, D-09 | CSS layout verification needs visual inspection | Create bilingual document, open public page, verify EN left / AR RTL right columns |
| Full RTL flip for Arabic-only | SET-04, D-11 | RTL layout verification needs visual inspection | Create Arabic-only document, verify dir="rtl", text right-aligned, numbers LTR |
| Client portal branded experience | PUB-04 | Visual branding check | Open portal URL, verify business logo/name in header, accent color applied |
| UX-03 visual polish pass | UX-03 | Subjective visual quality across all views | Review dashboard, list pages, detail pages, public pages for premium quality |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
