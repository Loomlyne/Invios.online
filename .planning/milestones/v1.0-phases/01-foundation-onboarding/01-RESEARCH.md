# Phase 1: Foundation & Onboarding - Research

**Researched:** 2026-04-06
**Domain:** Next.js 15 App Router, Supabase Auth/Postgres, mobile PWA shell, onboarding wizard, Tailwind CSS v4, shadcn/ui
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** Use separate `Sign in` and `Create account` screens rather than a combined auth screen.
- **D-02:** Use standard Supabase email/password auth with persistent sessions across refreshes and browser restarts.
- **D-03:** After first successful sign-in, users may enter the dashboard shell before onboarding is complete.
- **D-04:** Onboarding is still functionally required. Routes that depend on business defaults, branded document data, or setup completion must hard-block until onboarding is complete.
- **D-05:** Sign-out should be available in the profile menu and in settings.
- **D-06:** Onboarding should run as a wizard layered over the real dashboard shell, not as a standalone setup page.
- **D-07:** Step order is fixed: business profile, branding, defaults, then preview/confirm.
- **D-08:** Business profile and document defaults are required before the user can create documents. Branding can be deferred.
- **D-09:** When onboarding is completed, send the user into a create-first-invoice empty state rather than the generic dashboard home.
- **D-10:** Keep a live preview visible throughout onboarding.
- **D-11:** The preview should be a full invoice mock, not a lightweight branding card.
- **D-12:** Business branding inputs should support logo upload, brand color selection, and signature capture.
- **D-13:** Signature capture must support three modes: upload an existing signature image, draw a signature inline, or type a signature.
- **D-14:** Signature is strongly prompted during onboarding, but the user may mark it as add-later and still complete onboarding.
- **D-15:** If branding is incomplete, document flows should continue but show unbranded-draft warnings.
- **D-16:** Mobile navigation should use a bottom-tab primary nav for core work. Intended core tabs named by the user: invoices, clients, new invoice, quotation, settings.
- **D-17:** Any non-core or overflow destinations can live behind settings or a secondary menu rather than expanding the tab bar further.
- **D-18:** The first authenticated shell before onboarding completion is the real dashboard shell with the onboarding wizard layered into it.
- **D-19:** Install prompting should happen after onboarding is complete, not on first authenticated visit.
- **D-20:** On small screens, onboarding should prioritize the form and expose a sticky preview button that opens the full document preview in a separate sheet.

### Claude's Discretion

- Exact route map for "safe while unconfigured" shell surfaces, as long as setup-dependent flows remain blocked before onboarding completion.
- Exact visual treatment of the onboarding overlay, progress indicator, and unbranded-draft warnings.

### Deferred Ideas (OUT OF SCOPE)

None. Discussion stayed within the Phase 1 boundary.
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| AUTH-01 | User can create an account with email and password | Implemented: `signUpAction` in `src/actions/auth.ts`, `sign-up/page.tsx` using Supabase `signUp()` |
| AUTH-02 | User can sign in and remain authenticated across sessions | Implemented: `signInAction` in `src/actions/auth.ts`, middleware SSR session refresh via `@supabase/ssr` |
| AUTH-03 | User can sign out from the authenticated app | Implemented: `signOutAction` + `SignOutButton` component in `src/components/app/sign-out-button.tsx` |
| AUTH-04 | Unauthenticated users cannot access private operator routes | Implemented: `middleware.ts` → `updateSession` redirects `/app/**` to `/sign-in` when no user |
| ONB-01 | First-time user is redirected into onboarding after first sign-in until setup is complete | Partially implemented: OnboardingWizard shown over shell via layout logic; but D-09 (redirect to create-first-invoice) is NOT yet wired |
| ONB-02 | User can enter business name, contact details, address, and default invoice settings | Implemented: `OnboardingWizard` business-profile step + `saveBusinessProfileAction` |
| ONB-03 | User can upload logo and signature assets for document branding | Implemented: `saveBrandingStepAction` uploads to Supabase Storage `branding-assets` bucket |
| ONB-04 | User can choose primary branding color and see a live branded invoice preview during onboarding | Implemented: color pickers + `livePreview` memo in `OnboardingWizard` using `buildInvoicePreviewData` |
| ONB-05 | User can set default currency, tax, notes, and terms preferences | Implemented: defaults step in `OnboardingWizard` + `saveDefaultsAction` |
| SET-01 | User can manage business profile, branding, bank details, and footer details in settings | Implemented: `settings-workspace.tsx` with profile/branding/defaults tabs |
| SET-02 | User can configure invoice prefix, quotation prefix, default terms, default notes, and tax settings in settings | Implemented: defaults tab in settings workspace covers all these fields |
| UX-01 | Core app screens remain usable on small mobile widths | Partially implemented: shell has mobile nav as horizontal scroll row in header; D-16 (bottom-tab nav) is NOT yet implemented; breakpoints exist but bottom-tab pattern missing |
</phase_requirements>

---

## Summary

Phase 1 (Foundation & Onboarding) is substantially implemented and has been live in production since April 5, 2026. The project has advanced beyond Phase 1 into Phase 2 (Clients & Document Engine) which is also deployed at `https://invios-phase1-koss.vercel.app`. This changes the nature of Phase 1 planning: rather than a greenfield build, this phase is a **verification, gap-closing, and hardening pass** on existing code.

The core auth flows (sign-up, sign-in, sign-out, protected routes) are fully wired through Supabase `@supabase/ssr` in Next.js 15 App Router middleware. The onboarding wizard exists as a fixed-position overlay over the real app shell, runs four steps (business profile, branding, defaults, preview), supports live invoice preview, and persists all data to three Postgres tables (`profiles`, `branding`, `user_settings`). Settings mirrors the onboarding data with a tabbed UI. A PWA manifest, install prompt component, and signature pad component all exist.

Two meaningful gaps remain against the CONTEXT.md decisions: (1) D-09 (post-onboarding redirect to create-first-invoice rather than generic dashboard) is not implemented — `completeOnboardingAction` calls `revalidatePath` but does not redirect; (2) D-16 (bottom-tab primary nav on mobile) is not implemented — the current mobile nav is a horizontal scroll strip in the header, not a sticky bottom tab bar.

**Primary recommendation:** Plan this phase as audit + gap closure. Map each requirement against the existing code, confirm what passes, write targeted tests, and implement the two identified missing behaviors (D-09 redirect, D-16 bottom nav), then verify and deploy.

---

## Standard Stack

### Core (already installed)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| next | 15.5.14 | App Router, SSR, routing, Server Actions | Project mandate |
| react / react-dom | 19.2.0 | UI rendering | Project mandate |
| typescript | ^5 | Type safety | Project mandate |
| tailwindcss | ^4 | Utility CSS | Project mandate |
| @supabase/ssr | 0.10.0 | SSR-aware Supabase client for Next.js 15 | Official Supabase Next.js integration |
| @supabase/supabase-js | 2.101.1 | Supabase client | Official SDK |
| shadcn/ui primitives | (via components.json) | UI components (Dialog, Input, Button, etc.) | Project mandate |
| react-hook-form | 7.72.1 | Form state management in onboarding wizard | Avoids controlled input re-render thrash |
| zod | 4.3.6 | Schema validation for Server Actions | Type-safe validation |
| @hookform/resolvers | 5.2.2 | Zod → react-hook-form bridge | Pairs with both above |
| gsap / @gsap/react | 3.14.2 / 2.1.2 | Page transition animations | Already used in `page-transition.tsx` |
| lucide-react | 0.542.0 | Icons | Project mandate |

### Testing Infrastructure

| Tool | Version | Purpose | Config |
|------|---------|---------|--------|
| vitest | ^3.2.4 | Unit tests | `vitest.config.ts`, runs `src/**/*.test.ts`, `node` environment |
| @playwright/test | ^1.59.1 | E2E browser tests | `playwright.config.ts`, single Chromium project, starts dev server |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `@supabase/ssr` | Legacy `@supabase/auth-helpers-nextjs` | Deprecated for Next.js 15; `@supabase/ssr` is the current standard |
| Bottom-tab nav (Radix Tabs / custom) | Any nav library | Bottom tabs should be custom CSS/Tailwind pattern given design requirements |

**Version verification:**
- `next@15.5.14` confirmed via `package.json` (published post-training-cutoff)
- `@supabase/ssr@0.10.0` confirmed
- `zod@4.3.6` confirmed — NOTE: This is Zod v4, which has breaking changes from v3 (`.email()` now requires an object arg, `.safeParse` return shape changed in some methods). Existing code uses `z.string().email()` without arguments, which is valid in v4.

---

## Architecture Patterns

### Existing Project Structure

```
src/
├── actions/             # Server Actions ("use server") — auth.ts, app.ts, clients.ts, invoices.ts, quotations.ts
├── app/
│   ├── (app)/app/       # Route group for authenticated shell
│   │   ├── layout.tsx   # Auth guard + AppShell wrapper (loads getAppContext)
│   │   ├── page.tsx     # Dashboard home with setup checklist
│   │   ├── settings/    # Settings page (profile / branding / defaults tabs)
│   │   └── …           # Clients, invoices, quotations, get-started routes
│   ├── sign-in/         # Public auth route
│   ├── sign-up/         # Public auth route
│   ├── forgot-password/ # Public auth route
│   ├── update-password/ # Public auth route
│   ├── manifest.ts      # PWA manifest — Next.js MetadataRoute.Manifest
│   └── layout.tsx       # Root layout
├── components/
│   ├── app/             # App-shell components (AppShell, OnboardingWizard, InstallPromptButton, SignaturePad, etc.)
│   ├── auth/            # Auth form/shell components
│   ├── clients/         # Client-specific components
│   ├── documents/       # Document builder/preview components
│   ├── invoice/         # Invoice preview renderer
│   └── ui/              # shadcn/ui primitives
├── lib/
│   ├── data.ts          # getAppContext() — primary server-side data aggregator
│   ├── setup.ts         # deriveSetupProgress() — setup completion logic
│   ├── preview.ts       # buildInvoicePreviewData(), createDefaultUserState()
│   ├── types.ts         # Shared TypeScript types
│   ├── constants.ts     # appNavItems, onboardingSteps, defaultSettings, sampleLineItems
│   ├── supabase/        # server.ts, browser.ts, middleware.ts, admin.ts clients
│   └── env.ts           # Environment var access + isSupabaseConfigured()
└── middleware.ts         # Next.js middleware — session refresh + route protection
```

### Pattern 1: Server Component Auth Guard

The protected layout at `src/app/(app)/app/layout.tsx` calls `getAppContext()` server-side, which internally calls `supabase.auth.getUser()`. The middleware redirects unauthenticated requests before the layout even renders. This is the Supabase-recommended two-layer approach for Next.js 15:

```typescript
// middleware.ts calls updateSession() which refreshes JWT in cookies
// layout.tsx calls getAppContext() which calls supabase.auth.getUser() (authoritative check)
// Never use getSession() for auth decisions — always getUser() for server-side
```

### Pattern 2: Onboarding Wizard Over Shell

The wizard renders as a `fixed inset-0 z-40` overlay when `onboardingRequired` is true. The real shell renders behind it. This satisfies D-06 and D-18. The onboarding state is read from `AppContext.onboardingRequired` (derived from `profiles.onboarding_completed_at`).

The overlay is shown via `AppShell` passing `context` to child components, but the current implementation shows the wizard conditionally in `AppShell` or the app layout. The exact render path:

```
layout.tsx → getAppContext() → AppShell (receives context)
AppShell renders OnboardingWizard when context.onboardingRequired === true
```

### Pattern 3: Server Action + Optimistic UI

All onboarding form steps use `startTransition(async () => { const result = await serverAction(…) })` for non-blocking server mutation. The form state updates locally on success before the next revalidate cycle, giving responsive feel without blocking the UI.

### Pattern 4: Supabase Storage for Branding Assets

Logo and signature images are stored in the private `branding-assets` bucket under `{userId}/` prefix. Signed URLs (10-minute TTL) are generated server-side in `getAppContext()`. Storage RLS policies enforce owner-only access by matching `auth.uid()::text` against `(storage.foldername(name))[1]`.

### Pattern 5: PWA Manifest

`src/app/manifest.ts` exports a `MetadataRoute.Manifest` for Next.js automatic manifest serving at `/manifest.webmanifest`. Icons are SVG-based (`icon.svg`, `icon-maskable.svg`). `display: "standalone"` and `start_url: "/app"` are set for home-screen installability.

### Anti-Patterns to Avoid

- **Using `getSession()` for auth decisions:** `getSession()` reads from cookies and is not authoritative. Always use `getUser()` for protected routes, which validates against the Supabase server.
- **Calling `redirect()` inside try/catch:** Next.js `redirect()` throws a special error. If caught, it surfaces as "NEXT_REDIRECT" to the client. The existing codebase learned this lesson — `redirect()` calls are outside try/catch blocks.
- **Client-side Supabase for protected reads:** Don't use the browser Supabase client for data that requires RLS verification in server components. Use the server client.
- **Hydration mismatch on auth state:** Auth state should be read server-side and passed as props to avoid client/server HTML mismatches during hydration.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| JWT refresh in Next.js | Custom cookie refresh logic | `@supabase/ssr` `createServerClient` + middleware | Handles token rotation, cookie partitioning, SameSite correctly |
| Signature canvas drawing | Raw canvas event handling | Existing `SignaturePad` component in `src/components/app/signature-pad.tsx` | Already implemented |
| Form validation in Server Actions | Manual string checks | `zod` schema + `safeParse` | Consistent with existing pattern |
| Onboarding step persistence | URL params or localStorage | `profiles.onboarding_step` column in Postgres | Survives browser restarts, satisfies D-02 |
| Install prompt | Custom beforeinstallprompt handling | Existing `InstallPromptButton` component | Already wraps the `BeforeInstallPromptEvent` correctly |

**Key insight:** The Phase 1 infrastructure is already built. The job of Phase 1 planning is audit + targeted gap closure, not implementation from scratch.

---

## Runtime State Inventory

This is not a rename/refactor phase. Omitted.

---

## Common Pitfalls

### Pitfall 1: ONB-01 Completion Redirect Not Wired (D-09 Gap)

**What goes wrong:** After `completeOnboardingAction` succeeds, the action calls `revalidatePath("/app", "layout")` and returns `{ status: "success" }`. The wizard checks `result.status === "success"` but has no redirect — it just closes (because `onboardingRequired` becomes false after revalidate). The user lands on `/app` (generic dashboard), not the create-first-invoice empty state.

**Why it happens:** `completeOnboardingAction` does not call `redirect()`. The wizard's `completeOnboarding` handler does not navigate after success.

**How to avoid:** After `completeOnboardingAction` returns success, trigger a router push to `/app/get-started/create-invoice` (already exists as a page) or `/app/invoices/new`.

**Warning signs:** After completing onboarding, user sees the dashboard with setup checklist cards rather than invoice creation prompt.

### Pitfall 2: Mobile Nav Is Horizontal Scroll Strip, Not Bottom Tab Bar (D-16 Gap)

**What goes wrong:** `AppSidebarNav` in `mode="mobile"` renders as a horizontal-scroll pill row inside the sticky header at the top of the page. This is usable but does not satisfy D-16 (bottom-tab primary nav for core mobile work).

**Why it happens:** The original implementation used a top-header scroll nav as a pragmatic first pass.

**How to avoid:** Add a fixed bottom nav bar component for mobile breakpoints (`lg:hidden`). The five tabs from D-16 (Invoices, Clients, New Invoice, Quotation, Settings) should map to `appNavItems` with a dedicated "New invoice" primary action tab. The existing `appNavItems` in `constants.ts` covers Dashboard, Invoices, Quotations, Clients, Settings — mapping to the D-16 set requires either renaming/reordering or adding a new `new-invoice` shortcut tab.

**Warning signs:** On 375px-width viewport, nav items require horizontal scroll; no bottom dock is visible.

### Pitfall 3: Supabase Local vs. Hosted Schema Drift

**What goes wrong:** Migrations applied to hosted Supabase via `supabase db push --linked` diverge from local Docker container state. Running `supabase start` locally after a rebuild may not have Phase 1 or Phase 2 migrations applied.

**Why it happens:** Local Supabase container was stopped. Three migrations exist: `202604051800_phase1_foundation.sql`, `202604060130_phase2_documents.sql`, `202604060330_phase21_document_template.sql`.

**How to avoid:** When restarting local Supabase, run `supabase db reset` or `supabase migration up` to apply all pending migrations before running E2E tests.

**Warning signs:** Local E2E fails with "relation does not exist" errors; `supabase status` shows container as not running.

### Pitfall 4: `document_template` Column Missing from `user_settings` in Phase 1 Migration

**What goes wrong:** The `user_settings` table defined in `202604051800_phase1_foundation.sql` does NOT include a `document_template` column. That column was added in `202604060330_phase21_document_template.sql`. If Phase 1 migration is applied in isolation, `user_settings` reads that reference `document_template` will fail.

**Why it happens:** The column was added in a Phase 2.1 migration.

**How to avoid:** When running Phase 1 in isolation or on a fresh database, apply all three migrations in sequence. The planner must note that Phase 1 schema verification requires all three migrations.

**Warning signs:** Settings page throws "column user_settings.document_template does not exist" error.

### Pitfall 5: `lucide-react` Package Missing Internal Files

**What goes wrong:** Local `pnpm build` may fail with missing `dist/esm/shared/src/` files under `lucide-react@0.542.0`. This is a known workspace artifact.

**Why it happens:** The installed `lucide-react` package has incomplete dist files in the local node_modules (documented in MEMORY.md). Vercel builds are unaffected.

**How to avoid:** Use Vercel build as the authoritative build signal, not local `pnpm build`. For local validation, use `pnpm typecheck` + `pnpm lint` + `pnpm test` instead of a full build.

**Warning signs:** `pnpm build` fails with lucide import errors locally; Vercel deploy succeeds with the same source.

### Pitfall 6: Onboarding Wizard Not Triggered After Auth Redirect

**What goes wrong:** A new user signs up, Supabase sends a verification email (when email confirmation is enabled), the user is not immediately redirected to `/app`, and the wizard never shows.

**Why it happens:** `signUpAction` only redirects when `data.session` is truthy (immediate session available). When email confirmation is required, `data.session` is null and the action returns a "Check your inbox" message. The hosted Supabase is configured for immediate sign-up (no confirmation gate), but a configuration change could break this.

**How to avoid:** Ensure hosted Supabase "Confirm email" setting remains disabled for immediate session creation. The E2E test covers this: it `Promise.race`s between URL redirect and the confirmation message, so both paths are tolerated.

**Warning signs:** Sign-up returns success message rather than redirecting; `profiles` table does not have a row for the new user until email click.

---

## Code Examples

### Auth Guard Pattern (Server Component)

```typescript
// src/app/(app)/app/layout.tsx — authoritative server-side auth check
import { getAppContext } from "@/lib/data";

export default async function ProtectedLayout({ children }) {
  const context = await getAppContext();
  // context.email is undefined when not authenticated — middleware redirects first
  // but layout also guards for cases middleware misses (configured=false)
  if (context.configured && !context.email) {
    redirect("/sign-in");
  }
  return <AppShell context={context}>{children}</AppShell>;
}
```

### Supabase SSR Client (Server Component / Server Action)

```typescript
// src/lib/supabase/server.ts pattern
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createSupabaseServerClient() {
  const cookieStore = await cookies();
  return createServerClient(url, key, {
    cookies: {
      getAll() { return cookieStore.getAll(); },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) =>
          cookieStore.set(name, value, options)
        );
      },
    },
  });
}
```

### Post-Onboarding Redirect Pattern (Gap to Fill)

```typescript
// In OnboardingWizard completeOnboarding handler (client component)
import { useRouter } from "next/navigation";

const router = useRouter();
const completeOnboarding = () => {
  startTransition(async () => {
    const result = await completeOnboardingAction();
    if (result?.status === "error") {
      setFeedback(result.message ?? "");
    } else {
      // D-09: redirect into create-first-invoice rather than generic dashboard
      router.push("/app/get-started/create-invoice");
    }
    setPendingStep("");
  });
};
```

### Bottom-Tab Nav Pattern (Gap to Fill)

```typescript
// New fixed bottom nav for mobile — replaces/supplements current scroll nav
// Place in AppShell, rendered only below lg breakpoint
<nav className="fixed bottom-0 inset-x-0 z-30 lg:hidden border-t border-black/8 bg-surface pb-safe">
  <div className="flex items-stretch justify-around h-16">
    {mobileTabItems.map(item => (
      <Link key={item.key} href={item.href}
        className={cn("flex flex-col items-center justify-center gap-1 px-3 text-xs",
          isActive ? "text-accent-strong" : "text-muted"
        )}
      >
        <Icon className="size-5" />
        <span>{item.label}</span>
      </Link>
    ))}
  </div>
</nav>
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `@supabase/auth-helpers-nextjs` | `@supabase/ssr` | ~2023, mandated for Next.js 15 | `createServerClient` replaces all helper factories |
| `getSession()` for auth decisions | `getUser()` for authoritative checks | Next.js 15 + Supabase SSR docs | `getSession()` is JWT-only (can be spoofed); `getUser()` validates server-side |
| Pages Router `getServerSideProps` | App Router Server Components + Server Actions | Next.js 13+, stable in 15 | Data fetching and mutations are collocated with components |
| `cookies()` / `headers()` as sync | Async `cookies()` / `headers()` (must be awaited) | Next.js 15 | Breaking change — existing code correctly awaits these |
| Zod v3 `.email()` | Zod v4 `.email()` (same API surface for basic use) | Zod v4 (installed) | No breaking changes for simple `.email()` without message arg |

**Deprecated/outdated:**
- `@supabase/auth-helpers-nextjs`: replaced by `@supabase/ssr`. Not in this project.
- `next/headers` sync cookies: deprecated in Next.js 15. The project's `createSupabaseServerClient` correctly awaits `cookies()`.

---

## Open Questions

1. **D-09 navigation target: `/app/get-started/create-invoice` or `/app/invoices/new`?**
   - What we know: Both routes exist. `/app/get-started/create-invoice` is a dedicated page. `/app/invoices/new` is the real invoice builder.
   - What's unclear: Whether the "get-started" route is intentionally a simpler entry than the full builder, or a placeholder.
   - Recommendation: Read `src/app/(app)/app/get-started/create-invoice/page.tsx` before implementing D-09; if it's a meaningful onboarding-specific flow, use it; otherwise redirect to `/app/invoices/new`.

2. **D-16 bottom-tab item for "New Invoice" vs. existing nav items**
   - What we know: Current `appNavItems` has Dashboard, Invoices, Quotations, Clients, Settings. D-16 wants: Invoices, Clients, New Invoice, Quotation, Settings — no Dashboard tab.
   - What's unclear: Should Dashboard be accessible only via desktop sidebar when mobile shows a 5-tab bottom bar that excludes it?
   - Recommendation: Mobile bottom tab can exclude Dashboard (it's accessible via the brand logo link in the header). The tab bar items should be Invoices, Quotations, Clients, Settings + a centered FAB-style "New Invoice" primary action button.

3. **Install prompt placement after onboarding (D-19)**
   - What we know: `InstallPromptButton` component exists but is not shown post-onboarding yet.
   - What's unclear: Where exactly post-onboarding to surface it — as part of the get-started page, or as a dismissable banner on first app visit after onboarding?
   - Recommendation: Add install prompt to the get-started/create-invoice page or as a one-time banner in the AppShell when `onboardingComplete && !installedAsPWA`.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Build, tests | Yes | v22.20.0 | — |
| pnpm | Package management | Yes | (workspace) | — |
| Supabase CLI | Local DB, migrations | Yes | 2.84.2 | — |
| Local Supabase Docker | E2E tests | No — container stopped | — | Use hosted Supabase via PLAYWRIGHT_BASE_URL |
| Vercel CLI | Deployment verification | Not checked | — | Deploy via GitHub push to trigger Vercel CI |
| Playwright (Chromium) | E2E suite | Yes (installed via devDeps) | ^1.59.1 | — |
| Vitest | Unit tests | Yes | ^3.2.4 | — |

**Missing dependencies with no fallback:**
- None blocking for code/plan work.

**Missing dependencies with fallback:**
- Local Supabase Docker (stopped): E2E tests that use `createConfirmedUser()` (service-role admin API) target `https://{projectRef}.supabase.co` (hosted). If local container is needed, run `supabase start` first and verify migrations.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 3.2.4 (unit) + Playwright 1.59.1 (E2E) |
| Unit config file | `vitest.config.ts` |
| E2E config file | `playwright.config.ts` |
| Unit run command | `pnpm test` (runs `vitest run`) |
| E2E run command | `pnpm test:e2e` (requires dev server or PLAYWRIGHT_BASE_URL) |
| Full suite (unit) | `pnpm test` — currently 10 tests, 3 files, all passing |

### Current Test State

All 10 Vitest unit tests pass (verified 2026-04-06):
- `src/lib/billing-utils.test.ts` — 4 tests: totals math, slug generation, document number formatting, quotation-to-invoice mapping
- `src/lib/document-templates.test.ts` — 3 tests: template resolution, preview payload, totals stability
- `src/components/ui/button.test.ts` — 3 tests: ghost variant contrast, inverse variant, badge default contrast

Playwright E2E suite has 3 tests (requires running dev server + active Supabase):
- Sign-up surface submits and redirects or confirms verification
- Shell shortcuts and empty states route into live surfaces
- Critical client → quotation → invoice flow stays template-consistent

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| AUTH-01 | Sign-up form submits and creates account | E2E (smoke) | `pnpm test:e2e --grep "sign-up"` | Yes — `e2e/app-flow.spec.ts` |
| AUTH-02 | Sign-in persists session across reload | E2E (smoke) | `pnpm test:e2e --grep "sign-in"` | Partial — covered by `signIn()` helper; no explicit persistence test |
| AUTH-03 | Sign-out clears session and redirects | E2E (manual) | Manual — no dedicated test | No — Wave 0 gap |
| AUTH-04 | Unauthenticated access to /app redirects to sign-in | Unit (middleware logic) | `pnpm test` (middleware unit) | No — Wave 0 gap |
| ONB-01 | New user sees onboarding wizard, not blocked shell | E2E | `pnpm test:e2e --grep "sign-up"` | Partial — enters app but wizard visibility not asserted |
| ONB-02 | Business profile step saves name, email, phone, address | E2E (integration) | Manual + E2E | Partial — no dedicated onboarding step test |
| ONB-03 | Logo/signature upload persists to Storage | E2E (integration) | Manual | No — Wave 0 gap |
| ONB-04 | Brand color input updates live preview color | Unit (preview builder) | `pnpm test` | Partial — template tests exist, color test missing |
| ONB-05 | Currency/tax/terms/notes defaults save correctly | Unit (action schema) | `pnpm test` | Partial — covered by defaults schema but no persistence test |
| SET-01 | Business profile fields persist via settings | E2E | Manual | No — Wave 0 gap |
| SET-02 | Invoice prefix / quotation prefix / tax settings save | E2E | `pnpm test:e2e --grep "defaults"` | Partial — defaults tab covered in template flow test |
| UX-01 | App shell usable at 375px width | E2E (viewport) | Manual + E2E with mobile viewport | No — Wave 0 gap |
| D-09 gap | Post-onboarding redirects to create-first-invoice | E2E | New test needed | No — Wave 0 gap |
| D-16 gap | Bottom-tab nav visible and functional at mobile width | E2E (viewport) | New test needed | No — Wave 0 gap |

### Sampling Rate

- **Per task commit:** `pnpm test` (unit suite — 10 tests, ~28ms runtime after warmup)
- **Per wave merge:** `pnpm test && pnpm typecheck && pnpm lint`
- **Phase gate:** All unit tests green + manual verification on mobile viewport + Vercel deploy verified before `/gsd:verify-work`

### Wave 0 Gaps

The following test gaps should be addressed as early tasks in the plan:

- [ ] `src/lib/supabase/middleware.test.ts` — unit test for route protection logic (AUTH-04): unauthenticated `/app` request → redirect to `/sign-in`; authenticated `/sign-in` request → redirect to `/app`
- [ ] `src/lib/setup.test.ts` — unit tests for `deriveSetupProgress()` covering all completion states and the `readyForCompletion` edge case
- [ ] `src/actions/auth.test.ts` — unit tests for Zod schema validation in `signInSchema`, `signUpSchema` (validation-layer only, no Supabase call needed)
- [ ] E2E: Add sign-out test to `e2e/app-flow.spec.ts` (AUTH-03)
- [ ] E2E: Add mobile viewport assertion for bottom-tab nav (UX-01 / D-16) once bottom nav is implemented
- [ ] E2E: Add post-onboarding redirect assertion (ONB-01 / D-09) once redirect is implemented

---

## Project Constraints (from CLAUDE.md)

The project's `AGENTS.md` contains one critical directive:

> "This is NOT the Next.js you know. This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices."

**Enforcement in Phase 1 planning:**
- The installed version is Next.js 15.5.14 (post-cutoff)
- Async `cookies()`, async `headers()`, async `params`/`searchParams` are all required — existing code already uses these correctly
- There is no `node_modules/next/dist/docs/` directory in this project (it does not ship docs in dist). The intent of the directive is: treat training data about Next.js as potentially stale; verify actual behavior against the installed version.
- Typed routes (`typedRoutes: true` in `next.config.ts`) are enabled — all `href` values in `<Link>` require proper `Route` typing

**Design workflow rule (from MEMORY.md):**
- All frontend design work must start with `aidesigner-frontend`, then `ui-ux-pro-max`
- This is a project-level rule enforced for all UI-bearing phases
- The planner MUST include this as a prerequisite task before any new UI component implementation

**Stack mandate:** Next.js App Router + TypeScript + Tailwind CSS v4 + shadcn/ui + Supabase Auth/Postgres + Vercel + GitHub. No deviations.

---

## Sources

### Primary (HIGH confidence)

- Direct codebase audit — all files in `src/`, `supabase/migrations/`, `e2e/`, configuration files read directly
- `MEMORY.md`, `CONTEXT.md`, `REQUIREMENTS.md`, `ROADMAP.md`, `PROJECT.md` — read directly

### Secondary (MEDIUM confidence)

- Supabase `@supabase/ssr` documentation patterns — inferred from existing working code in `src/lib/supabase/`
- Next.js 15 App Router patterns — inferred from existing working code; training data treated as hypothesis per AGENTS.md directive

### Tertiary (LOW confidence)

- Bottom-tab nav implementation approach — based on Tailwind utility patterns; no external source consulted, standard CSS pattern

---

## Metadata

**Confidence breakdown:**
- What already exists: HIGH — read directly from source files
- Gap identification (D-09, D-16): HIGH — confirmed by code audit
- Test gaps: HIGH — confirmed by test file inventory
- Schema/migration state: HIGH — all migration files read
- Bottom-tab implementation approach: MEDIUM — standard pattern, no verification against Next.js 15 specifics needed
- Hosted Supabase state: MEDIUM — based on MEMORY.md (may have changed since last update)

**Research date:** 2026-04-06
**Valid until:** 2026-05-06 (stable stack, 30-day validity)
