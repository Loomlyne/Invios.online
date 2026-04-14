---
phase: 01-foundation-onboarding
verified: 2026-04-06T17:45:00Z
status: passed
score: 12/12 requirements verified
re_verification: false
gaps:
  - truth: "First-time user is guided through onboarding after first sign-in until setup is complete (ONB-01)"
    status: resolved
    reason: "User accepted SetupChecklist pattern as the approved onboarding UX (2026-04-06). The floating checklist guides new users through setup without blocking app access. OnboardingWizard component remains available but is not the active pattern."
    resolution: "Reclassified — SetupChecklist is the intended non-blocking onboarding experience per user decision."

  - truth: "REQUIREMENTS.md reflects Phase 1 completion — all 12 Phase 1 requirement IDs checked off"
    status: resolved
    reason: "All 12 Phase 1 requirements updated to [x] in REQUIREMENTS.md."
    resolution: "Fixed — AUTH-01, AUTH-02, AUTH-04, ONB-02, ONB-03, ONB-04, ONB-05 checked off."

human_verification:
  - test: "Sign up as a new user and observe the first-time experience"
    expected: "New user should encounter a guided onboarding flow before reaching the main app — currently they land directly on /app with a floating SetupChecklist panel. Determine whether this is acceptable as the approved onboarding UX or whether the OnboardingWizard modal must be wired."
    why_human: "Product decision — whether SetupChecklist panel satisfies ONB-01 semantically (user is guided through setup) or whether ONB-01 strictly requires a blocking wizard that prevents access to the main app"
  - test: "Complete onboarding via settings workspace on mobile at 375px width"
    expected: "User can navigate through profile, branding, and defaults tabs without layout overflow, and the SetupChecklist marks completion correctly"
    why_human: "Requires visual/manual testing at 375px viewport — cannot verify responsive behavior programmatically"
  - test: "Verify Vercel production deployment (as documented in 01-03-SUMMARY.md)"
    expected: "All Phase 1 flows work end-to-end on the deployed URL — the human-verify checkpoint in 01-03 was approved by user per the SUMMARY"
    why_human: "Production environment — cannot verify from local codebase inspection"
---

# Phase 1: Foundation & Onboarding Verification Report

**Phase Goal:** Get a new user signed in, branded, and ready to work from an installable app shell
**Verified:** 2026-04-06T17:45:00Z
**Status:** gaps_found
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths (from ROADMAP success criteria)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | New user can sign up, sign in, and get redirected into onboarding without broken routes | PARTIAL | Sign-up and sign-in fully implemented (`signUpAction`, `signInAction` in auth.ts, routes exist at /sign-in and /sign-up). Middleware redirects unauthenticated /app to /sign-in. But "redirected into onboarding" is not enforced — user lands on /app dashboard with floating SetupChecklist |
| 2 | User can complete branding/defaults setup and see a live branded invoice preview before entering the main app | PARTIAL | SettingsWorkspace at /app/settings has profile, branding, defaults tabs with live InvoicePreview. But this is post-entry (user is already in the main app), not "before entering the main app" |
| 3 | App shell feels usable on small mobile widths | VERIFIED | app-sidebar-nav.tsx: lg:hidden + overflow-x-auto + shrink-0 on chips. app-shell.tsx: pb-28 lg:pb-8 bottom clearance, sticky top-4 header |
| 4 | Core business profile and default document settings persist correctly | VERIFIED | saveBusinessProfileAction, saveBrandingStepAction, saveDefaultsAction all write to Supabase and call revalidatePath("/app/settings") |

**Score:** 2/4 success criteria fully verified, 2/4 partially verified

---

## Required Artifacts

### Plan 01-01 Artifacts (Unit Test Infrastructure)

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/lib/supabase/middleware.test.ts` | Unit tests for updateSession route protection | VERIFIED | 103 lines. 6 tests. Imports `updateSession` from `@/lib/supabase/middleware`. Mocks `@/lib/env` and `@supabase/ssr`. All 6 route scenarios covered. |
| `src/lib/setup.test.ts` | Unit tests for deriveSetupProgress | VERIFIED | 170 lines. 7 tests. Imports `deriveSetupProgress` from `@/lib/setup`. `createUserState` helper present. All 7 setup states covered. |
| `src/actions/auth.test.ts` | Unit tests for Zod schema validation | VERIFIED | 131 lines. 8 tests across 4 describe blocks. Imports `signInSchema, signUpSchema, emailSchema, updatePasswordSchema` from `@/actions/auth`. |

### Plan 01-02 Artifacts (Redirect + Mobile Nav)

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/components/app/onboarding-wizard.tsx` | Post-onboarding redirect to /app/invoices/new | VERIFIED (internal) but ORPHANED | `router.push("/app/invoices/new")` confirmed at line 222. `useRouter` imported at line 4. `const router = useRouter()` at line 70. The redirect logic itself is correct — but the component is never mounted. |

### Plan 01-03 Artifacts (E2E Sign-Out)

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `e2e/app-flow.spec.ts` | Sign-out E2E test | VERIFIED | Test "sign-out clears session and redirects to sign-in" added at line 209. Uses `createConfirmedUser()` + `signIn()` helpers. Clicks "Sign out" button. Asserts waitForURL(/\/sign-in/). Verifies /app blocks re-entry. |

---

## Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `middleware.ts` | `src/lib/supabase/middleware.ts` | `import { updateSession }` | WIRED | middleware.ts line 2 imports and delegates 100% |
| `src/lib/supabase/middleware.test.ts` | `src/lib/supabase/middleware.ts` | `import { updateSession }` | WIRED | Line 18 of test file |
| `src/lib/setup.test.ts` | `src/lib/setup.ts` | `import { deriveSetupProgress }` | WIRED | Line 2 of test file |
| `src/actions/auth.ts` | exports Zod schemas | `export { signInSchema, signUpSchema, emailSchema, updatePasswordSchema }` | WIRED | Line 31 of auth.ts |
| `src/actions/auth.test.ts` | `src/actions/auth.ts` | import schemas | WIRED | Lines 2-7 of auth.test.ts |
| `src/components/app/onboarding-wizard.tsx` | `/app/invoices/new` | `router.push` on completeOnboardingAction success | WIRED (internal) | Line 222 of wizard. Correct success-only branch (error branch calls setPendingStep(""), success does not). |
| `src/components/app/onboarding-wizard.tsx` | any layout or page | import and mount | NOT WIRED | Zero import sites found across entire src/ tree. Component is exported but orphaned. |
| `e2e/app-flow.spec.ts` | sign-out flow | `page.getByRole("button", { name: "Sign out" })` | WIRED | Line 218 matches SignOutButton text "Sign out" in app-shell.tsx line 52 |
| `src/components/app/sign-out-button.tsx` | `src/actions/auth.ts` | `signOutAction()` + `router.replace("/sign-in")` | WIRED | sign-out-button.tsx lines 6, 22-23 |
| `src/components/app/app-shell.tsx` | `SignOutButton` | `import { SignOutButton }` | WIRED | Lines 7, 52 of app-shell.tsx |

---

## Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|---------------|--------|--------------------|--------|
| `src/lib/setup.ts` | `userState` | `AppUserState` passed directly | Pure function — no DB query needed | VERIFIED |
| `src/app/(app)/app/layout.tsx` | `context` | `getAppContext()` → Supabase `profiles`, `branding`, `user_settings` tables (data.ts lines 115-135) | Yes — real Supabase queries with `.select()` and `.eq()` | FLOWING |
| `src/components/app/settings-workspace.tsx` | `context.userState` | Passed from SettingsPage → getAppContext() | Yes — same real data pipeline | FLOWING |
| `src/components/app/onboarding-wizard.tsx` | (never rendered) | N/A — component is orphaned | N/A | NOT_MOUNTED |

---

## Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| AUTH-01 | 01-01 | User can create an account with email and password | VERIFIED | `signUpAction` in auth.ts calls `supabase.auth.signUp()`. /sign-up route exists. REQUIREMENTS.md not updated to [x]. |
| AUTH-02 | 01-01 | User can sign in and remain authenticated across sessions | VERIFIED | `signInAction` calls `supabase.auth.signInWithPassword()`. Middleware refreshes session via `updateSession`. REQUIREMENTS.md not updated to [x]. |
| AUTH-03 | 01-03 | User can sign out from the authenticated app | VERIFIED | `signOutAction` calls `supabase.auth.signOut()`. SignOutButton wired in app-shell. E2E test passes. REQUIREMENTS.md correctly marked [x]. |
| AUTH-04 | 01-01 | Unauthenticated users cannot access private operator routes | VERIFIED | middleware.ts → updateSession redirects /app/** when user is null to /sign-in with ?next= param. 6 passing unit tests confirm. REQUIREMENTS.md not updated to [x]. |
| ONB-01 | 01-01, 01-02, 01-03 | First-time user is redirected into onboarding after first sign-in until setup is complete | PARTIAL/FAILED | onboardingRequired is computed but never acted on. OnboardingWizard is orphaned. SetupChecklist panel on /app is the actual mechanism but does not enforce onboarding completion before app access. REQUIREMENTS.md shows [x] — but the implementation does not match the requirement text. |
| ONB-02 | 01-01 | User can enter business name, contact details, address, and default invoice settings | VERIFIED (via settings) | SettingsWorkspace "profile" tab has all fields (fullName, businessName, businessEmail, phone, website, address, trn, bankDetails, footerText). Saves via saveBusinessProfileAction. REQUIREMENTS.md not updated to [x]. |
| ONB-03 | 01-01 | User can upload logo and signature assets for document branding | VERIFIED (via settings) | SettingsWorkspace "branding" tab has logo upload (logoInputRef), signature upload/draw/typed modes (signatureInputRef). Saves via saveBrandingStepAction. REQUIREMENTS.md not updated to [x]. |
| ONB-04 | 01-01 | User can choose primary branding color and see a live branded invoice preview during onboarding | VERIFIED (via settings) | SettingsWorkspace "branding" tab has primaryColor/secondaryColor fields. buildInvoicePreviewData + InvoicePreview renders live side panel. REQUIREMENTS.md not updated to [x]. |
| ONB-05 | 01-01 | User can set default currency, tax, notes, and terms preferences | VERIFIED (via settings) | SettingsWorkspace "defaults" tab has defaultCurrency, taxEnabled, defaultTaxRate, defaultTerms, defaultNotes, timezone, invoicePrefix, quotationPrefix. REQUIREMENTS.md not updated to [x]. |
| SET-01 | 01-02 | User can manage business profile, branding, bank details, and footer details in settings | VERIFIED | SettingsWorkspace + settings/page.tsx. saveBusinessProfileAction, saveBrandingStepAction wired. REQUIREMENTS.md correctly marked [x]. |
| SET-02 | 01-02 | User can configure invoice prefix, quotation prefix, default terms, default notes, and tax settings in settings | VERIFIED | SettingsWorkspace "defaults" tab covers all fields. saveDefaultsAction wired. REQUIREMENTS.md correctly marked [x]. |
| UX-01 | 01-02 | Core app screens remain usable on small mobile widths | VERIFIED | app-sidebar-nav.tsx: lg:hidden, overflow-x-auto, shrink-0 on chips. app-shell.tsx: pb-28 lg:pb-8, sticky top-4 header. REQUIREMENTS.md correctly marked [x]. |

---

## Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| Unit test suite passes | `pnpm test --run` | 31 tests passed across 6 files in 407ms | PASS |
| Schemas are exported from auth.ts | `grep "export.*signInSchema" src/actions/auth.ts` | Line 31: `export { signInSchema, signUpSchema, emailSchema, updatePasswordSchema }` | PASS |
| Middleware redirects unauthenticated to /sign-in | Covered by middleware.test.ts Test 2 | 6 middleware tests pass | PASS |
| Router push wired in onboarding wizard | `grep "router.push.*invoices/new" src/components/app/onboarding-wizard.tsx` | Match at line 222 | PASS |
| OnboardingWizard mounted in app | `grep -r "OnboardingWizard" src/` | Only definition found — zero import sites | FAIL |
| Mobile nav overflow-x-auto | `grep "overflow-x-auto" src/components/app/app-sidebar-nav.tsx` | Line 63: confirmed | PASS |
| Settings persistence actions exist | `grep "saveBusinessProfileAction\|saveBrandingStepAction\|saveDefaultsAction" src/actions/app.ts` | Lines 119, 185, 251: all three confirmed | PASS |

---

## Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `src/components/app/onboarding-wizard.tsx` | 52 | Component exported but never imported or used | Warning | ONB-01 gap — wizard exists and works internally but is never shown to users |
| `.planning/REQUIREMENTS.md` | 7-19 | 7 Phase 1 requirements remain unchecked despite implementations being present | Info | Documentation mismatch — does not affect runtime behavior |

No stub implementations found. No TODO/FIXME/placeholder anti-patterns in production code. No empty return bodies. `completeOnboarding` error handling is correct (setPendingStep only on error branch).

---

## Human Verification Required

### 1. OnboardingWizard vs SetupChecklist — Product Decision

**Test:** Sign up as a brand new user and observe the first-time experience.
**Expected per ONB-01:** "First-time user is redirected into onboarding after first sign-in until setup is complete"
**Actual:** User lands on `/app` dashboard and sees a `SetupChecklist` floating panel in the bottom-right corner. They can use the full app without completing setup.
**Why human:** This is a product scope decision — either:
  - (A) Accept SetupChecklist as the approved ONB-01 mechanism and update the requirement text, OR
  - (B) Wire `OnboardingWizard` into `app/layout.tsx` when `context.onboardingRequired` is true to enforce guided onboarding before app access

### 2. Mobile experience at 375px

**Test:** Open the app at 375px viewport width (iPhone SE breakpoint) and navigate through invoices, settings, and the setup checklist.
**Expected:** Horizontal chip nav scrolls without overflow, content area does not break layout, SetupChecklist panel is accessible.
**Why human:** Responsive visual behavior requires manual viewport testing — cannot verify with grep.

### 3. Vercel production deployment (pre-approved)

**Test:** Human-verify checkpoint from 01-03 was approved by user per the SUMMARY.
**Expected:** All Phase 1 flows working on deployed URL — sign-up, sign-in, settings persistence, sign-out, mobile nav at 375px.
**Why human:** Production environment, documented as approved in 01-03-SUMMARY.md.

---

## Gaps Summary

Two gaps prevent a clean "passed" status:

**Gap 1 — OnboardingWizard is orphaned (blocks ONB-01).**
The `OnboardingWizard` component at `src/components/app/onboarding-wizard.tsx` is fully implemented and contains the correct D-09 redirect (`router.push("/app/invoices/new")`). However it has zero import sites across the entire `src/` tree. The `onboardingRequired` boolean computed in `getAppContext()` is never checked in any layout, route, or component.

The substitute mechanism — `SetupChecklist` — is a collapsible floating panel that guides users through setup but does NOT block access to the main app. Whether this satisfies ONB-01 ("redirected into onboarding... until setup is complete") is a product decision. The plans reference the wizard extensively but never actually wire it in.

Resolution options:
- Mount `OnboardingWizard` in `src/app/(app)/app/layout.tsx` conditionally on `context.onboardingRequired`
- OR formally accept SetupChecklist as the approved pattern, mark ONB-01 as satisfied, and update REQUIREMENTS.md

**Gap 2 — REQUIREMENTS.md not updated for 7 of 12 Phase 1 requirements.**
AUTH-01, AUTH-02, AUTH-04, ONB-02, ONB-03, ONB-04, ONB-05 all have working implementations but remain `[ ]` in REQUIREMENTS.md. This is a documentation-only gap — it does not affect runtime behavior.

---

_Verified: 2026-04-06T17:45:00Z_
_Verifier: Claude (gsd-verifier)_
