# WhatsApp Share for Documents

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task.

**Goal:** Let operators send an invoice/quotation public link via WhatsApp (or copy it) directly from the document detail page, and let public viewers forward a document link via WhatsApp.

**Architecture:** Pure client-side. `wa.me/?text=` deep link with a URL-encoded message. No backend changes, no schema changes. The `shareToken` and public URL pattern (`/invoices/public/{shareToken}`, `/quotations/public/{shareToken}`) already exist.

**Tech Stack:** React 19 client component, `navigator.clipboard`, `lucide-react` icons, existing Tailwind tokens.

---

## Current state (investigated)

- **Operator side — NO share button exists at all.** `src/app/(app)/app/invoices/[slug]/page.tsx:100-111` renders Delete / Edit / Recurring / Status / Export buttons. There is no "Copy link" or "Share" action. Same gap on `src/app/(app)/app/quotations/[slug]/page.tsx`.
- **Public side:** `src/components/public/public-document-actions.tsx` only renders a PDF download `<a>`. No share/forward.
- `shareToken` is already on every `InvoiceRecord` and `QuotationRecord` (mapped in `src/lib/billing-data.ts:168,207`).
- Public URL is constructed in 2 places already: `src/app/api/invoices/[id]/pdf/route.ts:33` and `src/app/api/cron/reminders/route.ts:122`. Pattern: `${siteUrl}/invoices/public/${shareToken}`.
- `src/lib/env.ts` exports `env.siteUrl` — use this, not `window.location.origin`, so SSR and client agree.

---

## Tasks

### Task 1: Create `ShareButton` client component

**Objective:** Reusable button that copies the public link to clipboard and offers a WhatsApp deep link.

**Files:**
- Create: `src/components/documents/share-button.tsx`

**Implementation:**

```tsx
"use client";

import { useState } from "react";
import { Check, Copy, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ShareButtonProps {
  /** Full public URL, e.g. https://invios.online/invoices/public/abc123 */
  publicUrl: string;
  /** Document number for the WhatsApp message, e.g. "INV-0001" */
  documentNumber: string;
  /** Optional total + currency for a richer message */
  amountLabel?: string;
  /** "invoice" | "quotation" — controls wording */
  documentKind: "invoice" | "quotation";
  variant?: "default" | "accent" | "secondary" | "ghost";
  size?: "default" | "sm";
}

export function ShareButton({
  publicUrl,
  documentNumber,
  amountLabel,
  documentKind,
  variant = "secondary",
  size = "sm",
}: ShareButtonProps) {
  const [copied, setCopied] = useState(false);

  const kindLabel = documentKind === "invoice" ? "invoice" : "quotation";

  const message = amountLabel
    ? `Your ${kindLabel} ${documentNumber} for ${amountLabel} is ready: ${publicUrl}`
    : `Your ${kindLabel} ${documentNumber} is ready: ${publicUrl}`;

  const whatsappHref = `https://wa.me/?text=${encodeURIComponent(message)}`;

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard API can fail in non-secure contexts — fallback to WhatsApp
      window.open(whatsappHref, "_blank");
    }
  }

  return (
    <div className="flex gap-2">
      <Button type="button" variant={variant} size={size} onClick={handleCopy}>
        {copied ? (
          <>
            <Check className="size-4" />
            Copied
          </>
        ) : (
          <>
            <Copy className="size-4" />
            Copy link
          </>
        )}
      </Button>
      <Button asChild variant={variant} size={size}>
        <a href={whatsappHref} target="_blank" rel="noopener noreferrer">
          <MessageCircle className="size-4" />
          WhatsApp
        </a>
      </Button>
    </div>
  );
}
```

**Verification:** `pnpm typecheck` passes.

---

### Task 2: Wire `ShareButton` into invoice detail page

**Objective:** Add the share button to the operator invoice detail page.

**Files:**
- Modify: `src/app/(app)/app/invoices/[slug]/page.tsx` (around line 100-111, the button row)

**Changes:**

1. Import `ShareButton` and `env` from `@/lib/env`.
2. Build the public URL from `invoice.shareToken`:
   ```ts
   const publicUrl = `${env.siteUrl}/invoices/public/${invoice.shareToken}`;
   ```
3. Add `<ShareButton>` to the button row alongside ExportButton:
   ```tsx
   <ShareButton
     publicUrl={publicUrl}
     documentNumber={invoice.invoiceNumber}
     amountLabel={formatCurrency(invoice.total, invoice.currency)}
     documentKind="invoice"
   />
   <ExportButton invoiceId={invoice.id} invoiceNumber={invoice.invoiceNumber} />
   ```

**Verification:** `pnpm dev` → open any invoice → see Copy link + WhatsApp buttons → clicking Copy shows "Copied" → clicking WhatsApp opens wa.me with encoded message.

---

### Task 3: Wire `ShareButton` into quotation detail page

**Objective:** Same treatment for quotations.

**Files:**
- Modify: `src/app/(app)/app/quotations/[slug]/page.tsx`

**Changes:** Same pattern as Task 2 but with:
- `publicUrl = ${env.siteUrl}/quotations/public/${quotation.shareToken}`
- `documentKind="quotation"`
- `documentNumber={quotation.quotationNumber}`

**Verification:** Open any quotation → share buttons present and working.

---

### Task 4: Add WhatsApp forward to public document actions

**Objective:** Let the client (or anyone viewing the public link) forward it via WhatsApp.

**Files:**
- Modify: `src/components/public/public-document-actions.tsx`

**Changes:** Add `shareToken` and `documentKind` usage (props already exist but are unused). Build the public URL from `window.location.href` (we're already on the public page). Add a WhatsApp forward link below the PDF download.

```tsx
// Add inside the component, before the return:
const currentUrl = typeof window !== "undefined" ? window.location.href : "";
const whatsappHref = `https://wa.me/?text=${encodeURIComponent(`Document: ${currentUrl}`)}`;
```

Add a small WhatsApp forward button in the desktop block section.

**Verification:** Open a public invoice link → WhatsApp forward button visible → opens wa.me.

---

### Task 5: Commit

```bash
git add src/components/documents/share-button.tsx \
        src/app/(app)/app/invoices/[slug]/page.tsx \
        src/app/(app)/app/quotations/[slug]/page.tsx \
        src/components/public/public-document-actions.tsx
git commit -m "feat: add WhatsApp share + copy link to invoices, quotations, and public pages"
```

---

## Risks / edge cases

- **Clipboard API on HTTP:** Falls back to opening WhatsApp directly. Production is HTTPS so this is a non-issue on Vercel.
- **Message length:** `wa.me` has a practical limit ~1000 chars. Our message is well under.
- **Client phone unknown:** We use `wa.me/?text=` (no phone number) which opens WhatsApp to let the user pick a contact. We could prefill `wa.me/{phone}` if `client.phone` is set — optional enhancement for later.

## Effort estimate

~45 minutes. No backend, no migration, no new deps.
