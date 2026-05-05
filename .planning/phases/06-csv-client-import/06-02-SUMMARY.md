---
phase: 06-csv-client-import
plan: 02
subsystem: client-import
tags: [csv, wizard, papaparse, unit-tests, components]
dependency_graph:
  requires: [06-01]
  provides: [csv-import-wizard, step-upload, step-map, csv-import-tests]
  affects: [src/components/clients/csv-import, src/lib/csv-import.test.ts]
tech_stack:
  added: []
  patterns: [papaparse-client-side, mobile-sheet-wizard, step-indicator, tdd-vitest]
key_files:
  created:
    - src/lib/csv-import.test.ts
    - src/components/clients/csv-import/csv-import-wizard.tsx
    - src/components/clients/csv-import/step-upload.tsx
    - src/components/clients/csv-import/step-map.tsx
  modified: []
decisions:
  - "StepIndicator inlined in wizard shell — 4 dots with connecting lines, accent/success/surface-strong states"
  - "FileReader stored in useRef and aborted in useEffect cleanup — prevents state update on unmounted component"
  - "autoMappedRef tracks which fields were auto-detected independently of mapping state — allows per-field Auto-detected note to survive user edits to other fields"
  - "StepMap's autoMapHeaders call uses empty-mapping guard (Object.keys(mapping).length === 0) — prevents re-running detection when wizard navigates back from Step 3"
  - "Over-cap warning rendered as inline warning div (border-amber-700/20 bg-amber-50) matching badge.tsx warning color palette without importing Badge"
metrics:
  duration_seconds: 763
  completed_date: "2026-04-14"
  tasks_completed: 2
  files_created: 4
  files_modified: 0
---

# Phase 6 Plan 02: CSV Import Wizard Shell and Tests Summary

Unit tests for the csv-import.ts data layer plus wizard shell, StepUpload (PapaParse + 200-row cap + template download), and StepMap (autoMapHeaders auto-detect + Select overrides) — all wired into a MobileSheet container with step state management.

## What Was Built

### Task 1: Unit Tests (src/lib/csv-import.test.ts)

15 test cases covering:
- `csvRowSchema` — 6 tests: accepts full row, accepts name-only (optional fields default ""), rejects empty name, rejects 1-char name, rejects invalid email, accepts empty string email
- `autoMapHeaders` — 8 tests: exact match across all 6 fields, fuzzy "E-mail" -> email, "Full Name" -> name, "Phone Number" -> phone, "Company Name" -> company, "VAT Number" -> trn, ignores "Favorite Color", first-match-wins with ["Email", "E-mail Address"]
- `constants` — 2 tests: MAX_IMPORT_ROWS === 200, CSV_FIELDS has 6 entries

Pattern: `import { describe, it, expect } from "vitest"` with `.safeParse()` — consistent with `src/actions/clients.test.ts`.

### Task 2: Wizard Components

**csv-import-wizard.tsx** — Root `"use client"` component:
- Props: `open`, `onOpenChange`
- State: `step` (1|2|3|4), `rawRows`, `rawHeaders`, `mapping`, `validatedRows`, `result`
- `reset()` clears all state; called on `onOpenChange(false)`
- Inline `StepIndicator` — 4 dots, Check icon for completed steps, `bg-accent` for current, `bg-surface-strong` for upcoming; `h-0.5 flex-1 bg-border` connectors colored `bg-success` when passed
- `aria-live="polite"` SR region announces step title on navigation
- Steps 3/4 render placeholder divs (Plan 03 implements them)

**step-upload.tsx** — Step 1:
- Drop zone with `border-2 border-dashed`, drag-over state (`border-accent bg-accent/5`), loaded state (`border-border-brand bg-surface`)
- `FileReader` stored in `useRef`, aborted in `useEffect` cleanup
- `Papa.parse` with `{ header: true, skipEmptyLines: true, transformHeader: (h) => h.trim() }`
- Over-cap: slices to 200, shows inline amber warning with exact row count
- Parse error: shown as `text-danger` paragraph
- Template download: generates 6-column CSV with one example row, triggers blob download
- Footer: ghost "Close" + accent "Next" (disabled until `hasParsedData`)

**step-map.tsx** — Step 2:
- `useEffect` on `headers` dep: calls `autoMapHeaders` when `mapping` is empty; records auto-detected fields in `autoMappedRef`
- `grid grid-cols-1 sm:grid-cols-2` layout for 6 field rows
- Each field: `Label` with `htmlFor`, `Select` with all headers + "Skip this field" (value=""), "Auto-detected" text-xs note when auto-mapped and value still set
- Name field label gets ` *` danger indicator
- "Name is required to continue" hint shown on failed Next attempt
- Next button disabled when `mapping.name` is falsy

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

- Steps 3 (Preview) and 4 (Result) render placeholder `<div>` nodes in `csv-import-wizard.tsx` — intentional. Plan 03 implements `StepPreview` and `StepResult`.

## Self-Check: PASSED
