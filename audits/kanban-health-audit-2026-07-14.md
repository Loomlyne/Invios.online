# Invios Kanban Drag-and-Drop Health Audit

**Date:** 2026-07-14  
**Scope:** Clients, invoices, quotations, shared drag-and-drop runtime, persistence, undo, status semantics, accessibility, local QA, and regression coverage  
**Audited revision:** `1d8a00b` on `main` / `origin/main`

## Executive verdict

**Status: not fully healthy.**

The production pointer-drag foundation is now sound. Exact pointer targeting, compact drop surfaces, direct non-adjacent moves, strict gutter misses, invoice destination disabling, optimistic updates, rollback structure, and client undo all work as designed.

The remaining failures are domain and input-path failures rather than basic collision failures:

1. Converted quotations can be moved out of their locked Accepted state.
2. Quotation moves leave contradictory lifecycle timestamps.
3. Valid invoice moves to Paid advertise an Undo that the server must reject.
4. Keyboard users cannot drag cards even though dnd-kit exposes draggable semantics and instructions.
5. Local `next dev` is blocked from hydrating client interactivity by the current CSP, preventing trustworthy local Kanban browser testing.
6. Invoice columns can be stale because payment-status rollback and overdue synchronization are incomplete.
7. The repository has no durable browser-level Kanban regression suite, which explains the repeated repair cycle.

**Production pointer health:** good.  
**Domain integrity:** unhealthy.  
**Undo integrity:** partially healthy.  
**Keyboard accessibility:** broken.  
**Local testability:** broken.  
**Regression protection:** insufficient.

## Evidence and methodology

The audit combined:

- Static tracing from entity pages through `DataViewRenderer`, `KanbanView`, domain actions, Supabase writes, RLS, and cache revalidation.
- Git-history review across the recent Kanban repair sequence.
- Existing Vitest, TypeScript, and production-build verification.
- Temporary authenticated Playwright probes against `https://invios.online` using isolated records that were deleted after each run.
- Direct database assertions after browser drag and undo operations.
- Local browser probing against `next dev`.

The temporary Playwright audit harness and generated test artifacts were not retained as product files.

## Production runtime results

| Probe | Result | Classification |
|---|---|---|
| Client Lead → Approved, non-adjacent pointer drop | Persisted in Supabase | Healthy |
| Client Undo Approved → Lead | Persisted in Supabase | Healthy |
| Client drop in the gutter between Lead and In Review | No mutation | Healthy |
| Accepted quotation → Draft | Status persisted as Draft, but `accepted_date` remained populated | Confirmed defect |
| Converted Accepted quotation → Draft | Status persisted as Draft while conversion link remained | Confirmed defect |
| Sent invoice → Paid | Persisted in Supabase | Healthy forward move |
| Undo Paid → Sent | Server rejected reverse transition; database remained Paid; red rollback message shown | Confirmed defect |
| Focus card and press Space | Card was not picked up | Confirmed defect |
| Local authenticated Kanban under `next dev` | Client hydration failed because CSP rejected `unsafe-eval` | Confirmed local-QA blocker |

The local CSP browser error was:

> Evaluating a string as JavaScript violates the following Content Security Policy directive because `unsafe-eval` is not an allowed source of script.

Production did not show that hydration failure.

## Confirmed healthy behavior

### 1. Strict pointer collision is correct

`src/components/data-view/kanban-collision.ts:1-9` returns `pointerWithin(args)` whenever pointer coordinates exist, including an empty result. `closestCenter` is used only for non-pointer input.

This correctly prevents:

- Gutter drops from snapping to the nearest column.
- Header drops from becoming status changes.
- Outside-board drops from mutating records.
- Disabled invoice targets from falling through to another nearby target.

The production client probe confirmed both a direct non-adjacent move and a strict gutter no-op.

### 2. Droppable geometry matches the compact-board contract

- Column titles remain outside the registered target: `src/components/data-view/kanban-view.tsx:202-234`.
- The bordered card surface is the actual target: `src/components/data-view/droppable-column.tsx:16-29`.
- The surface keeps `min-h-[120px]`, so empty columns remain usable without turning the whole column into a target.
- `isOver` has a visible border/background/ring state.

### 3. Invoice invalid destinations are blocked at three layers

- UI policy: `src/components/data-view/configs/invoice-config.tsx:8-12`.
- Droppable disabling and drag-end recheck: `src/components/data-view/kanban-view.tsx:148-159,197-200,234`.
- Server policy: `src/actions/invoices.ts:302-330`.

Manual movement into payment- or due-date-owned statuses such as Partial Paid, Overpaid, and Overdue is blocked.

### 4. Overlay and collision geometry are correctly separated

- A dedicated `DragOverlay` renders the active card: `src/components/data-view/kanban-view.tsx:315-326`.
- Cursor centering changes overlay presentation only: `src/components/data-view/cursor-centered-overlay.ts:18-34`.
- Pure tests cover non-central pointer activation and fallback behavior.

### 5. Shared optimistic state and rollback structure are sound

`src/components/data-view/kanban-view.tsx:98-119`:

- Captures the exact confirmed item-array snapshot.
- Applies the status change optimistically.
- Advances the confirmed snapshot only after a successful action.
- Restores the exact snapshot and calls `router.refresh()` on failure.

`DataViewRenderer` correctly converts `{ok:false}` to a rejected promise at `src/components/data-view/data-view-renderer.tsx:42-54`.

### 6. Routing, ownership, and revalidation are connected

- Invoice moves delegate to `setInvoiceStatusAction`.
- Quotation moves delegate to `setQuotationStatusAction`.
- Client moves use an owned Supabase update.
- All mutations constrain rows by `id` and `user_id` and request a returned row.
- List and detail paths are revalidated.
- Supabase RLS provides an independent ownership boundary.
- Database triggers maintain `updated_at`.

Evidence:

- `src/actions/status.ts:15-68`
- `src/actions/invoices.ts:299-336`
- `src/actions/quotations.ts:266-299`
- `supabase/migrations/202604060130_phase2_documents.sql:174-244`

## Confirmed defects

### P1. Converted quotation lock is bypassed by Kanban

**Impact:** A quotation linked to a generated invoice can be moved from Accepted to Draft, Sent, Rejected, or Expired. This creates contradictory workflow state while retaining `converted_to_invoice_id` and `conversion_date`.

**Production proof:** The audit dragged a converted Accepted quotation to Draft and confirmed the database status became `draft`.

**Root cause:**

- Detail UI treats `convertedToInvoiceId !== null` as locked: `src/app/(app)/app/quotations/[slug]/page.tsx:59,87-105`.
- Quotation Kanban config has no `canChangeStatus` policy: `src/components/data-view/configs/quotation-config.tsx:7-29`.
- `setQuotationStatusAction` neither reads current conversion state nor rejects converted records: `src/actions/quotations.ts:266-289`.

**Required fix:** Enforce the lock both in `quotationConfig.canChangeStatus` and in `setQuotationStatusAction`. The server action is authoritative. The UI guard only prevents a misleading optimistic move.

### P1. Quotation lifecycle timestamps become contradictory

**Impact:** The visible status can say Draft or Sent while `accepted_date` or `rejected_date` still indicates a completed decision. Undo also rewrites history instead of restoring it.

**Production proof:** After dragging Accepted → Draft, the status persisted as Draft while `accepted_date` remained `2026-06-01T09:00:00+00:00`.

**Root cause:** `setQuotationStatusAction` builds a partial destination-only patch:

- Entering Sent always overwrites `sent_date`.
- Entering Accepted sets `accepted_date` and clears only `rejected_date`.
- Entering Rejected sets `rejected_date` and clears only `accepted_date`.
- Entering Draft, Sent, or Expired does not clear decision timestamps.

Evidence: `src/actions/quotations.ts:266-281`.

This conflicts with the full quotation update path, which preserves first-sent history and normalizes decision timestamps: `src/actions/quotations.ts:205-241`.

**Required fix:** Centralize quotation transition normalization. Every status mutation path must produce the complete, canonical timestamp patch. Decide explicitly whether accepted/rejected dates represent current-state dates or immutable event history. If immutable history is required, store events separately instead of leaving contradictory columns on the current record.

### P1. Invoice “Mark paid” Undo is impossible

**Impact:** The UI promises Undo after a valid move, but the reverse operation always fails for `sent|overdue|partial_paid → paid`.

**Production proof:** Sent → Paid persisted. Clicking Undo showed the red rollback alert and the database remained Paid.

**Root cause:**

- Forward policy allows Sent, Overdue, or Partial Paid → Paid: `src/lib/billing.ts:127-149`.
- The same policy rejects Paid → Sent, Overdue, or Partial Paid.
- Generic undo stores only `{id, from, to}` and submits `from` through the normal status action: `src/components/data-view/kanban-state.ts:6-21`, `src/components/data-view/kanban-view.tsx:98-125`.
- The server correctly rejects the reverse transition: `src/actions/invoices.ts:313-317`.

**Required fix:** Do not offer an undo operation that the domain rejects. Preferred options:

1. Add an explicit compensating undo action that validates the expected current status, payment state, and a short-lived operation token before restoring the exact prior status.
2. If compensating undo is not safe, do not create or display Undo for irreversible transitions to Paid.

The first option preserves the current product promise. The second is safer and smaller.

### P1. Local CSP prevents client hydration and browser QA

**Impact:** `next dev` renders HTML and CSS but client components do not hydrate. Kanban drag, interactive controls, and local Playwright tests cannot be trusted. This masks real regressions and pushes testing onto production.

**Root cause:**

- Development CSP is identical to production and omits `unsafe-eval`: `src/lib/supabase/middleware.ts:36-47`.
- The middleware test explicitly requires `unsafe-eval` to be absent in all environments: `src/lib/supabase/middleware.test.ts:45-55`.
- The current Next development bundle evaluates code dynamically and is blocked by that policy.

**Required fix:** Build the CSP per environment. Permit `'unsafe-eval'` only in development, keep the nonce-based strict policy in production, and test both modes separately.

### P1. Payment-derived invoice statuses can remain wrong

**Impact:** Kanban can continue showing Paid, Overpaid, or Partial Paid after the final payment is removed.

**Root cause:**

- With zero collected and a non-overdue invoice, `computePaymentStatus` returns the existing status: `src/lib/billing-utils.ts:145-157`.
- Therefore a previously payment-derived status remains sticky after deleting the last payment.
- `computeAndWriteInvoiceStatus` suppresses invoice-read, payment-read, and status-write failures: `src/lib/billing-data.ts:607-646`.

**Required fix:** Define a canonical zero-payment fallback, normally Sent for issued invoices and Overdue for past-due invoices. Propagate all read/write failures. Add an expected-current-status condition or transaction/RPC to prevent races.

### P2. Overdue columns can be stale on direct invoice-list entry

**Impact:** A user can open `/app/invoices` and see past-due Sent or Partial Paid cards that should be in Overdue.

**Root cause:**

- `syncOverdueStatuses` claims invoice-list usage but `listInvoices` does not call it: `src/lib/billing-data.ts:309-355,649-664`.
- Its only caller is a fire-and-forget dashboard path that swallows errors and can render stale data: `src/lib/billing-data.ts:695-697`.

**Required fix:** Move overdue derivation to a reliable scheduled/database mechanism or synchronously reconcile before invoice-list data is returned. Do not rely on visiting the dashboard.

### P2. Keyboard drag is unavailable and assistive instructions are false

**Impact:** Keyboard-only users cannot pick up, move, cancel, or drop cards.

**Production proof:** Focusing the draggable wrapper and pressing Space did not set `aria-pressed` or start a drag.

**Root cause:**

- Only `PointerSensor` is configured: `src/components/data-view/kanban-view.tsx:8-17,56-58`.
- Passing the custom sensor list replaces dnd-kit’s default Pointer + Keyboard sensors.
- Default hidden dnd-kit instructions still describe Space and arrow-key operation.

**Required fix:** Register `KeyboardSensor` with `sortableKeyboardCoordinates` or provide an equivalent explicit keyboard status-change control. Add item/column labels to custom announcements instead of exposing raw database IDs.

### P2. Touch and mobile scrolling conflict

**Impact:** On dense mobile boards, starting a horizontal swipe on a card can initiate drag or suppress board scrolling.

**Root cause:** Cards use `touch-none` inside a horizontal scroll container: `src/components/data-view/draggable-card.tsx:26-30`, `src/components/data-view/kanban-view.tsx:192-196`.

**Required fix:** Test real touch behavior. Prefer a dedicated drag handle, a touch sensor with delay/tolerance, or an explicit mobile move menu. Preserve horizontal panning from the main card body.

### P2. Draggable/card semantics are structurally fragile

- dnd-kit makes the outer wrapper a focusable `role="button"` while it contains a focusable Next `Link`: `src/components/data-view/draggable-card.tsx:21-33`, `src/components/data-view/kanban-view.tsx:246-254`.
- Browser probes observed native anchor `dragstart` events during successful dnd-kit pointer drags.
- The overlay uses the full column width while source cards are inset by the drop-surface padding.
- Mobile pagination dots use `role="tab"` without tabpanel relationships, roving focus, or arrow-key behavior.

**Required fix:** Separate navigation and drag affordances. Use a dedicated handle, disable native link dragging, align overlay width to the measured source rectangle, and replace decorative pagination dots with correct semantics.

### P2. Type coupling is erased in the shared renderer

`Record<ConfigKey, any>` and `status: string` in `src/components/data-view/data-view-renderer.tsx:14-40` remove compile-time coupling between entity records, status unions, configs, and mutation tables.

Runtime validation currently prevents cross-domain writes, but the design makes future status/config mismatches easier to introduce.

## Repair-history root cause chain

| Commit | Change | Audit conclusion |
|---|---|---|
| `c66c196` | Added optimistic moves, undo, `closestCenter`, and prop sync | Good product direction; introduced refresh and exact-target edge cases |
| `9c3e619` | Added refresh after failed persistence and better shortcut guards | Correct rollback fix |
| `6bf7d39` | Routed invoice/quotation moves through domain actions and disabled invalid invoice targets | Correct routing; exposed domain undo/timestamp conflicts |
| `ea53145` | Reconciled Undo against refreshed props | Correct Next refresh-race fix |
| `a4041b8` | Centered `DragOverlay` on cursor | Correct visual-only fix |
| `69d0608` | Replaced internal transform type import | Correct maintenance fix |
| `9e46f72` | Used `pointerWithin` but fell back to `closestCenter` on misses | Still produced nearest-column false drops |
| `75d02b5` | Expanded droppable geometry into headers/full-height columns | Fixed symptoms but regressed layout and target semantics |
| `1d8a00b` | Returned empty pointer misses and restored compact droppables | Correct root fix for pointer targeting |

The repeated pointer repair loop happened because geometry and collision policy were changed without a mounted/browser drag test. Static markup and helper tests could pass while the user-visible board regressed.

## Test coverage assessment

### Existing coverage that is useful

- Pure Kanban state transitions and prop reconciliation.
- Pointer hit/miss collision policy.
- Cursor-overlay arithmetic.
- Invoice destination policy.
- Generic action routing.
- Status schemas and payment calculations.

### Missing coverage that is required

1. Mounted `KanbanView` pointer drag through persistence and revalidated props.
2. Header, gutter, outside-board, and disabled-surface no-op assertions.
3. Successful non-adjacent drag with Supabase persistence.
4. Failed mutation with exact rollback, alert, and `router.refresh()`.
5. Visible Undo and Cmd/Ctrl+Z integration tests.
6. Invoice forward/reverse policy matrix for every advertised move.
7. Quotation transition matrix including timestamps and converted lock.
8. Client ownership and zero-row rollback at browser level.
9. Keyboard pickup, movement, cancellation, and drop.
10. Touch drag versus horizontal board scrolling.
11. Horizontal auto-scroll while dragging.
12. Escape cancellation and link-click behavior after drag activation.
13. Payment deletion from Partial Paid, Paid, and Overpaid to the canonical zero-payment state.
14. Direct invoice-list overdue synchronization.

The current `e2e/app-flow.spec.ts` has no Kanban drag/undo scenario. No mounted `.test.tsx` or `.spec.tsx` Kanban tests were found.

## Prioritized remediation plan

### Phase 1: Protect data integrity

1. Add a quotation transition policy shared by config and server action.
2. Reject every status mutation when `converted_to_invoice_id` is non-null.
3. Normalize all quotation lifecycle timestamps in one function.
4. Add conditional current-status checks to invoice and quotation updates.
5. Fix zero-payment invoice fallback and propagate payment-status write errors.

### Phase 2: Make undo truthful

1. Mark each transition as reversible or irreversible.
2. Implement safe compensating invoice undo or hide Undo for Paid transitions.
3. For quotations, either snapshot all affected lifecycle fields or use a domain undo action that restores the exact prior state.
4. Clear Undo only after confirmed reverse persistence.

### Phase 3: Restore testability and accessibility

1. Permit `unsafe-eval` only under `NODE_ENV=development`.
2. Add `KeyboardSensor` and custom announcements, or an accessible move menu.
3. Remove nested draggable-button/link semantics.
4. Add a touch-safe drag handle or mobile move control.

### Phase 4: Lock regression coverage

1. Promote the temporary production probes into a maintained Playwright Kanban spec.
2. Seed isolated clients, invoices, quotations, and conversion links.
3. Assert both rendered columns and Supabase state.
4. Run pointer, keyboard, and touch projects.
5. Keep strict gutter/header/outside-board tests as release gates.

## Definition of healthy

Kanban is healthy only when all of the following are true:

- Pointer drops mutate only the exact enabled card surface under the pointer.
- Header, gutter, disabled, outside-board, and cancelled drops are no-ops.
- Client, invoice, and quotation moves persist through the correct domain action.
- Every optimistic failure restores the exact confirmed record and reports the error.
- Every displayed Undo is guaranteed to persist or is not displayed.
- Converted quotations cannot leave their locked state.
- Quotation timestamps match current status semantics after move and undo.
- Invoice statuses remain correct after payment deletion and overdue passage.
- Keyboard and touch users have complete, tested movement paths.
- Local development hydrates and runs the same interaction tests without weakening production CSP.
- Browser regression tests verify both DOM behavior and database state.

## Verification snapshot

- Focused Kanban/status tests: passed.
- Full Vitest suite: **35 files passed, 281 tests passed, 5 todo**.
- TypeScript check: passed.
- Production Next.js build: passed.
- Production client pointer move, persistence, undo, and gutter probe: passed.
- Production quotation timestamp integrity probe: failed as documented.
- Production converted-quotation lock probe: failed as documented.
- Production invoice Paid undo probe: failed as documented.
- Production keyboard pickup probe: failed as documented.
- Local client hydration probe: failed because development CSP blocks `unsafe-eval`.

## Recommended release decision

Do not call the Kanban fully healthy yet. The pointer mechanics can stay. Prioritize the quotation conversion lock, quotation timestamp normalization, and truthful invoice undo before treating the board as reliable for production workflows. Add the browser regression suite in the same repair so this cycle does not repeat.

## Follow-up (2026-07-14 evening)

Product override shipped in `8e2ca3b`: **invoice and quotation Kanban moves are unrestricted** (any column). Converted-quotation lock and invoice transition matrix were removed from UI and server Kanban paths.

Also shipped:

- Payment-derived status revert when collected hits zero (`billing-utils.ts`).
- Overdue sync on `/app/invoices` list load.
- `KeyboardSensor`, `TouchSensor`, grip drag handle (`data-kanban-card` / `data-kanban-column` hooks).
- Dev-only CSP `unsafe-eval` (from `8967a30`).
- Maintained Playwright spec: `e2e/kanban-drag.spec.ts` (client pointer move + gutter no-op + Supabase assert).
- Playwright `webServer` uses `npm run dev` (not `pnpm`).

**Still open:** run and gate CI on `kanban-drag.spec.ts` locally or against `PLAYWRIGHT_BASE_URL`; quotation full-field undo; optional optimistic race guards on status writes.
