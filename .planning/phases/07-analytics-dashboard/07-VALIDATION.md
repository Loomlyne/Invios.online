---
phase: 7
slug: analytics-dashboard
status: approved
nyquist_compliant: true
wave_0_complete: false
created: 2026-04-16
---

# Phase 7 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest ^3.2.4 |
| **Config file** | none — package.json script `vitest run` |
| **Quick run command** | `pnpm test -- --reporter=verbose src/lib/dashboard.test.ts` |
| **Full suite command** | `pnpm test` |
| **Estimated runtime** | ~8 seconds |

---

## Sampling Rate

- **After every task commit:** Run `pnpm test -- src/lib/dashboard.test.ts`
- **After every plan wave:** Run `pnpm test`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 8 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 07-01-01 | 01 | 1 | DASH-05 | unit | `pnpm test -- src/lib/dashboard.test.ts` | Extend existing | ⬜ pending |
| 07-01-01 | 01 | 1 | DASH-06 | unit | `pnpm test -- src/lib/dashboard.test.ts` | Extend existing | ⬜ pending |
| 07-01-01 | 01 | 1 | DASH-07 | unit | `pnpm test -- src/lib/dashboard.test.ts` | Extend existing | ⬜ pending |
| 07-01-02 | 01 | 1 | DASH-05, DASH-06, DASH-07 | unit | `pnpm test -- src/lib/dashboard.test.ts` | Extend existing | ⬜ pending |
| 07-02-01 | 02 | 2 | DASH-05, DASH-06, DASH-07 | visual/manual | — | N/A (components) | ⬜ pending |
| 07-02-02 | 02 | 2 | DASH-05, DASH-06 | visual/manual | — | N/A (page wiring) | ⬜ pending |
| 07-02-03 | 02 | 2 | DASH-05, DASH-06, DASH-07 | visual | — | N/A (checkpoint) | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `pnpm dlx shadcn@latest add chart` — scaffolds `src/components/ui/chart.tsx` and installs recharts
- [ ] No new test files needed — all new functions extend `src/lib/dashboard.test.ts`

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Empty state shown when no non-draft invoices exist | DASH-05, DASH-06 | JSX rendering requires visual confirmation | Load dashboard with no invoices, verify EmptyState appears in both chart sections |
| Chart layout responsive (60/40 desktop, stacked mobile) | DASH-05, DASH-06 | Layout is CSS-driven, visual | Resize browser between mobile and desktop, verify grid changes |
| MoM badge hidden when delta is null | DASH-07 | Conditional render requires visual | Load with "all" range selected, verify no MoM badges appear |

---

## Validation Sign-Off

- [x] All tasks have automated verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 10s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** approved 2026-04-16
