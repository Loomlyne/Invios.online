---
phase: 8
slug: settings-foundation
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-15
---

# Phase 8 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | TypeScript compiler (`tsc --noEmit`) |
| **Config file** | `tsconfig.json` |
| **Quick run command** | `pnpm tsc --noEmit` |
| **Full suite command** | `pnpm tsc --noEmit` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `pnpm tsc --noEmit`
- **After every plan wave:** Run `pnpm tsc --noEmit`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 08-01-01 | 01 | 1 | NAV-01 | type-check | `pnpm tsc --noEmit` | ✅ | ⬜ pending |
| 08-01-02 | 01 | 1 | NAV-02 | type-check | `pnpm tsc --noEmit` | ✅ | ⬜ pending |
| 08-01-03 | 01 | 1 | NAV-03 | type-check | `pnpm tsc --noEmit` | ✅ | ⬜ pending |
| 08-02-01 | 02 | 1 | NAV-04 | manual | browser test | N/A | ⬜ pending |
| 08-02-02 | 02 | 1 | NAV-05 | manual | browser test | N/A | ⬜ pending |
| 08-03-01 | 03 | 2 | A11Y-01 | type-check | `pnpm tsc --noEmit` | ✅ | ⬜ pending |
| 08-03-02 | 03 | 2 | A11Y-02 | type-check | `pnpm tsc --noEmit` | ✅ | ⬜ pending |
| 08-03-03 | 03 | 2 | A11Y-03 | type-check | `pnpm tsc --noEmit` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

*Existing infrastructure covers all phase requirements — tsc is already configured.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Sidebar renders with icons and labels, active section highlighted | NAV-01, NAV-02 | Visual verification | Navigate to /app/settings, confirm sidebar visible on desktop with all 8 sections |
| URL sync with browser back/forward | NAV-03 | Browser history behavior | Click sections, use back button, verify no history pollution |
| Mobile section picker opens and switches | NAV-04 | Responsive viewport needed | Resize to <1024px, tap picker, switch sections |
| Keyboard arrow nav with focus ring | NAV-05 | Keyboard interaction | Tab to sidebar, use arrow keys, verify visible focus ring |
| Each section has independent Save button | A11Y-03 | Visual + functional | Check each placeholder panel has its own Save button |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
