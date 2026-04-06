---
phase: 2
slug: clients-document-engine
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-06
---

# Phase 2 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest |
| **Config file** | vitest.config.ts |
| **Quick run command** | `pnpm test --run` |
| **Full suite command** | `pnpm test --run && pnpm build` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `pnpm test --run`
- **After every plan wave:** Run `pnpm test --run && pnpm build`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 60 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 02-01-01 | 01 | 1 | CLNT-01 | integration | `pnpm test --run` | ❌ W0 | ⬜ pending |
| 02-01-02 | 01 | 1 | CLNT-02 | integration | `pnpm test --run` | ❌ W0 | ⬜ pending |
| 02-01-03 | 01 | 1 | CLNT-03 | integration | `pnpm test --run` | ❌ W0 | ⬜ pending |
| 02-01-04 | 01 | 1 | CLNT-04 | integration | `pnpm test --run` | ❌ W0 | ⬜ pending |
| 02-02-01 | 02 | 1 | QUOT-01 | integration | `pnpm test --run` | ❌ W0 | ⬜ pending |
| 02-02-02 | 02 | 1 | QUOT-02 | integration | `pnpm test --run` | ❌ W0 | ⬜ pending |
| 02-02-03 | 02 | 1 | QUOT-03 | integration | `pnpm test --run` | ❌ W0 | ⬜ pending |
| 02-02-04 | 02 | 2 | QUOT-04 | integration | `pnpm test --run` | ❌ W0 | ⬜ pending |
| 02-02-05 | 02 | 2 | QUOT-05 | manual | — | — | ⬜ pending |
| 02-02-06 | 02 | 2 | QUOT-06 | manual | — | — | ⬜ pending |
| 02-02-07 | 02 | 2 | QUOT-07 | integration | `pnpm test --run` | ❌ W0 | ⬜ pending |
| 02-03-01 | 03 | 1 | INV-01 | integration | `pnpm test --run` | ❌ W0 | ⬜ pending |
| 02-03-02 | 03 | 1 | INV-02 | integration | `pnpm test --run` | ❌ W0 | ⬜ pending |
| 02-03-03 | 03 | 2 | INV-03 | manual | — | — | ⬜ pending |
| 02-03-04 | 03 | 2 | INV-04 | manual | — | — | ⬜ pending |
| 02-03-05 | 03 | 2 | INV-05 | integration | `pnpm test --run` | ❌ W0 | ⬜ pending |
| 02-03-06 | 03 | 2 | INV-06 | manual | — | — | ⬜ pending |
| 02-03-07 | 03 | 3 | INV-07 | manual | — | — | ⬜ pending |
| 02-03-08 | 03 | 3 | INV-08 | integration | `pnpm test --run` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/actions/clients.test.ts` — stubs for CLNT-01 through CLNT-04
- [ ] `src/actions/quotations.test.ts` — stubs for QUOT-01, QUOT-02, QUOT-03, QUOT-07
- [ ] `src/actions/invoices.test.ts` — stubs for INV-01, INV-02, INV-05, INV-08
- [ ] Existing vitest infrastructure (vitest.config.ts) — already present from Phase 1

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Live preview renders branded document | QUOT-05, INV-03 | Visual rendering, no automated DOM assertion | Open document builder → verify preview pane updates in real time |
| PDF export matches preview | QUOT-06, INV-04, INV-06 | Cross-browser PDF rendering | Click export → open PDF → compare to preview |
| Public share URL shows correct doc | INV-07 | Requires public URL traversal | Copy share link → open in incognito → verify doc visible without auth |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 60s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
