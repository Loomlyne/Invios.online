---
phase: 5
slug: automation-recovery
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-12
---

# Phase 5 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest |
| **Config file** | `vitest.config.ts` |
| **Quick run command** | `pnpm test --reporter=verbose` |
| **Full suite command** | `pnpm test` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `pnpm test --reporter=verbose`
- **After every plan wave:** Run `pnpm test`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 05-00-01 | 00 | 0 | AUTO-01 | unit | `pnpm test src/actions/invoices.test.ts` | ❌ W0 | ⬜ pending |
| 05-00-02 | 00 | 0 | AUTO-02 | unit | `pnpm test src/actions/invoices.test.ts` | ❌ W0 | ⬜ pending |
| 05-00-03 | 00 | 0 | AUTO-03 | unit | `pnpm test src/lib/billing-data.test.ts` | ❌ W0 | ⬜ pending |
| 05-00-04 | 00 | 0 | AUTO-04 | unit | `pnpm test src/actions/app.test.ts` | ❌ W0 | ⬜ pending |
| 05-00-05 | 00 | 0 | AUTO-05 | unit | `pnpm test src/actions/app.test.ts` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/actions/invoices.test.ts` — stubs for AUTO-01 (version snapshot on save) and AUTO-02 (restore action)
- [ ] `src/lib/billing-data.test.ts` — stubs for AUTO-03 (recurring schedule data fetchers)
- [ ] `src/actions/app.test.ts` — stubs for AUTO-04/05 (reminder send + log dedup)

*Wave 0 test files are scaffolded RED first, then turned GREEN during implementation plans.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Vercel cron fires on schedule in production | AUTO-03, AUTO-04 | Cron runs only in Vercel production; cannot be unit tested | Deploy, wait for next daily run, check Vercel cron logs |
| Reminder email received by client | AUTO-04 | Requires real Resend send + live inbox | Send test reminder to a known email, verify delivery |
| Version sidebar renders and restores correctly | AUTO-02 | Visual/UX verification | Load invoice detail, open sidebar, restore an older version, confirm fields revert |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
