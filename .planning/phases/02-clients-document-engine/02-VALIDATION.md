---
phase: 2
slug: clients-document-engine
status: draft
nyquist_compliant: true
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
| 02-00-01 | 00 | 0 | CLNT-01..04 | unit | `pnpm test --run src/actions/clients.test.ts` | W0 creates | ⬜ pending |
| 02-00-02 | 00 | 0 | QUOT-01..03,07 | unit | `pnpm test --run src/actions/quotations.test.ts` | W0 creates | ⬜ pending |
| 02-00-03 | 00 | 0 | INV-01..02,05,08 | unit | `pnpm test --run src/actions/invoices.test.ts` | W0 creates | ⬜ pending |
| 02-01-01 | 01 | 1 | CLNT-03 | integration | `pnpm test --run && pnpm build` | via W0 | ⬜ pending |
| 02-01-02 | 01 | 1 | QUOT-05 | integration | `pnpm test --run && pnpm build` | via W0 | ⬜ pending |
| 02-01-03 | 01 | 1 | INV-05,06 | integration | `pnpm test --run && pnpm build` | via W0 | ⬜ pending |
| 02-02-01 | 02 | 1 | QUOT-01..04 | integration | `pnpm test --run && pnpm build` | via W0 | ⬜ pending |
| 02-02-02 | 02 | 1 | INV-01..04 | integration | `pnpm test --run && pnpm build` | via W0 | ⬜ pending |
| 02-03-01 | 03 | 2 | INV-05..07 | integration | `pnpm test --run && pnpm build` | via W0 | ⬜ pending |
| 02-03-02 | 03 | 2 | QUOT-05..07 | integration | `pnpm test --run && pnpm build` | via W0 | ⬜ pending |
| 02-03-03 | 03 | 2 | INV-08 | integration | `pnpm test --run && pnpm build` | via W0 | ⬜ pending |
| 02-04-01 | 04 | 2 | CLNT-01..04 | integration | `pnpm test --run && pnpm build` | via W0 | ⬜ pending |
| 02-05-01 | 05 | 3 | all | manual+auto | `pnpm test --run && pnpm build` | — | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Plan

**Plan 02-00-PLAN.md** creates all three test files:

- [x] `src/actions/clients.test.ts` — clientFormSchema validation, clientStatuses values
- [x] `src/actions/quotations.test.ts` — quotationFormSchema validation, quotationStatuses, documentLineItemSchema
- [x] `src/actions/invoices.test.ts` — invoiceFormSchema validation, invoiceStatuses, invoiceType
- [x] Existing vitest infrastructure (vitest.config.ts) — already present from Phase 1

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Live preview renders branded document | QUOT-05, INV-03 | Visual rendering, no automated DOM assertion | Open document builder → verify preview pane updates in real time |
| PDF export matches preview | QUOT-06, INV-04, INV-06 | Cross-browser PDF rendering | Click export → open PDF → compare to preview |
| Public share URL shows correct doc | INV-07 | Requires public URL traversal | Copy share link → open in incognito → verify doc visible without auth |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references (via 02-00-PLAN.md)
- [x] No watch-mode flags
- [x] Feedback latency < 60s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** pending (Wave 0 plan created, tests not yet executed)
