# Phase 2: Clients & Document Engine - Research

**Researched:** 2026-04-06
**Domain:** Next.js App Router, Supabase, document builder UX, share/export, Playwright PDF
**Confidence:** HIGH

## Summary

Phase 2 is substantially pre-built. The primary data layer (Supabase tables, server actions, data-fetching functions), the builder component, the list pages, and most detail page scaffolding already exist in the codebase. The remaining work is a focused set of UI wiring and new component builds that complete the product loop: replace the builder's status dropdown with a read-only badge, build `ShareModal`, build `DocumentStatusActions`, add `DocumentSummaryRow` to the client detail page, and wire up the PDF download and share buttons on detail pages.

All architectural decisions are locked in CONTEXT.md. The UI-SPEC (02-UI-SPEC.md) is approved (all 6 checker dimensions passed) and provides the exact visual contract for every new component. No new libraries are needed — the entire phase is implementable with the existing stack: Next.js 15 App Router, React 19, Supabase, shadcn/ui, Tailwind v4, Lucide, GSAP.

**Primary recommendation:** This is a wiring and component completion phase, not a greenfield build. Every plan must reference exact file paths and existing function names from the codebase. Avoid re-implementing anything that already exists.

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** "Share" on a detail page opens a share modal (dialog) with the public URL, a one-click "Copy" button, and a secondary "Open in new tab" link. User stays in context.
- **D-02:** "PDF" on a detail page triggers a direct file download via the existing Playwright API route (`/api/invoices/[id]/pdf` or `/api/quotations/[id]/pdf`). No print preview step.
- **D-03:** Status advances via contextual action buttons on the detail page, not via a free dropdown in the builder. Builder always saves documents as "draft". Status-aware actions: "Mark as sent" (when draft), "Mark as accepted" / "Mark as rejected" (when sent, quotations only), "Mark as expired" (when past expiry, quotations only).
- **D-04:** The builder's current `<select>` dropdown for status should be removed or replaced with a read-only status badge. Status changes happen exclusively on the detail page.
- **D-05:** After saving or creating a document in the builder, the user is redirected to the document's detail page.
- **D-06:** Clicking "Convert to invoice" on an accepted quotation's detail page immediately creates a new draft invoice and redirects to the new invoice's builder page for review. No confirmation modal.
- **D-07:** After conversion, the source quotation is locked against editing. Its status is set to "accepted" and the Edit button becomes disabled with a "Converted" indication.
- **D-08:** The client detail page displays linked invoices and quotations as simple summary cards (document number, status badge, date, total). No DataView within client detail.
- **D-09:** Client detail shows two headline financial stats: total billed (sum of invoice totals) and total quoted (sum of quotation totals). No status-based breakdowns.

### Claude's Discretion

- Exact visual design of the share modal (size, layout, copy-success feedback animation)
- Empty state messaging for clients with no documents yet on the detail page
- DataView default view mode per list page (list vs table vs kanban) — pick what suits each entity best
- Mobile builder layout details (Dialog preview trigger placement, form section ordering)
- Exact disabled-state treatment for locked quotations (tooltip text, visual style)

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope.

</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| CLNT-01 | User can create, edit, and archive a client record | `createClientAction`, `updateClientAction`, `archiveClientAction` all exist in `src/actions/clients.ts`. `ClientForm` component exists. Create inline card and edit form (via `?edit=1`) already wired on client detail page. |
| CLNT-02 | User can store client name, company, email, phone, address, tax info, and status | `clientFormSchema` in `src/lib/billing.ts` covers all fields. DB row includes `trn`, `tax_code`, `portal_token`. `ClientForm` renders all fields. |
| CLNT-03 | User can view all quotations and invoices associated with a client on the client detail page | `listInvoicesForClient` and `listQuotationsForClient` exist in `src/lib/billing-data.ts`. Client detail page already fetches and renders both lists. Needs `DocumentSummaryRow` to add status badges per D-08. |
| CLNT-04 | User can generate new quotations and invoices directly from a client detail page | Already implemented — "New quotation" and "New invoice" buttons pass `?clientId=` to builder routes. |
| QUOT-01 | User can create, edit, save, and delete quotation drafts | `createQuotationAction`, `updateQuotationAction`, `deleteQuotationAction` exist. Builder page at `/app/quotations/new` and `/app/quotations/[id]/edit` exist. |
| QUOT-02 | User can add structured line items with description, quantity, unit price, and total | `DocumentBuilder` handles line items with add/remove. `documentLineItemSchema` validates them. |
| QUOT-03 | User can set issue date, expiry date, discount, tax, notes, terms, and language on a quotation | All fields exist in `DocumentBuilder` and `quotationFormSchema`. |
| QUOT-04 | User can preview quotation output live while editing | `InvoicePreview` rendered live in builder right panel (xl) or Dialog (mobile). Already implemented. |
| QUOT-05 | User can mark a quotation as sent, accepted, rejected, or expired | `setQuotationStatusAction` exists. `DocumentStatusActions` component to be built per D-03, replacing the current ad-hoc button grid. |
| QUOT-06 | User can share a public quotation link by secure token | `share_token` generated at creation. Public page at `/quotations/public/[shareToken]` exists. `ShareModal` component to be built per D-01 (currently detail page has a plain `<Link>` to the public URL). |
| QUOT-07 | User can export a quotation to PDF | API route at `/api/quotations/[id]/pdf` exists (uses Playwright + Chromium). D-02 specifies direct download link — already an `<a>` tag; verify it uses `download` attribute or `target="_blank"`. |
| INV-01 | User can create, edit, save, and delete invoice drafts | `createInvoiceAction`, `updateInvoiceAction`, `deleteInvoiceAction` exist. Builder at `/app/invoices/new` and `/app/invoices/[id]/edit`. |
| INV-02 | User can add structured line items with description, quantity, unit price, and total | Same as QUOT-02 — shared `DocumentBuilder`. |
| INV-03 | User can set invoice type, issue date, due date, discount, tax, notes, terms, and language | All fields in `DocumentBuilder` and `invoiceFormSchema`. |
| INV-04 | User can preview invoice output live while editing | Same as QUOT-04 — already implemented. |
| INV-05 | User can mark an invoice as sent | `setInvoiceStatusAction` exists. `DocumentStatusActions` to wrap it per D-03. |
| INV-06 | User can share a public invoice link by secure token | Same pattern as QUOT-06. `ShareModal` needed. |
| INV-07 | User can export an invoice to PDF | API route at `/api/invoices/[id]/pdf` exists. Same wiring check as QUOT-07. |
| INV-08 | User can convert an accepted quotation into an invoice | `convertQuotationToInvoiceAction` exists in `src/actions/quotations.ts` and redirects to `/app/invoices/{invoiceData.id}`. D-06 says redirect should go to the builder, not the detail page. **Gap: current action redirects to detail page, D-06 requires builder page.** D-07 locking logic also needs implementation. |

</phase_requirements>

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js | 15.5.14 | App Router, server actions, API routes | Locked by project |
| React | 19.2.0 | UI rendering, `useTransition`, `useState` | Locked by project |
| Supabase JS | 2.101.1 | DB queries, auth session | Locked by project |
| Zod | 4.3.6 | Schema validation for form inputs | Established pattern in all actions |
| Tailwind CSS v4 | (via `@tailwindcss/postcss`) | Styling, design tokens via `@theme inline` | Locked by project |
| shadcn/ui | stone preset, css-variables | Button, Card, Dialog, Badge, Input, Textarea, Label | Established component library |
| Lucide React | 0.542.0 | Icons (Send, Share2, Copy, Check, Trash2, etc.) | Established throughout codebase |
| GSAP | 3.14.2 | Page transitions (already wired via PageTransition component) | Established in Phase 1 |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `@sparticuz/chromium` | ^143.0.4 | Headless Chromium for Playwright PDF generation | PDF export routes only |
| playwright-core | ^1.59.1 | `renderDocumentUrlToPdf` in `src/lib/document-pdf.ts` | PDF routes only |
| `react` `cache()` | (built-in) | Per-request deduplication for `getClientOptions` | Data functions called multiple times per render |

**Installation:** No new packages needed for Phase 2.

---

## Architecture Patterns

### Established Patterns (MUST follow)

**Server actions:**
```typescript
// Source: src/actions/clients.ts, src/actions/invoices.ts
"use server";
// 1. Parse FormData with Zod schema
// 2. requireSession() for auth + supabase client
// 3. Supabase mutation
// 4. revalidatePath() to bust cache
// 5. redirect() on success OR return ActionState { status, message, redirectTo? }
```

**Server action return pattern for builder redirect:**
```typescript
// Source: src/actions/invoices.ts createInvoiceAction
return {
  status: "success",
  redirectTo: `/app/invoices/${data.id}` as Route,
};
// Builder handles: if (result.status === "success" && result.redirectTo) router.push(result.redirectTo)
```

**Direct server action call pattern (detail page status buttons):**
```typescript
// Source: src/app/(app)/app/invoices/[id]/page.tsx
<form
  action={async () => {
    "use server";
    await setInvoiceStatusAction(invoice.id, "sent");
  }}
>
  <Button type="submit" variant="accent" className="w-full">
    <Send className="size-4" />
    Mark as sent
  </Button>
</form>
```

**Client component with useTransition for async actions:**
```typescript
// Source: src/components/documents/document-builder.tsx
const [isPending, startTransition] = useTransition();
startTransition(async () => {
  const result = await submitAction(prevState, formData);
  setState(result);
  if (result.status === "success" && result.redirectTo) {
    router.push(result.redirectTo as Route);
  }
});
```

**Share token access:**
```typescript
// Source: src/lib/billing-utils.ts — createShareToken()
// Tokens are 36-char hex strings (18 bytes). Already generated at document creation.
// InvoiceRecord/QuotationRecord expose shareToken (camelCase from mapInvoice/mapQuotation)
```

**Public URL construction (for ShareModal):**
```typescript
// Existing public pages:
// /invoices/public/[shareToken]
// /quotations/public/[shareToken]
// Full URL needed in ShareModal: construct from window.location.origin + path
```

### Recommended Project Structure

No changes to project structure needed. New components go in:
```
src/
├── components/
│   └── documents/
│       ├── document-builder.tsx        # MODIFY: remove status select
│       ├── share-modal.tsx             # NEW
│       ├── document-status-actions.tsx # NEW
│       └── document-summary-row.tsx    # NEW
├── app/(app)/app/
│   ├── invoices/[id]/page.tsx         # MODIFY: wire ShareModal, DocumentStatusActions
│   └── quotations/[id]/page.tsx       # MODIFY: wire ShareModal, DocumentStatusActions, lock D-07
```

### Pattern: ShareModal (client component)

```typescript
// src/components/documents/share-modal.tsx
"use client";
import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

// Props: publicUrl: string, open: boolean, onOpenChange: (open: boolean) => void
// Copy state: useState<"idle" | "copied">("idle")
// On copy: navigator.clipboard.writeText(publicUrl), set "copied", setTimeout reset 2000ms
// prefers-reduced-motion: skip timeout (immediate reset)
```

### Pattern: DocumentStatusActions (server component safe — uses inline server actions)

Status logic is already partially present on detail pages as ad-hoc forms. Extract into a dedicated component.

Quotation transitions per UI-SPEC:
- `draft` → "Mark as sent" (accent)
- `sent` → "Mark as accepted" (secondary), "Mark as rejected" (secondary)
- `accepted` → "Convert to invoice" (accent) — calls `convertQuotationToInvoiceAction`
- `expired` → no transitions
- Any → "Delete quotation" (danger)

Invoice transitions per UI-SPEC:
- `draft` → "Mark as sent" (accent)
- `sent` → no further invoice actions in Phase 2
- Any → "Delete invoice" (danger)

### Pattern: DocumentSummaryRow (per D-08)

Replaces the current `<Link>` rows on the client detail page. Adds `DocumentStatusBadge` on the right instead of `ArrowRight`. Structure confirmed in UI-SPEC:
```tsx
<Link href={...} className="rounded-[1rem] border border-black/7 bg-[#FFF8EE] px-4 py-4 transition hover:border-[#D7C4A7] hover:bg-[#FFF4E3]">
  <div className="flex items-center justify-between gap-3">
    <div>
      <p className="text-sm font-semibold text-foreground">{documentNumber}</p>
      <p className="text-sm text-muted-strong mt-1">{subtitle}</p>
    </div>
    <DocumentStatusBadge status={status} />
  </div>
</Link>
```

### Anti-Patterns to Avoid

- **Re-implementing the builder from scratch:** `DocumentBuilder` already handles all line items, date fields, commercial settings, notes, terms. Only remove the status `<select>` and add read-only badge.
- **Adding new status logic in the builder:** D-04 is explicit — builder always saves as draft. All status transitions are on the detail page.
- **Creating new data-fetch functions:** `listInvoicesForClient`, `listQuotationsForClient`, `getInvoiceById`, `getQuotationById` cover all Phase 2 reads.
- **Using `useEffect` for share URL:** `window.location.origin` is available synchronously in a client component event handler; no effect needed.
- **Wrapping server action forms in `"use client"` unnecessarily:** Detail pages are server components; inline `async () => { "use server"; ... }` forms work without making the page a client component.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| PDF generation | Custom HTML-to-PDF pipeline | `src/lib/document-pdf.ts` + `@sparticuz/chromium` + playwright-core | Already implemented, tested on Vercel serverless |
| Share token generation | Custom UUID/random | `createShareToken()` in `src/lib/billing-utils.ts` | Already in place, called at document creation |
| Quotation → invoice mapping | Custom field copy | `mapQuotationToInvoiceInput()` in `src/lib/billing-utils.ts` | Already maps all fields correctly |
| Document total computation | Custom math | `computeDocumentTotals()` in `src/lib/billing-utils.ts` | Handles discount/tax order-of-operations correctly |
| Clipboard copy | Custom execCommand | `navigator.clipboard.writeText()` | Modern async API, works in all target browsers |
| Status badge rendering | Custom badge component | `DocumentStatusBadge` in `src/components/documents/document-status-badge.tsx` | Already handles all invoice and quotation statuses |
| Client status badge | Custom | `ClientStatusBadge` in `src/components/clients/client-status-badge.tsx` | Already exists |

**Key insight:** Phase 2 is ~70% pre-built. Most work is wiring existing server actions and components into a polished UX flow, not building new infrastructure.

---

## Critical Gap: D-06 Redirect Target

**Current behavior:** `convertQuotationToInvoiceAction` in `src/actions/quotations.ts` (line 416) redirects to:
```typescript
redirect(`/app/invoices/${invoiceData.id}` as Route);
// → redirects to invoice DETAIL page
```

**D-06 requires:** Redirect to invoice BUILDER page for review:
```typescript
redirect(`/app/invoices/${invoiceData.id}/edit` as Route);
// → redirects to invoice BUILDER (edit) page
```

The builder's edit route `/app/invoices/[id]/edit` loads the existing invoice data via `getInvoiceById` and passes it to `DocumentBuilder` as `initialValue`. This is the correct target per D-06: "redirects the user to the new invoice's builder page for review."

**Action required:** Update line 416 in `src/actions/quotations.ts` to change the redirect target from `${invoiceData.id}` to `${invoiceData.id}/edit`.

---

## Critical Gap: D-07 Quotation Lock

**Current behavior:** Quotation detail page shows "Edit" button as a plain link with no lock logic. `convertQuotationToInvoiceAction` sets `converted_to_invoice_id` and `conversion_date` on the quotation row, but the detail page does not use these fields to disable the Edit button.

**D-07 requires:**
1. If `quotation.convertedToInvoiceId !== null`, the Edit button on the quotation detail page is disabled with `opacity-50 cursor-not-allowed`.
2. A "Converted" badge appears inline next to the DocumentStatusBadge.
3. Tooltip text: "This quotation has been converted into an invoice and can no longer be edited."

**Implementation:** The `QuotationRecord` type already exposes `convertedToInvoiceId` from `billing-data.ts`. The detail page can conditionally render the Edit button.

---

## Common Pitfalls

### Pitfall 1: Status Select Still Submits "draft" Override

**What goes wrong:** If the builder's status `<select>` is removed but the hidden form value is not replaced, the server action may receive no status value and default incorrectly.
**Why it happens:** `parseQuotationPayload` / `parseInvoicePayload` read `formData.get("status")`. If `<select name="status">` is removed, the field is absent.
**How to avoid:** Replace the `<select>` with `<input type="hidden" name="status" value="draft" />` in `DocumentBuilder` when in "new" mode. In edit mode, preserve the existing status from `initialValue?.status`.

### Pitfall 2: ShareModal `window.location.origin` SSR Crash

**What goes wrong:** Calling `window.location.origin` in a server component or during SSR throws "window is not defined".
**Why it happens:** `ShareModal` needs the full URL including origin. If this is computed outside a client component event handler, it runs during SSR.
**How to avoid:** `ShareModal` must be a `"use client"` component. Compute the full URL inside a click handler or use `typeof window !== "undefined"` guard. Alternatively, pass the full absolute URL as a prop from the server component (using `headers()` to read the host).

### Pitfall 3: Playwright PDF on Vercel — Cold Start Timeout

**What goes wrong:** First PDF request on a cold Vercel serverless function may exceed the function timeout (default 10s, PDF route needs ~15-30s).
**Why it happens:** `@sparticuz/chromium` cold-starts the binary. The existing `document-pdf.ts` already has a 30s `goto` timeout and 15s selector timeout.
**How to avoid:** Vercel function timeout for PDF routes should be set to 60s in `vercel.json` or `next.config.ts`. Verify this is already configured (not checked in this research — flag for planner to verify).

### Pitfall 4: `revalidatePath` Missing After Quotation Lock

**What goes wrong:** After `convertQuotationToInvoiceAction`, the quotation detail page still shows the Edit button as enabled if the cache is not busted.
**Why it happens:** `revalidatePath("/app/quotations")` and `revalidatePath(`/app/quotations/${quotationId}`)` are already called. This should be fine — but confirm the detail page is not using `use cache` or `unstable_cache` that might hold a stale value.
**Warning signs:** Edit button remains clickable after conversion on the quotation detail page.

### Pitfall 5: Builder Status Badge Position

**What goes wrong:** The read-only status badge (replacing the dropdown per D-04) appears in the wrong location or is visually inconsistent.
**Why it happens:** The `DocumentBuilder` CardHeader has a multi-element flex row (Badge + CardTitle + mobile Dialog trigger). Inserting a `DocumentStatusBadge` in the wrong spot breaks the layout.
**How to avoid:** Per UI-SPEC: the status badge goes in the CardHeader alongside the "Invoice builder" / "Quotation builder" Badge, in the same `flex flex-wrap items-center gap-3` row pattern used on detail pages. The mobile Dialog trigger stays in its current position (right side of header).

### Pitfall 6: Copy-to-Clipboard Requires HTTPS

**What goes wrong:** `navigator.clipboard.writeText()` throws in non-secure contexts (localhost HTTP).
**Why it happens:** Clipboard API requires HTTPS or localhost.
**How to avoid:** For dev, access via `https://localhost` or use the `document.execCommand('copy')` fallback. In production (Vercel), HTTPS is always present. Acceptable to ignore in dev if team uses localhost.

---

## Code Examples

### Share Modal Copy Feedback (complete pattern)
```typescript
// Source: UI-SPEC 02-UI-SPEC.md — ShareModal pattern
"use client";
import { useState } from "react";
const [copyState, setCopyState] = useState<"idle" | "copied">("idle");

const handleCopy = async () => {
  try {
    await navigator.clipboard.writeText(publicUrl);
    setCopyState("copied");
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!prefersReduced) {
      setTimeout(() => setCopyState("idle"), 2000);
    } else {
      setCopyState("idle");
    }
  } catch {
    // fallback: select text
  }
};
```

### Status-Conditional Edit Button (D-07)
```typescript
// src/app/(app)/app/quotations/[id]/page.tsx
const isLocked = quotation.convertedToInvoiceId !== null;

// In the header button group:
{isLocked ? (
  <Button variant="secondary" size="sm" disabled className="opacity-50 cursor-not-allowed"
    title="This quotation has been converted into an invoice and can no longer be edited.">
    <SquarePen className="size-4" />
    Edit
  </Button>
) : (
  <Button asChild variant="secondary" size="sm">
    <Link href={`/app/quotations/${quotation.id}/edit`}>
      <SquarePen className="size-4" />
      Edit
    </Link>
  </Button>
)}
```

### Hidden Status Field in Builder (D-04)
```typescript
// src/components/documents/document-builder.tsx — replace status <select>
// Read-only display only, no form field mutation
<input type="hidden" name="status" value={initialValue?.status ?? "draft"} />
// In header alongside builder badge:
<DocumentStatusBadge status={(initialValue?.status ?? "draft") as InvoiceStatus | QuotationStatus} />
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `useFormState` | `useActionState` (React 19) | React 19 / Next.js 15 | `useFormState` is removed in React 19 — the codebase already uses `useState` + `useTransition` pattern which is correct for React 19 |
| `next/headers` sync | `next/headers` async (`await headers()`) | Next.js 15 | Existing code already uses async patterns correctly |
| `params` sync | `params: Promise<{...}>` with `await` | Next.js 15 | Already correctly implemented in all detail pages |

**Deprecated/outdated:**
- `useFormState`: Removed in React 19. Codebase correctly uses `useState` + `useTransition` instead — no migration needed.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Next.js dev server | ✓ | (detected via project) | — |
| Supabase (cloud) | All data operations | ✓ | 2.101.1 SDK | — |
| Playwright / Chromium | PDF generation | ✓ | playwright-core ^1.59.1 + @sparticuz/chromium ^143.0.4 | — |
| Vercel (deploy) | Production hosting | ✓ | (cloud service) | — |

**Open verification item:** Verify Vercel function timeout config for `/api/invoices/[id]/pdf` and `/api/quotations/[id]/pdf`. PDF generation requires 30-60s. If no `maxDuration` is set in route config, default Vercel timeout (10s on Hobby) may cause failures.

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest (configured at `vitest.config.ts`) |
| Config file | `/Users/koss/Desktop/Develop/INV/vitest.config.ts` |
| Quick run command | `npm test` |
| Full suite command | `npm test` |
| E2E command | `npm run test:e2e` (Playwright) |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| CLNT-01 | Create/edit/archive client action logic | unit | `npm test -- billing-utils` | ✅ (billing-utils.test.ts covers related utils) |
| QUOT-05 | Status transitions: sent/accepted/rejected/expired | unit | `npm test -- src/lib/billing-utils.test.ts` | ❌ Wave 0 — no status action unit tests |
| INV-05 | Status transitions: draft → sent | unit | same | ❌ Wave 0 |
| INV-08 | mapQuotationToInvoiceInput correctness | unit | `npm test -- src/lib/billing-utils.test.ts` | ✅ (covered in billing-utils.test.ts) |
| QUOT-07 / INV-07 | PDF API routes return 200 + pdf content-type | smoke | `npm run test:e2e` | ❌ Wave 0 — no PDF route test |
| QUOT-06 / INV-06 | Share token visible in ShareModal | manual / visual | — | manual only |
| D-06 | convertQuotationToInvoiceAction redirect to edit page | unit | `npm test -- quotations` | ❌ Wave 0 |
| D-07 | Locked quotation: convertedToInvoiceId gates Edit button | unit | `npm test -- quotations` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `npm test` (Vitest, < 5s for unit suite)
- **Per wave merge:** `npm test && npm run typecheck`
- **Phase gate:** `npm test && npm run typecheck && npm run build` before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/actions/quotations.test.ts` — covers D-06 redirect target and D-07 lock condition
- [ ] `src/actions/invoices.test.ts` — covers status action correctness
- [ ] No new test framework install needed — Vitest is already configured

---

## Open Questions

1. **Vercel PDF route timeout**
   - What we know: `renderDocumentUrlToPdf` has 30s goto timeout + 15s selector wait
   - What's unclear: Whether `vercel.json` or route config already sets `maxDuration: 60`
   - Recommendation: Planner should include a task to verify/add `export const maxDuration = 60;` to both PDF route files

2. **`convertQuotationToInvoiceAction` redirect target**
   - What we know: Currently redirects to `/app/invoices/${invoiceData.id}` (detail page)
   - What's unclear: Whether this was intentional in Phase 1 or a placeholder
   - Recommendation: This is a confirmed gap per D-06 — fix in Wave 1 of the plan

3. **ShareModal public URL construction**
   - What we know: Public pages exist at `/invoices/public/[shareToken]` and `/quotations/public/[shareToken]`
   - What's unclear: Whether the full absolute URL should be constructed server-side (via `headers().get("host")`) or client-side (`window.location.origin`)
   - Recommendation: Client-side is simpler and avoids a headers() call. Since ShareModal is a `"use client"` component (needs clipboard API), compute `window.location.origin + "/invoices/public/" + shareToken` in the click handler or pass as a prop.

---

## Project Constraints (from CLAUDE.md)

- **AGENTS.md directive:** "This is NOT the Next.js you know. Read `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices." — Any Next.js API usage must be verified against the installed version (15.5.14).
- **Memory:** Check Supabase backend first, then implement, then deploy to Vercel production.
- **Design prerequisite:** Before any frontend design or implementation starts for this phase, `aidesigner-frontend` and `ui-ux-pro-max` must be invoked. The UI-SPEC (02-UI-SPEC.md) is already approved — this prerequisite is satisfied.
- **Infra/deploy:** While executing this phase, check Supabase and Vercel implications in parallel. Phase is not done until deployed to Vercel and verified live.

---

## Sources

### Primary (HIGH confidence)
- Direct codebase scan — all file paths and code patterns verified by reading source files
- `src/actions/clients.ts`, `src/actions/invoices.ts`, `src/actions/quotations.ts` — server action implementations
- `src/components/documents/document-builder.tsx` — builder component
- `src/lib/billing-data.ts` — all data-fetch functions
- `src/lib/billing.ts` — schemas and types
- `src/lib/billing-utils.ts` — utility functions
- `src/lib/document-pdf.ts` — PDF generation
- `src/app/(app)/app/clients/[slug]/page.tsx` — client detail page
- `src/app/(app)/app/invoices/[id]/page.tsx` — invoice detail page
- `src/app/(app)/app/quotations/[id]/page.tsx` — quotation detail page
- `.planning/phases/02-clients-document-engine/02-UI-SPEC.md` — approved UI design contract
- `.planning/phases/02-clients-document-engine/02-CONTEXT.md` — locked decisions
- `.planning/REQUIREMENTS.md` — requirement definitions

### Secondary (MEDIUM confidence)
- Package.json verified dependencies and versions
- `vitest.config.ts` verified test framework configuration

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all versions verified from package.json
- Architecture patterns: HIGH — extracted directly from codebase source files
- Pitfalls: HIGH (D-04/D-06/D-07 gaps) / MEDIUM (clipboard/PDF timeout — based on known browser/Vercel behavior)
- Test infrastructure: HIGH — vitest.config.ts and existing test files read directly

**Research date:** 2026-04-06
**Valid until:** 2026-05-06 (stack is stable, no fast-moving dependencies)
