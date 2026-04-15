---
phase: 08-settings-foundation
plan: "01"
subsystem: settings
tags: [types, shared-components, accessibility, settings]
dependency_graph:
  requires: []
  provides: [SETTINGS_SECTIONS const, SettingsSection type, Section, Field, SaveButton]
  affects: [src/lib/types.ts, settings-workspace.tsx, settings/page.tsx]
tech_stack:
  added: []
  patterns: [const-derived-type, state-machine-button, aria-live-region]
key_files:
  created:
    - src/components/app/settings/shared/settings-section.tsx
    - src/components/app/settings/shared/save-button.tsx
  modified:
    - src/lib/types.ts
decisions:
  - SETTINGS_SECTIONS const is the single source of truth; SettingsSection type derived via typeof ... [number]
  - SaveButton error recovery resets to idle state (no stuck Saving... on throw)
  - BrandingSection preserved unchanged for SetupItemStatus compatibility (removed in Phase 9)
metrics:
  duration: "2 min"
  completed: "2026-04-15"
  tasks_completed: 2
  files_modified: 3
requirements: [NAV-01, NAV-02, A11Y-01, A11Y-02, A11Y-03]
---

# Phase 8 Plan 01: Settings Foundation — Types and Shared Primitives Summary

**One-liner:** SETTINGS_SECTIONS const (7 keys) replaces manual SettingsSection union; Section/Field layout primitives and stateful SaveButton with aria-live region created as shared components.

## Tasks Completed

| # | Task | Commit | Files |
|---|------|--------|-------|
| 1 | SETTINGS_SECTIONS const and SettingsSection type update | f2090e8 | src/lib/types.ts |
| 2 | Section, Field primitives and SaveButton shared components | fedaaf1 | src/components/app/settings/shared/settings-section.tsx, src/components/app/settings/shared/save-button.tsx |

## What Was Built

**Task 1 — types.ts update:**
- Replaced `export type SettingsSection = "general" | "invoices" | "notifications" | "account"` with a 7-element `SETTINGS_SECTIONS` const array (`profile`, `branding`, `business`, `general`, `emails`, `integrations`, `billing`)
- Derived `SettingsSection` type from the const using `typeof SETTINGS_SECTIONS[number]`
- Added `SettingsSectionConfig` interface for sidebar rendering (key, label, icon, description)
- `BrandingSection` and `SetupItemStatus` left unchanged for Phase 9 cleanup

**Task 2 — shared components:**
- `Section` card primitive: rounded card with optional `danger` variant (`border-danger/20 bg-[#FFF5F3]`), h3 title + muted description
- `Field` primitive: flex-col label+input wrapper with `htmlFor` prop for accessible label association (A11Y-01)
- `SaveButton`: idle/saving/saved state machine with 2s reset timeout, Loader2 spinner during saving, Check icon on saved, try/catch error recovery, `role="status" aria-live="polite"` sr-only span announces "Changes saved." (A11Y-02)

## Decisions Made

- **SETTINGS_SECTIONS const pattern**: Using `as const` array + `typeof SETTINGS_SECTIONS[number]` means adding a new section key only requires one edit (the const), and TypeScript propagates the change everywhere.
- **SaveButton error recovery**: Catch block resets to `"idle"` so a failed save never leaves the button stuck in a non-interactive state.
- **BrandingSection preserved**: `SetupItemStatus.section` still references `SettingsSection | BrandingSection`. The old `SettingsSection` values are gone (breaking settings-workspace and page.tsx — expected, resolved in Plans 02-03).

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None — no UI is rendered in this plan; all outputs are pure type/component definitions.

## Self-Check: PASSED

- [x] `src/lib/types.ts` modified — confirmed present
- [x] `src/components/app/settings/shared/settings-section.tsx` created — confirmed present
- [x] `src/components/app/settings/shared/save-button.tsx` created — confirmed present
- [x] Commit f2090e8 — Task 1 feat(08-01)
- [x] Commit fedaaf1 — Task 2 feat(08-01)
