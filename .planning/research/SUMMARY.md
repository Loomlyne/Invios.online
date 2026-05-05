# Project Research Summary

**Project:** Invios v1.2 — Settings UX Redesign
**Domain:** SaaS settings — sidebar navigation, monolith decomposition, avatar upload, notification preferences
**Researched:** 2026-04-15
**Confidence:** HIGH

## Executive Summary

Invios v1.2 converts a 629-line monolithic `SettingsWorkspace` with four horizontal tabs into a sidebar-based settings hub with eight dedicated sections. The research confirms this is a well-understood pattern in SaaS (Linear, Vercel, Stripe all follow it) with clear conventions: vertical left sidebar, per-section URL deep-linking via `?section=X`, and independent save state per section. The entire redesign is buildable on the existing stack with one new dependency — `@radix-ui/react-avatar` for the Profile tab avatar.

The recommended architecture uses a single server-rendered `settings/page.tsx` that loads `getAppContext()` once, then delegates section switching to client-side `useState` with `router.replace` for URL sync. This avoids re-fetching Supabase on every tab click while preserving deep-linkable URLs. The `BrandingWorkspace` is absorbed into the settings hub and the `/app/branding` route becomes a redirect — eliminating the current dual-entry-point problem.

The key risks are architectural drift back toward a monolith, a split-brain at `/app/branding` if the redirect is deferred, and mobile section switching being left as `hidden lg:flex` with no fallback. All three are preventable if the foundational phase (type system, shell, sidebar, mobile pattern) is locked before any section content is written.

## Key Findings

### Recommended Stack

The existing stack handles all requirements. Next.js 15.5.14 App Router with Server Actions, Tailwind 4, shadcn/ui, `@radix-ui/react-switch`, `react-hook-form 7.72.1`, `zod 4.3.6`, and Supabase Storage are all installed and sufficient. One new primitive is needed: `@radix-ui/react-avatar` for avatar image plus initials fallback on the Profile tab.

**Core technologies:**
- `@radix-ui/react-avatar` (new): Avatar display with initials fallback — not currently installed, add with `pnpm dlx shadcn@latest add avatar`
- `@radix-ui/react-switch` (existing): Notification toggles in Emails tab — already installed, underused
- `react-hook-form` + `zod` (existing): Per-section form validation — replaces current manual `isDirty` diff detection
- Supabase Storage `branding-assets` bucket (existing): Avatar upload follows the same `uploadFileToStorage` pattern already used for logo/signature
- `vaul` (existing): Mobile drawer for section picker if needed — already installed

Do not add: shadcn Sidebar component, `@radix-ui/react-navigation-menu`, `react-dropzone`, `react-image-crop`, `framer-motion`, `focus-trap-react`, Stripe.js, or any data-fetching layer.

### Expected Features

**Must have (table stakes):**
- Vertical sidebar navigation with `aria-current="page"` — all best-in-class SaaS uses left-side nav for 5+ sections
- Per-section URL routing via `?section=X` — deep-link bookmarkability from email notifications
- Per-section independent Save — global save is the primary UX problem in the current monolith
- Profile tab consolidating name, avatar, password, danger zone — standard single identity section
- Branding absorbed into settings with `/app/branding` redirect — one mental model for configuration
- Business Info as a dedicated tab — personal vs. business vs. payment are three distinct concerns
- Mobile-responsive section switching — current `lg:hidden` shortcut card is an acknowledged workaround
- Inline save feedback with `aria-live` — toasts are missed; inline is the standard

**Should have (competitive):**
- Per-event email notification toggles (`invoice_sent`, `invoice_viewed`, `payment_recorded`, etc.) using Switch components, saved explicitly per section
- Integrations placeholder with "Coming soon" cards — builds trust and manages expectations
- Billing tab with current plan display — users expect to know their plan status
- Avatar upload with initials fallback — Linear/Vercel/Notion standard
- Date format preference (`DD/MM/YYYY` vs. `YYYY-MM-DD`) — UAE users require this
- Separate document numbering for invoices vs. quotes — `quote_prefix` + `next_quote_number` in `user_settings`

**Defer (v2+):**
- Dark mode — full token audit, HSL system makes this a major redesign, not a CSS variable swap
- Two-factor authentication — Supabase MFA enrollment flow is a separate auth surface
- Live integrations (Xero, QuickBooks, Zapier) — OAuth connection management is out of scope
- Live billing/Stripe — payment integration is OPS-06, deferred
- Notification digest preferences — requires email scheduling infrastructure

### Architecture Approach

The settings surface uses a single server page that fetches all context once, then delegates UI to a client-side shell. `settings/page.tsx` (Server Component) calls `getAppContext()` and passes the result to `SettingsShell`. The shell owns `activeSection` as `useState`, renders `SettingsSidebar` alongside the active panel, and syncs the URL via `router.replace`. Section switching is instant with no additional Supabase round-trips. Each panel is self-contained: owns its own dirty state via `useRef` snapshot, its own loading state, and calls its own Server Action on Save.

**Major components:**
1. `settings-shell.tsx` — layout owner: sidebar + panel slot, `activeSection` state, URL sync
2. `settings-sidebar.tsx` — pure presentational nav, `aria-current`, emits section changes
3. `panels/` (7 files) — one file per section, each self-contained with own save logic
4. `shared/settings-section.tsx` — `Section` and `Field` primitives promoted from current monolith
5. `src/lib/types.ts` — `SETTINGS_SECTIONS` const array as single source of truth for type and `validSections` Set

### Critical Pitfalls

1. **Global dirty state shared across sections** — commit to per-section independent save before writing any panel. Never share `isDirty` or `saving` state across section boundaries. Warning sign: a `useRef` defined at shell level but mutated inside a panel.

2. **Branding split-brain at `/app/branding`** — add `redirect('/app/settings?section=branding')` to the old `page.tsx` on day one of the Branding phase, before tab content is complete. Audit all `href="/app/branding"` references in the same phase.

3. **`SettingsSection` type and `validSections` Set diverging silently** — use a `SETTINGS_SECTIONS = [...] as const` array as the single source of truth, derive both the TypeScript union and the Set from it.

4. **Mobile sidebar collapses to nothing** — decide and stub the mobile pattern in Phase 1 before writing any section content. Recommended: full-width section list at `/app/settings` root on mobile; sidebar on `lg+`. Never use `overflow-x: auto` on the sidebar.

5. **`router.push` pollutes browser history for section switching** — use `router.replace` in all sidebar click handlers. Prevents the back-button trap.

6. **Avatar upload using wrong storage path or signed URL strategy** — use `avatars/{userId}/avatar.{ext}` separate from branding assets, sign the URL in `getAppContext`, use `URL.createObjectURL(file)` for client-side preview.

7. **Notification toggles firing a Server Action per flip** — toggles update local state only; one explicit Save button commits all preferences.

## Implications for Roadmap

Based on combined research, the natural phase structure follows the build-order dependency chain identified in ARCHITECTURE.md:

### Phase 1: Foundation — Type System, Shell, and Sidebar

**Rationale:** Every other section depends on this. The `SettingsSection` type, the `validSections` Set, the shell layout, the sidebar nav, and the mobile section-switching pattern must exist and be correct before any content panel is written. Pitfalls 3, 4, and 5 (type divergence, mobile collapse, history pollution) are all Phase 1 problems that cascade into every subsequent phase if not fixed here.

**Delivers:** Working settings shell with sidebar navigation, `?section=X` URL sync via `router.replace`, mobile section picker stub, `SETTINGS_SECTIONS` const array as single source of truth, `Section`/`Field` shared primitives extracted from the monolith.

**Addresses:** SET-01 (vertical sidebar nav + URL routing)

**Avoids:** Pitfalls 3, 4, 5

**Research flag:** Standard patterns — no additional research needed.

---

### Phase 2: Branding Tab Consolidation

**Rationale:** Branding is the highest-complexity existing panel (file uploads, live preview, custom fonts, template selection). It must be migrated, not rebuilt. The redirect from `/app/branding` goes in on day one of this phase to prevent the split-brain. Doing this in Phase 2 means the redirect is live early and the mobile nav is already correct from Phase 1.

**Delivers:** `BrandingPanel` (colors, logo, fonts, templates) and `BusinessInfoPanel` (business details, bank info) inside the settings shell. `/app/branding` returns 301. `branding-workspace.tsx` deleted. Nav references updated.

**Addresses:** SET-03 (Branding tab), SET-04 (Business Info tab)

**Avoids:** Pitfall 2 (branding split-brain), Pitfall 8 (file upload ref detaching on re-render)

**Research flag:** Standard patterns — `BrandingWorkspace` is a direct migration.

---

### Phase 3: Profile Tab with Avatar Upload

**Rationale:** Profile tab requires the one new dependency (`@radix-ui/react-avatar`), a new Server Action (`saveProfileAction` split from `saveGeneralSettingsAction`), a new upload action (`uploadAvatarAction`), and a Supabase Storage path decision. Doing this after Branding means the upload pattern is validated in production context before avatar adds its own wrinkle (client-side preview via `createObjectURL`).

**Delivers:** `ProfilePanel` with name, email (read-only), avatar upload + initials fallback, hourly rate field, password change, sign out, danger zone. `profiles.avatar_url` populated and signed in `getAppContext`.

**Addresses:** SET-02 (Profile tab)

**Avoids:** Pitfall 3 (avatar in wrong storage bucket), Pitfall 8 (file input ref)

**Research flag:** Avatar storage bucket config needs verification before implementation — confirm RLS policy for avatar paths.

---

### Phase 4: General and Emails Tabs + Schema Migration

**Rationale:** General tab is a restructuring of existing fields plus two new `user_settings` columns. Emails tab requires a schema migration (5 new boolean columns) that must run before toggles can be functional. Grouping these allows one migration PR for both. Pitfall 6 (toggles firing per-flip) is the key risk here.

**Delivers:** `GeneralPanel` with date format, per-type doc numbering, restructured preferences. `EmailsPanel` with per-event notification toggles. Supabase migration adding `date_format`, `quote_prefix`, `next_quote_number`, `invoice_sent`, `invoice_viewed`, `payment_recorded`, `quotation_accepted`, `reminder_sent` columns.

**Addresses:** SET-05 (General tab), SET-06 (Emails tab)

**Avoids:** Pitfall 1 (global dirty state), Pitfall 6 (concurrent toggle saves)

**Research flag:** Standard patterns — no additional research needed.

---

### Phase 5: Integrations and Billing Placeholders + Monolith Cleanup

**Rationale:** These are stubs — low complexity, no backend. Do them last so they do not block real work. This phase is also the cleanup phase: delete `settings-workspace.tsx` and `branding-workspace.tsx`, verify no remaining imports, run full accessibility audit.

**Delivers:** `IntegrationsPanel` with "Coming soon" card grid. `BillingPanel` with current plan display. `settings-workspace.tsx` and `branding-workspace.tsx` deleted. Accessibility audit complete.

**Addresses:** SET-07 (Integrations), SET-08 (Billing)

**Research flag:** No research needed — static content only.

---

### Phase Ordering Rationale

- Phase 1 must be first: type system and shell are the load-bearing foundation; no panel can exist without them.
- Phase 2 before Phase 3: migration work (Branding) should validate before new work (avatar) to avoid compounding unknowns.
- Phase 4 groups General + Emails because they share a schema migration; one Supabase PR is cleaner than two.
- Phase 5 is last: stubs and cleanup have no dependents and benefit from deferral (less merge risk).
- The monolith (`settings-workspace.tsx`) stays alive until Phase 5 as a reference and safety net. Delete only when all panels are verified.

### Research Flags

Phases needing deeper research during planning:
- **Phase 3 (Avatar upload):** Supabase Storage bucket config — confirm RLS policy for avatar paths before writing `uploadAvatarAction`. Determine whether to extend `branding-assets` bucket with an `avatars/` prefix or create a separate bucket.

Phases with standard patterns (no research-phase needed):
- **Phase 1:** Shell + sidebar pattern is direct port of existing `SettingsWorkspace` structure to a vertical layout.
- **Phase 2:** Branding migration is a file move + component extraction — existing `BrandingWorkspace` code is the spec.
- **Phase 4:** General tab is a restructure; Emails tab is new toggles with an explicit Save.
- **Phase 5:** Static content + file deletion.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Verified against actual `package.json` and `node_modules/@radix-ui/` — not training assumptions |
| Features | HIGH | Existing codebase fully audited; Linear/Vercel/Stripe patterns confirmed |
| Architecture | HIGH | Based on live code reading of all affected files; build order derived from actual import graph |
| Pitfalls | HIGH | Grounded in reading the actual `settings-workspace.tsx` (629 lines) and `branding-workspace.tsx` |

**Overall confidence:** HIGH

### Gaps to Address

- **Avatar storage bucket RLS policy:** Research confirms the pattern but not the exact bucket config for avatars. Verify during Phase 3 planning: does `branding-assets` allow `avatars/{userId}` paths, or is a new bucket needed?
- **`@radix-ui/react-dropdown-menu` merge timing:** Added on `claude/pensive-greider` branch (not yet merged). Phase 3 should check whether this branch has merged before adding the dep again.
- **Emails tab schema migration timing:** The per-event boolean columns in `user_settings` must be provisioned in Supabase before the Emails tab can be functional. Run the migration at the start of Phase 4, not the end.

## Sources

### Primary (HIGH confidence)
- `src/components/app/settings-workspace.tsx` — monolith under refactor; source of current dirty state, saveAll, validSections pattern
- `src/components/app/branding-workspace.tsx` — route being consolidated; source of upload ref pattern
- `src/app/(app)/app/settings/page.tsx` — searchParams + validSections Set
- `src/lib/types.ts` — SettingsSection, BrandingSection union types
- `src/actions/app.ts`, `src/actions/auth.ts` — all save actions, upload patterns
- `src/lib/data.ts` — `getAppContext()` coverage
- `package.json` — verified installed packages (2026-04-15)
- `node_modules/@radix-ui/` — verified installed Radix primitives (2026-04-15)

### Secondary (MEDIUM confidence)
- Linear Changelog — Personalized sidebar and new settings pages, Dec 2024
- Linear — How we redesigned the Linear UI
- Vercel — New dashboard navigation + Feb 2026 rollout
- shadcn/ui — Vertical Tabs Layout Pattern, Account Danger Zone block
- W3C WAI-ARIA Practices Guide — sidebar nav, switch role, alertdialog

### Tertiary (LOW confidence)
- Project memory `technical_v11_research.md` — `next/dynamic+ssr:false` pattern for InvoicePreview (applicable to Branding panel)
- Project memory `project_v11_avatar_menu.md` — `@radix-ui/react-dropdown-menu` added on pensive-greider branch

---
*Research completed: 2026-04-15*
*Ready for roadmap: yes*
