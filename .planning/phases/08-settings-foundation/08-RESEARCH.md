# Phase 8: Settings Foundation - Research

**Researched:** 2026-04-15
**Domain:** Settings shell — vertical sidebar navigation, URL-synced section routing, mobile section picker, keyboard accessibility, per-section Save pattern
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** Adapt sidebar to Invios design tokens (glass-panel pattern, HSL brand tokens, surface-warm backgrounds) — NOT a pixel copy of reference screenshots. Style with existing design system.
- **D-02:** Fixed sidebar on desktop, always visible. Sidebar disappears on mobile viewports. No collapsible/toggle state needed.
- **D-05:** Icons + text in mobile section picker, matching desktop sidebar items.
- **D-07:** Profile is the default/landing section when user opens Settings (replaces current "general" default).
- **D-09:** Inline button state change for save feedback: "Save Changes" → "Saving..." → "Saved ✓" then reset after 2s. No toast or banner. Preserves current UX pattern.

### Claude's Discretion

- **D-03:** Sidebar width — pick based on content label lengths and existing spacing patterns (likely ~220-240px).
- **D-04:** Mobile section picker pattern — choose between dropdown select at top or bottom sheet based on existing mobile patterns in the app (Vaul drawer, FAB popup precedent).
- **D-06:** Flat list with separators vs grouped with headers — decide based on information architecture. 8 sections: Profile, Branding, Business Info, General, Emails, Integrations, Billing.
- **D-08:** Save button placement — likely header position on desktop (matches current pattern), sticky bottom on mobile.

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope.
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| NAV-01 | User can navigate settings via a vertical sidebar with labeled section links and icons | Plain `<nav>` with aria-current; SETTINGS_SECTIONS const drives item list |
| NAV-02 | User can see the active section highlighted in the sidebar with visual focus indicator | `data-[active=true]` attribute + accent token styling; consistent with existing Radix data-state pattern |
| NAV-03 | User can switch sections via URL-synced routing (browser back/forward works correctly) | `router.replace` (not push) keeps URL in sync without polluting history |
| NAV-04 | User can switch sections on mobile via a dropdown/sheet section picker | Vaul drawer preferred (already installed v1.1.2); dropdown select as fallback |
| NAV-05 | User can navigate sidebar items with keyboard arrow keys and focus ring indicators | Native `<button>` elements are natively focusable; arrow key roving requires `onKeyDown` handler |
| A11Y-01 | All form fields have associated labels and appropriate ARIA attributes | Existing `Field` component wraps Label + children; `aria-current="page"` on active sidebar item |
| A11Y-02 | Save feedback uses aria-live regions for screen reader announcements | `role="status"` or `aria-live="polite"` region wrapping save state text |
| A11Y-03 | Each section has its own independent save button (no global save) | Per-panel `isDirty` via `useRef` snapshot; retire global `saveAll()` |
</phase_requirements>

---

## Summary

Phase 8 delivers the load-bearing settings shell: a vertical sidebar on desktop, a mobile section picker, URL-synced section routing, keyboard navigation, and the per-section Save button pattern. No panel content is implemented — each section renders a placeholder. All implementation builds on existing project infrastructure with zero new runtime dependencies.

The existing `SettingsWorkspace` (629-line monolith) is replaced by a composed `SettingsShell` + `SettingsSidebar` + `panels/` structure. The `SettingsSection` TypeScript type must be updated from the old 4-value union to a new 7-value const-derived union as the first action, so TypeScript surfaces all downstream breakage immediately.

The pre-existing `.planning/research/` files (STACK.md, ARCHITECTURE.md, PITFALLS.md) already cover this domain at HIGH confidence — this RESEARCH.md consolidates and scopes those findings to Phase 8's specific deliverables (shell + navigation only, no panel content).

**Primary recommendation:** Build the scaffold in strict dependency order — types first, then shared primitives, then sidebar, then shell, then page.tsx swap — so TypeScript catches every broken reference before any new panel code is written.

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js App Router | 15.5.14 | Server component page, searchParams, router.replace | Already installed; single-page approach avoids repeated getAppContext calls |
| React | 19.2.0 | useState, useCallback, useRef for shell and per-panel state | Already installed |
| TypeScript | ^5 | SettingsSection const-derived union type | Already installed |
| Tailwind CSS | ^4 | Sidebar width, active states, responsive hiding | Already installed |
| lucide-react | 0.469.0 | Icons in sidebar nav items (matching desktop and mobile) | Already installed |
| vaul | 1.1.2 | Mobile section picker (Drawer pattern — existing precedent in app) | Already installed |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| shadcn Button | installed | Save button with state variants | Per-section save CTA |
| shadcn Card | installed | Section content container | Each panel's visual wrapper |
| useRouter (next/navigation) | — | router.replace for URL-synced section switching | All sidebar item click handlers |

### No New Dependencies

Phase 8 requires zero new packages. `@radix-ui/react-avatar` (identified in STACK.md) is needed for the Profile panel but that panel is implemented in Phase 10 — do not install it in Phase 8.

**Installation:** None required for Phase 8.

---

## Architecture Patterns

### Recommended Project Structure

```
src/
├── app/(app)/app/settings/
│   └── page.tsx                          # MODIFIED — SettingsWorkspace → SettingsShell; validSections updated
│
├── components/app/settings/
│   ├── settings-shell.tsx                # NEW — layout: sidebar + panel slot
│   ├── settings-sidebar.tsx              # NEW — vertical nav, active state, keyboard nav
│   ├── panels/
│   │   ├── profile-panel.tsx             # NEW — placeholder only in Phase 8
│   │   ├── branding-panel.tsx            # NEW — placeholder only in Phase 8
│   │   ├── business-info-panel.tsx       # NEW — placeholder only in Phase 8
│   │   ├── general-panel.tsx             # NEW — placeholder only in Phase 8
│   │   ├── emails-panel.tsx              # NEW — placeholder only in Phase 8
│   │   ├── integrations-panel.tsx        # NEW — "Coming soon" card
│   │   └── billing-panel.tsx             # NEW — "Coming soon" card
│   └── shared/
│       ├── settings-section.tsx          # NEW — Section + Field primitives extracted from settings-workspace.tsx
│       ├── save-button.tsx               # NEW — stateful Save button ("Save Changes" → "Saving..." → "Saved ✓")
│       └── password-input.tsx            # NEW — extracted from ChangePasswordSection (for Phase 10 use)
│
├── lib/
│   ├── types.ts                          # MODIFIED — SettingsSection union replaced by SETTINGS_SECTIONS const
│   └── constants.ts                      # MODIFIED — appNavItems branding entry removed or updated
│
└── components/app/
    ├── settings-workspace.tsx            # DELETED at end of Phase 8
    └── app-sidebar-nav.tsx               # MODIFIED — remove branding nav item
```

### Pattern 1: SETTINGS_SECTIONS Const — Single Source of Truth

**What:** Replace manual `Set<SettingsSection>` in page.tsx and manual type union in types.ts with a single `as const` array that derives both.

**When to use:** Any time a TypeScript union type has a parallel runtime validation structure. Eliminates silent divergence when new values are added.

**Example:**
```typescript
// src/lib/types.ts
export const SETTINGS_SECTIONS = [
  "profile",
  "branding",
  "business",
  "general",
  "emails",
  "integrations",
  "billing",
] as const;

export type SettingsSection = typeof SETTINGS_SECTIONS[number];
```

```typescript
// src/app/(app)/app/settings/page.tsx
import { SETTINGS_SECTIONS } from "@/lib/types";

const validSections = new Set(SETTINGS_SECTIONS);
const initialSection: SettingsSection = validSections.has(section as SettingsSection)
  ? (section as SettingsSection)
  : "profile"; // default changed from "general" to "profile" (D-07)
```

### Pattern 2: Client-Side Section Switching with URL Sync

**What:** `SettingsShell` owns `activeSection` as `useState`. Section changes call `router.replace` (not `push`) to sync the URL without adding history entries.

**When to use:** Multi-section settings where all data is loaded once by the Server Component. Avoids re-running `getAppContext()` on every tab click.

**Example:**
```typescript
// src/components/app/settings/settings-shell.tsx
'use client';
import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import type { SettingsSection, AppContext } from "@/lib/types";
import { SettingsSidebar } from "./settings-sidebar";

export function SettingsShell({
  context,
  initialSection,
}: {
  context: AppContext;
  initialSection: SettingsSection;
}) {
  const router = useRouter();
  const [activeSection, setActiveSection] = useState<SettingsSection>(initialSection);

  const navigate = useCallback((section: SettingsSection) => {
    setActiveSection(section);
    router.replace(`/app/settings?section=${section}`, { scroll: false });
  }, [router]);

  return (
    <div className="flex min-h-0 gap-6">
      <SettingsSidebar active={activeSection} onNavigate={navigate} />
      <main className="flex-1 min-w-0">
        {activeSection === "profile" && <ProfilePanel context={context} />}
        {activeSection === "branding" && <BrandingPanel context={context} />}
        {activeSection === "business" && <BusinessInfoPanel context={context} />}
        {activeSection === "general" && <GeneralPanel context={context} />}
        {activeSection === "emails" && <EmailsPanel context={context} />}
        {activeSection === "integrations" && <IntegrationsPanel />}
        {activeSection === "billing" && <BillingPanel />}
      </main>
    </div>
  );
}
```

### Pattern 3: Sidebar Nav with Keyboard Navigation (NAV-05)

**What:** Plain `<nav>` with `<button>` items. Native buttons are keyboard-focusable (Tab). Arrow-key roving tabindex requires an explicit `onKeyDown` handler since this is not a Radix composite widget.

**When to use:** Vertical navigation lists where the browser's native tab order is insufficient and arrow-key movement is expected by keyboard users (WCAG 2.1 AA).

**Example:**
```typescript
// src/components/app/settings/settings-sidebar.tsx
'use client';
import { useRef } from "react";

// Arrow key roving: move focus within the nav button list
function handleKeyDown(
  e: React.KeyboardEvent<HTMLButtonElement>,
  items: HTMLButtonElement[]
) {
  const idx = items.indexOf(e.currentTarget);
  if (e.key === "ArrowDown") {
    e.preventDefault();
    items[(idx + 1) % items.length]?.focus();
  } else if (e.key === "ArrowUp") {
    e.preventDefault();
    items[(idx - 1 + items.length) % items.length]?.focus();
  }
}
```

ARIA contract for the sidebar nav:
- `<nav role="navigation" aria-label="Settings navigation">` on the wrapper
- `aria-current="page"` on the active item's `<button>`
- `tabIndex={active ? 0 : -1}` on each button for roving tabindex (so Tab enters at the active item)

### Pattern 4: Per-Section Save Button with Inline Feedback (A11Y-02, A11Y-03, D-09)

**What:** Each placeholder panel includes a Save button that cycles through "Save Changes" → "Saving..." → "Saved ✓" states. An `aria-live="polite"` region announces the state change to screen readers.

**When to use:** All settings panels. Established in Phase 8 as the shared `<SaveButton>` primitive so all subsequent phases reuse it.

**Example:**
```typescript
// src/components/app/settings/shared/save-button.tsx
'use client';
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

type SaveState = "idle" | "saving" | "saved";

export function SaveButton({
  isDirty,
  onSave,
}: {
  isDirty: boolean;
  onSave: () => Promise<void>;
}) {
  const [state, setState] = useState<SaveState>("idle");

  async function handleSave() {
    setState("saving");
    await onSave();
    setState("saved");
    setTimeout(() => setState("idle"), 2000);
  }

  return (
    <>
      <Button
        onClick={handleSave}
        disabled={!isDirty || state === "saving"}
      >
        {state === "saving" ? "Saving..." : state === "saved" ? "Saved ✓" : "Save Changes"}
      </Button>
      {/* A11Y-02: screen reader live region */}
      <span role="status" aria-live="polite" className="sr-only">
        {state === "saved" ? "Changes saved." : ""}
      </span>
    </>
  );
}
```

### Pattern 5: Mobile Section Picker (NAV-04)

**What:** On viewports below `lg` (1024px), the sidebar is hidden (`hidden lg:flex`). A Vaul `<Drawer>` provides the section picker. A full-width button at the top of the content area shows the current section name and opens the drawer.

**Recommendation (D-04 resolution):** Use Vaul Drawer. The app already uses vaul (v1.1.2) for the FAB popup on `claude/pensive-greider` branch. A Drawer matches the existing mobile sheet patterns. A native `<select>` is simpler but cannot show icons alongside text (D-05 requires icons + text). Vaul Drawer wins.

**Mobile layout structure:**
```tsx
{/* Mobile only: section picker trigger */}
<div className="lg:hidden mb-4">
  <Drawer.Root>
    <Drawer.Trigger asChild>
      <button className="w-full flex items-center justify-between px-4 py-3 rounded-[var(--radius-md)] border border-border bg-surface text-sm font-medium">
        <span className="flex items-center gap-2">
          <CurrentSectionIcon className="size-4 text-accent" />
          {currentSectionLabel}
        </span>
        <ChevronDown className="size-4 text-muted" />
      </button>
    </Drawer.Trigger>
    <Drawer.Portal>
      <Drawer.Content>
        {/* List of all sections with icons + text, same items as desktop sidebar */}
      </Drawer.Content>
    </Drawer.Portal>
  </Drawer.Root>
</div>
```

### Section Grouping Decision (D-06 resolution)

**Recommendation:** Flat list with a single visual separator between "core" and "system" sections.

Rationale: 7 items is short enough that grouping headers add visual noise without navigation benefit. A subtle `<hr>` or `my-2 border-t border-border` separator between Emails and Integrations gives a natural "account management" vs "system" split without full grouped-with-headers treatment.

```
Profile
Branding
Business Info
General
Emails
────────────   (separator)
Integrations
Billing
```

### Sidebar Width Decision (D-03 resolution)

**Recommendation:** 224px (`w-56` in Tailwind). "Business Info" is the longest label at ~12 chars. At 224px with px-4 padding and icon, all labels fit on one line at `text-sm`. Consistent with the app's existing app-sidebar-nav which uses `px-4 py-3` spacing.

### Anti-Patterns to Avoid

- **Do not use `router.push`** for section switching — stacks history entries, Back button traps user inside settings.
- **Do not put all panels in one file** — re-creates the 629-line monolith. One file per panel in `panels/`.
- **Do not share dirty state across panels** — each panel owns its `isDirty`. Global dirty = global save = the problem being fixed.
- **Do not use shadcn Sidebar component** — 500+ line app-shell component with collapsible state, cookie persistence. Overkill for a settings section picker.
- **Do not use `@radix-ui/react-navigation-menu`** — designed for top-level site nav with hover submenus, not a settings section list.
- **Do not hide the sidebar on mobile without a picker replacement** — sections become unreachable.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Drawer for mobile section picker | Custom bottom sheet | `vaul` Drawer (already installed) | Focus trapping, swipe-to-close, accessibility all built in |
| Save state machine | Custom setTimeout + flag | `SaveButton` shared component built in Wave 1 | Centralizes the "Save Changes → Saving... → Saved ✓" timing; reused by all 9+ subsequent panels |
| Active section URL sync | Custom history manipulation | `router.replace` from `next/navigation` | Correct behavior with no history pollution; Next.js-idiomatic |
| Form field labels | Custom label/input wrappers | `Field` primitive extracted from settings-workspace.tsx | Already implements gap-2 layout, label association; reuse don't rebuild |
| Focus trapping in drawer | focus-trap-react | vaul built-in focus management | Vaul handles this internally |

**Key insight:** Phase 8 is a refactor and scaffold phase. The most valuable output is the correct structure (one file per panel, correct types, correct URL pattern) so that Phases 9–12 can execute in parallel without merge conflicts.

---

## Common Pitfalls

### Pitfall 1: `validSections` Set diverges from `SettingsSection` type
**What goes wrong:** Type updated in `types.ts`, Set not updated in `page.tsx`. `?section=profile` silently falls through to default section.
**Why it happens:** Two separate constructs for the same data.
**How to avoid:** `SETTINGS_SECTIONS as const` array derives both. Add it to `types.ts` and import it in `page.tsx`. TypeScript errors immediately if a section is missing from conditional rendering.
**Warning signs:** `?section=profile` in URL, General tab renders.

### Pitfall 2: `router.push` instead of `router.replace`
**What goes wrong:** Back button navigates through settings history. Profile → General → Branding requires 3 Back presses to leave settings.
**How to avoid:** All sidebar item click handlers call `router.replace('/app/settings?section=X', { scroll: false })`.
**Warning signs:** History entries accumulate in DevTools.

### Pitfall 3: No mobile section picker
**What goes wrong:** `hidden lg:flex` on sidebar, nothing to replace it. Mobile users cannot switch sections.
**How to avoid:** Mobile picker must be built in the same plan as the desktop sidebar. They are part of the same component deliverable.
**Warning signs:** 375px viewport — only the default section is accessible.

### Pitfall 4: Branding still in app nav after Phase 8
**What goes wrong:** `appNavItems` in `constants.ts` still includes Branding as a top-level nav item pointing to `/app/branding`. Users navigate to the old standalone page.
**How to avoid:** Remove the `branding` entry from `appNavItems` in Phase 8 (since it will become a settings section). Also remove from `app-sidebar-nav.tsx` `iconMap`. The `/app/branding` redirect is a Phase 9 concern, but nav cleanup is Phase 8.
**Warning signs:** Desktop sidebar still shows "Branding" as a top-level nav item.

### Pitfall 5: Phase 8 placeholder panels import non-existent actions
**What goes wrong:** Placeholder panel files import `saveProfileAction` which does not yet exist, causing TypeScript errors.
**How to avoid:** Phase 8 panel stubs contain no wired actions — just the visual container, title, description, and a disabled Save button. Action wiring happens in Phases 9–12.

### Pitfall 6: Shared `Section`/`Field` primitives not extracted before panels are written
**What goes wrong:** Each panel developer re-implements the section container pattern slightly differently. Visual inconsistency accumulates.
**How to avoid:** Extract `Section` and `Field` from `settings-workspace.tsx` into `shared/settings-section.tsx` in Wave 1, before any panel is written. All panels import from shared.

---

## Code Examples

Verified patterns from existing codebase:

### Active state pattern (from app-sidebar-nav.tsx)
```typescript
// Existing pattern — adapt for settings sidebar items
className={cn(
  "flex items-center gap-3 rounded-[1.15rem] px-4 py-3 text-sm transition",
  active
    ? "bg-[#17120F] text-on-dark shadow-[0_16px_40px_rgba(23,18,15,0.16)]"
    : "text-muted-strong hover:bg-black/5",
)}
```
The settings sidebar should use a lighter active state (not the full dark pill, which is the app-level nav style). Use `bg-accent/10 text-accent-strong` for settings section active items to distinguish them from the top-level nav.

### router.replace for section switching
```typescript
// Correct — no history entry
router.replace(`/app/settings?section=${section}`, { scroll: false });

// Wrong — creates history entry
router.push(`/app/settings?section=${section}`);
```

### ARIA on sidebar nav
```tsx
<nav role="navigation" aria-label="Settings navigation">
  <button
    aria-current={active ? "page" : undefined}
    tabIndex={active ? 0 : -1}
    onKeyDown={(e) => handleArrowKey(e, navRef)}
  >
    <Icon className="size-4" />
    <span>Profile</span>
  </button>
</nav>
```

### vaul Drawer (mobile picker — vaul already in use in project)
```typescript
import { Drawer } from "vaul";

// Pattern consistent with existing project usage
<Drawer.Root>
  <Drawer.Trigger asChild>
    <button>...</button>
  </Drawer.Trigger>
  <Drawer.Portal>
    <Drawer.Overlay className="fixed inset-0 bg-black/40" />
    <Drawer.Content className="fixed inset-x-0 bottom-0 ...">
      {SETTINGS_SECTIONS_CONFIG.map((s) => (
        <button key={s.key} onClick={() => { navigate(s.key); closeDrawer(); }}>
          <s.Icon className="size-4" />
          {s.label}
        </button>
      ))}
    </Drawer.Content>
  </Drawer.Portal>
</Drawer.Root>
```

### Section and Field primitives (extracted from settings-workspace.tsx)
```tsx
// src/components/app/settings/shared/settings-section.tsx
function Section({
  title,
  description,
  danger,
  children,
}: {
  title: string;
  description?: string;
  danger?: boolean;
  children: ReactNode;
}) {
  return (
    <div className={cn("rounded-[var(--radius-md)] border p-6 space-y-4", danger && "border-danger/30 bg-danger/5")}>
      <div>
        <h3 className={cn("font-semibold text-sm", danger && "text-danger")}>{title}</h3>
        {description && <p className="text-muted text-sm mt-1">{description}</p>}
      </div>
      {children}
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <Label>{label}</Label>
      {children}
    </div>
  );
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `SettingsSection = "general" | "invoices" | "notifications" | "account"` | `SETTINGS_SECTIONS as const` → derived type | Phase 8 start | TypeScript catches missing sections automatically |
| Global `saveAll()` via `Promise.all([3 actions])` | Per-panel independent save | Phase 8 start | Validation errors in one panel don't block another |
| `router.push` for tab switching | `router.replace` | Phase 8 start | Back button no longer trapped in settings history |
| Horizontal `<Tabs>` from Radix | Vertical `<nav>` sidebar | Phase 8 | Richer visual hierarchy; collapses to mobile picker |
| `initialSection` defaults to `"general"` | Defaults to `"profile"` (D-07) | Phase 8 | Profile is the landing section |

**Deprecated/outdated:**
- `SettingsWorkspace` component: replaced by `SettingsShell` + per-panel files. Delete after Phase 8 complete.
- `BrandingSection` type: can be removed from `types.ts` once branding is migrated to a settings panel (Phase 9).
- `appNavItems` branding entry: remove in Phase 8; branding moves to settings sidebar.

---

## Environment Availability

Step 2.6: SKIPPED — Phase 8 is a pure code/component refactor. No external services, databases, or CLI tools beyond the project's own Next.js stack are required. Existing Supabase connection is unchanged; no new buckets or migrations needed in Phase 8.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest (no version pinned; installed as devDep) |
| Config file | `vitest.config.ts` (root) |
| Quick run command | `pnpm test` (runs `vitest run`) |
| Full suite command | `pnpm test` |
| Test pattern | `src/**/*.test.ts` (node environment, no DOM) |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|--------------|
| NAV-01 | SETTINGS_SECTIONS const exports correct values | unit | `pnpm test src/lib/types.test.ts` | ❌ Wave 0 |
| NAV-02 | Active section derived correctly from validSections Set | unit | `pnpm test src/lib/types.test.ts` | ❌ Wave 0 |
| NAV-03 | `router.replace` called (not push) on section change | manual-only | — | N/A — visual behavior; no DOM environment |
| NAV-04 | Mobile picker shows correct section list | manual-only | — | N/A — UI component in browser |
| NAV-05 | Keyboard arrow key navigation | manual-only | — | N/A — browser interaction |
| A11Y-01 | Form fields have labels | manual-only | — | N/A — DOM check |
| A11Y-02 | aria-live region present in SaveButton | manual-only | — | N/A — DOM check |
| A11Y-03 | Each panel has independent save, no shared state | unit | `pnpm test src/lib/types.test.ts` | ❌ Wave 0 (type test) |

**Note:** Most Phase 8 requirements are UI/interaction concerns that cannot be tested in vitest's node environment (no DOM). The testable surface is the type-level logic — `SETTINGS_SECTIONS` const integrity and `validSections` derivation. Browser-level checks (aria, keyboard, mobile picker) should be verified manually during the visual review step.

### Sampling Rate
- **Per task commit:** `pnpm test`
- **Per wave merge:** `pnpm test`
- **Phase gate:** `pnpm test` green + manual browser review of sidebar, mobile picker, keyboard nav, and URL sync before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/lib/types.test.ts` — verify `SETTINGS_SECTIONS` contains all 7 sections and `SettingsSection` is correctly derived; verify `validSections` Set logic from page.tsx perspective

*(Existing tests in `src/actions/` are unaffected by Phase 8 changes.)*

---

## Project Constraints (from CLAUDE.md)

- **AGENTS.md / CLAUDE.md directive:** "This is NOT the Next.js you know — read `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices."
  - Impact: Verify `router.replace` signature in Next.js 15.5.14 before using. Use `{ scroll: false }` option.
  - Impact: `searchParams` in page.tsx is async in Next.js 15 — must `await searchParams` (already done in existing page.tsx; preserve this pattern).
- **use-server rule (from STATE.md):** Only async functions may be exported from `"use server"` files. Phase 8 adds no new server actions, but any future actions must follow this.
- **router.replace (from STATE.md):** Carry-forward decision — confirmed for Phase 8.
- **SETTINGS_SECTIONS as const (from STATE.md):** Carry-forward decision — implement in Phase 8.
- **git push:** Must be user-initiated — Claude's shell hangs. Deploy via `vercel --prod` after implementation.

---

## Open Questions

1. **vaul Drawer API in the installed version (v1.1.2)**
   - What we know: vaul is installed at v1.1.2 per STACK.md.
   - What's unclear: Whether the `Drawer.Root`/`Drawer.Trigger`/`Drawer.Portal`/`Drawer.Content` API is the correct import pattern for v1.1.2 or whether it uses a different export shape.
   - Recommendation: Before writing the mobile picker, check `node_modules/vaul/dist/index.d.ts` for the actual export names. Do not assume the API from training data.

2. **`appNavItems` branding removal — safe in Phase 8?**
   - What we know: `appNavItems` drives `AppSidebarNav`. The branding entry points to `/app/branding`. Phase 9 adds the redirect.
   - What's unclear: Whether removing the branding nav item in Phase 8 (before the branding content is in settings) creates a dead end for users who need to access branding.
   - Recommendation: Keep the branding nav entry in Phase 8 but mark it as a settings link (`/app/settings?section=branding`). The actual settings branding panel is a placeholder in Phase 8. Remove the standalone branding nav entry when Phase 9 is complete.

3. **`BrandingSection` type referenced in `SetupItemStatus`**
   - What we know: `SetupItemStatus.section` is typed as `SettingsSection | BrandingSection`. Removing `BrandingSection` or changing its values would break setup checklist links.
   - What's unclear: Whether setup checklist branding links need to be updated in Phase 8 or can wait for Phase 9.
   - Recommendation: Do not remove `BrandingSection` in Phase 8. Update setup checklist hrefs in Phase 9 when the redirect is added.

---

## Sources

### Primary (HIGH confidence)
- Direct codebase: `src/lib/types.ts` — current SettingsSection union, BrandingSection type
- Direct codebase: `src/app/(app)/app/settings/page.tsx` — validSections Set pattern, async searchParams
- Direct codebase: `src/components/app/settings-workspace.tsx` — Section/Field primitives, global saveAll pattern
- Direct codebase: `src/components/app/app-sidebar-nav.tsx` — active state styling pattern, iconMap
- Direct codebase: `src/components/app/bottom-nav.tsx` — lg:hidden pattern, aria-current usage
- Direct codebase: `src/lib/constants.ts` — appNavItems shape, branding entry
- Direct codebase: `src/app/globals.css` — glass-panel, accent token definitions
- `.planning/research/STACK.md` — verified installed packages, no-new-deps conclusion
- `.planning/research/ARCHITECTURE.md` — component structure, build order, integration points
- `.planning/research/PITFALLS.md` — all 8 pitfalls with phase assignments

### Secondary (MEDIUM confidence)
- AGENTS.md / CLAUDE.md: Next.js version awareness directive
- STATE.md carry-forward decisions: router.replace, SETTINGS_SECTIONS as const, per-section save

### Tertiary (LOW confidence)
- vaul Drawer API shape — assumed from training data; verify against installed node_modules before implementing.

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all packages verified from package.json; no new deps required
- Architecture: HIGH — grounded in direct codebase reading; ARCHITECTURE.md pre-analyzed the full decomposition
- Pitfalls: HIGH — sourced from direct code reading of the monolith being replaced
- Mobile picker API: LOW — vaul v1.1.2 export shape not verified; check node_modules

**Research date:** 2026-04-15
**Valid until:** 2026-05-15 (stable libraries; no fast-moving deps)
