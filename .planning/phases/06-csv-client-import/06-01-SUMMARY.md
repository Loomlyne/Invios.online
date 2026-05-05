---
phase: 06-csv-client-import
plan: "01"
subsystem: api
tags: [papaparse, zod, supabase, csv, client-import, batch-insert]

# Dependency graph
requires: []
provides:
  - next.config.ts body size limits (proxyClientMaxBodySize 10mb, serverActions.bodySizeLimit 5mb)
  - PapaParse installed (papaparse 5.5.3, @types/papaparse 5.5.2)
  - src/lib/csv-import.ts with all shared types, constants, validation schema, and fuzzy header mapping
  - importClientsAction server action in src/actions/clients.ts with batch insert, slug accumulation, duplicate detection
affects: [06-02, 06-03]

# Tech tracking
tech-stack:
  added: [papaparse 5.5.3, @types/papaparse 5.5.2]
  patterns:
    - App-level email duplicate detection (fetch existing emails, filter in memory, no upsert)
    - Slug accumulation via running Set across map loop to prevent same-name collisions
    - Single batch .insert(insertRows) for performance
    - Shared csv-import.ts module with no use server directive — importable by both client and server

key-files:
  created:
    - src/lib/csv-import.ts
  modified:
    - next.config.ts
    - src/actions/clients.ts
    - package.json

key-decisions:
  - "proxyClientMaxBodySize: 10mb >= serverActions.bodySizeLimit: 5mb — prevents silent FormData truncation in Next.js 15 proxy"
  - "csv-import.ts has no use server directive — shared between wizard UI components and server action"
  - "App-level duplicate detection: fetch emails once, filter in memory — avoids Supabase upsert RLS ambiguity"
  - "Slug Set accumulates inside map loop — critical for same-name rows in same import batch"
  - "ImportResult (not ActionState) returned — structured inserted/skipped/failed counts for wizard Result step"

patterns-established:
  - "Fuzzy header mapping: HEADER_ALIASES record + first-match-wins loop in autoMapHeaders"
  - "Batch import pattern: pre-fetch slugs once, accumulate Set, single .insert()"

requirements-completed: [CLNT-05]

# Metrics
duration: 12min
completed: 2026-04-14
---

# Phase 06 Plan 01: CSV Import Data Layer Summary

**PapaParse installed, Zod CSV row schema with fuzzy header mapping in csv-import.ts, and importClientsAction with batch insert, slug accumulation, and app-level email deduplication**

## Performance

- **Duration:** 12 min
- **Started:** 2026-04-14T13:30:00Z
- **Completed:** 2026-04-14T13:42:00Z
- **Tasks:** 3
- **Files modified:** 4 (next.config.ts, package.json, src/lib/csv-import.ts, src/actions/clients.ts)

## Accomplishments
- Configured Next.js 15 body size limits to prevent silent FormData truncation over 1MB
- Created csv-import.ts with all shared types, constants (MAX_IMPORT_ROWS=200), fuzzy header aliases (25+ variants), Zod row schema, and ImportResult type — no `"use server"` so it's importable from both client wizard and server action
- Added importClientsAction to clients.ts with single batch insert, slug collision prevention via accumulated Set, and app-level email duplicate detection returning structured ImportResult counts

## Task Commits

Each task was committed atomically:

1. **Task 1: Configure Next.js body size limits and install PapaParse** - `074e1a4` (chore)
2. **Task 2: Create src/lib/csv-import.ts with types, schema, constants, and helper functions** - `0d31762` (feat)
3. **Task 3: Add importClientsAction to src/actions/clients.ts** - `9fc5a5e` (feat)

## Files Created/Modified
- `next.config.ts` - Added proxyClientMaxBodySize: "10mb" and serverActions.bodySizeLimit: "5mb"
- `package.json` - Added papaparse to dependencies, @types/papaparse to devDependencies
- `src/lib/csv-import.ts` - CSV_FIELDS, CsvField, MAX_IMPORT_ROWS, CSV_FIELD_LABELS, autoMapHeaders, csvRowSchema, CsvRowInput, CsvRowValid, ImportResult
- `src/actions/clients.ts` - Added importClientsAction export (all existing exports unchanged)

## Decisions Made
- `proxyClientMaxBodySize` set to 10mb (double the 5mb action limit) to satisfy the Next.js requirement that proxy limit >= action limit
- csv-import.ts intentionally has no `"use server"` directive — shared module usable by both wizard client components and server action
- App-level email dedup (fetch + memory filter) rather than Supabase upsert — avoids RLS ambiguity where upsert may silently fail when RLS covers only one operation
- `status: "lead"` for all imported clients — consistent with manual client creation defaults
- ImportResult (not ActionState) returned — structured counts allow wizard Result step to display granular feedback without string parsing

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All non-UI artifacts for the CSV import wizard are in place
- Plan 06-02 can build the multi-step wizard UI using csv-import.ts types and importClientsAction
- Plan 06-03 can build the trigger button and CSV import entry point
- TypeScript compilation passes (tsc --noEmit exit 0)

---
*Phase: 06-csv-client-import*
*Completed: 2026-04-14*
