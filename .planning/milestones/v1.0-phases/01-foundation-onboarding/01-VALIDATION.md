---
phase: 1
slug: foundation-onboarding
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-06
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 3.2.4 (unit) + Playwright 1.59.1 (E2E) |
| **Unit config file** | `vitest.config.ts` |
| **E2E config file** | `playwright.config.ts` |
| **Quick run command** | `pnpm test` |
| **Full suite command** | `pnpm test && pnpm typecheck && pnpm lint` |
| **Estimated runtime** | ~28ms (unit, after warmup) |

---

## Sampling Rate

- **After every task commit:** Run `pnpm test`
- **After every plan wave:** Run `pnpm test && pnpm typecheck && pnpm lint`
- **Before `/gsd:verify-work`:** Full unit suite green + manual mobile viewport check + Vercel deploy verified
- **Max feedback latency:** ~30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 1-W0-01 | 01 | 0 | AUTH-04 | unit | `pnpm test` | ❌ W0 | ⬜ pending |
| 1-W0-02 | 01 | 0 | AUTH-01/02 | unit | `pnpm test` | ❌ W0 | ⬜ pending |
| 1-W0-03 | 01 | 0 | ONB-01..05 | unit | `pnpm test` | ❌ W0 | ⬜ pending |
| 1-01-01 | 01 | 1 | AUTH-01 | E2E smoke | `pnpm test:e2e --grep "sign-up"` | ✅ | ⬜ pending |
| 1-01-02 | 01 | 1 | AUTH-02 | E2E smoke | `pnpm test:e2e --grep "sign-in"` | ✅ (partial) | ⬜ pending |
| 1-01-03 | 01 | 1 | AUTH-03 | E2E | `pnpm test:e2e --grep "sign-out"` | ❌ W0 | ⬜ pending |
| 1-01-04 | 01 | 1 | AUTH-04 | unit | `pnpm test` | ❌ W0 | ⬜ pending |
| 1-02-01 | 02 | 1 | ONB-01/D-09 | E2E | `pnpm test:e2e --grep "onboarding"` | ❌ W0 | ⬜ pending |
| 1-02-02 | 02 | 1 | ONB-04 | unit | `pnpm test` | ✅ (partial) | ⬜ pending |
| 1-02-03 | 02 | 1 | ONB-02/03/05 | E2E manual | manual | Partial | ⬜ pending |
| 1-03-01 | 03 | 1 | UX-01/D-16 | E2E viewport | `pnpm test:e2e --grep "mobile"` | ❌ W0 | ⬜ pending |
| 1-04-01 | 04 | 1 | SET-01/SET-02 | E2E | `pnpm test:e2e --grep "settings"` | Partial | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/lib/supabase/middleware.test.ts` — unit test for route protection logic (AUTH-04): unauthenticated `/app` → redirect `/sign-in`; authenticated `/sign-in` → redirect `/app`
- [ ] `src/lib/setup.test.ts` — unit tests for `deriveSetupProgress()` covering all completion states and `readyForCompletion` edge case
- [ ] `src/actions/auth.test.ts` — Zod schema validation tests for `signInSchema`, `signUpSchema` (validation-layer only, no Supabase call)
- [ ] E2E: Add sign-out test to `e2e/app-flow.spec.ts` (AUTH-03)
- [ ] E2E: Add post-onboarding redirect assertion (ONB-01 / D-09) once redirect is implemented
- [ ] E2E: Add mobile viewport bottom-tab assertion (UX-01 / D-16) once bottom nav is implemented

*Existing infrastructure covers all currently-passing requirements. Wave 0 adds coverage for gaps identified in research.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Logo upload persists to Supabase Storage | ONB-03 | Requires real storage bucket + signed URL | 1. Complete onboarding branding step with logo upload. 2. Reload settings page. 3. Verify logo renders in branding tab. |
| Signature capture (draw mode) works on touch device | ONB-03 / D-13 | Canvas touch events require real device | 1. Open onboarding on mobile. 2. Choose draw mode. 3. Draw signature with finger. 4. Verify signature preview renders. |
| Install prompt appears post-onboarding | D-19 | PWA install prompt requires browser permission | 1. Complete onboarding on Chrome on Android. 2. Verify install banner appears on get-started page. |
| App usable on 375px width after bottom-tab nav added | UX-01 / D-16 | Device viewport test | 1. Open Chrome DevTools at 375px. 2. Verify bottom tab bar visible and tappable. 3. Verify no horizontal scroll on main surfaces. |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
