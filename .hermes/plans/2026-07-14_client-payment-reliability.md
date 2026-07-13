# Client Payment Reliability Badge

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task.

**Goal:** Show "Avg days to pay" and a reliability tier (Fast / Standard / Slow / Late) on every client card and client detail page, computed from existing `invoices.due_date` + `payments.created_at`.

**Architecture:** Pure read-side computation in `src/lib/client-intelligence.ts`. No schema changes, no migrations. Fetches invoices + payments for a client, computes average days-to-pay across paid/partial invoices, classifies into a tier.

**Tech Stack:** TypeScript, existing Supabase queries, pure function (unit-testable).

---

## Current state (investigated)

- Client detail page `src/app/(app)/app/clients/[slug]/page.tsx:31` already fetches `invoices` via `listInvoicesForClient(client.id)`.
- But it does NOT fetch payments, and `listInvoicesForClient` (in `src/lib/billing-data.ts:377`) does not include payments.
- `listPaymentsForInvoice` exists (`src/lib/billing-data.ts:577`) but is per-invoice.
- The dashboard's `getCollectedAmount` (`src/app/api/cron/reminders/route.ts:193`) sums payments — pattern to reuse.
- No client intelligence layer exists yet. This becomes the foundation for Phase 14 (Client Intelligence) in the v2.0 roadmap.

---

## Tasks

### Task 1: Write failing tests for the computation

**Objective:** Define the reliability score logic via tests before implementing.

**Files:**
- Create: `src/lib/client-intelligence.test.ts`

**Test cases:**

```ts
import { describe, it, expect } from "vitest";
import { computePaymentReliability, type ReliabilityInput } from "./client-intelligence";

const baseInput = (over: Partial<ReliabilityInput>): ReliabilityInput => ({
  paidInvoices: [],
  ...over,
});

describe("computePaymentReliability", () => {
  it("returns null when no paid invoices", () => {
    const result = computePaymentReliability(baseInput({ paidInvoices: [] }));
    expect(result).toBeNull();
  });

  it("classifies as 'fast' when avg <= 7 days", () => {
    const result = computePaymentReliability(baseInput({
      paidInvoices: [
        { dueDate: "2026-01-01", paidAt: "2026-01-05" }, // 4 days
      ],
    }));
    expect(result?.tier).toBe("fast");
    expect(result?.avgDaysToPay).toBe(4);
  });

  it("classifies as 'standard' when avg 8-21 days", () => {
    const result = computePaymentReliability(baseInput({
      paidInvoices: [
        { dueDate: "2026-01-01", paidAt: "2026-01-15" }, // 14 days
      ],
    }));
    expect(result?.tier).toBe("standard");
  });

  it("classifies as 'slow' when avg 22-45 days", () => {
    const result = computePaymentReliability(baseInput({
      paidInvoices: [
        { dueDate: "2026-01-01", paidAt: "2026-02-01" }, // 31 days
      ],
    }));
    expect(result?.tier).toBe("slow");
  });

  it("classifies as 'late' when avg > 45 days", () => {
    const result = computePaymentReliability(baseInput({
      paidInvoices: [
        { dueDate: "2026-01-01", paidAt: "2026-04-01" }, // 90 days
      ],
    }));
    expect(result?.tier).toBe("late");
  });

  it("averages across multiple paid invoices", () => {
    const result = computePaymentReliability(baseInput({
      paidInvoices: [
        { dueDate: "2026-01-01", paidAt: "2026-01-05" }, // 4
        { dueDate: "2026-02-01", paidAt: "2026-02-20" }, // 19
      ],
    }));
    expect(result?.avgDaysToPay).toBe(11.5); // (4 + 19) / 2
    expect(result?.tier).toBe("standard");
  });

  it("ignores invoices with no payment date", () => {
    const result = computePaymentReliability(baseInput({
      paidInvoices: [
        { dueDate: "2026-01-01", paidAt: null },
      ],
    }));
    expect(result).toBeNull();
  });
});
```

**Run:** `pnpm test src/lib/client-intelligence.test.ts`
**Expected:** FAIL — module not found.

---

### Task 2: Implement `client-intelligence.ts`

**Objective:** Make the tests pass.

**Files:**
- Create: `src/lib/client-intelligence.ts`

```ts
export interface ReliabilityInput {
  paidInvoices: { dueDate: string; paidAt: string | null }[];
}

export interface PaymentReliability {
  avgDaysToPay: number;
  tier: "fast" | "standard" | "slow" | "late";
}

export function computePaymentReliability(input: ReliabilityInput): PaymentReliability | null {
  const settled = input.paidInvoices.filter((inv) => inv.paidAt);
  if (settled.length === 0) return null;

  const days = settled.map((inv) => {
    const due = new Date(inv.dueDate).getTime();
    const paid = new Date(inv.paidAt!).getTime();
    return Math.max(0, Math.round((paid - due) / (1000 * 60 * 60 * 24)));
  });

  const avgDaysToPay = days.reduce((a, b) => a + b, 0) / days.length;

  let tier: PaymentReliability["tier"];
  if (avgDaysToPay <= 7) tier = "fast";
  else if (avgDaysToPay <= 21) tier = "standard";
  else if (avgDaysToPay <= 45) tier = "slow";
  else tier = "late";

  return { avgDaysToPay, tier };
}
```

**Run:** `pnpm test src/lib/client-intelligence.test.ts`
**Expected:** PASS — all tests green.

---

### Task 3: Add data fetcher for client payment history

**Objective:** Query function that gathers the data `computePaymentReliability` needs.

**Files:**
- Modify: `src/lib/client-intelligence.ts` (append)

```ts
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function getClientPaymentReliability(
  clientId: string,
): Promise<PaymentReliability | null> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return null;

  // Fetch all invoices for this client that are paid or partially paid
  const { data: invoices } = await supabase
    .from("invoices")
    .select("id, due_date")
    .eq("client_id", clientId)
    .in("status", ["paid", "partial_paid", "overpaid"]);

  if (!invoices || invoices.length === 0) return null;

  // Fetch the earliest payment date for each invoice
  const invoiceIds = invoices.map((inv) => inv.id);
  const { data: payments } = await supabase
    .from("payments")
    .select("invoice_id, created_at")
    .in("invoice_id", invoiceIds)
    .order("created_at", { ascending: true });

  const firstPaymentByInvoice = new Map<string, string>();
  for (const p of payments ?? []) {
    if (!firstPaymentByInvoice.has(p.invoice_id)) {
      firstPaymentByInvoice.set(p.invoice_id, p.created_at);
    }
  }

  return computePaymentReliability({
    paidInvoices: invoices.map((inv) => ({
      dueDate: inv.due_date,
      paidAt: firstPaymentByInvoice.get(inv.id) ?? null,
    })),
  });
}
```

---

### Task 4: Create `PaymentReliabilityBadge` component

**Objective:** Visual component that renders the tier + avg days.

**Files:**
- Create: `src/components/clients/payment-reliability-badge.tsx`

```tsx
import { Badge } from "@/components/ui/badge";
import type { PaymentReliability } from "@/lib/client-intelligence";

const tierConfig: Record<PaymentReliability["tier"], { label: string; variant: "default" | "accent" | "secondary" | "outline" }> = {
  fast: { label: "Fast payer", variant: "accent" },
  standard: { label: "On-time payer", variant: "default" },
  slow: { label: "Slow payer", variant: "secondary" },
  late: { label: "Late payer", variant: "outline" },
};

export function PaymentReliabilityBadge({ reliability }: { reliability: PaymentReliability }) {
  const config = tierConfig[reliability.tier];
  return (
    <Badge variant={config.variant} className="gap-1.5">
      {config.label}
      <span className="text-muted-strong">·</span>
      <span className="font-normal">avg {Math.round(reliability.avgDaysToPay)}d</span>
    </Badge>
  );
}
```

---

### Task 5: Wire into client detail page

**Objective:** Show the badge on the client detail page.

**Files:**
- Modify: `src/app/(app)/app/clients/[slug]/page.tsx`

**Changes:**

1. Import `getClientPaymentReliability` and `PaymentReliabilityBadge`.
2. After the `Promise.all` on line 26-29, add:
   ```ts
   const reliability = await getClientPaymentReliability(client.id);
   ```
3. Render the badge in the header card, next to `<ClientStatusBadge>` (around line 41):
   ```tsx
   {reliability && <PaymentReliabilityBadge reliability={reliability} />}
   ```

**Verification:** Open a client with payment history → badge appears with tier + avg days.

---

### Task 6: Verify and commit

**Run:**
```bash
pnpm test src/lib/client-intelligence.test.ts
pnpm typecheck
pnpm build
```

**Commit:**
```bash
git add src/lib/client-intelligence.ts src/lib/client-intelligence.test.ts \
        src/components/clients/payment-reliability-badge.tsx \
        src/app/(app)/app/clients/[slug]/page.tsx
git commit -m "feat: add client payment reliability badge computed from payment history"
```

---

## Risks / edge cases

- **No payment history:** Returns null, badge simply doesn't render. No UI gap.
- **Overdue invoices counted:** Only paid/partial/overpaid statuses are queried, so unpaid invoices don't skew the average.
- **Clock skew:** Uses `payments.created_at` (DB timestamp), not client time. Reliable.
- **N+1 query:** One query for invoices, one for payments. Bounded by `in("invoice_id", [...])`. Fine for hundreds of invoices.

## Future extension

This `client-intelligence.ts` file is the seed for Phase 14 (Client Intelligence). Next additions: LTV, health score, suggested actions.

## Effort estimate

~1.5 hours. Pure logic + 1 new component + 1 page modification.
