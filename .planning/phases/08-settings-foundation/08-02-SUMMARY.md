---
phase: 08-settings-foundation
plan: "02"
subsystem: settings
tags: [navigation, sidebar, keyboard-accessibility, routing, settings]
dependency_graph:
  requires: [08-01]
  provides: [SettingsSidebar, SettingsShell, settings page.tsx wired to SettingsShell]
  affects:
    - src/components/app/settings/settings-sidebar.tsx
    - src/components/app/settings/settings-shell.tsx
    - src/app/(app)/app/settings/page.tsx
tech_stack:
  added: []
  patterns: [roving-tabindex, router.replace-url-sync, useCallback-navigation, glass-panel-sidebar]
key_files:
  created:
    - src/components/app/settings/settings-sidebar.tsx
    - src/components/app/settings/settings-shell.tsx
  modified:
    - src/app/(app)/app/settings/page.tsx
decisions:
  - SIDEBAR_ITEMS array exported from settings-sidebar.tsx for mobile picker reuse in Plan 03
  - Separator rendered after index 4 (Emails), before Integrations — structural visual grouping
  - router.replace with scroll:false prevents history pollution and scroll jump on section switch
  - useCallback([router]) wraps navigate — stable reference across renders
  - page.tsx uses SETTINGS_SECTIONS const (single source of truth) for validation Set
  - Default section is "profile" (D-07 locked)
metrics:
  duration: "8 min"
  completed: "2026-04-15"
  tasks_completed: 2
  files_modified: 3
requirements: [NAV-01, NAV-02, NAV-03, NAV-05]
---

# Phase 8 Plan 02: Settings Foundation — Sidebar Navigation and Shell Summary

**One-liner:** SettingsSidebar with 7-item roving-tabindex keyboard nav and accent/10 active state; SettingsShell layout shell owns section state and URL-syncs via router.replace; page.tsx now uses SETTINGS_SECTIONS const and defaults to profile.

## Tasks Completed

| # | Task | Commit | Files |
|---|------|--------|-------|
| 1 | Settings sidebar with keyboard navigation | ab2c919 | src/components/app/settings/settings-sidebar.tsx |
| 2 | Settings shell and page.tsx swap | bd81284 | src/components/app/settings/settings-shell.tsx, src/app/(app)/app/settings/page.tsx |

## What Was Built

**Task 1 — SettingsSidebar:**
- 7-item vertical `<nav>` with icons (User, Palette, Building2, SlidersHorizontal, Mail, Plug, CreditCard)
- Desktop-only: `hidden lg:flex` container at `w-56` (224px)
- Glass-panel styling: `glass-panel border-r border-black/8 rounded-[var(--radius-md)]`
- Active state: `bg-accent/10 text-accent-strong` on button, `text-accent` on icon
- ARIA: `role="navigation"` + `aria-label="Settings navigation"` on container, `aria-current="page"` on active button
- Roving tabindex: active item `tabIndex={0}`, all others `tabIndex={-1}` — Tab lands on active item
- Arrow key navigation: ArrowDown/ArrowUp with `e.preventDefault()`, circular wrap-around
- Separator (`<hr className="my-2 border-t border-border" />`) after Emails item (index 4)
- `SIDEBAR_ITEMS` exported for mobile picker reuse in Plan 03

**Task 2 — SettingsShell and page.tsx:**
- `SettingsShell`: `"use client"` component, owns `activeSection` state, renders sidebar + main layout
- `navigate` callback uses `router.replace('/app/settings?section=X', { scroll: false })` — no history pollution
- `pb-28 lg:pb-8` on main content area for mobile bottom nav clearance
- `min-w-0` on flex main to prevent overflow
- Placeholder panel renders section name until Plan 03 wires real panels
- `page.tsx`: imports `SETTINGS_SECTIONS` and `SettingsShell` — removes hardcoded section Set and SettingsWorkspace
- `page.tsx`: `validSections = new Set<SettingsSection>(SETTINGS_SECTIONS)` — single source of truth
- `page.tsx`: defaults to `"profile"` (was `"general"`)
- Async `searchParams` pattern preserved (Next.js 15 requirement)

## Decisions Made

- **SIDEBAR_ITEMS exported**: Plan 03 mobile picker reuses the same array to guarantee icon/label parity between desktop sidebar and mobile drawer.
- **Separator placement**: Between Emails (index 4) and Integrations (index 5) — separates "core user settings" from "system/account" sections visually.
- **router.replace + scroll:false**: Prevents the back button from cycling through every section the user visited, and prevents scroll position jumping during section switch.
- **page.tsx default "profile"**: D-07 locked decision — first visit lands on Profile, not the legacy "general" default.

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

- `SettingsShell` renders a placeholder panel ("X settings will be available here.") for all sections. This is intentional — Plan 03 wires real panel components. The plan goal (sidebar + URL routing) is fully achieved; placeholder does not block the plan's objective.

## Self-Check: PASSED

- [x] `src/components/app/settings/settings-sidebar.tsx` created — confirmed present
- [x] `src/components/app/settings/settings-shell.tsx` created — confirmed present
- [x] `src/app/(app)/app/settings/page.tsx` modified — confirmed present
- [x] Commit ab2c919 — Task 1 feat(08-02)
- [x] Commit bd81284 — Task 2 feat(08-02)
- [x] `tsc --noEmit` — clean (empty output)
