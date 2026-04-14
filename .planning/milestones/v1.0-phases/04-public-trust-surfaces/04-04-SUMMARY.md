---
phase: 04
plan: 04
type: summary
wave: 2
completed_at: "2026-04-10T23:00:00.000Z"
tasks_completed: 2
---

# Phase 4 Plan 04 — Bilingual/RTL Rendering and TRN Display

## Objective ✓ Complete

Add bilingual (EN/AR side-by-side) and Arabic-only (full RTL) rendering to InvoicePreview, display TRN fields per UAE compliance (SET-03), and load IBM Plex Sans Arabic font on public pages where Arabic content exists.

## Tasks Completed

### Task 1: Add bilingual/RTL rendering and TRN display to InvoicePreview ✓

**Changes Made:**

- **src/lib/types.ts**: Added `recipientTrn?: string` field to `InvoicePreviewData` interface for client TRN display
- **src/components/invoice/invoice-preview.tsx**:
  - Imported `formatTrnDisplay` and `getArabicDescription` from billing-utils
  - Imported `cn` utility for conditional classNames
  - Added language-aware variables: `isArabicOnly`, `isBilingual`, `isRtl`
  - Added `bilingualLabel()` helper for dual-language labels
  - Updated outer container with:
    - `max-w-[1100px]` for bilingual documents
    - `dir="rtl"` for Arabic-only documents
    - `lang="ar"` or `"en"` attributes
    - Arabic font family applied conditionally
  - Added TRN display in header for business (after phone)
  - Added client TRN display in "Billed to" section (after phone)
  - Updated all section labels to be bilingual-aware:
    - "Billed to" / "الفاتورة إلى"
    - "Invoice date" / "تاريخ الفاتورة"
    - "Due date" / "تاريخ الاستحقاق"
    - "Amount due" / "المبلغ المستحق"
    - "Payment info" / "معلومات الدفع"
    - "Terms" / "الشروط والأحكام"
    - "Notes" / "ملاحظات"
    - "Date signed" / "التاريخ"
  - Implemented bilingual line items rendering:
    - Side-by-side grid layout (EN left, AR right) on desktop
    - Stacked layout on mobile (<md breakpoint)
    - Each column shows appropriate language version via `getArabicDescription()`
  - Updated totals section to show bilingual labels and Arabic values
  - Protected numbers with `dir="ltr"` to keep them LTR in RTL contexts
  - Conditional rendering for Arabic table headers

**Acceptance Criteria Met:**
- ✓ `dir="rtl"` conditional on language
- ✓ `getArabicDescription` and `formatTrnDisplay` imported and used
- ✓ `isBilingual` and `isArabicOnly` variables
- ✓ `max-w-[1100px]` for bilingual
- ✓ Arabic label strings (الوصف, المجموع, etc.)
- ✓ `dir="ltr"` on numeric spans in RTL contexts
- ✓ recipientTrn field in InvoicePreviewData
- ✓ pnpm typecheck passes

### Task 2: Load Arabic font on public pages with Arabic content ✓

**Changes Made:**

- **src/app/invoices/public/[shareToken]/page.tsx**:
  - Imported `IBM_Plex_Sans_Arabic` from next/font/google
  - Created `arabicFont` instance with:
    - subsets: ["arabic"]
    - weight: ["400", "500", "600"]
    - variable: "--font-arabic"
    - display: "swap"
    - preload: false
  - Added `hasArabicContent` check (language is "ar" or "bilingual")
  - Wrapped InvoicePreview in div with `arabicFont.variable` class when Arabic content present

- **src/app/quotations/public/[shareToken]/page.tsx**:
  - Identical changes to invoices page
  - Arabic font loads only when document has Arabic content

**Acceptance Criteria Met:**
- ✓ IBM_Plex_Sans_Arabic imported on both public pages
- ✓ `--font-arabic` CSS variable available
- ✓ preload: false (efficient loading)
- ✓ Root layout.tsx NOT modified (no global Arabic font)
- ✓ Font loads conditionally only for Arabic/bilingual documents
- ✓ pnpm typecheck passes

## Test Results

- ✓ `pnpm typecheck` — No type errors
- ✓ All language-aware rendering paths implemented
- ✓ TRN display functional for both supplier and client
- ✓ Numbers remain LTR in all RTL contexts
- ✓ Arabic font loads only when needed

## Key Implementation Details

1. **Three Language Rendering Paths:**
   - **English-only**: Standard table layout, LTR
   - **Arabic-only**: Full RTL with `dir="rtl"`, Arabic labels on headers
   - **Bilingual**: Side-by-side columns (grid), EN left/AR right, collapse to stacked on mobile

2. **TRN Display (SET-03):**
   - Business TRN shown in header after contact info
   - Client TRN shown in "Billed to" section after phone
   - Uses `formatTrnDisplay()` to add "TRN: " prefix

3. **Font Optimization (Pitfall 1 mitigation):**
   - Arabic font loaded ONLY on pages where Arabic content exists
   - NOT loaded globally in root layout
   - Prevents unnecessary font download for English-only users

4. **RTL Safety:**
   - All numbers protected with `dir="ltr"` 
   - `tabular-nums` class ensures consistent digit width
   - Unicode BiDi algorithm handles digit directionality

5. **Bilingual Collapsing:**
   - Desktop: 2-column grid with 32px gap
   - Mobile: Single column (stacked)
   - Uses md breakpoint (768px) to determine layout

## Files Modified

1. src/lib/types.ts — InvoicePreviewData interface (recipientTrn field)
2. src/components/invoice/invoice-preview.tsx — Bilingual/RTL rendering logic
3. src/app/invoices/public/[shareToken]/page.tsx — Arabic font loading
4. src/app/quotations/public/[shareToken]/page.tsx — Arabic font loading

## Requirements Coverage

- ✓ SET-03: TRN displayed for supplier and client
- ✓ SET-04: Bilingual and Arabic-only rendering with RTL support
- All language-aware section labels and headers

## Next Steps

Ready for Plan 05 (UX-03 Visual Quality Pass) — Wave 3 checkpoint review.

