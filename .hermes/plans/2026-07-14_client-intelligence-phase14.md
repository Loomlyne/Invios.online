# Phase 14: Client Intelligence (v2.0 Roadmap Acceleration)

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task.

**Goal:** Ship the highest-value read-side intelligence from the v2.0 roadmap before Portal v2. Gives operators LTV, payment reliability, and a health score per client — all computed from existing tables, no migrations, no new user input.

**Architecture:** Extends the `client-intelligence.ts` module created by the "Client Payment Reliability Badge" plan. Three computed metrics + one composite health score + a new "Intelligence" card on the client detail page. Read-only, no server actions, no cron.

**Tech Stack:** TypeScript, Supabase queries, pure functions (unit-testable), existing `Card`/`Badge` UI.

---

## Current state (investigated)

- `src/app/(app)/app/clients/[slug]/page.tsx` shows: client header, metric cards (invoice count, quotation count), invoice list, quotation list. **No intelligence layer.**
- Data access via `listInvoicesForClient`, `listQuotationsForClient`, `getClientBySlug` in `src/lib/billing-data.ts`.
- `listPaymentsForInvoice` exists (`billing-data.ts:577`) but payments aren't loaded on the client detail page.
- `.planning/research/v2.0-FEATURES.md` ranks client intelligence as MEDIUM complexity, no new user input. It's the fastest-value v2.0 deliverable.
- `.planning/research/v2.0-ARCHITECTURE.md:93-101` specifies:
  - `computeClientLTV(clientId)` — sum paid invoices
  - `computePaymentReliability(clientId)` — avg days to pay
  - `computeClientHealth(clientId)` — composite score + suggested actions
- The "Client Payment Reliability Badge" plan creates `src/lib/client-intelligence.ts` with `computePaymentReliability`. This plan extends that file.

**Dependency:** This plan assumes the "Client Payment Reliability Badge" plan has been executed first (it creates the base module). If not, Task 1 below includes creating the file.

---

## Tasks

### Task 1: Write failing tests for LTV + health score

**Objective:** Define the logic before implementing.

**Files:**
- Create or extend: `src/lib/client-intelligence.test.ts`

**Test cases to add:**

```ts
import { computeClientLTV, computeClientHealth, type LTVInput, type HealthInput } from "./client-intelligence";

describe("computeClientLTV", () => {
  it("sums total of all paid invoices", () => {
    const result = computeClientLTV({
      paidInvoices: [{ total: 1000 }, { total: 2500 }],
    });
    expect(result).toBe(3500);
  });

  it("returns 0 when no paid invoices", () => {
    expect(computeClientLTV({ paidInvoices: [] })).toBe(0);
  });
});

describe("computeClientHealth", () => {
  it("returns 'healthy' when LTV high and pays fast", () => {
    const result = computeClientHealth({
      ltv: 50000,
      reliability: { avgDaysToPay: 5, tier: "fast" },
      outstandingCount: 0,
      totalInvoices: 10,
    });
    expect(result.score).toBeGreaterThanOrEqual(80);
    expect(result.label).toBe("healthy");
  });

  it("returns 'at-risk' when slow payer with outstanding invoices", () => {
    const result = computeClientHealth({
      ltv: 5000,
      reliability: { avgDaysToPay: 40, tier: "slow" },
      outstandingCount: 3,
      totalInvoices: 8,
    });
    expect(result.label).toBe("at-risk");
  });

  it("returns 'critical' when late payer with high outstanding ratio", () => {
    const result = computeClientHealth({
      ltv: 2000,
      reliability: { avgDaysToPay: 60, tier: "late" },
      outstandingCount: 5,
      totalInvoices: 6,
    });
    expect(result.label).toBe("critical");
  });

  it("returns 'new' when fewer than 2 invoices", () => {
    const result = computeClientHealth({
      ltv: 0,
      reliability: null,
      outstandingCount: 1,
      totalInvoices: 1,
    });
    expect(result.label).toBe("new");
  });
});
```

**Run:** `pnpm test src/lib/client-intelligence.test.ts`
**Expected:** FAIL — functions not exported.

---

### Task 2: Implement `computeClientLTV`

**Objective:** Pure function that sums paid invoice totals.

**Files:**
- Modify: `src/lib/client-intelligence.ts` (append to existing module)

```ts
export interface LTVInput {
  paidInvoices: { total: number }[];
}

export function computeClientLTV(input: LTVInput): number {
  return input.paidInvoices.reduce((sum, inv) => sum + inv.total, 0);
}
```

---

### Task 3: Implement `computeClientHealth`

**Objective:** Composite score from LTV, reliability, and outstanding ratio.

**Files:**
- Modify: `src/lib/client-intelligence.ts` (append)

```ts
export interface HealthInput {
  ltv: number;
  reliability: PaymentReliability | null;
  outstandingCount: number;
  totalInvoices: number;
}

export interface ClientHealth {
  score: number; // 0-100
  label: "new" | "healthy" | "at-risk" | "critical";
  suggestedAction: string;
}

export function computeClientHealth(input: HealthInput): ClientHealth {
  // New client: fewer than 2 invoices
  if (input.totalInvoices < 2) {
    return {
      score: 50,
      label: "new",
      suggestedAction: "Send the first quotation to start the relationship.",
    };
  }

  let score = 50; // baseline

  // LTV contribution (up to +25)
  if (input.ltv > 50000) score += 25;
  else if (input.ltv > 10000) score += 15;
  else if (input.ltv > 0) score += 5;

  // Payment reliability contribution (up to +15 or -20)
  if (input.reliability) {
    switch (input.reliability.tier) {
      case "fast": score += 15; break;
      case "standard": score += 8; break;
      case "slow": score -= 10; break;
      case "late": score -= 20; break;
    }
  }

  // Outstanding ratio penalty (up to -15)
  const outstandingRatio = input.totalInvoices > 0
    ? input.outstandingCount / input.totalInvoices
    : 0;
  if (outstandingRatio > 0.5) score -= 15;
  else if (outstandingRatio > 0.3) score -= 8;

  score = Math.max(0, Math.min(100, score));

  let label: ClientHealth["label"];
  let suggestedAction: string;

  if (score >= 80) {
    label = "healthy";
    suggestedAction = "Priority client. Consider offering recurring billing.";
  } else if (score >= 50) {
    label = "at-risk";
    suggestedAction = input.reliability?.tier === "late" || input.reliability?.tier === "slow"
      ? "Send a payment reminder before the next project."
      : "Monitor payment patterns on the next invoice.";
  } else {
    label = "critical";
    suggestedAction = "Require upfront payment before taking on new work.";
  }

  return { score, label, suggestedAction };
}
```

**Run:** `pnpm test src/lib/client-intelligence.test.ts`
**Expected:** PASS.

---

### Task 4: Add data fetchers for LTV and health

**Objective:** Query functions that gather all inputs.

**Files:**
- Modify: `src/lib/client-intelligence.ts` (append)

```ts
export async function getClientIntelligence(clientId: string) {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return null;

  // All invoices for this client
  const { data: invoices } = await supabase
    .from("invoices")
    .select("id, total, status, due_date")
    .eq("client_id", clientId);

  if (!invoices || invoices.length === 0) return null;

  const settled = invoices.filter((inv) =>
    ["paid", "partial_paid", "overpaid"].includes(inv.status)
  );

  // Payments for settled invoices
  const settledIds = settled.map((inv) => inv.id);
  const { data: payments } = await supabase
    .from("payments")
    .select("invoice_id, created_at")
    .in("invoice_id", settledIds)
    .order("created_at", { ascending: true });

  const firstPaymentByInvoice = new Map<string, string>();
  for (const p of payments ?? []) {
    if (!firstPaymentByInvoice.has(p.invoice_id)) {
      firstPaymentByInvoice.set(p.invoice_id, p.created_at);
    }
  }

  const reliability = computePaymentReliability({
    paidInvoices: settled.map((inv) => ({
      dueDate: inv.due_date,
      paidAt: firstPaymentByInvoice.get(inv.id) ?? null,
    })),
  });

  const ltv = computeClientLTV({
    paidInvoices: settled.map((inv) => ({ total: Number(inv.total) })),
  });

  const outstandingCount = invoices.filter((inv) =>
    ["sent", "overdue", "partial_paid"].includes(inv.status)
  ).length;

  const health = computeClientHealth({
    ltv,
    reliability,
    outstandingCount,
    totalInvoices: invoices.length,
  });

  return { ltv, reliability, health };
}
```

---

### Task 5: Create `ClientIntelligenceCard` component

**Objective:** Display LTV, reliability, health score, and suggested action.

**Files:**
- Create: `src/components/clients/client-intelligence-card.tsx`

```tsx
import { TrendingUp, Heart, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import type { ClientHealth, PaymentReliability } from "@/lib/client-intelligence";

const healthConfig: Record<ClientHealth["label"], { icon: typeof Heart; color: string }> = {
  new: { icon: Heart, color: "text-muted" },
  healthy: { icon: TrendingUp, color: "text-green-600" },
  "at-risk": { icon: AlertTriangle, color: "text-amber-600" },
  critical: { icon: AlertTriangle, color: "text-red-600" },
};

export function ClientIntelligenceCard({
  ltv,
  reliability,
  health,
  currency = "AED",
}: {
  ltv: number;
  reliability: PaymentReliability | null;
  health: ClientHealth;
  currency?: string;
}) {
  const config = healthConfig[health.label];
  const Icon = config.icon;

  return (
    <Card>
      <CardHeader>
        <Badge variant="accent">Client intelligence</Badge>
        <CardTitle className="mt-3">Relationship health</CardTitle>
        <CardDescription>Computed from payment history and billing patterns.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="grid grid-cols-3 gap-3">
          <div>
            <p className="text-[11px] uppercase tracking-[0.18em] text-muted">LTV</p>
            <p className="mt-1 text-lg font-semibold text-foreground">{formatCurrency(ltv, currency)}</p>
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-[0.18em] text-muted">Avg days to pay</p>
            <p className="mt-1 text-lg font-semibold text-foreground">
              {reliability ? Math.round(reliability.avgDaysToPay) : "—"}
            </p>
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-[0.18em] text-muted">Health score</p>
            <p className={`mt-1 text-lg font-semibold ${config.color}`}>{health.score}</p>
          </div>
        </div>

        <div className="flex items-start gap-2 border-t border-black/7 pt-3">
          <Icon className={`mt-0.5 size-4 ${config.color}`} />
          <div>
            <p className="text-sm font-medium capitalize text-foreground">{health.label}</p>
            <p className="text-sm text-muted-strong">{health.suggestedAction}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
```

---

### Task 6: Wire into client detail page

**Objective:** Replace the simple metric cards with the intelligence card.

**Files:**
- Modify: `src/app/(app)/app/clients/[slug]/page.tsx`

**Changes:**

1. Import `getClientIntelligence` and `ClientIntelligenceCard`.
2. Add to the `Promise.all`:
   ```ts
   const [invoices, quotations, intelligence] = await Promise.all([
     listInvoicesForClient(client.id),
     listQuotationsForClient(client.id),
     getClientIntelligence(client.id),
   ]);
   ```
3. Insert `<ClientIntelligenceCard>` in the right column (replacing or supplementing the existing metric cards at line 65-68). Keep the simple count cards if desired, or consolidate into the intelligence card.

**Verification:** Open a client with history → intelligence card shows LTV, avg days, health score, and a suggested action.

---

### Task 7: Verify and commit

**Run:**
```bash
pnpm test src/lib/client-intelligence.test.ts
pnpm typecheck
pnpm build
```

**Commit:**
```bash
git add src/lib/client-intelligence.ts src/lib/client-intelligence.test.ts \
        src/components/clients/client-intelligence-card.tsx \
        src/app/(app)/app/clients/[slug]/page.tsx
git commit -m "feat: client intelligence card with LTV, reliability, and health score (Phase 14)"
```

---

## Risks / edge cases

- **N+1 queries:** `getClientIntelligence` does 2 queries (invoices + payments batch). Bounded and fine for hundreds of invoices per client.
- **Health score thresholds are heuristic:** The weights (LTV +25, reliability +15/-20, outstanding -15) are starting values. They should be revisited after real usage. The tests pin the behavior so changes are intentional.
- **New client UX:** Fewer than 2 invoices returns "new" label with a gentle onboarding suggestion, avoiding the appearance of a bad score.
- **Currency:** LTV uses the client's invoice currency. If a client has mixed-currency invoices (rare), the sum is technically incorrect. Acceptable for v1; could add currency normalization later.

## v2.0 Roadmap position

This ships the core of **Phase 14 (Client Intelligence)** from `.planning/research/v2.0-FEATURES.md`. It intentionally skips:
- Portal engagement metric (requires Portal v2 first)
- Cohort analysis (requires Phase 17 forecast first)
- Materialized views (premature optimization)

## Effort estimate

~2.5 hours. Logic is straightforward. The card component + page wiring is ~1 hour. Tests are ~1 hour. Data fetcher is ~30 min.
