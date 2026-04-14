# Phase 5: Automation & Recovery - Context

**Gathered:** 2026-04-12
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 5 adds three independent capability layers to the invoice lifecycle:

1. **Invoice version history** — Automatic snapshot on every save, collapsible history panel on invoice detail, safe restore with warning when financial records exist
2. **Recurring billing** — Schedule configuration available both at invoice creation and on existing invoices, Vercel cron creates draft copies each cycle
3. **Reminder automation** — Reminder settings are already built in Settings > Notifications; Phase 5 wires the actual send logic (Vercel cron), adds a `reminder_logs` table for deduplication

New capabilities explicitly **out of scope** for Phase 5:
- Recurring payments/expenses (monthly hosting, annual domain fees) — deferred
- Auto-send recurring invoices without review (AUTO-06 — v2)
- Per-invoice manual "Send Reminder" button — reminders are global/automated only

</domain>

<decisions>
## Implementation Decisions

### Version History — Capture (AUTO-01)
- **D-01:** Snapshot on **every save** — automatic, silent, no user action required. Simple trigger, predictable history.
- **D-02:** Store JSONB snapshots in a new `invoice_versions` table (invoice_id, user_id, snapshot JSONB, created_at). Rolling window of **10 versions** per invoice — oldest dropped when 11th is created.

### Version History — UI (AUTO-02)
- **D-03:** Version history appears as a **collapsible sidebar panel** on the invoice detail page. Each row shows: save date/time, total amount. User can expand and preview or restore from any version row.
- **D-04:** Version count limit of 10 is the v1 default. Unlimited retention is a **future premium/subscription tier** feature — design the cap as a configurable constant so it can be raised per-plan later.

### Restore Safety (AUTO-02)
- **D-05:** Restore flow — **warn + confirm** before applying. Show the user: "Restoring this version changes the invoice total from X to Y. Existing payments are preserved but payment status will recalculate." Require explicit confirmation.
- **D-06:** After restore, payments and expenses are **kept intact** (they are financial records). Invoice fields (line items, amounts, dates, terms) revert to the snapshot. Payment status is recomputed automatically after restore.

### Recurring Billing — Configuration (AUTO-03)
- **D-07:** Recurrence is configurable in **both places**:
  - "Repeat this" toggle during invoice **creation** (for users who know upfront)
  - "Make recurring" action on existing **invoice detail** (for users who add it later)
- **D-08:** Supported frequencies: **weekly, monthly, quarterly** (matches requirement AUTO-03 exactly).
- **D-09:** Configuring recurrence requires: frequency + next generation date (auto-calculated from original issue date + frequency interval).

### Recurring Billing — Execution (AUTO-03)
- **D-10:** Each cycle creates a **new draft invoice** — same line items, client, terms as the source; updated issue date (today) and due date (today + original payment terms). User reviews and sends manually.
- **D-11:** A **Vercel cron job** (daily, e.g., `0 6 * * *`) checks all active recurring schedules and creates drafts for any schedules where `next_due_date <= today`. No manual trigger needed.
- **D-12:** Generated drafts appear in the invoices list as normal drafts. No special badge needed in v1, though they may note "Recurring — generated from Invoice #XXXX" in the notes field.

### Reminder System — Configuration (AUTO-04)
- **D-13:** Reminder timing rules are **already configured** in Settings > Notifications (`reminder_enabled`, `reminder_days_before`, `reminder_days_after`, `second_reminder_days`). The `saveNotificationsAction` is already implemented. Phase 5 does NOT add new settings UI.

### Reminder System — Execution & Deduplication (AUTO-04, AUTO-05)
- **D-14:** Reminders are sent **globally and automatically** via a Vercel cron job (daily). Reads each user's reminder settings and checks all sent/overdue invoices against the timing rules.
- **D-15:** A new `reminder_logs` table tracks sends: (invoice_id, user_id, sent_at, reminder_type). Before sending, the cron checks this table. If a reminder was sent for this invoice within the configured cooldown, skip silently.
- **D-16:** Reminder email content: **invoice public link + amount due + due date**. Uses the existing branded email template pattern from `src/lib/email.ts` (Resend). No full line item summary in v1.
- **D-17:** Reminder emails are sent to the **client's email address** on the invoice's associated client record.

### Claude's Discretion
- Internal cron API route path naming and auth (e.g., `CRON_SECRET` env var for Vercel cron)
- SQL schema details for `invoice_versions` and `reminder_logs` tables
- Exact version sidebar component structure and animation
- Whether to add a "Recurring" indicator badge to the invoices list (nice-to-have, Claude decides)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements & Project State
- `.planning/REQUIREMENTS.md` — AUTO-01..05 definitions (exact acceptance criteria)
- `.planning/ROADMAP.md` — Phase 5 goal and success criteria
- `.planning/STATE.md` — Project decisions log (slug patterns, schema conventions)

### Existing Code — Reminder Infrastructure (already built)
- `src/components/app/settings-workspace.tsx` — Notifications tab with reminder settings UI (already fully built)
- `src/actions/app.ts` — `saveNotificationsAction` and `notificationsSchema` (already implemented)

### Existing Code — Email Infrastructure
- `src/lib/email.ts` — Resend client, branded HTML email template, `sendWelcomeEmail` / `sendPasswordResetEmail` patterns to replicate

### Existing Code — Invoice Schema & Actions
- `src/actions/invoices.ts` — `saveInvoiceAction` is the save entry point (version snapshot hooks here)
- `src/lib/billing.ts` — `invoiceFormSchema`, invoice field definitions
- `src/lib/data.ts` — data access patterns for invoice reads

### Database Schema
- `supabase/migrations/202604060130_phase2_documents.sql` — invoices table structure
- `supabase/migrations/20260407120000_phase3_payments_expenses.sql` — payments/expenses tables (relevant to restore safety)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/lib/email.ts` branded template function — Phase 5 adds `sendReminderEmail` following the same pattern
- `src/actions/app.ts` `saveNotificationsAction` — reads reminder config; cron reads the same profile fields
- Supabase `requireSession()` pattern — cron endpoint will use service role key instead (not session-based)

### Established Patterns
- DB migrations: All schema changes go in `supabase/migrations/` with timestamped filenames
- Server actions: `"use server"`, `requireSession()`, Zod parsing, `revalidatePath()`
- Status computation: `computeAndWriteInvoiceStatus` pattern from Phase 3 — restore must call this after reverting invoice fields

### Integration Points
- `saveInvoiceAction` in `src/actions/invoices.ts` — version snapshot is inserted here after successful DB write
- Vercel cron endpoint: new API route at `src/app/api/cron/` — needs `CRON_SECRET` env var + vercel.json cron config
- Invoice detail page `src/app/(app)/app/invoices/[slug]/page.tsx` — version sidebar panel added here

</code_context>

<specifics>
## Specific Ideas

- Version limit of 10 is intentionally a constant (not hardcoded) — future subscription tiers can increase it
- Recurring invoices created by cron should reference their source in notes: "Generated from recurring schedule — Invoice #ORIG"
- Reminder cron and recurring cron may share the same daily run (one cron endpoint, two tasks) or be separate routes — Claude decides

</specifics>

<deferred>
## Deferred Ideas

- **Recurring payments/expenses** — User mentioned wanting monthly hosting fees, annual domain renewals to be recurring expenses. This is a meaningful new capability (recurring expense entries vs recurring invoice billing) — belongs in a future phase or v2.
- **Unlimited version history** — Becomes available at premium/subscription tier. Design the 10-version cap as a configurable constant now.
- **AUTO-06: Auto-send recurring invoices** — v2 requirement. Phase 5 creates drafts; user reviews and sends manually.
- **Per-invoice reminder button** — Decided against. Reminders are global/automated from Settings only.

</deferred>

---

*Phase: 05-automation-recovery*
*Context gathered: 2026-04-12*
