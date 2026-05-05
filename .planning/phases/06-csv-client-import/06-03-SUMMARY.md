---
phase: 06
plan: 03
subsystem: clients/csv-import
tags: [csv-import, wizard, preview, result, clients-page]
dependency_graph:
  requires: [06-01, 06-02]
  provides: [complete-csv-import-wizard, import-csv-button]
  affects: [/app/clients page, clients table]
tech_stack:
  added: []
  patterns: [Fragment key for tbody row pairs, client wrapper for server page interactivity, preparePreview async validation, fetchExistingClientEmailsAction for duplicate detection]
key_files:
  created:
    - src/components/clients/csv-import/step-preview.tsx
    - src/components/clients/csv-import/step-result.tsx
    - src/components/clients/csv-import/import-csv-button.tsx
  modified:
    - src/components/clients/csv-import/csv-import-wizard.tsx
    - src/actions/clients.ts
    - src/app/(app)/app/clients/page.tsx
decisions:
  - "Fragment key on table row pairs: use <Fragment key={i}> (not <>) when mapping parallel tr elements in tbody to give React stable identity"
  - "fetchExistingClientEmailsAction added as separate action from importClientsAction to allow client-side preview before confirmation — avoids importing server-side duplicate check result on every mapping change"
  - "Import CSV uses variant=secondary so Add client retains primary accent prominence"
metrics:
  duration: 262s
  completed: 2026-04-14
  tasks_completed: 2
  tasks_total: 3
  files_created: 3
  files_modified: 3
---

# Phase 06 Plan 03: Preview, Result, and Page Integration Summary

**One-liner:** Step 3 validation table with row checkboxes/badges, Step 4 import summary, and Import CSV button wired to clients page header completing the full 4-step CSV import wizard.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Preview + Result + wizard orchestration | daec241 | step-preview.tsx, step-result.tsx, csv-import-wizard.tsx, clients.ts |
| 1b | Fragment key fix in step-preview | 88361c1 | step-preview.tsx |
| 2 | Wire Import CSV button to clients page | d5df59c | import-csv-button.tsx, clients/page.tsx |
| 3 | Human verify checkpoint | — | (awaiting user) |

## What Was Built

### step-preview.tsx
- Scrollable table (`max-h-[50vh] overflow-y-auto`) with sticky thead
- Per-row status: `<Badge variant="success/warning/destructive">` for valid/duplicate/error states
- Row checkboxes with 44px touch targets (`size-11` wrapper div)
- "Select all" checkbox controlling all non-error rows
- Error detail row (`<td colSpan={5}>`) rendered below error rows using `<Fragment key={i}>`
- Summary bar: "{N} valid · {N} duplicates · {N} errors"
- Confirm button: `Confirm import ({N} clients)` with Loader2 spinner + `aria-busy="true"` during submission
- Back button and empty-selection helper text

### step-result.tsx
- Centered layout with Check icon in emerald circle
- Heading: "{N} clients imported"
- 3-column count grid: inserted (text-success) / skipped (text-muted) / failed (text-danger)
- Error message shown when `result.status === "error"`
- Done button (variant=accent, full width) calls `onDone` to close wizard

### csv-import-wizard.tsx updates
- Added `isSubmitting` state
- `preparePreview()`: maps raw CSV rows through field mapping, validates with `csvRowSchema`, fetches existing emails via `fetchExistingClientEmailsAction` for duplicate detection, sets `validatedRows` and advances to step 3
- `handleConfirmImport()`: filters checked valid rows, calls `importClientsAction`, advances to step 4
- `handleToggleRow(index)` and `handleToggleAll(checked)` for checkbox control
- Step 2 "Next" now calls `preparePreview()` instead of `setStep(3)` directly
- Step 3 renders `<StepPreview>` with full props
- Step 4 renders `<StepResult>` with result and onDone

### clients.ts additions
- `fetchExistingClientEmailsAction()`: fetches all non-null client emails for the current user, returns lowercase array for Set-based duplicate lookup in wizard preview

### import-csv-button.tsx
- `"use client"` wrapper holding `open` state
- Renders `<Button variant="secondary">Import CSV <Upload /></Button>` + `<CsvImportWizard>`

### clients/page.tsx
- Added `ImportCsvButton` import
- PageHeader `actions` now contains `<ImportCsvButton />` before existing "Add client" button

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed Fragment key missing in step-preview table row pairs**
- **Found during:** Task 1 (post-write review)
- **Issue:** `<>` used as map return in `<tbody>` — React requires keyed Fragment when returning multiple sibling elements
- **Fix:** Imported `Fragment` from React, replaced `<>` with `<Fragment key={i}>`, removed duplicate `key` props from inner `<tr>` elements
- **Files modified:** src/components/clients/csv-import/step-preview.tsx
- **Commit:** 88361c1

## Checkpoint: Task 3 — Human Verification

**Status:** Awaiting human verification

**Automated pre-checks completed:**
- All 6 artifact files exist at expected paths
- `fetchExistingClientEmailsAction` exported from clients.ts
- `ImportCsvButton` imported and rendered in clients/page.tsx
- `"use client"` directive present in import-csv-button.tsx
- `Confirm import` text present in step-preview.tsx
- `clients imported` text present in step-result.tsx
- `tsc --noEmit` exits clean (0 errors)

**Manual verification steps for user:**
See Task 3 in the plan — 9-step flow covering Upload → Map → Preview → Confirm → Result → Done.

## Known Stubs

None — all wizard steps are fully implemented and wired to real data.

## Self-Check: PASSED

- step-preview.tsx: FOUND
- step-result.tsx: FOUND
- import-csv-button.tsx: FOUND
- csv-import-wizard.tsx: updated with preparePreview + handleConfirmImport
- clients.ts: fetchExistingClientEmailsAction present
- clients/page.tsx: ImportCsvButton rendered
- Commits daec241, 88361c1, d5df59c: verified in git log
