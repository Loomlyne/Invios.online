# Phase 5: Automation & Recovery — Research

**Researched:** 2026-04-12
**Domain:** Invoice versioning, Vercel cron jobs, recurring billing, reminder automation, Supabase schema extensions
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Version History — Capture (AUTO-01)**
- D-01: Snapshot on every save — automatic, silent, no user action required.
- D-02: Store JSONB snapshots in a new `invoice_versions` table (invoice_id, user_id, snapshot JSONB, created_at). Rolling window of 10 versions per invoice — oldest dropped when 11th is created.

**Version History — UI (AUTO-02)**
- D-03: Version history appears as a collapsible sidebar panel on the invoice detail page. Each row shows: save date/time, total amount. User can expand and preview or restore from any version row.
- D-04: Version count limit of 10 is the v1 default. Design the cap as a configurable constant so it can be raised per-plan later.

**Restore Safety (AUTO-02)**
- D-05: Restore flow — warn + confirm before applying. Show the user: "Restoring this version changes the invoice total from X to Y. Existing payments are preserved but payment status will recalculate." Require explicit confirmation.
- D-06: After restore, payments and expenses are kept intact. Invoice fields revert to the snapshot. Payment status is recomputed automatically after restore.

**Recurring Billing — Configuration (AUTO-03)**
- D-07: Recurrence configurable at invoice creation AND on existing invoice detail.
- D-08: Supported frequencies: weekly, monthly, quarterly.
- D-09: Requires frequency + next generation date (auto-calculated from original issue date + frequency interval).

**Recurring Billing — Execution (AUTO-03)**
- D-10: Each cycle creates a new draft invoice — same line items, client, terms; updated issue date (today) and due date (today + original payment terms). Notes include "Generated from recurring schedule — Invoice #ORIG".
- D-11: Vercel cron job (daily, `0 6 * * *`) checks all active recurring schedules and creates drafts for any where `next_due_date <= today`.
- D-12: Generated drafts appear as normal drafts. No special badge in v1.

**Reminder System — Configuration (AUTO-04)**
- D-13: Reminder timing rules already configured in Settings > Notifications. Phase 5 does NOT add new settings UI.

**Reminder System — Execution & Deduplication (AUTO-04, AUTO-05)**
- D-14: Reminders sent globally and automatically via a Vercel cron job (daily). Reads each user's reminder settings from `user_settings`.
- D-15: New `reminder_logs` table tracks sends: (invoice_id, user_id, sent_at, reminder_type). Cron checks before sending.
- D-16: Reminder email content: invoice public link + amount due + due date. Uses existing branded email template from `src/lib/email.ts`.
- D-17: Reminder emails sent to the client's email address on the invoice's associated client record.

### Claude's Discretion
- Internal cron API route path naming and auth (e.g., `CRON_SECRET` env var for Vercel cron)
- SQL schema details for `invoice_versions` and `reminder_logs` tables
- Exact version sidebar component structure and animation
- Whether to add a "Recurring" indicator badge to the invoices list (nice-to-have, Claude decides)

### Deferred Ideas (OUT OF SCOPE)
- Recurring payments/expenses
- Unlimited version history (premium/subscription tier)
- AUTO-06: Auto-send recurring invoices without review
- Per-invoice manual "Send Reminder" button
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| AUTO-01 | System creates invoice version snapshots on save | invoice_versions table schema, snapshot-after-write pattern in updateInvoiceAction |
| AUTO-02 | User can view invoice version history and restore a prior version safely | Sidebar panel on invoice detail page, restoreInvoiceVersionAction with warn+confirm, computeAndWriteInvoiceStatus after restore |
| AUTO-03 | User can configure an invoice as recurring with weekly, monthly, or quarterly frequency | recurring_schedules table, frequency UI at creation + detail, Vercel cron daily handler |
| AUTO-04 | User can configure reminder timing rules for invoices | Already implemented in Settings > Notifications; cron reads user_settings columns |
| AUTO-05 | Reminder sends are logged so duplicate reminders can be prevented | reminder_logs table, deduplication check before send in cron handler |
</phase_requirements>

---

## Summary

Phase 5 adds three independent capability layers, all of which integrate cleanly into existing patterns without disturbing the financial record model. The most critical architectural constraint is that `invoice_versions` and `reminder_logs` are owned by a cron/service-role context — they need to be written by both session-authenticated server actions (versions) and unauthenticated cron endpoints (reminder_logs, recurring drafts). This means the cron routes use the Supabase admin client (`createSupabaseAdminClient`) rather than `requireSession()`.

**Key discovery:** The reminder settings columns (`reminder_enabled`, `reminder_days_before`, `reminder_days_after`, `remind_on_due_date`, `second_reminder_days`) are live in the Supabase `user_settings` table and consumed by `src/lib/data.ts` and `src/actions/app.ts`, but they have NO corresponding migration file in the repo. Phase 5's migration must add them with `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` — this is safe for a live database (idempotent) and matches the existing pattern from `202604060330_phase21_document_template.sql`.

**Primary recommendation:** Two cron routes (`/api/cron/recurring` and `/api/cron/reminders`) with shared `CRON_SECRET` auth guard. Both use the Supabase admin client (service role key). The version snapshot inserts after a successful `updateInvoiceAction` using the existing session client — no admin client needed there.

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @supabase/supabase-js | 2.101.1 (pinned) | Admin client for cron writes | Already in project; service role bypasses RLS |
| resend | ^6.10.0 (pinned) | Reminder email delivery | Already wired in `src/lib/email.ts` |
| next | 15.5.14 (pinned) | Route handlers for cron endpoints | App Router `GET` handler with `NextRequest` |
| zod | 4.3.6 (pinned) | Schema validation for recurring config | Matches all existing action schemas |
| vitest | ^3.2.4 (pinned) | Unit tests | Already configured, `environment: "node"` |

### No New Packages Required
This phase introduces no new npm dependencies. All required infrastructure (Supabase, Resend, Zod, Vitest) is already installed.

---

## Architecture Patterns

### Recommended Project Structure Extensions

```
src/
├── app/
│   ├── api/
│   │   └── cron/
│   │       ├── recurring/
│   │       │   └── route.ts        # POST/GET: generate overdue recurring drafts
│   │       └── reminders/
│   │           └── route.ts        # POST/GET: send due reminders, log sends
│   └── (app)/app/invoices/[slug]/
│       └── page.tsx                # Add VersionHistoryPanel (server component)
├── actions/
│   ├── invoices.ts                 # Add snapshotInvoiceVersion() call in updateInvoiceAction
│   └── versions.ts                 # New: restoreInvoiceVersionAction
├── components/
│   └── documents/
│       ├── version-history-panel.tsx   # Collapsible sidebar — client component
│       ├── version-restore-dialog.tsx  # shadcn/ui AlertDialog confirm flow
│       └── recurring-config-form.tsx   # Frequency + next_date picker
└── lib/
    ├── email.ts                    # Add sendReminderEmail() following existing pattern
    └── cron-utils.ts               # Shared: verifyCronAuth(), advance next_due_date
supabase/
└── migrations/
    └── 20260412000000_phase5_automation.sql   # All 3 new tables + reminder columns
vercel.json                         # Add "crons" array
```

### Pattern 1: Vercel Cron Route Handler with CRON_SECRET Auth

Vercel sends `Authorization: Bearer <CRON_SECRET>` on every cron invocation. The route handler must validate this before doing any work.

```typescript
// Source: https://vercel.com/docs/cron-jobs/manage-cron-jobs#securing-cron-jobs
// src/app/api/cron/recurring/route.ts
import type { NextRequest } from 'next/server';

export const maxDuration = 60; // seconds — override default if needed

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  // ... business logic using admin client
  return Response.json({ success: true });
}
```

**vercel.json format (two separate cron paths):**
```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "crons": [
    {
      "path": "/api/cron/recurring",
      "schedule": "0 6 * * *"
    },
    {
      "path": "/api/cron/reminders",
      "schedule": "0 7 * * *"
    }
  ]
}
```

Two separate routes (not one combined) because:
- Independent failure domains: reminder failure doesn't block recurring generation
- Separate log streams for debugging in Vercel dashboard
- Each can have its own `maxDuration` if needed

**Important Vercel cron constraints (HIGH confidence — verified from official docs):**
- Cron only triggers on production deployments, not preview
- Vercel will NOT retry on failure — errors must be logged, not silently swallowed
- Cron can invoke same endpoint twice (idempotency required — already handled by `next_due_date` advance and `reminder_logs` dedup check)
- Hobby plan: once-per-day only. Pro plan: invoked within the minute specified
- Timezone is always UTC — `0 6 * * *` = 06:00 UTC (10:00 Dubai time)

### Pattern 2: Version Snapshot — After Successful Write

Insert the snapshot AFTER the invoice update succeeds in `updateInvoiceAction`. Use the same session `supabase` client (no admin needed — owner inserts their own versions).

```typescript
// In updateInvoiceAction, after successful .update() call:
async function snapshotInvoiceVersion(
  supabase: SupabaseClient,
  invoiceId: string,
  userId: string,
  snapshot: Record<string, unknown>,
): Promise<void> {
  // 1. Insert new version
  await supabase.from('invoice_versions').insert({
    invoice_id: invoiceId,
    user_id: userId,
    snapshot,
  });

  // 2. Enforce rolling 10-cap: delete oldest beyond MAX_VERSIONS
  const MAX_VERSIONS = 10; // configurable constant
  const { data: versions } = await supabase
    .from('invoice_versions')
    .select('id, created_at')
    .eq('invoice_id', invoiceId)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (versions && versions.length > MAX_VERSIONS) {
    const toDelete = versions.slice(MAX_VERSIONS).map((v) => v.id);
    await supabase.from('invoice_versions').delete().in('id', toDelete);
  }
}
```

**What to put in the snapshot JSONB:** The full invoice row at write time — same fields that `updateInvoiceAction` writes: client_id, issue_date, due_date, currency, tax_rate, discount, subtotal, discount_amount, tax_amount, total, line_items, notes, terms, language, trn, invoice_type. Also include invoice_number and a denormalized `client_name` for display in the sidebar without extra joins.

**JSONB shape (for sidebar display and restore):**
```json
{
  "invoice_number": "INV-0001",
  "client_id": "uuid",
  "client_name": "Acme Corp",
  "issue_date": "2026-04-12",
  "due_date": "2026-04-26",
  "currency": "AED",
  "tax_rate": 5,
  "discount": 0,
  "subtotal": 10000,
  "discount_amount": 0,
  "tax_amount": 500,
  "total": 10500,
  "line_items": [...],
  "notes": "...",
  "terms": "...",
  "language": "en",
  "trn": "",
  "invoice_type": "invoice"
}
```

### Pattern 3: Restore with Warn + Confirm

```typescript
// src/actions/versions.ts
"use server";
export async function restoreInvoiceVersionAction(
  versionId: string,
  invoiceId: string,
): Promise<ActionState> {
  const { supabase, user } = await requireSession();

  // 1. Fetch snapshot (verify ownership via user_id on invoice_versions)
  const { data: version } = await supabase
    .from('invoice_versions')
    .select('snapshot')
    .eq('id', versionId)
    .eq('invoice_id', invoiceId)
    .eq('user_id', user.id)
    .single();

  // 2. Apply snapshot fields back to invoices table
  const snap = version.snapshot as SnapshotShape;
  await supabase
    .from('invoices')
    .update({
      client_id: snap.client_id,
      issue_date: snap.issue_date,
      due_date: snap.due_date,
      // ... all invoice fields from snapshot
    })
    .eq('id', invoiceId)
    .eq('user_id', user.id);

  // 3. Recompute payment status (payments preserved — totals changed)
  await computeAndWriteInvoiceStatus(supabase, invoiceId, user.id);

  // 4. Revalidate and redirect
  revalidatePath(`/app/invoices/${invoiceSlug}`);
}
```

**Client-side confirm dialog:** Use `shadcn/ui AlertDialog` (already in the project via `@radix-ui/react-dialog`). Dialog shows: old total → restored total. Confirm button calls the server action via `startTransition`.

The "warn" step is entirely client-side — the dialog component receives `currentTotal` and `snapshotTotal` as props. The server action is only called on confirmation.

### Pattern 4: Recurring Schedule — Next Date Advance

```typescript
// lib/cron-utils.ts
export function advanceNextDueDate(
  currentNextDue: string, // "YYYY-MM-DD"
  frequency: 'weekly' | 'monthly' | 'quarterly',
): string {
  const date = new Date(currentNextDue);
  if (frequency === 'weekly') date.setDate(date.getDate() + 7);
  if (frequency === 'monthly') date.setMonth(date.getMonth() + 1);
  if (frequency === 'quarterly') date.setMonth(date.getMonth() + 3);
  return date.toISOString().split('T')[0];
}
```

**Cron logic for recurring drafts:**
1. Query `recurring_schedules` where `is_active = true AND next_due_date <= today`
2. For each schedule, fetch the source invoice (all fields)
3. Insert new draft invoice (today's date, recalculated due date, same line items/client/terms, notes with "Generated from...")
4. Advance `next_due_date` on the schedule
5. Log errors per-schedule — one failure does not abort others

### Pattern 5: Reminder Cron Logic

```typescript
// For each user with reminder_enabled = true:
//   For each sent/overdue invoice:
//     Check if reminder_days_before: (due_date - today) == reminder_days_before
//     Check if remind_on_due_date: (due_date == today)
//     Check if reminder_days_after: (today - due_date) == reminder_days_after
//     Check if second_reminder_days: (today - due_date) == second_reminder_days
//     For each match: check reminder_logs for (invoice_id, reminder_type, sent within cooldown)
//     If not logged: sendReminderEmail(), insert reminder_logs row
```

**Reminder types enum for `reminder_logs.reminder_type`:**
- `'before'` — days_before trigger
- `'due_date'` — same-day trigger
- `'after'` — days_after trigger
- `'second'` — second_reminder_days trigger

**Dedup check query:**
```sql
SELECT 1 FROM reminder_logs
WHERE invoice_id = $1 AND reminder_type = $2
  AND sent_at >= (now() - interval '24 hours')
LIMIT 1;
```

### Anti-Patterns to Avoid

- **Snapshot before write:** Take the snapshot AFTER a successful DB update, not before. Snapshotting before means a failed update still creates a version entry.
- **RLS on cron-written tables:** `invoice_versions` inserted by user sessions need owner RLS. `reminder_logs` inserted by cron (service role) bypass RLS — enable RLS for select/owner read but cron uses admin client which bypasses all policies.
- **Using `requireSession()` in cron routes:** Cron routes have no session cookie. Always use `createSupabaseAdminClient()` in `src/app/api/cron/` routes.
- **Rolling delete before insert:** Delete the oldest AFTER insert, not before — prevents a race where the invoice has 9 versions, delete fires, then insert fails, leaving 8.
- **Single cron for both tasks:** Separating recurring and reminders into two routes allows independent failure handling and cleaner logs.

---

## Database Schema

### New Tables for Phase 5 Migration

```sql
-- invoice_versions: one row per save, rolling 10-cap enforced in application layer
CREATE TABLE IF NOT EXISTS public.invoice_versions (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id   uuid NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  user_id      uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  snapshot     jsonb NOT NULL,
  created_at   timestamptz NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS invoice_versions_invoice_id_idx
  ON public.invoice_versions (invoice_id, user_id, created_at DESC);

ALTER TABLE public.invoice_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "invoice versions are viewable by owner"
  ON public.invoice_versions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "invoice versions are insertable by owner"
  ON public.invoice_versions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "invoice versions are deletable by owner"
  ON public.invoice_versions FOR DELETE
  USING (auth.uid() = user_id);

-- recurring_schedules: one row per configured recurring invoice
CREATE TABLE IF NOT EXISTS public.recurring_schedules (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  source_invoice_id uuid NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  frequency       text NOT NULL CHECK (frequency IN ('weekly', 'monthly', 'quarterly')),
  next_due_date   date NOT NULL,
  is_active       boolean NOT NULL DEFAULT true,
  created_at      timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at      timestamptz NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS recurring_schedules_cron_idx
  ON public.recurring_schedules (is_active, next_due_date)
  WHERE is_active = true;

ALTER TABLE public.recurring_schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "recurring schedules are viewable by owner"
  ON public.recurring_schedules FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "recurring schedules are insertable by owner"
  ON public.recurring_schedules FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "recurring schedules are updatable by owner"
  ON public.recurring_schedules FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "recurring schedules are deletable by owner"
  ON public.recurring_schedules FOR DELETE
  USING (auth.uid() = user_id);

-- reminder_logs: tracks each send event for deduplication
CREATE TABLE IF NOT EXISTS public.reminder_logs (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id    uuid NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  user_id       uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reminder_type text NOT NULL CHECK (reminder_type IN ('before', 'due_date', 'after', 'second')),
  sent_at       timestamptz NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS reminder_logs_dedup_idx
  ON public.reminder_logs (invoice_id, reminder_type, sent_at DESC);

ALTER TABLE public.reminder_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "reminder logs are viewable by owner"
  ON public.reminder_logs FOR SELECT
  USING (auth.uid() = user_id);

-- Reminder settings columns on user_settings (already live in DB, migration adds IF NOT EXISTS)
ALTER TABLE public.user_settings
  ADD COLUMN IF NOT EXISTS reminder_enabled boolean NOT NULL DEFAULT false;
ALTER TABLE public.user_settings
  ADD COLUMN IF NOT EXISTS reminder_days_before integer NOT NULL DEFAULT 3;
ALTER TABLE public.user_settings
  ADD COLUMN IF NOT EXISTS reminder_days_after integer NOT NULL DEFAULT 7;
ALTER TABLE public.user_settings
  ADD COLUMN IF NOT EXISTS remind_on_due_date boolean NOT NULL DEFAULT true;
ALTER TABLE public.user_settings
  ADD COLUMN IF NOT EXISTS second_reminder_days integer NOT NULL DEFAULT 14;
```

**Critical schema note:** `reminder_logs` has no UPDATE or DELETE RLS policy — rows are write-once by the cron (admin client bypasses RLS) and read-only by the owner. This matches the payments/expenses pattern from Phase 3.

**Index rationale:**
- `invoice_versions_invoice_id_idx`: (invoice_id, user_id, created_at DESC) — covers the sidebar query (list all versions for an invoice in date order) and the rolling-cap delete (fetch all versions to find oldest)
- `recurring_schedules_cron_idx`: partial index on `is_active = true, next_due_date` — the cron query is exactly `WHERE is_active = true AND next_due_date <= $today`, this makes it O(log n) even with many schedules
- `reminder_logs_dedup_idx`: (invoice_id, reminder_type, sent_at DESC) — covers the per-invoice per-type dedup check

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Email templating | Custom HTML builder | `brandedEmailHtml()` in `src/lib/email.ts` | Already battle-tested with Gmail/Outlook compatibility, branded colors |
| Cron scheduling | Self-hosted scheduler, node-cron | Vercel cron (vercel.json) | Zero infra, runs on prod only, visible in dashboard |
| Date arithmetic for recurring | Manual date math | `Date.setMonth()` / `Date.setDate()` | Trivial one-liner, no library needed for 3 frequencies |
| Invoice status recompute | Custom status logic | `computeAndWriteInvoiceStatus()` from `billing-data.ts` | Already handles all 6 status transitions correctly |
| Confirm dialog | Custom modal | shadcn/ui AlertDialog (already in project) | Accessible, keyboard-navigable, matches design system |
| Admin DB writes from cron | Session-based access | `createSupabaseAdminClient()` | Cron has no auth session; service role is the correct pattern |

---

## Common Pitfalls

### Pitfall 1: Snapshot Before Write Succeeds
**What goes wrong:** A version row is inserted before the invoice update, then the update fails. The version table now has a ghost entry that doesn't match any real saved state.
**Why it happens:** Wanting to "save the current state before overwriting it."
**How to avoid:** The current state IS already in the `invoices` table — snapshot is built FROM the post-update row, or from `parsed.data` that was just successfully written. Insert version row after `supabase.from('invoices').update(...).select(...)` succeeds.
**Warning signs:** Versions that look like the current invoice, not older saves.

### Pitfall 2: RLS Blocks Cron Admin Writes
**What goes wrong:** `reminder_logs` insert fails silently because the cron route tries to use a session client but there's no active session.
**Why it happens:** Copying the `requireSession()` pattern into a cron route.
**How to avoid:** Cron routes use `createSupabaseAdminClient()`. Admin client uses the service role key, which bypasses RLS entirely.
**Warning signs:** 401/403 errors in Vercel cron logs, or empty `reminder_logs` despite cron running.

### Pitfall 3: Restore Leaves Status Stale
**What goes wrong:** Restoring a version from when the invoice total was 5,000 AED to when it was 3,000 AED doesn't update payment status. A 4,500 payment against a 3,000 invoice should be `overpaid`, but status stays whatever it was before restore.
**Why it happens:** Forgetting that `computeAndWriteInvoiceStatus` must run after every change to invoice total or due_date.
**How to avoid:** `restoreInvoiceVersionAction` calls `computeAndWriteInvoiceStatus(supabase, invoiceId, user.id)` immediately after the invoice update. This is the exact same pattern used in `addPaymentAction` and `deletePaymentAction`.

### Pitfall 4: Duplicate Draft Generation (Idempotency Failure)
**What goes wrong:** Cron fires twice on the same day (Vercel may deliver the same cron event more than once per official docs). Two draft invoices are created for one schedule.
**Why it happens:** Not advancing `next_due_date` atomically before creating the draft.
**How to avoid:** Update `next_due_date` first (or in the same operation as draft creation), check idempotency: after advancing, the schedule's `next_due_date` will be > today, so a second cron run that day won't match the `next_due_date <= today` filter.
**Warning signs:** Duplicate drafts appearing in the invoice list on the same day.

### Pitfall 5: Reminder Email to Wrong Address
**What goes wrong:** Reminder sent to user's email (account owner) instead of client's email.
**Why it happens:** Confusing `profiles.email` with `clients.email`.
**How to avoid:** D-17 is explicit: send to `invoice.client.email`. The cron query must join `invoices → clients` and use `clients.email`. Guard with: if `client.email` is null, skip send for that invoice.

### Pitfall 6: Reminder Columns Missing in Migration
**What goes wrong:** Migration runs on a fresh Supabase instance (e.g., staging or a new developer environment) and fails because the reminder columns aren't there.
**Why it happens:** The columns were added directly to the live DB without a migration file. They exist in production but not in the migration history.
**How to avoid:** Phase 5 migration MUST include `ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS` for all 5 reminder columns. The `IF NOT EXISTS` guard makes this safe on production (no-op if columns already exist).

### Pitfall 7: Version Sidebar Triggers Full Page Rerender
**What goes wrong:** The version panel uses client state toggle (open/closed) and fetching version data causes a full RSC re-render or layout shift.
**Why it happens:** Mixing server data fetching with client-controlled UI without proper Suspense boundaries.
**How to avoid:** Load version list data server-side at page render (add `listInvoiceVersions(invoice.id)` to the `Promise.all` in `InvoiceDetailPage`). Pass versions as prop to a client component that handles open/close toggle and confirmation dialog state locally.

---

## Code Examples

### Email: sendReminderEmail pattern
```typescript
// Source: mirrors sendPasswordResetEmail in src/lib/email.ts
export function sendReminderEmail(params: {
  clientEmail: string;
  invoiceNumber: string;
  total: number;
  currency: string;
  dueDate: string;
  publicLink: string;
}): void {
  const client = getResend();
  if (!client) return;

  const formattedTotal = formatCurrency(params.total, params.currency);

  client.emails
    .send({
      from: env.emailFrom,
      to: params.clientEmail,
      subject: `Invoice ${params.invoiceNumber} — Payment Reminder`,
      html: brandedEmailHtml({
        title: `Payment Reminder: ${params.invoiceNumber}`,
        bodyLines: [
          `A payment of ${formattedTotal} is due on ${params.dueDate}.`,
          'Please use the link below to view your invoice.',
        ],
        ctaUrl: params.publicLink,
        ctaLabel: 'View Invoice',
      }),
    })
    .catch((err: unknown) =>
      console.error('[email] Failed to send reminder email:', err),
    );
}
```

### Vercel Cron Route — Full Auth + Admin Pattern
```typescript
// src/app/api/cron/recurring/route.ts
import type { NextRequest } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

export const maxDuration = 60;

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    return new Response('Admin client unavailable', { status: 503 });
  }

  const today = new Date().toISOString().split('T')[0];
  // ... query recurring_schedules where is_active AND next_due_date <= today
  return Response.json({ success: true });
}
```

### Zod Schema for Recurring Schedule Config
```typescript
// Matches existing Zod schema conventions in billing.ts and app.ts
export const recurringScheduleSchema = z.object({
  invoiceId: z.string().uuid(),
  frequency: z.enum(['weekly', 'monthly', 'quarterly']),
  nextDueDate: z.string().min(1, 'Next generation date is required.'),
  isActive: z.boolean().default(true),
});
```

### Version Sidebar List Query (billing-data.ts pattern)
```typescript
export async function listInvoiceVersions(invoiceId: string): Promise<VersionRecord[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('invoice_versions')
    .select('id, snapshot, created_at')
    .eq('invoice_id', invoiceId)
    .order('created_at', { ascending: false })
    .limit(10);

  if (error || !data) return [];
  return data.map((row) => ({
    id: row.id,
    createdAt: row.created_at,
    total: (row.snapshot as SnapshotShape).total,
    snapshot: row.snapshot as SnapshotShape,
  }));
}
```

---

## Existing Code Integration Points

### updateInvoiceAction (`src/actions/invoices.ts`)
Currently: fetches existing invoice, computes totals, calls `supabase.from('invoices').update(...)`, returns `{status:'success', redirectTo}`.

Phase 5 modification: After the `.update()` call succeeds and `data` is returned, call `snapshotInvoiceVersion(supabase, data.id, userId, snapshotPayload)`. The `snapshotPayload` is built from `parsed.data` plus the computed totals. This is a fire-and-forget non-blocking pattern (errors logged, not thrown) — same as email sends.

`createInvoiceAction` does NOT snapshot — version history only applies to updates (D-01 says "on every save" meaning every edit save, not initial creation).

### computeAndWriteInvoiceStatus (`src/lib/billing-data.ts`)
Called after: `addPaymentAction`, `deletePaymentAction`.
Phase 5 adds: `restoreInvoiceVersionAction` (after applying snapshot fields).
Signature: `computeAndWriteInvoiceStatus(supabase, invoiceId, userId)` — takes the session client, not admin.

### InvoiceDetailPage (`src/app/(app)/app/invoices/[slug]/page.tsx`)
Currently: `Promise.all([getAppContext(), listPaymentsForInvoice, listExpensesForInvoice])`.
Phase 5: Add `listInvoiceVersions(invoice.id)` to the same `Promise.all`. Pass `versions` prop to new `VersionHistoryPanel` component.

### `src/lib/data.ts` UserSettings mapping
The data layer already reads reminder columns from `user_settings` (lines confirmed in grep). The cron reminder handler replicates this same query without `requireSession()` — using admin client instead, querying all users where `reminder_enabled = true`.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| CRON_SECRET env var | Cron auth | Not yet set | — | Add to Vercel env vars before deploy |
| SUPABASE_SERVICE_ROLE_KEY | Admin client | Already set | — | Existing (used by cron routes in Phase 4 public pages) |
| RESEND_API_KEY | Reminder emails | Already set | — | `isEmailConfigured()` guard (fire-and-forget, no crash) |
| vercel.json | Cron registration | Not yet created | — | Create new file |

**Missing without fallback:**
- `CRON_SECRET` must be added to Vercel project environment variables before first production deploy. Without it, the auth check `authHeader !== 'Bearer undefined'` would accidentally match if authHeader is also undefined — use strict empty-string guard: `if (!process.env.CRON_SECRET || authHeader !== 'Bearer ' + process.env.CRON_SECRET)`.

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest ^3.2.4 |
| Config file | `vitest.config.ts` at project root |
| Quick run command | `npm test` (vitest run) |
| Full suite command | `npm test` |
| Environment | `node` (no DOM) |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| AUTO-01 | `snapshotInvoiceVersion` inserts a row with correct JSONB shape | unit | `npm test -- src/lib/billing-data.test.ts` | ❌ Wave 0 |
| AUTO-01 | Rolling 10-cap deletes oldest when 11th version inserted | unit | `npm test -- src/lib/billing-data.test.ts` | ❌ Wave 0 |
| AUTO-02 | `listInvoiceVersions` returns versions in descending order, max 10 | unit | `npm test -- src/lib/billing-data.test.ts` | ❌ Wave 0 |
| AUTO-02 | `restoreInvoiceVersionAction` applies snapshot fields and calls `computeAndWriteInvoiceStatus` | unit | `npm test -- src/actions/versions.test.ts` | ❌ Wave 0 |
| AUTO-03 | `recurringScheduleSchema` validates frequency enum and date | unit | `npm test -- src/lib/billing.test.ts` | ❌ Wave 0 |
| AUTO-03 | `advanceNextDueDate` advances by 7 days (weekly), 1 month (monthly), 3 months (quarterly) | unit | `npm test -- src/lib/cron-utils.test.ts` | ❌ Wave 0 |
| AUTO-04 | Reminder cron reads `reminder_enabled = true` users only | unit (mock) | `npm test -- src/app/api/cron/reminders.test.ts` | ❌ Wave 0 |
| AUTO-05 | Reminder cron skips invoice when `reminder_logs` has a matching row within 24h | unit (mock) | `npm test -- src/app/api/cron/reminders.test.ts` | ❌ Wave 0 |
| AUTO-05 | `sendReminderEmail` sends to `client.email`, not user's email | unit (mock) | `npm test -- src/lib/email.test.ts` | ❌ Wave 0 |

### Test Patterns to Follow

All tests use the established mock-chain pattern from `src/lib/billing-data.test.ts` and `src/actions/payments.test.ts`:

```typescript
// Pattern: mock Supabase client with chained vi.fn()
vi.mock('@/lib/supabase/server', () => ({
  createSupabaseServerClient: vi.fn(),
}));

vi.mock('@/lib/supabase/admin', () => ({
  createSupabaseAdminClient: vi.fn(),
}));

// In test: build mock chain
const mockSingle = vi.fn().mockResolvedValue({ data: mockVersionRow, error: null });
const mockEq3 = vi.fn().mockReturnValue({ single: mockSingle });
const mockEq2 = vi.fn().mockReturnValue({ eq: mockEq3 });
const mockEq1 = vi.fn().mockReturnValue({ eq: mockEq2 });
const mockSelect = vi.fn().mockReturnValue({ eq: mockEq1 });
const mockFrom = vi.fn().mockReturnValue({ select: mockSelect });
(createSupabaseServerClient as ReturnType<typeof vi.fn>).mockResolvedValue({ from: mockFrom });
```

**Important:** Vitest in this project uses static imports + `vi.mock()` hoisting. Dynamic `await import()` patterns are unreliable (per project memory). Use static imports at top of file, mock at module level.

**For `computeAndWriteInvoiceStatus` in restore tests:** mock it to verify it is called with the correct arguments, not to test its internals (those are tested in billing-data tests).

### Sampling Rate
- **Per task commit:** `npm test`
- **Per wave merge:** `npm test`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/lib/cron-utils.test.ts` — covers `advanceNextDueDate` (weekly/monthly/quarterly), `verifyCronAuth` guard
- [ ] `src/actions/versions.test.ts` — covers `restoreInvoiceVersionAction` (happy path, ownership check, status recompute call)
- [ ] `src/lib/billing-data.test.ts` extensions — add `snapshotInvoiceVersion` (insert + 10-cap delete) and `listInvoiceVersions` (order, limit)
- [ ] `src/app/api/cron/reminders.test.ts` — covers `reminder_enabled` filter, dedup check, skip-if-no-email guard
- [ ] `src/lib/billing.test.ts` extension — add `recurringScheduleSchema` validation (frequency enum, date required, isActive default)

---

## Open Questions

1. **CRON_SECRET not yet in Vercel project env vars**
   - What we know: Must be added manually before first prod deploy. The variable is named exactly `CRON_SECRET` per Vercel's convention.
   - What's unclear: Whether it exists already in the project (can't check Vercel dashboard from here).
   - Recommendation: Include `vercel env add CRON_SECRET` step in the deploy plan, or instruct the executor to add it via Vercel dashboard before running cron routes.

2. **Reminder columns: live DB vs migration gap**
   - What we know: Columns (`reminder_enabled` etc.) are read by `src/lib/data.ts` and written by `saveNotificationsAction` — they exist in production. No migration file covers them.
   - What's unclear: Whether they were added manually to production or via a migration not in the repo.
   - Recommendation: Phase 5 migration uses `ADD COLUMN IF NOT EXISTS` for all 5 columns. This is idempotent and safe regardless.

3. **Version sidebar UX: collapsible inline vs drawer**
   - What we know: D-03 says "collapsible sidebar panel." The project uses Vaul sheets for mobile overlays already.
   - What's unclear: Whether "sidebar" means a right-side column panel (desktop-only, shifts layout) or a Vaul sheet (mobile-friendly).
   - Recommendation: Use a collapsible section below the financial details on the same detail page (no layout shift) — consistent with existing PaymentsTable and ExpensesTable card pattern. On mobile it stacks naturally.

---

## Sources

### Primary (HIGH confidence)
- Vercel Cron Jobs official docs (https://vercel.com/docs/cron-jobs) — vercel.json format, schedule syntax
- Vercel Manage Cron Jobs (https://vercel.com/docs/cron-jobs/manage-cron-jobs) — CRON_SECRET auth pattern, idempotency requirements, no-retry behavior
- Vercel Cron Quickstart (https://vercel.com/docs/cron-jobs/quickstart) — exact route handler and vercel.json structure
- Project codebase: `src/lib/email.ts`, `src/actions/invoices.ts`, `src/actions/app.ts`, `src/lib/billing-data.ts` — all patterns verified by direct read
- Project migrations: all 11 migration files read — schema conventions confirmed

### Secondary (MEDIUM confidence)
- `src/lib/data.ts` grep for reminder columns — confirmed columns are live in user_settings but not in any migration file
- `src/actions/payments.test.ts` and `src/lib/billing-data.test.ts` — Vitest mock-chain pattern confirmed as established project convention

---

## Project Constraints (from CLAUDE.md → AGENTS.md)

AGENTS.md states: "This is NOT the Next.js you know. This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code."

Verified Next.js version: **15.5.14**. Key App Router conventions confirmed against official docs:
- Route handlers use `export async function GET(request: NextRequest)` — confirmed
- `params` in page components are `Promise<{slug: string}>` and require `await params` — confirmed in existing `page.tsx`
- `Response.json()` for responses (not `NextResponse.json`) — confirmed from Vercel cron docs for TypeScript 5.2+
- No `"use server"` in route handlers — they are not server actions

**The `node_modules/next/dist/docs/` directory does not exist in this installation.** Relied on official Vercel documentation (fetched live) and direct inspection of existing project route handler patterns as the ground truth for Next.js 15 conventions.

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all packages verified in package.json, no new deps needed
- Database schema: HIGH — follows exact conventions of existing migration files; reminder column discovery verified by grep
- Vercel cron pattern: HIGH — verified against official docs (fetched live April 2026)
- Architecture: HIGH — derived from reading all 6 canonical files listed in CONTEXT.md
- Test patterns: HIGH — derived from existing test files in the codebase

**Research date:** 2026-04-12
**Valid until:** 2026-05-12 (stable libraries; Vercel cron API unlikely to change)
