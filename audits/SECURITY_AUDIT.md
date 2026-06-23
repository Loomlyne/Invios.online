# Security Audit — Invios

**Scope:** Application code (Next.js 15 / App Router), Supabase (Postgres + Auth + Storage), Vercel hosting, GitHub repo & delivery pipeline.
**Date:** 2026-06-22 · **Branch reviewed:** `main` @ `b1d6eaa` · **Reviewer:** automated deep audit
**Status:** Analysis only — **no code or infrastructure changes were made.**

Environment under review:
- **Supabase** project `Invios` (`kwprfrplurkjztedglaf`), region `eu-north-1`, Postgres `17.6`, `ACTIVE_HEALTHY`.
- **Vercel** project `invios.online` (`prj_AtdNaRrzRFUUMpd2gKfhunuYVKzi`), team `koussays`, framework `nextjs`, Node `24.x`.
- **GitHub** `Loomlyne/Invios.online` — **public repository**, 0 Actions workflows, `main` **not** branch-protected.
- Live data: 52 auth users (all "confirmed"), 86 clients, 46 invoices, 36 quotations, 17 payments, **0 subscriptions**, 1 private storage bucket (`branding-assets`, 16 objects).

---

## Executive summary

The core data-isolation model is **genuinely solid**: Row Level Security is enabled on **all 14 public tables** with owner-scoped policies, the storage bucket is private with per-user folder policies, share tokens use 144-bit entropy, webhook signatures are HMAC-verified with constant-time comparison, the service-role key never leaves the server, and the middleware strips spoofed auth headers. There is no critical data-exposure hole.

The weaknesses are **at the edges**: account-security policy is loose (no email verification, no leaked-password check, no MFA), there are **no HTTP security headers**, a couple of `SECURITY DEFINER` functions are needlessly callable by anonymous users, session cookies are readable by JavaScript, and there is no rate limiting on abuse-prone endpoints (auth, webhooks, Chromium-backed PDF generation).

| Severity | Count | Headline items |
|---|---|---|
| 🔴 High | 0 | — |
| 🟠 Medium | 6 | No email verification · Leaked-password protection off · No MFA · Public-executable `SECURITY DEFINER` RPCs · No security headers · No rate limiting |
| 🟡 Low | 6 | JS-readable session cookies · Stored CSS-injection via brand color · Dead Paddle webhook · Fail-open paywall check · Mutable function `search_path` · Public repo recon surface |
| 🟢 Strengths | 9 | RLS everywhere · Private storage w/ folder policies · Strong tokens · Verified webhooks · Server-only service role · Header-spoof defense · Anti-enumeration reset · Zod input validation · Secrets gitignored |

---

## Strengths (verified, keep these)

- **RLS on every table.** All 14 `public.*` tables have `relrowsecurity = true`. Policies are `auth.uid() = user_id` (or owner-equivalent). `subscriptions` is read-only to the owner and only written by the service role via webhook. Confirmed via `pg_policy` inspection.
- **Storage is locked down.** `branding-assets` bucket is **private**; policies require `(auth.uid())::text = (storage.foldername(name))[1]` for read/insert/update/delete — users can only touch files under their own `{userId}/…` prefix. Public document pages fetch logos through **short-lived (10-min) signed URLs** (`src/lib/public-documents.ts:14`), not public objects.
- **Unguessable share/portal tokens.** `share_token` and `portal_token` default to `encode(extensions.gen_random_bytes(18),'hex')` — 144 bits of entropy (`supabase/migrations/202604060130_phase2_documents.sql`). Public document access is a capability URL with strong tokens.
- **Webhook signatures verified.** Creem: HMAC-SHA256 over the raw body with `crypto.timingSafeEqual` and length check (`src/lib/creem.ts:87`). Paddle: `ts:body` HMAC-SHA256 (`src/app/api/paddle/webhook/route.ts:12`). Missing/invalid signature ⇒ 400; missing secret ⇒ 500.
- **Header-spoofing defense.** Middleware **deletes** any client-supplied `x-middleware-user-id` / `-email` before stamping the verified values from `supabase.auth.getUser()` (`src/lib/supabase/middleware.ts:88-90`). Server components read the trusted headers (`src/lib/data.ts:124`).
- **Service role is server-only.** `SUPABASE_SERVICE_ROLE_KEY` is read in `src/lib/env.ts` and only used in server modules / route handlers / server actions (23 files, all server-side). It is never shipped to the client bundle.
- **Anti-enumeration password reset.** `forgotPasswordAction` always returns a generic success message regardless of whether the account exists (`src/actions/auth.ts:152,179`).
- **Input validation.** Auth flows validate with Zod schemas (`src/lib/auth-schemas.ts`); avatar upload checks size (≤5 MB) and MIME allow-list (`src/actions/auth.ts:328`).
- **Secrets hygiene.** `.gitignore` excludes `.env*` and `.vercel`; no env files are committed.

---

## Findings

### 🟠 M1 — Email verification is disabled (anyone can register any address)
`MEMORY.md:118` records: *"Hosted auth config now uses immediate email sign-up with no confirmation gate."* This matches the DB (52/52 users `confirmed_at` set). `signUpAction` immediately issues a session if Supabase returns one (`src/actions/auth.ts:115`).
**Impact:** Accounts can be created with email addresses the user does not own (impersonation, spam signups, junk data, deliverability risk for reminder emails sent "from" those tenants). No proof-of-control.
**Recommendation:** Require email confirmation in Supabase Auth (or a verification step before document-sending features unlock). Keep onboarding smooth with a "verify to send/share" gate rather than a hard wall.

### 🟠 M2 — Leaked-password protection disabled
Supabase advisor `auth_leaked_password_protection` (WARN). HaveIBeenPwned check is off, so users can set known-breached passwords.
**Recommendation:** Enable in Supabase → Auth → Password security. Remediation: https://supabase.com/docs/guides/auth/password-security

### 🟠 M3 — No MFA options enabled
Supabase advisor `auth_insufficient_mfa_options` (WARN). For a product holding clients' financial data, accounts are single-factor only.
**Recommendation:** Enable TOTP MFA at minimum. Remediation: https://supabase.com/docs/guides/auth/auth-mfa

### 🟠 M4 — `SECURITY DEFINER` functions executable by `anon`/`authenticated` over the REST API
Advisors `0028`/`0029`. Two functions are reachable as RPC:
- `public.handle_new_user()` — a **trigger** function (runs on `auth.users` insert). It has **no business being callable** by `anon`/`authenticated` via `/rest/v1/rpc/handle_new_user`.
- `public.next_document_number(p_kind, p_prefix)` — increments per-user document counters; exposed to authenticated callers.

Both run with definer privileges. (Good news: both now pin `search_path=public`, confirmed via `pg_proc.proconfig`.)
**Impact:** `handle_new_user` being publicly invokable is an unnecessary, potentially state-mutating surface. `next_document_number` lets an authenticated user bump counters arbitrarily (low impact, but unintended).
**Recommendation:** `REVOKE EXECUTE ... FROM anon, authenticated` on `handle_new_user`; restrict `next_document_number` to the contexts that need it (it's already called server-side via the service role in the recurring cron). Remediation: https://supabase.com/docs/guides/database/database-linter?lint=0028_anon_security_definer_function_executable

### 🟠 M5 — No HTTP security headers
`next.config.ts` defines **no** `headers()` and `vercel.json` adds none. Missing: `Content-Security-Policy`, `Strict-Transport-Security`, `X-Frame-Options`/`frame-ancestors`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`.
**Impact:** No clickjacking protection (app can be framed), no MIME-sniffing protection, no CSP to blunt XSS, no HSTS preload.
**Recommendation:** Add a `headers()` block (or `vercel.json` `headers`). Start with `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`, then iterate to a real CSP (note: the per-tenant inline `<style>` and Recharts `dangerouslySetInnerHTML` need `style-src` accommodation).

### 🟠 M6 — No rate limiting anywhere
There is no app-level throttling on: sign-in / sign-up / password-reset server actions, the public document pages, the webhook endpoints, or the **Chromium-backed PDF/PNG routes** (`/api/invoices/[id]/pdf`, `/png`, `/api/quotations/[id]/pdf`).
**Impact:** Credential brute-force (Supabase has some built-ins, but the server actions wrap it), email-bomb via reset/reminder paths, and especially **cost/DoS abuse** — each PDF request boots a headless browser (`maxDuration = 60`). A handful of concurrent requests can exhaust function minutes and money.
**Recommendation:** Add Vercel Firewall / rate-limit rules or an Upstash-style limiter on auth + webhook + PDF routes; cache generated PDFs (see Speed audit S7).

### 🟡 L1 — Session cookies are readable by JavaScript (`httpOnly: false`)
`SESSION_COOKIE_OPTIONS` sets `httpOnly: false` in both `src/lib/supabase/server.ts:24` and `src/lib/supabase/middleware.ts:33`. The Supabase auth (access + refresh) tokens therefore live in JS-readable cookies.
**Impact:** Any XSS becomes full session theft / refresh-token exfiltration. This is the common `@supabase/ssr` trade-off (the browser client reads cookies), but it raises the stakes of M5 and L2.
**Recommendation:** If feasible, move to httpOnly cookies with the browser client reading session via the server, or at minimum compensate with a strict CSP (M5) and brand-color sanitisation (L2). Document the decision explicitly.

### 🟡 L2 — Stored CSS injection via unvalidated brand color
`saveBrandingAction` / branding save persist `primary_color` as the **raw form value with no validation** (`src/actions/app.ts:221,544` — `primary_color: primaryColor || null`). The authenticated app layout interpolates that value into a server-rendered `<style>` block (`src/app/(app)/app/layout.tsx:112-126`), and `hexToTokens`'s invalid-input branch returns the **raw string** as `accent` (`layout.tsx:13`). A value containing `</style>…` is injected verbatim into the document.
**Impact:** Stored CSS/markup injection in the tenant's **own** authenticated shell (self-scoped ⇒ low severity; not a cross-tenant XSS). The **public** invoice/quotation header is safe — it uses a React inline `style={{ backgroundColor }}` object (`src/components/public/public-page-shell.tsx:23`), which cannot break out into new declarations or script.
**Recommendation:** Validate `primary_color`/`secondary_color` server-side against `^#[0-9a-fA-F]{6}$` before persisting; have `hexToTokens` never echo an unvalidated string.

### 🟡 L3 — Dead Paddle webhook still live; multi-processor schema cruft
`src/app/api/paddle/webhook/route.ts` is still deployed and reachable, and the `subscriptions` table carries columns from **three** billing integrations (Paddle, Polar, Creem) accreted across migrations `20260617000001_paddle_billing.sql`, `20260617000000_polar_subscriptions.sql`, `20260620000000_creem_billing.sql`. Only Creem is current.
**Impact:** Extra unauthenticated-reachable endpoint (signature-gated, but still attack surface) and ambiguous source of truth for subscription state.
**Recommendation:** Remove the Paddle route and prune unused columns once Creem is confirmed as the sole processor (see Functionality F3).

### 🟡 L4 — Paywall check fails open
`checkPaidSubscription` returns `true` when the admin client is unavailable (`src/lib/supabase/middleware.ts:57`, "fail open").
**Impact:** A misconfiguration (missing service-role key) silently grants premium access. Low security impact, but inconsistent with intent.
**Recommendation:** Decide intentionally; if exports are truly paid, fail closed with a clear error.

### 🟡 L5 — Mutable `search_path` on `update_updated_at_column`
Advisor `0011`. The trigger function has no pinned `search_path` (`proconfig = null`), unlike the other two functions.
**Recommendation:** `ALTER FUNCTION public.update_updated_at_column() SET search_path = ''` (or `public`). Remediation: https://supabase.com/docs/guides/database/database-linter?lint=0011_function_search_path_mutable

### 🟡 L6 — Public repository increases recon surface
`githubRepoVisibility: public`. Schema, endpoint names, RPC names, and the billing flow are fully visible.
**Impact:** Legitimate for MIT-licensed source, but lowers the cost of targeted abuse (e.g. knowing `next_document_number` exists, or the exact webhook event names). Pair with M4/M6.

---

## What's missing / what to add

- **Auth hardening package:** email verification (M1), leaked-password check (M2), TOTP MFA (M3), and a documented session-timeout / refresh-rotation policy.
- **Security headers + CSP** (M5) and **rate limiting** (M6) — the two biggest "absent control" gaps.
- **Secret rotation runbook.** The repo's commit history references multiple processors and env churn; confirm `SUPABASE_SERVICE_ROLE_KEY`, `CRON_SECRET`, and `CREEM_WEBHOOK_SECRET` are current, scoped, and rotated. Verify `CRON_SECRET` is set so `/api/cron/*` (currently `isCronAuthenticated`-gated) is actually protected in production.
- **Dependency / secret scanning.** No Dependabot, no `npm audit` gate, no secret scanning in CI (there is no CI at all). Enable GitHub secret scanning + Dependabot on the public repo.
- **Branch protection** on `main` (require review + status checks) — currently `protected: false`.
- **Error monitoring** (e.g. Sentry) so security-relevant failures (webhook signature failures, RLS denials) are observable rather than `console.error` into Vercel logs.
- **A documented data-retention / deletion path.** `deleteAccountAction` deletes the auth user (`src/actions/auth.ts:310`) but verify cascading deletion of `public.*` rows and `storage` objects (GDPR/again UAE PDPL considerations for stored client PII).

## Suggested remediation order
1. **M5 headers + M6 rate limiting** (broad, cheap, protects everything incl. PDF cost abuse).
2. **M1–M3 auth hardening** (toggles in Supabase + small signup change).
3. **M4 revoke RPC execute** + **L5 search_path** (one migration).
4. **L2 brand-color validation**, **L3 remove Paddle**, **L4 fail-closed decision**.
5. Repo governance: branch protection, Dependabot, secret scanning, monitoring.
