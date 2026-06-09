# Phase 8: Settings Foundation - Context

**Gathered:** 2026-04-15
**Status:** Ready for planning

<domain>
## Phase Boundary

Deliver the settings shell — vertical sidebar navigation, URL-synced section routing, mobile section picker, keyboard accessibility, and per-section Save button pattern. This is the load-bearing structure every subsequent panel depends on. No panel content is implemented in this phase — only the skeleton with placeholder/empty panels for each section.

</domain>

<decisions>
## Implementation Decisions

### Sidebar Visual Style
- **D-01:** Adapt sidebar to Invios design tokens (glass-panel pattern, HSL brand tokens, surface-warm backgrounds) — NOT a pixel copy of reference screenshots. Style with existing design system.
- **D-02:** Fixed sidebar on desktop, always visible. Sidebar disappears on mobile viewports. No collapsible/toggle state needed.
- **D-03:** Claude's Discretion: sidebar width — pick based on content label lengths and existing spacing patterns (likely ~220-240px).

### Mobile Section Switching
- **D-04:** Claude's Discretion: mobile section picker pattern — choose between dropdown select at top or bottom sheet based on existing mobile patterns in the app (Vaul drawer, FAB popup precedent).
- **D-05:** Icons + text in mobile section picker, matching desktop sidebar items.

### Section Structure & Grouping
- **D-06:** Claude's Discretion: flat list with separators vs grouped with headers — decide based on information architecture. 8 sections: Profile, Branding, Business Info, General, Emails, Integrations, Billing.
- **D-07:** Profile is the default/landing section when user opens Settings (replaces current "general" default).

### Save Pattern
- **D-08:** Claude's Discretion: Save button placement — likely header position on desktop (matches current pattern), sticky bottom on mobile. Each section has its own independent Save button.
- **D-09:** Inline button state change for save feedback: "Save Changes" → "Saving..." → "Saved ✓" then reset after 2s. No toast or banner. Preserves current UX pattern.

### Claude's Discretion
Claude has flexibility on: sidebar width, mobile picker pattern, section grouping strategy, and save button placement. All other decisions are locked.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Existing Settings Code (to be replaced)
- `src/app/(app)/app/settings/page.tsx` — Current server component; `getAppContext()` call, `validSections` Set, searchParams routing
- `src/components/app/settings-workspace.tsx` — 629-line monolithic workspace; Section/Field/PasswordInput wrapper components, global saveAll(), isDirty detection
- `src/lib/types.ts` — `SettingsSection` type union, `UserSettings` interface, `AppContext` interface

### Design System
- `src/app/globals.css` — HSL token family, glass-panel classes, surface-warm tokens
- `.planning/research/STACK.md` — Stack research confirming no new deps needed for Phase 8
- `.planning/research/ARCHITECTURE.md` — Architecture analysis for sidebar approach
- `.planning/research/PITFALLS.md` — Pitfalls including SettingsSection/validSections divergence, router.replace requirement, mobile sidebar fallback

### Project Context
- `.planning/PROJECT.md` — Design workflow constraint: aidesigner-frontend + ui-ux-pro-max for frontend work
- `.planning/REQUIREMENTS.md` — NAV-01 through NAV-05, A11Y-01 through A11Y-03

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `Section` component (inside settings-workspace.tsx): wraps title + description + children with optional `danger` styling — extract and reuse
- `Field` component (inside settings-workspace.tsx): wraps Label + children with gap-2 — extract and reuse
- `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent` from shadcn — NOT reused for sidebar (sidebar is a plain `<nav>` with `aria-current`)
- `Switch` component at `src/components/ui/switch.tsx` — already installed, will be used in later phases
- `Card`, `Button`, `Input`, `Label`, `Badge` — all shadcn components already available

### Established Patterns
- `getAppContext()` fetches all user state (profile, branding, settings) in one server call — keep this; no per-section fetching
- `useRouter` + `router.push` for tab switching — change to `router.replace` to prevent history pollution
- `useState` for active section tracking — keep, driven by `?section=` searchParam
- Global `isDirty` via `useRef` snapshot + `useMemo` comparison — retire this pattern; each panel will own its own dirty state

### Integration Points
- `page.tsx` server component: update `validSections` Set to use `SETTINGS_SECTIONS` const array
- `SettingsSection` type in `types.ts`: expand union to include all 8 sections
- App nav sidebar: "Settings" link already points to `/app/settings`
- Mobile bottom nav: Settings icon already exists
- Branding shortcut link inside current settings (mobile-only, `lg:hidden`) — remove once branding is a settings tab

</code_context>

<specifics>
## Specific Ideas

- User provided screenshots of their current settings pages as UX references — adopt the pattern (vertical sidebar, clean sections) but style with Invios tokens, not pixel-copy
- The sidebar should feel consistent with the rest of the app's glass-panel, dark-mode aesthetic
- 8 sections in order: Profile, Branding, Business Info, General, Emails, Integrations, Billing (plus any separator treatment Claude decides)

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 08-settings-foundation*
*Context gathered: 2026-04-15*
