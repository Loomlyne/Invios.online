---
feature: admin-dashboard
slug: admin-dashboard
status: draft-plan
owner: koussayzayani@proton.me
created: 2026-06-22
decision_basis: Q&A 2026-06-22 (powers=read+safe-actions, access=email-allowlist, location=/admin route group, scope=all 4 capabilities)
---

# Admin Dashboard — End-to-End Plan

> A gated, owner-only control panel inside the existing Invios Next.js app that lets
> **you** (the app operator) investigate any account, see all of a user's data,
> manage their billing, surface errors, and export their data to send to them.
> **Read + safe support actions only** in v1 — no destructive ops, no "log in as".

---

## 0. Decisions locked (from planning Q&A)

| Decision | Choice | Consequence |
|---|---|---|
| **Powers** | Read + *safe* support actions | View everything; act only via a fixed catalogue of reversible/non-destructive actions. No delete, no impersonation in v1. |
| **Access control** | Admin-email allowlist via env var (`ADMIN_EMAILS`) | No schema change for auth; middleware blocks `/admin` for anyone not on the list. |
| **v1 scope** | All four capabilities | Accounts overview · Per-account deep view · Billing control · Errors/logs + data export. |
| **Location** | Same app, gated `(admin)` route group | One deploy, reuses all existing data code; service-role client used **server-side only**. |

### Explicitly OUT of scope for v1 (candidates for v2)
- "Log in as user" / session impersonation.
- Destructive operations (delete account, delete documents, hard data edits).
- Editing arbitrary record fields (only the curated safe actions are allowed).
- A separate admin deployment.

---

## 1. Terminology (to avoid confusion)

This app is **multi-tenant**. Two different meanings of "client":

- **Account / User** = a business that signed up for Invios (row in `auth.users` ↔ `profiles`). *This is who you support.*
- **Client** = a customer that an Account invoices (row in `public.clients`, owned by an Account).

This dashboard is primarily about **Accounts** and everything each Account owns
(including their `clients`). Throughout this doc, "account" = an Invios user.

---

## 2. The core security problem (read this first)

Every data table has **Row-Level Security** scoped to `auth.uid() = user_id`. The
normal app can only ever see the signed-in account's rows. An admin "god view"
must **bypass RLS**, which is only possible with the **service-role key** via
`createSupabaseAdminClient()` (already exists in `src/lib/supabase/admin.ts`).

That power is dangerous, so the plan is built around these invariants:

1. **The service-role key never reaches the browser.** All admin data is fetched
   in Server Components / Server Actions / Route Handlers. No admin module is ever
   imported by a `"use client"` component.
2. **Every `/admin` entry point passes through `requireAdmin()`** (session present
   **and** email on the allowlist) before any data is read. Defense in depth:
   middleware gate **+** per-request guard in the layout/actions.
3. **Safe actions only.** Mutations go through a fixed, audited catalogue (§7).
   No generic "update any column" endpoint.
4. **Everything an admin does is written to an audit log** (§8).
5. `/admin` is `force-dynamic`, `noindex`, and excluded from any caching.

---

## 3. Architecture overview

```
Browser ──/admin/*──▶ middleware.ts (gate: session + ADMIN_EMAILS)
                          │ allow
                          ▼
                  src/app/(admin)/admin/layout.tsx
                     └─ requireAdmin() ──┐ (re-check, server-side)
                          │ ok           │ not admin ▶ 404 (not /sign-in — hide existence)
                          ▼
            Admin Server Components ──▶ src/lib/admin/admin-data.ts
                          │                    └─ createSupabaseAdminClient() (service role, bypasses RLS)
                          ▼
            Safe actions ──▶ src/actions/admin.ts
                                 ├─ requireAdmin()
                                 ├─ perform action (Creem / DB / email)
                                 └─ writeAuditLog(...)
```

### Why 404 (not redirect) for non-admins
Returning `notFound()` for non-allowlisted users hides the existence of `/admin`
from regular signed-in users. (Redirect-to-sign-in leaks that the route exists.)

---

## 4. File / module map

**New files**
| Path | Purpose |
|---|---|
| `src/lib/admin/guard.ts` | `requireAdmin()` → returns `{ admin: serviceClient, adminEmail }` or `notFound()`. |
| `src/lib/admin/admin-data.ts` | Cross-account **read** queries via service-role client (accounts list, account overview, their clients/docs/financials/subscription). |
| `src/lib/admin/audit.ts` | `writeAuditLog(entry)` + `listAuditLog()`. |
| `src/actions/admin.ts` | Safe support **actions** (server actions), each `requireAdmin` + audit. |
| `src/app/(admin)/admin/layout.tsx` | Admin shell + `requireAdmin()`; distinct chrome so you always know you're in admin. |
| `src/app/(admin)/admin/page.tsx` | **Accounts overview & search**. |
| `src/app/(admin)/admin/accounts/[userId]/page.tsx` | **Per-account deep view**. |
| `src/app/(admin)/admin/billing/page.tsx` | **Billing & subscription control** (cross-account). |
| `src/app/(admin)/admin/logs/page.tsx` | **Errors / activity / audit log**. |
| `src/components/admin/*` | Admin-only presentational components (tables, account header, action buttons). |
| `supabase/migrations/<ts>_admin_audit_log.sql` | `admin_audit_log` table (+ optional `error_events`). |

**Modified files**
| Path | Change |
|---|---|
| `src/lib/env.ts` | Add `adminEmails: string[]` + `isAdminEmail(email)`. |
| `middleware.ts` / `src/lib/supabase/middleware.ts` | Add `/admin` gate (session + allowlist) before the existing logic. |
| `.env` (Vercel) | Add `ADMIN_EMAILS`. |

**Reused as-is**
- `src/lib/supabase/admin.ts` — service-role client (the engine).
- `src/lib/export-csv.ts` — `buildClientsCsv / buildInvoicesCsv / buildQuotationsCsv / buildDashboardCsv`, `csvResponse`.
- `src/lib/creem.ts` — `createCreemBillingPortal(customerId)`.
- `src/lib/billing-utils.ts`, `src/lib/dashboard.ts` — pure compute (collection rate, profit, aging) for stats.
- `src/lib/email.ts` — resend welcome / reminder, for safe "resend" actions.

> **Key pattern:** existing `src/lib/billing-data.ts` functions use the **RLS server
> client** and only read the signed-in user's rows. We do **not** reuse them for
> cross-account reads. Instead `admin-data.ts` re-implements the same queries with
> the **service-role client**, always filtering by an explicit `target user_id`.

---

## 5. Access control & gating (detail)

### 5.1 Env
```
ADMIN_EMAILS=koussayzayani@proton.me      # comma-separated, case-insensitive
```
`env.ts`:
```ts
adminEmails: (process.env.ADMIN_EMAILS ?? "")
  .split(",").map(s => s.trim().toLowerCase()).filter(Boolean),
export function isAdminEmail(email?: string | null) {
  return !!email && env.adminEmails.includes(email.toLowerCase());
}
```

### 5.2 Middleware gate (first-line)
In `updateSession`, after `getUser()` resolves, before the `/app` block:
```ts
if (pathname.startsWith("/admin")) {
  if (!user || !isAdminEmail(user.email)) {
    return rewriteToNotFound();   // or NextResponse.rewrite to a 404
  }
}
```
(Note: the existing matcher already covers `/admin`.)

### 5.3 `requireAdmin()` (second-line, authoritative)
Used by the admin layout and **every** admin server action:
```ts
export async function requireAdmin() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !isAdminEmail(user.email)) notFound();   // hide existence
  const admin = createSupabaseAdminClient();
  if (!admin) throw new Error("Admin client unavailable (service role key missing).");
  return { admin, adminEmail: user.email!, adminId: user.id };
}
```

---

## 6. Capabilities — v1 (all four)

### 6.1 Accounts overview & search  → `/admin`
- **Data:** join `auth.admin.listUsers()` (email, created_at, last_sign_in_at,
  email_confirmed_at) with `profiles` (name, onboarding) + aggregate counts.
- **Columns:** email · name · plan (from `subscriptions.status/plan`) · # clients ·
  # invoices · # quotations · total billed · outstanding · last activity · flags.
- **Search/filter:** by email/name; filter by plan (free/pro), status
  (active/canceled/past_due), "has errors", "no activity 30d".
- **Health flags (computed):** lapsed subscription, zero documents, stuck
  onboarding, recent errors. Surfaces "who needs help".
- **Perf note:** counts across all accounts can be heavy. v1 = a single grouped
  aggregate query per table (group by `user_id`) assembled in memory; revisit with
  a materialized `account_stats` view if account count grows.

### 6.2 Per-account deep view  → `/admin/accounts/[userId]`
One screen, tabbed, showing **everything that account owns**:
- **Header:** email, name, signup date, last sign-in, plan badge, quick actions.
- **Profile & settings:** `profiles`, `branding`, `user_settings`.
- **Clients:** their `clients` rows (the account's customers) + per-client totals.
- **Documents:** `invoices`, `quotations` (status, totals, dates, share tokens),
  drill to a read-only document view; `invoice_versions` history.
- **Financials:** `payments`, `expenses`; billed/collected/outstanding/overdue,
  aging — computed with existing `dashboard.ts`/`billing-utils.ts`.
- **Automation:** `recurring_schedules`, `reminder_logs`.
- **Activity & errors:** recent `error_events` + `admin_audit_log` for this account.
- **Export:** buttons → per-account CSV, per-client CSV (§6.4).

### 6.3 Billing & subscription control  → `/admin/billing`
- **View:** every `subscriptions` row joined to account email; Creem ids; status;
  `current_period_end`; detect *lapsed* (canceled + period elapsed) and *missing*.
- **Safe actions (audited):**
  - **Open Creem billing portal** for an account → `createCreemBillingPortal(creem_customer_id)`.
  - **Manually set status** (`active` / `trialing` / `canceled` / `past_due`) +
    `current_period_end` — for reconciliation when a webhook was missed. This is a
    curated, audited write (not arbitrary editing).
  - **Re-sync from Creem** (optional, v1.1): refetch subscription by `creem_subscription_id`.

### 6.4 Errors, logs & data export  → `/admin/logs` (+ export buttons everywhere)
- **Error feed:** in-app `error_events` table written by the error boundary and a
  small server logger (account id, route, message, digest, timestamp). Filter by
  account. *(Vercel runtime logs stay the source of truth for infra; we link out to
  the Vercel inspector but capture app-level errors in-DB so they're searchable per
  account.)*
- **Audit log:** every admin action (§8), filterable.
- **Data export (to send to a user):**
  - **Per-account CSV bundle:** clients + invoices + quotations + dashboard summary
    (reuse `export-csv.ts` builders, served via an admin route handler).
  - **Per-client CSV:** one customer's record + their invoices/quotations/payments —
    the thing you asked for ("export one client's data and send it to him").
  - **(v1.1)** Zip of a client's invoice/quotation **PDFs** (reuse `document-pdf.ts`).

---

## 7. Safe action catalogue (the only mutations allowed in v1)

| Action | Target | Mechanism | Reversible? |
|---|---|---|---|
| Open billing portal | account | `createCreemBillingPortal` | n/a (read-ish) |
| Set subscription status / period end | `subscriptions` | curated admin update | yes (re-set) |
| Resend welcome email | account | `email.ts` | n/a |
| Resend invoice reminder | invoice | `email.ts` | n/a |
| Regenerate document share link | invoice/quotation | rotate `share_token` | yes |
| Export account CSV | account | `export-csv.ts` | read-only |
| Export client CSV | client | `export-csv.ts` | read-only |

Anything not on this list is **not** buildable from the admin UI in v1.

---

## 8. Audit log (new table)

```sql
create table public.admin_audit_log (
  id uuid primary key default gen_random_uuid(),
  admin_email text not null,
  action text not null,                 -- e.g. 'subscription.set_status'
  target_user_id uuid,                  -- account acted upon
  target_resource text,                 -- e.g. 'subscriptions:<id>' / 'invoice:<id>'
  metadata jsonb not null default '{}', -- before/after, params
  created_at timestamptz not null default now()
);
alter table public.admin_audit_log enable row level security;
-- No policies for anon/auth roles → only the service-role client can read/write.
```
Optional `error_events` table (for §6.4 error feed) with the same RLS posture.
`writeAuditLog()` is called inside every action in `src/actions/admin.ts`.

---

## 9. Delivery plan (waves)

| Wave | Goal | Key deliverables | Demo-able outcome |
|---|---|---|---|
| **0 — Foundation & security** | Lock the door before furnishing the room | `ADMIN_EMAILS` env + `isAdminEmail`; middleware gate; `requireAdmin()`; `(admin)` route group + shell; `admin_audit_log` migration; empty dashboards | Only you can open `/admin`; everyone else gets 404 |
| **1 — Accounts overview** | See & find any account | `admin-data.listAccounts()`; overview table + search/filter + health flags | Search any user, see their stats at a glance |
| **2 — Per-account deep view** | Investigate one account fully | `getAccountOverview/Clients/Documents/Financials`; tabbed `[userId]` page | Open a user, see all their clients/docs/money |
| **3 — Billing control** | Fix billing issues | `/admin/billing`; portal + set-status + audited writes | Reconcile a stuck subscription in 2 clicks |
| **4 — Errors & export** | Diagnose + hand data back | `error_events` capture; logs page; per-account & per-client CSV export | Export a client's data and email it to them |

Each wave: typecheck + lint + `next build` green, committed on its own branch → PR.

---

## 10. Risks & pitfalls

- **Service-role key leakage** → enforce: admin modules server-only; add an ESLint
  boundary/check that `lib/admin/*` and `supabase/admin` are never imported by a
  `"use client"` file. (Highest-severity risk.)
- **RLS confusion** → admin reads MUST use the service-role client *and* always pass
  an explicit `target user_id`; never trust ambient `auth.uid()` in admin paths.
- **PII / privacy / legal** → you'll be viewing customers' customer data. Confirm the
  Privacy Policy permits operator access for support; the audit log is your record.
- **Performance at scale** → cross-account aggregates are O(all rows). Start simple,
  add an `account_stats` view/materialized view if/when needed.
- **`auth.admin.listUsers()` pagination** → paginate; cache short-lived; join to
  `profiles` for searchable fields.
- **Accidental destructive feel** → distinct admin chrome (color/banner) so you never
  confuse admin with the normal app.

---

## 11. Validation & tests

- Unit: `isAdminEmail`, audit serializer, per-client CSV builder, stat aggregation.
- Integration: `requireAdmin()` returns 404 for non-admin; admin route handlers
  reject non-admin; safe actions write an audit row.
- Manual (`/verify`): allowlisted user sees `/admin`; a normal test account gets 404;
  set-status reflects in DB + audit log; export downloads correct CSV.

---

## 12. Env & config checklist

- [ ] `ADMIN_EMAILS` set in Vercel (Production + Preview) and locally.
- [ ] `SUPABASE_SERVICE_ROLE_KEY` present (already used by `admin.ts`) — confirm it's
      **not** prefixed `NEXT_PUBLIC_` (it isn't) and never imported client-side.
- [ ] Apply `admin_audit_log` (+ `error_events`) migration to Supabase.

---

## 13. Open questions for you (please confirm before I build)

1. **Admin email(s):** start with just `koussayzayani@proton.me`? Any others?
2. **Set-subscription-status action:** include it in v1 (manual billing
   reconciliation), or keep v1 strictly **portal-only** and add manual status in v1.1?
3. **Per-client export format:** CSV only for v1, or do you also want a **PDF bundle**
   (zip of that client's invoices/quotations) right away?
4. **Error feed:** add the in-app `error_events` table now (searchable per account),
   or v1 just links to the Vercel dashboard and we add in-DB capture in v1.1?
5. **"Everything the app can do":** you said *read + safe actions*. Confirm
   **impersonation ("log in as user")** stays **out** of v1 — it's the single biggest
   privacy/security item and I'd plan it separately with extra safeguards.
6. **Privacy Policy:** OK for me to add a short "operator/support access" clause so
   this is covered legally?

---

## 14. Suggested first step

On your go-ahead, I'll execute **Wave 0** (foundation & security) end-to-end on a
branch and open a draft PR: env allowlist, middleware gate, `requireAdmin()`, the
`(admin)` route group with a locked-down shell, and the audit-log migration — i.e.
the door is bolted and audited before any data is shown. Then Waves 1→4 each as
their own reviewable PR.
