# PDF Generation Cold-Start Optimization

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task.

**Goal:** Reduce the 3-8 second PDF export latency caused by Playwright + `@sparticuz/chromium` cold-start on Vercel serverless.

**Architecture:** Three-pronged approach: (1) optimize the browser launch args, (2) add a lightweight keepalive cron so the serverless container stays warm, (3) add an async "email PDF" fallback so the user is never blocked waiting. The keepalive is the primary win because `@sparticuz/chromium` must extract the binary on first invocation.

**Tech Stack:** Existing `playwright-core` + `@sparticuz/chromium`, Vercel cron, Resend (already integrated).

---

## Current state (investigated)

- `src/lib/document-pdf.ts` launches Playwright fresh on every call:
  ```ts
  const browser = await playwright.launch({
    args: chromium.args,
    executablePath: await chromium.executablePath(),
    headless: true,
  });
  ```
- `await chromium.executablePath()` extracts the binary from the lambda layer on cold start — this is the primary latency source.
- `waitUntil: "networkidle"` + 30s timeout + 15s selector wait compounds the problem.
- Route handlers: `src/app/api/invoices/[id]/pdf/route.ts`, `src/app/api/quotations/[id]/pdf/route.ts` — both `maxDuration = 60`.
- Resend is already a dependency (`src/lib/email.ts`) and used for reminders.
- Cron pattern is established (`vercel.json` + `CRON_SECRET` auth).

---

## Tasks

### Task 1: Optimize `document-pdf.ts` launch args

**Objective:** Reduce extraction + launch overhead.

**Files:**
- Modify: `src/lib/document-pdf.ts`

**Changes:**

1. Add `singleProcess: true` to launch args (keeps chromium to one process):
   ```ts
   const browser = await playwright.launch({
     args: [...chromium.args, "--single-process"],
     executablePath: await chromium.executablePath(),
     headless: true,
   });
   ```

2. Reduce `networkidle` to `domcontentloaded` for `?print=1` pages (the print page doesn't need network idle — it's all server-rendered):
   ```ts
   await page.goto(url, {
     waitUntil: "domcontentloaded",
     timeout: 15_000,
   });
   ```

3. Keep the font-ready + selector wait, but reduce selector timeout to 10s.

**Verification:** `pnpm dev` → export a PDF → confirm it renders correctly and faster locally (the real win is on Vercel).

---

### Task 2: Add keepalive cron endpoint

**Objective:** Hit the PDF endpoint on a schedule to keep the serverless container warm.

**Files:**
- Create: `src/app/api/cron/pdf-keepalive/route.ts`

```ts
import type { NextRequest } from "next/server";
import { isCronAuthenticated } from "@/lib/env";

export const maxDuration = 15;

export async function GET(request: NextRequest) {
  if (!isCronAuthenticated(request.headers.get("authorization"))) {
    return new Response("Unauthorized", { status: 401 });
  }

  // We don't actually generate a PDF here — that would require auth context.
  // Instead, we import the chromium module to trigger binary extraction into
  // the container layer cache, warming it for the next real request.
  try {
    await import("@sparticuz/chromium");
    return Response.json({ warmed: true });
  } catch (err) {
    return Response.json(
      { warmed: false, error: err instanceof Error ? err.message : "unknown" },
      { status: 500 },
    );
  }
}
```

**Files:**
- Modify: `vercel.json`

```json
{
  "crons": [
    { "path": "/api/cron/recurring", "schedule": "0 6 * * *" },
    { "path": "/api/cron/reminders", "schedule": "0 7 * * *" },
    { "path": "/api/cron/pdf-keepalive", "schedule": "*/5 * * * *" }
  ]
}
```

**Note:** Vercel cron has a 5-minute minimum granularity. This keeps the container warm during business hours. Cost: ~288 invocations/day on the free/hobby tier, well within limits.

---

### Task 3: Add async "Email me the PDF" fallback

**Objective:** Give the user an async option if the sync export is slow.

**Files:**
- Create: `src/app/api/invoices/[id]/email-pdf/route.ts`
- Create: `src/app/api/quotations/[id]/email-pdf/route.ts`

**Implementation (invoice variant):**

```ts
import { NextResponse } from "next/server";
import { getInvoiceById } from "@/lib/billing-data";
import { renderDocumentUrlToPdf } from "@/lib/document-pdf";
import { requireSession } from "@/lib/require-session";
import { sendPdfEmail } from "@/lib/email";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  let userId: string;
  try {
    const { user } = await requireSession();
    userId = user.id;
  } catch {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const invoice = await getInvoiceById(id);
  if (!invoice || invoice.userId !== userId) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  const origin = new URL(request.url).origin;
  const pdfBuffer = await renderDocumentUrlToPdf(
    `${origin}/invoices/public/${invoice.shareToken}?print=1`,
  );

  await sendPdfEmail({
    to: user.email,
    documentNumber: invoice.invoiceNumber,
    pdfBuffer,
    kind: "invoice",
  });

  return NextResponse.json({ sent: true });
}
```

**Files:**
- Modify: `src/lib/email.ts` — add `sendPdfEmail` function that attaches a Buffer via Resend's attachment API:
  ```ts
  export async function sendPdfEmail({ to, documentNumber, pdfBuffer, kind }: {
    to: string;
    documentNumber: string;
    pdfBuffer: Buffer;
    kind: "invoice" | "quotation";
  }) {
    const { data, error } = await resend.emails.send({
      from: EMAIL_FROM,
      to,
      subject: `Your ${kind} ${documentNumber}`,
      html: `<p>Your ${kind} ${documentNumber} is attached.</p>`,
      attachments: [{
        filename: `${documentNumber}.pdf`,
        content: pdfBuffer,
      }],
    });
    if (error) throw new Error(`Resend error: ${error.message}`);
  }
  ```

---

### Task 4: Add "Email PDF" button to the UI

**Objective:** Expose the async option in the invoice detail page.

**Files:**
- Create: `src/components/documents/email-pdf-button.tsx`

A client component that POSTs to the email-pdf endpoint and shows a loading state:

```tsx
"use client";
import { useState } from "react";
import { Mail } from "lucide-react";
import { Button } from "@/components/ui/button";

export function EmailPdfButton({ endpoint }: { endpoint: string }) {
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  async function handleSend() {
    setStatus("sending");
    try {
      const res = await fetch(endpoint, { method: "POST" });
      if (!res.ok) throw new Error("Failed");
      setStatus("sent");
      setTimeout(() => setStatus("idle"), 3000);
    } catch {
      setStatus("error");
      setTimeout(() => setStatus("idle"), 3000);
    }
  }

  return (
    <Button type="button" variant="secondary" size="sm" onClick={handleSend} disabled={status === "sending"}>
      <Mail className="size-4" />
      {status === "sending" ? "Sending…" : status === "sent" ? "Sent!" : status === "error" ? "Failed" : "Email PDF"}
    </Button>
  );
}
```

Wire into `src/app/(app)/app/invoices/[slug]/page.tsx` next to `<ExportButton>`:
```tsx
<EmailPdfButton endpoint={`/api/invoices/${invoice.id}/email-pdf`} />
```
Same for quotations page.

---

### Task 5: Verify and commit

**Run:**
```bash
pnpm typecheck
pnpm build
pnpm test
```

**Commit:**
```bash
git add src/lib/document-pdf.ts src/app/api/cron/pdf-keepalive/route.ts \
        src/app/api/invoices/[id]/email-pdf/route.ts \
        src/app/api/quotations/[id]/email-pdf/route.ts \
        src/lib/email.ts src/components/documents/email-pdf-button.tsx \
        src/app/(app)/app/invoices/[slug]/page.tsx \
        src/app/(app)/app/quotations/[slug]/page.tsx \
        vercel.json
git commit -m "perf: optimize PDF cold-start, add keepalive cron and async email-PDF fallback"
```

---

## Risks / edge cases

- **Keepalive cost:** ~288 cron invocations/day. Vercel Hobby allows 2 cron invocations/min and 100GB-hours. Negligible.
- **Keepalive doesn't fully solve cold start:** Vercel may still spin a new container under load. The real fix is moving PDF to a dedicated worker (Modal, Cloudflare Workers Browser Rendering) — but that's a larger scope. This plan makes the pragmatic improvement.
- **Email-PDF requires `user.email`:** `requireSession` returns `{ user }` from Supabase auth — `user.email` is always present for email/password auth.
- **`domcontentloaded` risk:** If the print page lazy-loads fonts/images, the PDF might render before fonts load. Mitigated by keeping `await document.fonts.ready` (already in `document-pdf.ts`).

## Effort estimate

~2 hours. The keepalive + launch arg optimization is ~30 min. The email-PDF fallback is ~1.5 hours (new endpoint + component + email function).
