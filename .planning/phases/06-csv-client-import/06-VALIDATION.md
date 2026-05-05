---
phase: 6
slug: csv-client-import
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-14
---

# Phase 6 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 3.2.4 |
| **Config file** | `vitest.config.ts` |
| **Quick run command** | `pnpm test` |
| **Full suite command** | `pnpm test` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `pnpm test`
- **After every plan wave:** Run `pnpm test`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 06-00-01 | 00 | 0 | CLNT-05 | unit | `pnpm test` | ❌ W0 | ⬜ pending |
| 06-00-02 | 00 | 0 | CLNT-05 | unit | `pnpm test` | ❌ W0 | ⬜ pending |
| 06-00-03 | 00 | 0 | CLNT-05 | unit | `pnpm test` | ❌ W0 | ⬜ pending |
| 06-00-04 | 00 | 0 | CLNT-05 | unit | `pnpm test` | ❌ W0 | ⬜ pending |
| 06-00-05 | 00 | 0 | CLNT-05 | unit | `pnpm test` | ❌ W0 | ⬜ pending |
| 06-00-06 | 00 | 0 | CLNT-05 | unit | `pnpm test` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/lib/csv-import.test.ts` — stubs for csvRowSchema validation, autoMapHeaders fuzzy matching, 200-row cap enforcement
- [ ] `src/actions/clients.test.ts` — extend with stubs for importClientsAction slug accumulation, duplicate email skip, batch insert

*Tests are pure Node-compatible — PapaParse parsing is client-side, not tested here. These test the data layer functions.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| MobileSheet wizard renders 4 steps correctly | CLNT-05 | Visual UI flow | Open /app/clients, click "Import CSV", verify steps cycle through Upload → Map → Preview → Result |
| Auto-map correctly identifies non-standard headers | CLNT-05 | Heuristic output quality | Upload CSV with "E-mail", "Full Name", "Phone Number" headers — verify auto-mapping |
| Downloadable CSV template has correct headers | CLNT-05 | Browser download behavior | Click "Download template", open file, verify columns: name, company, email, phone, address, trn |
| Duplicate email rows show ⚠️ badge | CLNT-05 | Visual indicator | Import CSV with email matching existing client — verify badge appears in preview |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
