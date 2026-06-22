# Functionality Audit — Invios

**Scope:** End-to-end product behavior across code, Supabase, Vercel, and GitHub delivery.
**Date:** 2026-06-22 · **Branch reviewed:** `main` @ `b1d6eaa` · **Reviewer:** automated deep audit
**Status:** Analysis only — **no code or infrastructure changes were made.**

What the product does (from `README.md` / `MEMORY.md`): branded quotations & invoices with live preview, PDF/PNG export, public share links, client management + CSV import, payments & expenses, profit/aging analytics, recurring invoices and reminder emails (Vercel cron), bilingual EN/AR documents, and a Creem-billed Free/Pro plan.

---

## Executive summary

The feature surface is broad and largely well-built: the data layer is cleanly separated (`src/lib/billing-data.ts`), server actions are validated, RLS keeps tenants isolated, and the document → share → PDF loop is verified working in `MEMORY.md`. But there is **one high-impact regression live on `main`** and several reliability gaps clustered around **billing** and **delivery process**.

| Severity | Count | Headline |
|---|---|---|
| 🔴 High | 1 | Pro paywall 402s PDF/PNG/CSV export for **all** users (0 subscriptions exist) |
| 🟠 Medium | 5 | Webhook email-resolution breaks past 50 users · 3 competing billing integrations · No CI/quality gate · `live:false` + prod-alias verification · Pricing copy inconsistency |
| 🟡 Low | 6 | Recurring-cron idempotency · Unbounded cron scans · Open crash-fix PR #15 · `next/image` remote-pattern risk · No error monitoring · Stale branches |

---

## 🔴 H1 — Export is paywalled to a plan nobody has → PDF/PNG/CSV broken for every user

**Evidence chain:**
- Middleware gates three prefixes behind an active subscription:
  ```
  PAID_ONLY_PREFIXES = ["/api/invoices", "/api/quotations", "/api/export"]   // middleware.ts:7
  ```
  and returns **HTTP 402** when `checkPaidSubscription(user.id)` is false (`src/lib/supabase/middleware.ts:148-161`).
- `checkPaidSubscription` returns **false when there is no subscription row** (`middleware.ts:66`).
- The database has **0 rows in `public.subscriptions`** (confirmed by query).
- Therefore every authenticated request to:
  - `/api/invoices/[id]/pdf` and `/png` (invoice PDF/PNG export),
  - `/api/quotations/[id]/pdf` (quotation PDF),
  - `/api/export/{invoices,quotations,clients,dashboard}` (CSV/XLS export)

  currently returns **402 Pro subscription required** — for all 52 users.
- Meanwhile the UI still presents these actions to everyone: the `ExportButton` links straight to `/api/export/*` (`src/components/app/export-button.tsx`), and document pages expose PDF/PNG buttons. There is **no "Pro" affordance or upgrade prompt in front of the button** — the user clicks and gets a broken download / raw 402 JSON.

**Why it matters:** PDF/PNG export is described as a **core, shipped** feature in the README, not a Pro upsell. The subscription gate (introduced with the Polar work, PR #11, later softened to API-only) now silently disables the product's headline output for the entire user base because billing has never produced a single active subscription.

**Caveat (verify against prod):** this is the behavior of the code on `main`. If production env disables billing some other way, confirm by hitting the live export endpoint as a logged-in user. Either way the UX is wrong: the button must reflect entitlement.

**Recommendation (pick one):**
- If export is **free**: remove `/api/invoices`, `/api/quotations`, `/api/export` from `PAID_ONLY_PREFIXES`.
- If export is **Pro**: gate it in the **UI** (disabled + "Upgrade" affordance), return a friendly redirect (not 402 JSON) on the server, and make sure a working Creem checkout actually grants the entitlement first.

---

## 🟠 Medium

### M1 — Webhook email-fallback resolves only the first 50 users
Both webhook handlers resolve the account by listing users and matching email:
```
const { data } = await admin.auth.admin.listUsers();   // creem webhook:81, paddle webhook:51
data.users.find(u => u.email === email)
```
`listUsers()` is **paginated (default 50/page)** and these calls request only page 1. With **52 users already**, anyone past the first page cannot be matched by email.
- **Creem** mitigates this: the primary path is `metadata.userId` carried via checkout `request_id` (`src/lib/creem.ts:54`, webhook `src/app/api/creem/webhook/route.ts:128`); email is only a fallback. Risk is moderate.
- **Paddle** relies **solely** on email (`route.ts:93`) → effectively broken beyond 50 users (also dead code — see M2/F-Security L3).

**Recommendation:** Resolve via stored `*_customer_id`/`*_subscription_id` and checkout metadata; if email lookup is needed, page through `listUsers` or use an admin lookup by email. Remove the Paddle path.

### M2 — Three competing billing integrations; ambiguous source of truth
Paddle → Polar → Creem were layered over four migrations and multiple PRs (#11 Polar, #12–#14 Creem). The `subscriptions` table carries `paddle_*`, Polar, and `creem_*` columns simultaneously; the Paddle webhook route still exists; `MEMORY.md` and README still mention Paddle/AED while commits move to "Creem $15/mo USD."
**Impact:** Hard to reason about which processor is authoritative; dead endpoints; schema bloat; onboarding confusion.
**Recommendation:** Declare Creem the single processor, delete Paddle route + Polar/Paddle columns, and reconcile docs.

### M3 — No CI / automated quality gate; broken builds have reached `main`
GitHub Actions: **0 workflows** (`actions_list` → `total_count: 0`). The repo has real tests (`vitest` unit suites across `src/**/*.test.ts`, Playwright `e2e/app-flow.spec.ts`) and `lint`/`typecheck` scripts, but **nothing runs them on push/PR**. Consequences are visible in Vercel history:
- `dpl_FRoP…` / `dpl_DL28…` — **ERROR**: BillingPanel importing `next/headers` into a client component (fixed in PR #12).
- `dpl_2Bv1…` — **ERROR** on PR #14 branch.
- PR #13 — production install broken by a bad pnpm lockfile merge (`@floating-ui/react-dom`), worked around with `--no-frozen-lockfile`.
`MEMORY.md:147` also notes local `pnpm build` is unreliable, so **Vercel is currently the only build signal** — i.e. main is the CI.
**Recommendation:** Add a GitHub Actions workflow running `pnpm lint && pnpm typecheck && pnpm test` (and ideally `next build`) on PRs; protect `main` to require it. (A `session-start-hook` skill exists in this environment to scaffold exactly this.)

### M4 — Vercel project shows `live: false`; production aliasing needs confirmation
`get_project` returns `"live": false`. Domains attached: `invios.online`, `www.invios.online`, plus legacy `invios-phase1-koss.vercel.app` and others. `MEMORY.md` still references the old `invios-phase1-koss` production URL while README/commits use `invios.online`.
**Impact:** Possible ambiguity about which deployment/alias actually serves `invios.online`, and whether the production toggle is in the intended state.
**Recommendation:** Confirm `invios.online` points at the latest `target: production` deployment, retire legacy aliases, and verify `NEXT_PUBLIC_SITE_URL=https://invios.online` (the apex-cookie logic in `middleware.ts:16` and the `www → apex` 308 redirect depend on it).

### M5 — Pricing is inconsistent across the product
Commit/PR history shows pricing stated as **AED 50/mo** (public redesign), **$19 monthly / $15 annual** (Polar PR #11), and **$15/mo USD** (Creem commits). Different pages and the README describe the plan differently.
**Impact:** Trust/clarity problem at the exact moment of conversion; also a payout-verification risk.
**Recommendation:** Single source of truth for plan/price/currency, rendered everywhere from one constant; reconcile copy on landing, `/pricing`, billing panel, and legal pages.

---

## 🟡 Low

### L1 — Recurring-invoice cron has a duplicate-generation window
`/api/cron/recurring` inserts the new draft **then** advances `next_due_date` (`src/app/api/cron/recurring/route.ts:108-146`). If the insert succeeds but the schedule update fails, the next run regenerates. Unlike `/api/cron/reminders`, there is **no per-document dedupe log**.
**Recommendation:** Make generation idempotent (e.g. unique key on `(source_invoice_id, period)` or a generation log), or advance the schedule in the same transaction.

### L2 — Cron jobs scan all rows with no batching
Both crons load every eligible row for every user in one pass (`maxDuration = 60`). Fine at today's volume; will hit the 60s ceiling and memory pressure as data grows.
**Recommendation:** Page/batch and add a high-water mark; consider moving heavy work off the request path.

### L3 — Crash-fix PR #15 is still open (draft)
PR #15 fixes a real production crash: `/app` queried with an empty-string `userId` against a `uuid` column (`invalid input syntax for type uuid: ""`), surfaced as a white "Application error" with no error boundary. It is **not merged**.
**Recommendation:** Merge it (or fold the redirect-before-query fix + root `error.tsx` into the next change). Until then the dashboard can still crash for any request that reaches the page without a resolved session.

### L4 — `next/image` with Supabase signed URLs but no `images.remotePatterns`
The public document header renders the tenant logo via `next/image` with a Supabase **signed URL** on a different host (`src/components/public/public-page-shell.tsx:27`), but `next.config.ts` declares no `images.remotePatterns`/`domains`.
**Impact:** In Next 15 a remote host not allow-listed throws at render (or the image silently fails). `MEMORY.md` claims logos render in prod, so verify — it may be erroring intermittently or relying on an undocumented config.
**Recommendation:** Add `images.remotePatterns` for the Supabase project host, or set `unoptimized` for these signed URLs.

### L5 — No error monitoring / alerting
Failures are `console.error`'d into Vercel logs only (webhooks, crons, data layer). No Sentry/alerting; the uuid crash (L3) was found by reading runtime logs after a user reported a white screen.
**Recommendation:** Add error tracking + a root `error.tsx` (the latter ships in PR #15).

### L6 — Repository hygiene: stale branches
12 branches exist; most are merged `claude/*` feature branches plus `fix/lockfile-floating-ui`. PR #10 explicitly re-opened a 70-commits-ahead stale branch for triage.
**Recommendation:** Delete merged branches; keep `main` + active work only.

---

## Feature-by-feature status (observed)

| Area | State | Notes |
|---|---|---|
| Auth (sign up/in, reset, change pw, delete, change email, avatar) | ✅ Working, validated | Zod-guarded; anti-enumeration reset; **email not verified** (see Security M1) |
| Clients + CSV import | ✅ | RLS-scoped; `listClients` caps 200 + JS search |
| Quotations / Invoices / quote→invoice | ✅ Verified in MEMORY | Slugs + 144-bit share tokens; version history |
| Public share pages & client portal | ✅ | Admin-client reads by token; owner branding via signed URLs |
| **PDF / PNG / CSV export** | 🔴 **Blocked by paywall** | See H1 |
| Payments / expenses / profit | ✅ | Status recompute on payment change |
| Dashboard & analytics | ⚠️ | Works; crashes if `userId` missing until PR #15 lands (L3) |
| Recurring invoices (cron) | ⚠️ | Works; idempotency gap (L1) |
| Reminder emails (cron) | ✅ | Has 24h dedupe via `reminder_logs` |
| Billing / subscriptions (Creem) | ⚠️ | 0 active subs; email-resolution + multi-processor debt (M1–M2) |
| Transactional email (Resend) | ✅ | Welcome/reset/changed/activated/canceled/reminder |
| PWA install | ✅ | Manifest + install prompt (icon caveats in Design audit) |

## What's missing / what to add
- A **working, verified end-to-end billing path** (checkout → webhook → entitlement → export unlock) with at least one successful test subscription before relying on the paywall.
- **CI** (lint/typecheck/test/build) + **branch protection** — the single highest-leverage reliability fix.
- **Idempotency + monitoring** for the cron jobs and webhooks.
- **Entitlement-aware UI**: buttons that reflect plan state instead of failing at the API.
- Consolidation of billing processors and **consistent pricing** copy.
