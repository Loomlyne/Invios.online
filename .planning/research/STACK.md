# Stack Research: v1.2 Settings UX Redesign

**Domain:** Settings UX — vertical sidebar navigation, avatar upload, notification toggles, integrations page, billing page
**Researched:** 2026-04-15
**Confidence:** HIGH (all conclusions grounded in the actual installed package.json and codebase, not training assumptions)

---

## Existing Stack (verified, do not re-evaluate)

| Technology | Installed Version | Role |
|------------|------------------|------|
| Next.js | 15.5.14 | App Router, Server Actions |
| React | 19.2.0 | UI |
| TypeScript | ^5 | Language |
| Tailwind CSS | ^4 | Styling |
| shadcn/ui | default style, stone base | Component layer |
| `@radix-ui/react-switch` | 1.2.6 | Toggle/switch primitives |
| `@radix-ui/react-tabs` | 1.1.13 | Current horizontal tabs (will be replaced) |
| `@radix-ui/react-dialog` | 1.1.15 | Modals |
| `@radix-ui/react-label` | 2.1.7 | Form labels |
| `@radix-ui/react-slot` | 1.2.3 | Button asChild pattern |
| react-hook-form | 7.72.1 | Form state |
| zod | 4.3.6 | Schema validation |
| `@hookform/resolvers` | 5.2.2 | RHF + Zod bridge |
| Supabase Storage (`branding-assets` bucket) | — | Already handles logo/cover uploads |
| vaul | 1.1.2 | Mobile drawer (existing) |
| lucide-react | 0.469.0 | Icons |

Installed Radix primitives are exactly: `react-dialog`, `react-label`, `react-slot`, `react-switch`, `react-tabs`. No others are present in `node_modules/@radix-ui/`.

---

## New Capabilities Needed and Their Stack

### 1. Sidebar Navigation

**Verdict: no new dependency required.**

The vertical settings sidebar is a styled navigation list, not a complex routed structure. It is a `<nav>` with `<button>` or `<Link>` items and an `activeSection` state — the same pattern as the existing horizontal `<Tabs>` but rendered vertically.

Do NOT reach for:
- `@radix-ui/react-navigation-menu` — that primitive is for top-level site navigation with popovers and keyboard-navigated mega-menus. Settings sidebar has none of those needs.
- shadcn `Sidebar` component — it is a full sidebar-with-collapsible-groups component that ships 500+ lines of context, cookie persistence, and keyboard shortcuts. It targets app shells, not a settings panel.

**Implementation:** Build a `SettingsSidebar` as a plain Tailwind `nav` component with `aria-current="page"` on the active item. Use `router.push('?section=X')` or local `useState` for active section — the existing `page.tsx` searchParam pattern already handles this. Keyboard navigation is automatic because `<button>` elements are natively focusable and the browser handles arrow key tab order correctly for a list.

**ARIA pattern:** `role="navigation"` on the `<nav>`, `aria-label="Settings navigation"`, `aria-current="page"` on the active item. No additional library needed.

### 2. Switch/Toggle Components for Notification Preferences

**Verdict: already installed, just not used consistently.**

`@radix-ui/react-switch` 1.2.6 is installed and a `Switch` shadcn component exists at `src/components/ui/switch.tsx`. The current notifications tab uses bare `<input type="checkbox">` with `accent-black`. For the redesigned Emails tab with per-event notification toggles, replace those checkboxes with the existing `<Switch>` component.

No new dependency. The `Switch` component already has correct focus ring, accessible checked state via `data-[state=checked]`, and is keyboard operable.

### 3. Avatar Upload

**Verdict: no new library needed — reuse the existing Supabase Storage upload pattern.**

The project already uploads files to the `branding-assets` Supabase Storage bucket via Server Actions in `src/actions/app.ts` (logo and cover image uploads). Avatar upload follows the exact same pattern:

1. `<input type="file" accept="image/*">` in a `'use client'` component
2. `FormData` submission to an existing-pattern Server Action
3. Supabase Storage `.upload()` to `branding-assets` bucket (or a new `avatars` bucket — same API)
4. Store the returned public URL in the user's profile row

**Do NOT add:**
- `react-dropzone` — overkill for a single avatar upload; the drag-and-drop affordance adds zero value on a settings page where users click to pick a file
- `react-image-crop` or `cropperjs` — cropping is a nice-to-have, not required for v1.2; a simple square-fit CSS transform on display is enough
- Any dedicated upload component library

**Avatar display:** Use `@radix-ui/react-avatar` for the avatar image + fallback initials pattern. This primitive is NOT currently installed. Add it.

```
pnpm add @radix-ui/react-avatar
```

Then scaffold `src/components/ui/avatar.tsx` following the shadcn avatar pattern (or use `pnpm dlx shadcn@latest add avatar`). The component handles image load errors and falls back to initials automatically — exactly what the profile tab needs.

Note: `@radix-ui/react-dropdown-menu` was added on branch `claude/pensive-greider` for the header avatar menu but has not yet merged into this worktree. When it merges, `package.json` will gain that dep. Do not re-add it if it is already present after merge.

### 4. Form Validation in Settings Sections

**Verdict: react-hook-form + zod are already installed. Use them for sections that have commit-on-save forms.**

The current `settings-workspace.tsx` uses uncontrolled `useState` mutation + manual diff detection for dirty state. For the redesigned per-section forms (Profile, Business Info, General), use `react-hook-form` with `useForm` + `zodResolver`. This eliminates the manual `isDirty` ref comparison and gives per-field error display.

No new dependency. `react-hook-form` 7.72.1 + `@hookform/resolvers` 5.2.2 + `zod` 4.3.6 are all installed.

**Zod 4 note:** The project runs Zod 4.3.6. Zod 4 has a new top-level import path style (`import { z } from "zod"` is unchanged) but some internal schema types changed. The `@hookform/resolvers` 5.2.2 supports Zod 4 — this was a breaking change in resolvers v5. No version conflicts.

### 5. Integrations Page

**Verdict: no new library needed.**

The integrations page for v1.2 is a display/management surface — it lists connected services and provides connect/disconnect buttons. No OAuth flows are in scope (AUTH-05 is deferred). The page is a `Card` grid with status indicators.

Use existing: `Card`, `Badge`, `Button`, `Dialog` (for disconnect confirmation). All installed.

### 6. Billing/Subscription Page

**Verdict: no new library needed for display; payment provider integration is a future concern.**

The billing page for v1.2 shows plan information and a "manage subscription" affordance. Actual Stripe/payment integration is out of scope for this milestone (OPS-06 deferred). The page is a static display with a plan card and upgrade CTA.

Use existing: `Card`, `Badge`, `Button`. No new dependencies.

### 7. Accessibility — Focus Management and Keyboard Navigation

**Verdict: no new library needed.**

The sidebar navigation pattern with `aria-current`, `role="navigation"`, and native `<button>` elements satisfies WCAG 2.1 AA for keyboard navigation. Radix primitives (`Switch`, `Dialog`) already handle focus trapping and roving tabindex internally.

For section-to-section focus management when the sidebar is used, `useRef` + `element.focus()` on section mount is sufficient. Do NOT add a focus management library (`focus-trap-react`, `tabbable`) — Radix Dialog already wraps its own focus trap and the settings sidebar does not need one.

---

## New Dependencies to Add (complete list)

| Package | Version | Why | Install |
|---------|---------|-----|---------|
| `@radix-ui/react-avatar` | latest (^1.1.x) | Avatar image + initials fallback for Profile tab | `pnpm add @radix-ui/react-avatar` |

**That's it.** One new package.

Then scaffold the shadcn wrapper:
```bash
pnpm dlx shadcn@latest add avatar
```

This adds `src/components/ui/avatar.tsx` with `Avatar`, `AvatarImage`, `AvatarFallback` — ready to use.

---

## What NOT to Add

| Package | Why Not |
|---------|---------|
| `shadcn/ui Sidebar` component | Full app-shell sidebar with collapsible groups, cookie persistence, keyboard shortcuts. Settings sidebar is a simple `<nav>` list — this is 10x the complexity needed. |
| `@radix-ui/react-navigation-menu` | Designed for top-level site navigation with submenus and hover states. Irrelevant for a settings section picker. |
| `react-dropzone` | Avatar upload is a single file, single click. The browser native `<input type="file">` is sufficient. |
| `react-image-crop` | Image cropping is not in scope for v1.2 profile tab. CSS `object-fit: cover` on a fixed avatar circle is enough. |
| `focus-trap-react` | Radix Dialog already handles focus trapping. The sidebar nav uses native focusable elements. |
| `framer-motion` | The existing design system uses CSS transitions and GSAP (already installed). Do not add another animation dependency. |
| `react-query` / `swr` | Settings data is loaded once per page via RSC + `getAppContext`. No real-time subscription or cache-invalidation complexity exists here. |
| Any billing SDK (Stripe.js, etc.) | Billing page for v1.2 is display-only. OPS-06 payment integration is deferred. |

---

## Integration Notes with Existing Design System

**Sidebar active state:** Use `data-[active=true]` attribute on sidebar items and wire it with `[data-active=true]:bg-accent/10 [data-active=true]:text-accent-strong` Tailwind selectors — consistent with the existing `data-[state=checked]` pattern from Radix Switch.

**Switch component for notifications:** The existing `Switch` at `src/components/ui/switch.tsx` uses `data-[state=checked]:bg-foreground` (black when on). For notification toggles this is correct — checked = enabled = black. No restyling needed.

**Avatar fallback:** Use `bg-accent/15 text-accent-strong` for the initials fallback circle — matches the existing avatar menu pattern established on `claude/pensive-greider`.

**Mobile layout:** On mobile (below `lg`), the sidebar collapses and sections become a scrollable single-column layout. Use existing `vaul` Drawer for the mobile section picker if needed, consistent with the existing mobile sheet patterns in the app. Alternatively a simple `<select>` picker is acceptable for v1.2 and keeps complexity low.

---

## Alternatives Considered

| Category | Recommended | Alternative | Why Not Alternative |
|----------|-------------|-------------|---------------------|
| Sidebar nav | Plain `<nav>` with Tailwind | shadcn Sidebar component | shadcn Sidebar is an app-shell component with 500+ lines of collapsible state, cookie persistence, and keyboard shortcuts. Settings sidebar is a simple list. |
| Avatar display | `@radix-ui/react-avatar` | CSS-only initials circle | Radix Avatar handles image load errors and graceful fallback — the CSS-only approach breaks when an avatar image URL 404s. |
| File upload | Native `<input type="file">` | `react-dropzone` | Single-file upload for a settings field does not benefit from drag-and-drop UX. |
| Form state | react-hook-form (existing) | Zustand/manual useState | react-hook-form is already installed and purpose-built for this. |

---

## Sources

- Verified installed packages: `package.json` in worktree root (2026-04-15)
- Verified installed Radix packages: `ls node_modules/@radix-ui/` from monorepo root (2026-04-15)
- Existing Supabase Storage upload pattern: `src/actions/app.ts` lines 63-103 (branding-assets bucket)
- Existing Switch component: `src/components/ui/switch.tsx`
- shadcn/ui avatar docs: https://ui.shadcn.com/docs/components/avatar
- @radix-ui/react-avatar: https://www.radix-ui.com/primitives/docs/components/avatar
- Memory: `project_v11_avatar_menu.md` — `@radix-ui/react-dropdown-menu` added on pensive-greider branch, not yet merged
- Zod v4 + @hookform/resolvers v5 compatibility: confirmed via installed versions (resolvers 5.x is the Zod 4 support release)

---

*Stack research for: v1.2 Settings UX Redesign*
*Researched: 2026-04-15*
