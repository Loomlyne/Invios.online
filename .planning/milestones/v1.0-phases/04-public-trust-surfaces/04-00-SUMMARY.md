---
phase: 04-public-trust-surfaces
plan: "00"
subsystem: testing
tags: [vitest, tdd, billing-data, billing-utils, public-quotations, portal-token, slug-alias, uuid, trn, bilingual]

# Dependency graph
requires:
  - phase: 03-dashboard-cash-flow
    provides: billing-data.ts, billing-utils.ts, quotations.ts with full data layer

provides:
  - Wave 0 RED test scaffolds for all Phase 4 pure-logic requirements
  - Failing tests for getClientByPortalToken and getSlugAliasRedirect in billing-data.test.ts
  - Failing tests for acceptQuotationPublicAction and rejectQuotationPublicAction in public-quotations.test.ts
  - Failing tests for isUuid, formatTrnDisplay, getArabicDescription in billing-utils.test.ts

affects: [04-01, 04-02, 04-03, 04-04, 04-05, 04-06]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Wave 0 TDD scaffold pattern: vi.mock @/lib/supabase/admin with chainable mockReturnValue chain"
    - "Dynamic import pattern in tests: await import('@/actions/public-quotations') for fresh module each test"
    - "beforeEach vi.clearAllMocks() to prevent test pollution across describe blocks"

key-files:
  created:
    - src/lib/billing-data.test.ts
    - src/actions/public-quotations.test.ts
  modified:
    - src/lib/billing-utils.test.ts

key-decisions:
  - "Wave 0 tests use dynamic imports (await import) to isolate RED state per test without module caching issues"
  - "getSlugAliasRedirect test uses call-count mock pattern for multi-table Supabase queries"
  - "billing-utils.test.ts extended with named imports (isUuid, formatTrnDisplay, getArabicDescription) at top — TypeScript will fail at import until Plan 01 adds the functions"

patterns-established:
  - "TDD Wave 0 scaffold: write 5+ tests per function, mock Supabase admin client with chainable vi.fn, verify RED before committing"
  - "Public action tests: mock both @/lib/supabase/admin and next/cache, use FormData instances"

requirements-completed:
  - PUB-01
  - PUB-02
  - PUB-04
  - PUB-05
  - UX-04
  - SET-03
  - SET-04

# Metrics
duration: 2min
completed: "2026-04-10"
---

# Phase 4 Plan 00: Wave 0 Test Scaffolds Summary

**21 RED test cases across 3 files covering portal token lookup, slug alias redirect, public quotation accept/reject guards, UUID detection, TRN formatting, and bilingual description fallback**

## Performance

- **Duration:** 2 min
- **Started:** 2026-04-10T17:50:01Z
- **Completed:** 2026-04-10T17:52:35Z
- **Tasks:** 3
- **Files modified:** 3

## Accomplishments
- Created `src/lib/billing-data.test.ts` with 5 failing tests for `getClientByPortalToken` (valid token, invalid token, archived client) and `getSlugAliasRedirect` (alias exists, no alias)
- Created `src/actions/public-quotations.test.ts` with 7 failing tests covering accept/reject guard logic, rejection reason storage, and double-action prevention
- Extended `src/lib/billing-utils.test.ts` with 9 failing tests for `isUuid`, `formatTrnDisplay`, and `getArabicDescription` — all 22 pre-existing tests remain GREEN

## Task Commits

Each task was committed atomically:

1. **Task 1: Create billing-data.test.ts with portal and slug alias test scaffolds** - `bdfa228` (test)
2. **Task 2: Create public-quotations.test.ts with accept/reject guard tests** - `5fd3ea0` (test)
3. **Task 3: Extend billing-utils.test.ts with UUID detection and bilingual helpers** - `c36f5b9` (test)

## Files Created/Modified
- `src/lib/billing-data.test.ts` - Tests for getClientByPortalToken, getSlugAliasRedirect (5 tests, all RED)
- `src/actions/public-quotations.test.ts` - Tests for acceptQuotationPublicAction, rejectQuotationPublicAction (7 tests, all RED)
- `src/lib/billing-utils.test.ts` - Extended with isUuid, formatTrnDisplay, getArabicDescription tests (9 new tests RED, 22 existing tests GREEN)

## Decisions Made
- Dynamic imports (`await import(...)`) used in tests to prevent module cache from masking missing exports
- getSlugAliasRedirect tests use a call-count-based mock implementation to handle the two-table pattern (alias lookup → invoice slug lookup)
- New billing-utils imports added at top of file — TypeScript compile error at import will keep them clearly RED until Plan 01 exports the functions

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All 21 test cases are in RED state ready to turn GREEN as Plans 01-06 implement the production functions
- Plan 01 (billing-utils functions) can immediately target: `pnpm test -- src/lib/billing-utils.test.ts`
- Plan 02 (billing-data portal functions) can immediately target: `pnpm test -- src/lib/billing-data.test.ts`
- Plan 03 (public quotation actions) can immediately target: `pnpm test -- src/actions/public-quotations.test.ts`

---
*Phase: 04-public-trust-surfaces*
*Completed: 2026-04-10*
