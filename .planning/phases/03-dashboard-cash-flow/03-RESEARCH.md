# Phase 3: Dashboard & Cash Flow — Research

**Researched:** 2026-04-07
**Domain:** Financial dashboard metrics, payment/expense ledger tables, invoice status automation, Supabase schema extension, Next.js 15 Server Actions + RSC
**Confidence:** HIGH

---

## Summary

Phase 3 is an extension phase on a fully-operational existing codebase. All architectural choices are already locked in: Next.js 15.5 App Router RSC, Supabase Postgres with RLS, `requireSession()` server actions, Zod schemas, Tailwind v4 with CSS custom properties, shadcn/ui. No new libraries are needed — Phase 3 is entirely additive.

The two pillars of work are:
1. **New DB tables + server actions** — `payments` and `expenses` tables with Supabase migration, CRUD server actions following the established pattern, and a `computeInvoicePaymentStatus()` function called after every mutation and on every data load.
2. **UI extensions** — Dashboard page rebuilt with `MetricCard` grid, quick actions, recent docs, and overdue sections; invoice detail page extended with `ProfitSummary`, `PaymentsTable`, and `ExpensesTable` inline ledger components.

The most important planning concern is the status recomputation design: CONTEXT.md D-08/D-09 specifies status is written back to the `invoices` table on every payment mutation AND on data load. This requires a shared pure function used in both paths — not two separate implementations.

**Primary recommendation:** Write the migration first (Wave 0), then server actions + status computation function (Wave 1), then invoice detail page extensions (Wave 2), then dashboard rebuild (Wave 3).

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Payment Recording UX**
- D-01: Payments are recorded as inline rows directly on the invoice detail page — no modal, no sidebar. A payments table renders below the invoice totals with existing rows and an empty add row at the bottom (date, amount, method columns + delete action).
- D-02: Payment entry fields: date paid, amount, payment method (cash / bank transfer / cheque / other). No notes field.
- D-03: Status updates automatically server-side on every payment mutation: `paid` when collected ≥ total, `partial_paid` when 0 < collected < total. No user confirmation step — the computation runs immediately on save.

**Expense Tracking**
- D-04: Expenses appear on the invoice detail page as a separate inline table from payments — same section, two distinct tables. Both are visible at the same level of hierarchy; neither is collapsed by default.
- D-05: Expense entry fields: description, amount, date, vendor.

**Dashboard Layout & Metrics**
- D-06: Dashboard metrics (billed, collected, outstanding, collection rate) are all-time totals — no time filter, no period selector.
- D-07: Dashboard layout order: (1) Metric strip, (2) Quick actions, (3) Recent invoices + recent quotations side-by-side, (4) Overdue invoices list (only when overdue items exist), (5) Setup checklist (only for incomplete setup).

**Overdue & Status Automation**
- D-08: Invoice `overdue` status is computed on page load / data fetch (server-side). No cron job.
- D-09: Full payment status logic (server-side, runs on every payment mutation and on data load):
  - `paid`: collected amount ≥ invoice total
  - `partial_paid`: 0 < collected amount < invoice total
  - `overdue`: invoice is unpaid or partial_paid AND due_date < today
  - Status is written back to the `invoices` table on computation — not derived at query time.

### Claude's Discretion
- Exact visual treatment of the inline payments/expenses tables (row height, column widths, add-row affordance) — fully specified in 03-UI-SPEC.md
- Empty state for the overdue section and each recent-documents column — fully specified in 03-UI-SPEC.md
- Profit/margin display location on the invoice detail page — above the payments/expenses section (UI-SPEC decision)
- Whether collection rate rounds to nearest integer or shows one decimal place — rounds to nearest integer (UI-SPEC decision)

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope.
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| DASH-01 | User can view total billed, collected, outstanding, and collection rate on the dashboard | New `getDashboardMetrics()` data function aggregating all invoices + payments per user |
| DASH-02 | User can view recent invoices, recent quotations, and overdue items on the dashboard | New dashboard sections using existing `listInvoices` / `listQuotations` + overdue-sync function |
| DASH-03 | User can access quick actions for new invoice, new quotation, new client from the dashboard | New quick actions strip in `app/page.tsx` using existing Button + Link components |
| DASH-04 | New users with no data see useful empty states and a setup checklist | `MetricCard` shows "—" when no data; `EmptyState` in recent columns; `SetupChecklist` already exists |
| OPS-01 | User can record one or more payment entries against an invoice | New `payments` table + `addPaymentAction` / `deletePaymentAction` server actions |
| OPS-02 | User can record one or more expense entries against an invoice | New `expenses` table + `addExpenseAction` / `deleteExpenseAction` server actions |
| OPS-03 | Invoice collected amount and outstanding are computed from invoice total and payment records | `computeInvoicePaymentStatus()` function: SUM(payments.amount) compared to invoice.total |
| OPS-04 | Invoice payment status auto-updates to `partial_paid`, `paid`, or `overdue` | Same function writes status back to `invoices.status` after every payment mutation + on data load |
| OPS-05 | User can view profit amount and margin per invoice based on total and direct expenses | `ProfitSummary` component: `profit = invoice.total - SUM(expenses.amount)` |
| UX-02 | Clear loading, empty, success, validation, and error states throughout core flows | UI-SPEC defines all states; PaymentsTable/ExpensesTable are client components with optimistic UI |
</phase_requirements>

---

## Standard Stack

### Core (all already installed — no new dependencies)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js | 15.5.14 | App Router, RSC, Server Actions | Project-mandated |
| React | 19.2.0 | UI framework | Project-mandated |
| Supabase JS | 2.101.1 | Postgres client, RLS-aware queries | Project-mandated |
| Zod | 4.3.6 | Schema validation for action inputs | Established in every existing action |
| TypeScript | 5.x | Type safety | Project-mandated |
| Tailwind CSS | 4.x | Styling via CSS custom properties | Project-mandated |
| shadcn/ui | (installed) | Card, Badge, Button, Input components | Project-mandated |
| Lucide React | 0.469.0 | Icons (Trash2, Plus, UserPlus) | Established in project |
| Vitest | 3.2.4 | Unit tests (schema + pure logic) | Project test runner |

**No new npm packages are needed for Phase 3.**

### Supporting (reused from prior phases)

| Component/Module | Location | Phase 3 Usage |
|-----------------|----------|---------------|
| `requireSession()` | `src/lib/require-session.ts` | Auth guard in all new server actions |
| `revalidatePath` | next/cache | Cache invalidation after payment/expense mutations |
| `DocumentSummaryRow` | `src/components/documents/document-summary-row.tsx` | Recent + overdue rows in dashboard |
| `DocumentStatusBadge` | `src/components/documents/document-status-badge.tsx` | Status display in recent/overdue lists |
| `EmptyState` | `src/components/app/empty-state.tsx` | Empty states in recent document columns |
| `SetupChecklist` | `src/components/app/setup-checklist.tsx` | Unchanged — conditional render in dashboard |
| `updateDocumentStatusAction` | `src/actions/status.ts` | May be called directly or replaced by inline status write in payments actions |
| `getAppContext()` | `src/lib/data.ts` | Extended to include dashboard financial aggregates |

---

## Architecture Patterns

### Established Patterns (must follow exactly)

**Server action shape:**
```typescript
// Source: src/actions/invoices.ts pattern
"use server";
import { requireSession } from "@/lib/require-session";
import { revalidatePath } from "next/cache";
import { z } from "zod";

export async function addPaymentAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  try {
    const { supabase, user } = await requireSession();
    // Zod parse
    // DB insert
    // computeAndWriteInvoiceStatus(supabase, invoiceId, user.id)
    revalidatePath(`/app/invoices/${invoiceId}`);
    revalidatePath("/app");
    return { status: "success" };
  } catch (error) {
    return { status: "error", message: error instanceof Error ? error.message : "Could not save payment." };
  }
}
```

**Row type pattern (billing-data.ts):**
```typescript
// Source: src/lib/billing-data.ts — every DB table has a typed Row interface
type PaymentRow = {
  id: string;
  invoice_id: string;
  user_id: string;
  amount: number;       // numeric(12,2) → Number() cast on read
  date_paid: string;
  method: PaymentMethod;
  created_at: string;
};

export interface PaymentRecord {
  id: string;
  invoiceId: string;
  userId: string;
  amount: number;
  datePaid: string;
  method: PaymentMethod;
  createdAt: string;
}
```

**Data loader pattern (React cache):**
```typescript
// Source: src/lib/billing-data.ts — all data loaders use React cache()
export const listPaymentsForInvoice = cache(async (invoiceId: string): Promise<PaymentRecord[]> => {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("payments")
    .select("*")
    .eq("invoice_id", invoiceId)
    .order("date_paid", { ascending: true })
    .returns<PaymentRow[]>();
  if (error) throw new Error(error.message);
  return (data ?? []).map(mapPayment);
});
```

**Inline server form actions (DocumentStatusActions pattern):**
```typescript
// Source: src/components/documents/document-status-actions.tsx
// Delete without modal — immediate server action via form
<form action={async () => {
  "use server";
  await deletePaymentAction(paymentId, invoiceId);
}}>
  <Button type="submit" variant="ghost" size="icon">
    <Trash2 className="size-4" />
  </Button>
</form>
```

### Recommended Project Structure for New Files

```
src/
├── actions/
│   ├── payments.ts         # addPaymentAction, deletePaymentAction
│   └── expenses.ts         # addExpenseAction, deleteExpenseAction
├── lib/
│   ├── billing.ts          # extend: paymentMethodSchema, paymentFormSchema, expenseFormSchema
│   │                       #         PaymentRecord, ExpenseRecord interfaces
│   └── billing-data.ts     # extend: listPaymentsForInvoice, listExpensesForInvoice
│                           #         getDashboardMetrics, syncOverdueStatuses
├── components/
│   ├── app/
│   │   └── metric-card.tsx # New: MetricCard component
│   └── documents/
│       ├── payments-table.tsx    # New: inline ledger ('use client')
│       ├── expenses-table.tsx    # New: inline ledger ('use client')
│       └── profit-summary.tsx   # New: profit/margin bar (server component)
└── app/(app)/app/
    └── page.tsx            # Replace dashboard content (keep file)
supabase/
└── migrations/
    └── 20260407XXXX_phase3_payments_expenses.sql
```

### Pattern: Status Computation Function

This is the architectural keystone of Phase 3. It must be a shared pure utility callable from:
1. After `addPaymentAction` / `deletePaymentAction`
2. Inside `listInvoices` (data load) for overdue sync
3. Inside `getDashboardMetrics` for overdue sync

```typescript
// src/lib/billing-data.ts (or src/lib/billing-utils.ts)
// Compute and WRITE payment status for a single invoice
export async function computeAndWriteInvoiceStatus(
  supabase: SupabaseClient,
  invoiceId: string,
  userId: string,
): Promise<void> {
  // 1. Fetch invoice total + due_date
  const { data: invoice } = await supabase
    .from("invoices")
    .select("total, due_date, status")
    .eq("id", invoiceId)
    .eq("user_id", userId)
    .single();

  // 2. Fetch SUM of payments
  const { data: payments } = await supabase
    .from("payments")
    .select("amount")
    .eq("invoice_id", invoiceId)
    .eq("user_id", userId);

  const collected = (payments ?? []).reduce((sum, p) => sum + Number(p.amount), 0);
  const total = Number(invoice.total);
  const today = new Date().toISOString().split("T")[0];

  let newStatus: InvoiceStatus;
  if (collected >= total) {
    newStatus = "paid";
  } else if (collected > 0) {
    newStatus = invoice.due_date < today ? "overdue" : "partial_paid";
  } else {
    newStatus = invoice.due_date < today ? "overdue" : invoice.status;
  }

  if (newStatus !== invoice.status) {
    await supabase
      .from("invoices")
      .update({ status: newStatus })
      .eq("id", invoiceId)
      .eq("user_id", userId);
  }
}
```

**Critical note on overdue logic:** Per D-09, `overdue` applies when invoice is `unpaid OR partial_paid` AND `due_date < today`. Paid invoices are never overdue. Drafts are never overdue. Only `sent` and `partial_paid` statuses transition to overdue.

### Pattern: Bulk Overdue Sync (for list/dashboard load)

```typescript
// Called at the top of listInvoices() and getDashboardMetrics() to keep statuses fresh
export async function syncOverdueStatuses(supabase: SupabaseClient, userId: string) {
  const today = new Date().toISOString().split("T")[0];
  // Mark overdue: sent/partial_paid invoices past due date
  await supabase
    .from("invoices")
    .update({ status: "overdue" })
    .eq("user_id", userId)
    .in("status", ["sent", "partial_paid"])
    .lt("due_date", today);
}
```

### Pattern: Dashboard Metrics Aggregation

```typescript
// src/lib/billing-data.ts
export async function getDashboardMetrics(userId: string) {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return defaultMetrics;

  // Sync overdue statuses first
  await syncOverdueStatuses(supabase, userId);

  // All-time totals from invoices
  const { data: invoices } = await supabase
    .from("invoices")
    .select("total, status")
    .eq("user_id", userId)
    .not("status", "eq", "draft"); // exclude drafts from billed total

  // Total collected from payments
  const { data: payments } = await supabase
    .from("payments")
    .select("amount")
    .eq("user_id", userId);

  const totalBilled = (invoices ?? []).reduce((s, i) => s + Number(i.total), 0);
  const totalCollected = (payments ?? []).reduce((s, p) => s + Number(p.amount), 0);
  const outstanding = Math.max(0, totalBilled - totalCollected);
  const collectionRate = totalBilled > 0
    ? Math.round((totalCollected / totalBilled) * 100)
    : null; // null → display "—"

  return { totalBilled, totalCollected, outstanding, collectionRate };
}
```

### Pattern: Client Component Ledger Table

`PaymentsTable` and `ExpensesTable` are `'use client'` components because they need local form state for the add-row. They call server actions via `useActionState` (React 19 / Next.js 15 pattern — replaces the older `useFormState`).

```typescript
// src/components/documents/payments-table.tsx
"use client";
import { useActionState } from "react";
import { addPaymentAction } from "@/actions/payments";

export function PaymentsTable({ invoiceId, payments }: PaymentsTableProps) {
  const [state, formAction, isPending] = useActionState(addPaymentAction, { status: "idle" });
  // ...
}
```

**Note:** `useActionState` is the React 19 API (was `useFormState` in React 18 via react-dom). At React 19.2.0 (installed), import from `"react"` directly.

### Anti-Patterns to Avoid

- **Deriving status at query time instead of writing it back:** D-09 explicitly requires status to be written to the DB. Do not compute status only in TypeScript and skip the DB update — the dashboard's overdue section depends on querying `status = 'overdue'` from the DB.
- **Separate overdue functions per page:** Don't duplicate the overdue sync in `listInvoices` AND the dashboard separately with different logic. Extract a single `syncOverdueStatuses()` function.
- **Forgetting `revalidatePath("/app")` after payment mutations:** The dashboard reads invoice statuses; not revalidating the dashboard cache means stale metrics.
- **Using `useFormState` from `react-dom`:** React 19 ships `useActionState` from `"react"` directly. The old import path is removed.
- **Wrapping delete actions in `<form>` with `useActionState`:** Simple delete actions can use inline `action={async () => { "use server"; ... }}` pattern (established in `DocumentStatusActions`) — no `useActionState` needed.
- **SUM aggregation in TypeScript without user_id guard on payments:** The `payments` table must always be filtered by `user_id` (RLS), but when doing a global sum for dashboard metrics, ensure the query is scoped to `user_id`.
- **Drafts included in "Total Billed":** Drafts have not been sent and should not count toward billed amount. Filter them out (`status != 'draft'`) when computing totalBilled.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Form state management in ledger add row | Custom useState + fetch logic | `useActionState` (React 19, built-in) | Already integrated with Server Actions, handles pending/error state |
| DB numeric precision | JavaScript floating point arithmetic | SQL `numeric(12,2)` columns + `Number()` cast on read | Existing pattern in all invoice/quotation totals — consistent |
| Status badge display | Custom status-to-color logic | `DocumentStatusBadge` (already handles all 5 invoice statuses) | Already handles `partial_paid`, `paid`, `overdue`, `sent`, `draft` |
| Summary rows in lists | Custom row components | `DocumentSummaryRow` (already built in Phase 2) | Consistent visual treatment |
| Route invalidation | Manual state refresh | `revalidatePath` in server actions | Already established pattern |
| Empty states | Custom empty divs | `EmptyState` component | Consistent design |

---

## Common Pitfalls

### Pitfall 1: Status Race Condition on Bulk Overdue Sync
**What goes wrong:** `syncOverdueStatuses` runs at dashboard load time, updating many invoice rows. If the user is simultaneously on an invoice detail page, the cached invoice data may be stale.
**Why it happens:** React `cache()` deduplicates within a single request but does not cross-request cache invalidation.
**How to avoid:** Always call `revalidatePath("/app/invoices")` and `revalidatePath("/app")` after the bulk overdue sync in `getDashboardMetrics`. Within a single server render, this is fine — the sync runs and the query after it sees fresh data.
**Warning signs:** Dashboard shows overdue section but invoice detail shows "sent" status.

### Pitfall 2: `useActionState` Initial State Shape Mismatch
**What goes wrong:** `useActionState(action, initialState)` — if `initialState` doesn't match `ActionState` type exactly (e.g. missing `status`), TypeScript errors occur at runtime.
**Why it happens:** Existing `ActionState` type requires `status: "idle" | "success" | "error"`. Passing `{}` or `null` as initial state breaks the type.
**How to avoid:** Always initialize with `{ status: "idle" as const }`.
**Warning signs:** TypeScript error on the `state.status` access.

### Pitfall 3: Payments/Expenses Table Optimistic State Desync
**What goes wrong:** Optimistic row is added client-side, server action fails, but the optimistic row is not removed and no error is shown.
**Why it happens:** Using `isPending` for opacity without checking `state.status === "error"` on completion.
**How to avoid:** In the `useEffect` on `state`, reset the form fields on `status === "success"` and show inline error on `status === "error"`. Don't persist optimistic rows — let `revalidatePath` drive the server re-render.
**Warning signs:** Ghost rows after failed saves.

### Pitfall 4: Profit Calculation Uses Payments Instead of Expenses
**What goes wrong:** Profit is computed as `invoice.total - SUM(payments)` instead of `invoice.total - SUM(expenses)`.
**Why it happens:** Conceptual confusion — payments are receipts (money in), expenses are costs (money out). Profit = revenue minus costs, not revenue minus collections.
**How to avoid:** `profit = invoice.total - SUM(expenses.amount)`. Payments have zero impact on profit calculation. This is explicitly called out in CONTEXT.md specifics: "Profit per invoice = invoice total − sum of direct expenses (not payments — expenses are costs, payments are revenue receipts)."
**Warning signs:** Negative profit on fully-paid invoices with no expenses.

### Pitfall 5: Overdue Status Applied to Drafts
**What goes wrong:** A draft invoice with a past due date gets marked `overdue` by the bulk sync.
**Why it happens:** The UPDATE query doesn't filter out `draft` status — it catches all invoices with past due dates.
**How to avoid:** `syncOverdueStatuses` must filter `.in("status", ["sent", "partial_paid"])` — never include `draft` or `paid` in the overdue sync.
**Warning signs:** Draft invoices appear in the overdue section of the dashboard.

### Pitfall 6: `numeric(12,2)` from Supabase Returns as String
**What goes wrong:** Supabase returns PostgreSQL `numeric` columns as strings (`"1000.00"`) in the JS client, not numbers.
**Why it happens:** PostgreSQL `numeric` type is mapped to string to preserve precision.
**How to avoid:** Always cast: `Number(row.amount)` in the row mapper function. Existing `mapInvoice()` already does this for all totals — follow the same pattern for payment/expense amount fields.
**Warning signs:** `NaN` in aggregation or comparison.

### Pitfall 7: React 19 `useActionState` Import Path
**What goes wrong:** `import { useFormState } from "react-dom"` — this import no longer exists in React 19.
**Why it happens:** The old API was `useFormState` from `react-dom/client`. React 19 renamed and moved it to `useActionState` from `"react"`.
**How to avoid:** `import { useActionState } from "react"`. Verified: project is on React 19.2.0.
**Warning signs:** Module not found error for `react-dom/client` export.

---

## Database Schema for Phase 3

### New Migration File

`supabase/migrations/20260407XXXX_phase3_payments_expenses.sql`

```sql
-- payments table
create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references public.invoices (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  amount numeric(12,2) not null,
  date_paid date not null,
  method text not null default 'other'
    check (method in ('cash', 'bank_transfer', 'cheque', 'other')),
  created_at timestamptz not null default timezone('utc'::text, now())
);

-- expenses table
create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references public.invoices (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  amount numeric(12,2) not null,
  date date not null,
  description text not null,
  vendor text,
  created_at timestamptz not null default timezone('utc'::text, now())
);

-- Indexes
create index if not exists payments_invoice_id_idx on public.payments (invoice_id, user_id);
create index if not exists expenses_invoice_id_idx on public.expenses (invoice_id, user_id);

-- RLS
alter table public.payments enable row level security;
alter table public.expenses enable row level security;

-- RLS policies (owner-only, same pattern as existing tables)
create policy "payments are viewable by owner" on public.payments
  for select using (auth.uid() = user_id);
create policy "payments are insertable by owner" on public.payments
  for insert with check (auth.uid() = user_id);
create policy "payments are deletable by owner" on public.payments
  for delete using (auth.uid() = user_id);

create policy "expenses are viewable by owner" on public.expenses
  for select using (auth.uid() = user_id);
create policy "expenses are insertable by owner" on public.expenses
  for insert with check (auth.uid() = user_id);
create policy "expenses are deletable by owner" on public.expenses
  for delete using (auth.uid() = user_id);
```

**Design notes:**
- `payments` does not have an `updated_at` — rows are add/delete only, no editing.
- `expenses` does not have an `updated_at` — same.
- `method` uses a CHECK constraint not a PostgreSQL ENUM to keep migration simple. Matches D-02 values: cash, bank_transfer, cheque, other.
- Both tables cascade-delete on invoice delete.
- Both tables cascade-delete on user/profile delete.

### Type Extensions to `src/lib/billing.ts`

```typescript
export const paymentMethods = ["cash", "bank_transfer", "cheque", "other"] as const;
export type PaymentMethod = (typeof paymentMethods)[number];

export const paymentFormSchema = z.object({
  invoiceId: z.string().uuid(),
  datePaid: z.string().min(1, "Enter a date."),
  amount: z.coerce.number().positive("Enter a valid amount."),
  method: z.enum(paymentMethods).default("other"),
});

export const expenseFormSchema = z.object({
  invoiceId: z.string().uuid(),
  date: z.string().min(1, "Enter a date."),
  amount: z.coerce.number().positive("Enter a valid amount."),
  description: z.string().min(1, "Enter a description."),
  vendor: z.string().default(""),
});

export interface PaymentRecord {
  id: string;
  invoiceId: string;
  userId: string;
  amount: number;
  datePaid: string;
  method: PaymentMethod;
  createdAt: string;
}

export interface ExpenseRecord {
  id: string;
  invoiceId: string;
  userId: string;
  amount: number;
  date: string;
  description: string;
  vendor: string;
  createdAt: string;
}
```

---

## Code Examples

### Example: addPaymentAction (full shape)
```typescript
// src/actions/payments.ts
"use server";
import { revalidatePath } from "next/cache";
import { paymentFormSchema } from "@/lib/billing";
import { computeAndWriteInvoiceStatus } from "@/lib/billing-data";
import { requireSession } from "@/lib/require-session";
import type { ActionState } from "@/lib/types";

export async function addPaymentAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  try {
    const { supabase, user } = await requireSession();
    const parsed = paymentFormSchema.safeParse({
      invoiceId: formData.get("invoiceId"),
      datePaid: formData.get("datePaid"),
      amount: formData.get("amount"),
      method: formData.get("method") || "other",
    });
    if (!parsed.success) {
      return { status: "error", message: parsed.error.issues[0]?.message };
    }
    const { error } = await supabase.from("payments").insert({
      invoice_id: parsed.data.invoiceId,
      user_id: user.id,
      amount: parsed.data.amount,
      date_paid: parsed.data.datePaid,
      method: parsed.data.method,
    });
    if (error) throw new Error(error.message);
    await computeAndWriteInvoiceStatus(supabase, parsed.data.invoiceId, user.id);
    revalidatePath(`/app/invoices/${parsed.data.invoiceId}`);
    revalidatePath("/app/invoices");
    revalidatePath("/app");
    return { status: "success" };
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Payment could not be saved. Check the amount and try again.",
    };
  }
}
```

### Example: MetricCard component
```typescript
// src/components/app/metric-card.tsx
// Server component — no 'use client' needed
export function MetricCard({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="rounded-[1.1rem] border border-black/7 bg-surface p-4 sm:p-5">
      <p className="text-xs text-muted uppercase tracking-[0.18em]">{label}</p>
      <p className={cn(
        "mt-1 text-2xl font-semibold tracking-tight",
        accent ? "text-success" : "text-foreground",
      )}>
        {value}
      </p>
    </div>
  );
}
```

### Example: PaymentsTable client component shape
```typescript
// src/components/documents/payments-table.tsx
"use client";
import { useActionState, useEffect, useRef } from "react";
import { addPaymentAction } from "@/actions/payments";
import type { PaymentRecord } from "@/lib/billing";
import type { ActionState } from "@/lib/types";

const INITIAL_STATE: ActionState = { status: "idle" };

export function PaymentsTable({
  invoiceId,
  invoiceTotal,
  currency,
  payments,
}: {
  invoiceId: string;
  invoiceTotal: number;
  currency: string;
  payments: PaymentRecord[];
}) {
  const [state, formAction, isPending] = useActionState(addPaymentAction, INITIAL_STATE);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.status === "success") {
      formRef.current?.reset();
    }
  }, [state]);

  return (
    <div>
      <h3 className="text-xs uppercase tracking-[0.24em] text-muted font-medium mb-2">Payments</h3>
      <div className="rounded-[1rem] border border-border bg-surface overflow-hidden">
        {/* header row, data rows, add row */}
      </div>
    </div>
  );
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `useFormState` from `react-dom` | `useActionState` from `react` | React 19 | Import path changed — use `react` not `react-dom` |
| Derive status in query (computed column) | Write status back to DB (D-09 decision) | Phase 3 design decision | Overdue section can query `status = 'overdue'` directly |
| `useFormState` return: `[state, action]` | `useActionState` return: `[state, action, isPending]` | React 19 | Third element `isPending` now built-in — no separate `useTransition` needed |

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|-------------|-----------|---------|---------|
| Node.js | Build + dev server | ✓ | v22.20.0 | — |
| pnpm | Package management | ✓ | 10.32.1 | — |
| Supabase (via env) | All DB operations | ✓ (env.local present) | 2.101.1 | — |
| Vitest | Unit tests | ✓ | 3.2.4 | — |

Step 2.6: No new external dependencies introduced. All tools already available.

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 3.2.4 |
| Config file | `vitest.config.ts` (root) |
| Quick run command | `pnpm vitest run src/lib/billing.test.ts src/actions/invoices.test.ts` |
| Full suite command | `pnpm test` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| OPS-01 | `paymentFormSchema` validates correctly | unit | `pnpm vitest run src/actions/payments.test.ts` | ❌ Wave 0 |
| OPS-02 | `expenseFormSchema` validates correctly | unit | `pnpm vitest run src/actions/expenses.test.ts` | ❌ Wave 0 |
| OPS-03 | `computeInvoicePaymentStatus` pure logic: paid/partial_paid thresholds | unit | `pnpm vitest run src/lib/billing-utils.test.ts` | ❌ Wave 0 (extend) |
| OPS-04 | Overdue logic: sent invoice past due_date → overdue, paid → never overdue | unit | `pnpm vitest run src/lib/billing-utils.test.ts` | ❌ Wave 0 (extend) |
| OPS-05 | Profit = total - expenses, margin = profit/total | unit | `pnpm vitest run src/lib/billing-utils.test.ts` | ❌ Wave 0 (extend) |
| DASH-01 | Collection rate formula: Math.round(collected/billed * 100), zero-state returns null | unit | `pnpm vitest run src/lib/billing-utils.test.ts` | ❌ Wave 0 (extend) |
| DASH-04 | MetricCard renders "—" when value is null | manual smoke | — | manual |
| UX-02 | Loading/empty/error states render correctly | manual smoke | — | manual |

### Sampling Rate
- **Per task commit:** `pnpm vitest run src/lib/billing-utils.test.ts`
- **Per wave merge:** `pnpm test`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/actions/payments.test.ts` — covers OPS-01 (`paymentFormSchema` validation)
- [ ] `src/actions/expenses.test.ts` — covers OPS-02 (`expenseFormSchema` validation)
- [ ] Extend `src/lib/billing-utils.test.ts` — covers OPS-03, OPS-04, OPS-05, DASH-01 (pure computation logic for `computePaymentStatus`, profit, collection rate)
- [ ] Extend `src/lib/billing.ts` — `paymentFormSchema`, `expenseFormSchema`, `PaymentRecord`, `ExpenseRecord` types (prerequisite for test files)

---

## Open Questions

1. **`getDashboardMetrics` and `getAppContext` coupling**
   - What we know: `getAppContext()` is already called in `app/page.tsx` and returns user state. Dashboard financial metrics require a separate DB query (invoices + payments).
   - What's unclear: Should `getDashboardMetrics` be merged into `getAppContext()` or called separately in `app/page.tsx`?
   - Recommendation: Call separately with `Promise.all([getAppContext(), getDashboardMetrics(userId)])` in `app/page.tsx`. Keep `getAppContext()` focused on user state — don't bloat it with financial aggregates. `userId` is available from `context.userId`.

2. **Payments table: `user_id` column necessity**
   - What we know: `invoice_id` already implies `user_id` via the `invoices` table join. Adding `user_id` directly to `payments` is redundant but makes RLS simpler.
   - What's unclear: Does Supabase RLS support join-based policies on `payments` that check `invoice.user_id`?
   - Recommendation: Include `user_id` directly on `payments` and `expenses` tables. Consistent with every other table in the project (all have direct `user_id`). Simpler RLS policies. Slight redundancy is acceptable.

3. **`DocumentSummaryRow` missing `amount` display for recent invoices**
   - What we know: Current `DocumentSummaryRow` shows document number, subtitle (client name), and status badge. For a dashboard "recent invoices" list, showing the total amount is useful.
   - What's unclear: Should a `amount` prop be added, or should the existing component be extended?
   - Recommendation: Add an optional `amount?: string` prop to `DocumentSummaryRow`. Render it if present. Backwards compatible — existing usages omit it.

---

## Project Constraints (from CLAUDE.md)

- **Stack is mandated:** Next.js App Router, TypeScript, Tailwind CSS, shadcn/ui, Supabase Auth, Supabase Postgres, Vercel, GitHub. No deviations.
- **Read node_modules/next/dist/docs/ before writing code:** The AGENTS.md directive requires reading Next.js internal docs before implementing. Planner tasks must include this as a Wave 0 prerequisite step.
- **Every phase assumes Supabase backend + Vercel hosting:** Deployment verification is part of phase completion. Plan must include a deployment task.
- **Design workflow:** All frontend UI work starts with `aidesigner-frontend` skill — however, this phase has a fully-specified UI-SPEC already approved. The UI-SPEC already fulfills the design step; no new AIDesigner generation needed.
- **Memory:** Check Supabase backend first, then implement, then deploy to Vercel production.

---

## Sources

### Primary (HIGH confidence)
- Codebase direct scan — `src/actions/invoices.ts`, `src/lib/billing-data.ts`, `src/lib/billing.ts`, `src/lib/require-session.ts`, `src/lib/data.ts` — established patterns extracted directly
- `supabase/migrations/202604060130_phase2_documents.sql` — DB schema verified, all enum types and table structures confirmed
- `src/actions/invoices.test.ts` — test framework shape confirmed (Vitest, pure Zod tests, node environment)
- `vitest.config.ts` — test runner config confirmed
- `.planning/phases/03-dashboard-cash-flow/03-CONTEXT.md` — all locked decisions
- `.planning/phases/03-dashboard-cash-flow/03-UI-SPEC.md` — all component + layout + copy decisions
- `package.json` — exact dependency versions confirmed

### Secondary (MEDIUM confidence)
- React 19 `useActionState` API: project is on React 19.2.0; `useActionState` ships in React 19 core. Migration from `useFormState` (react-dom) to `useActionState` (react) is a confirmed breaking change in React 19.
- PostgreSQL `numeric` → JS string coercion: documented Supabase behavior, consistent with existing `Number()` casts in `mapInvoice()`.

### Tertiary (LOW confidence)
- None — all findings are sourced from codebase or verified library behavior.

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libraries directly confirmed in `package.json` and codebase
- Architecture patterns: HIGH — extracted directly from existing working code
- DB schema design: HIGH — follows exact pattern of Phase 2 migration
- Pitfalls: HIGH for code-path issues (numeric coercion, useActionState, status logic); MEDIUM for edge cases (race conditions)

**Research date:** 2026-04-07
**Valid until:** 2026-05-07 (30 days — stable stack)
