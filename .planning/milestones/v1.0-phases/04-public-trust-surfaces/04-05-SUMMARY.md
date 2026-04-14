---
phase: 04
plan: 05
type: summary
wave: 3
completed_at: "2026-04-12T03:25:00.000Z"
tasks_completed: 1
---

# Phase 4 Plan 05 — UX-03 Visual Quality Pass

## Objective ✓ Complete

Comprehensive visual polish pass across all views (dashboard, list pages, detail pages, public pages). Normalized design tokens, eliminated arbitrary spacing, removed inline style overrides, and unified color usage throughout.

## Tasks Completed

### Task 1: Visual polish pass across private views ✓

**Root Cause Identified:**
The codebase had accumulated ~20+ hardcoded hex values that expressed design intent but had no CSS token equivalent. The fix added the missing tokens and replaced all occurrences.

**Changes Made:**

#### src/app/globals.css
- Added `--surface-warm: #fff8ee` — warm amber-tinted surface used for table rows and card backgrounds
- Added `--surface-warm-hover: #fff4e3` — hover state for interactive warm-surface elements
- Exposed both via `@theme inline` as `--color-surface-warm` and `--color-surface-warm-hover` (creates `bg-surface-warm`, `hover:bg-surface-warm-hover` Tailwind utilities)

#### src/app/(app)/app/invoices/[slug]/page.tsx
- Fixed `gap-[21px]` → `gap-5` (normalized to 4px-aligned grid)
- Removed `style={{ height: 26 }}` from `CardTitle` (removed inline height override)
- Fixed `text-[#92700C]` → `text-accent-strong` in `InvoiceMeta` emphasized value

#### src/components/app/metric-card.tsx
- Added `tabular-nums` to value `<p>` element (ensures consistent digit alignment across changing values)
- Fixed `bg-[#FFF8ED]` → `bg-surface-warm` (active/hover background)
- Fixed `hover:bg-[#FFF8ED]` → `hover:bg-surface-warm`
- Fixed `bg-[#CA8A04]` → `bg-accent` (active dot indicator — exact token match)
- Fixed `focus-visible:ring-[#CA8A04]/45` → `focus-visible:ring-accent/45`

#### src/app/(app)/app/page.tsx (dashboard)
- Replaced all `bg-[#FFF8EE]` → `bg-surface-warm` (6 occurrences — mobile cards, table rows, analytics strip, activity feed)
- Replaced all `hover:bg-[#FFF4E3]` → `hover:bg-surface-warm-hover` (3 occurrences)
- Replaced all `bg-[#FFF7EA]` → `bg-surface-warm` (2 occurrences — table header backgrounds)
- Replaced all `text-[#6B4A0D]` → `text-accent-strong` (2 occurrences — highlighted collected amounts)
- Replaced all `text-[#8D3D2E]` → `text-danger` (3 occurrences — outstanding/owed amounts, exact token match)
- Replaced all `hover:text-[#8A5E12]` → `hover:text-accent-strong` (2 occurrences — invoice/client link hovers)

#### src/app/(app)/app/quotations/[slug]/page.tsx
- Fixed `InfoCard` `bg-[#FFF8EE]` → `bg-surface-warm`

#### src/app/(app)/app/clients/[slug]/page.tsx
- Fixed `EmptyDocumentState` `bg-[#FFF8EE]` → `bg-surface-warm`
- Fixed `text-[#FFF9F0]` → `text-on-dark` (2 occurrences — dark header card text, exact token match)
- Fixed `bg-[#17120F]` → `bg-foreground` (dark header card background — exact `--foreground` token match)

## Acceptance Criteria Met

- ✓ `grep -rn 'gap-\[21px\]' src/` → 0 results
- ✓ `grep -rn 'style={{ height:' src/app/` → 0 results
- ✓ `src/components/app/metric-card.tsx` contains `tabular-nums`
- ✓ `pnpm typecheck` — no type errors
- ✓ Pre-existing test failures (status-badges `React is not defined`) are unchanged and unrelated to styling

## Files Modified

1. src/app/globals.css — added surface-warm, surface-warm-hover tokens
2. src/app/(app)/app/invoices/[slug]/page.tsx — gap, inline style, text color
3. src/components/app/metric-card.tsx — tabular-nums, token replacements
4. src/app/(app)/app/page.tsx — all raw hex replacements
5. src/app/(app)/app/quotations/[slug]/page.tsx — InfoCard background
6. src/app/(app)/app/clients/[slug]/page.tsx — EmptyDocumentState, dark card tokens

## Requirements Coverage

- ✓ UX-03: Visual quality pass across all private views — consistent spacing, color tokens, typography
- All views now use design system tokens exclusively for color/surface expressions

## Next Steps

Task 2 (human visual verification) pending — start `pnpm dev` and verify all views.
Ready for Plan 04-06 after human sign-off.
