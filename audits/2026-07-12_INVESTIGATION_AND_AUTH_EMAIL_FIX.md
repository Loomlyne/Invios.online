# Investigation & Auth Email Fix — Invios

**Date:** 2026-07-12 · **Scope:** page-by-page structure, design/UX, Supabase + Vercel integrations, and a ground-up fix of the broken signup confirmation email flow.
**Status:** Code changes applied (see "Fix implemented"). Dashboard actions still required (see "Required manual steps").

---

## 1. Page inventory (route map)

### Public / marketing
| Route | Purpose | Notes |
|---|---|---|
| `/` | Landing page | Hero, features, CTA; detects signed-in state via middleware header |
| `/pricing` | Pricing (Free/Pro $15) | Creem checkout wired, `PRO_BILLING_ENABLED` gates purchase |
| `/privacy`, `/terms`, `/refund` | Legal | |
| `/invoices/public/[shareToken]` | Public invoice view | Tenant-branded shell |
| `/quotations/public/[shareToken]` | Public quotation view + accept/reject | |
| `/portal/[portalToken]` | Client portal (all docs for a client) | |

### Auth
| Route | Purpose | Notes |
|---|---|---|
| `/sign-in` | Password sign-in | **Now** surfaces `?error=` messages (added in this fix) |
| `/sign-up` | Signup | Was the broken flow — see §4 |
| `/forgot-password` | Recovery request (Resend-branded email via admin.generateLink) | |
| `/update-password` | Set new password after recovery | Middleware no longer bounces authenticated users off it (fixed) |
| `/auth/confirm` | **NEW** — verifies email-link tokens, sets session, redirects | The missing piece |

### App (authenticated, `/app/*`)
Dashboard (`/app`), Clients (`/app/clients`, `[slug]`, CSV import wizard), Invoices (list/new/detail/edit + PDF/PNG export, recurring, status), Quotations (list/new/detail/edit), Branding (`/app/branding`), Notes, Settings (`/app/settings` — profile, business info, branding, emails, integrations, billing, general panels). Loading skeletons exist for the main lists.

### Admin (`/admin/*`, allowlist via `ADMIN_EMAILS`)
Overview, Accounts (+ per-user deep view), Billing, Logs. Middleware returns bare 404 to non-admins.

### API
Creem (checkout/portal/webhook), crons (`/api/cron/recurring` 06:00, `/api/cron/reminders` 07:00 — verified in `vercel.json` and live project), exports (CSV), PDF/PNG renderers (`@sparticuz/chromium` + playwright-core).

---

## 2. Design / UI-UX

A full design audit already exists (`audits/DESIGN_AUDIT.md`, 2026-06-22) and remains accurate. Verified highlights:

- **Strengths:** cohesive "luxury stationery" system (cream `#f8f4ee`, gold `#ca8a04`, Cormorant Garamond + DM Sans), per-tenant theming engine deriving a full palette from one brand hex, fluid `clamp()` spacing tokens, loading/empty states, mobile bottom-nav shell + PWA.
- **Still open from that audit:** gold accent & muted text below WCAG AA contrast as text (D1); public document header hardcodes white on arbitrary brand color (D2); no dark mode while PWA `theme_color` is dark (D3); SVG-only PWA icons.
- **Auth UX gap fixed today:** confirmation/recovery link failures used to dead-end silently on `/sign-in`; errors are now shown as an alert banner.

## 3. Integrations

- **Supabase** (`kwprfrplurkjztedglaf`, eu-north-1, Postgres 17.6): `@supabase/ssr` clients (browser/server/middleware) correctly implemented with cookie rotation on every response path; admin (service-role) client for admin area, recovery links, account deletion. 30 migrations version-controlled.
  - **Advisors (live, today):** WARN — leaked-password protection disabled; too few MFA options; `handle_new_user_subscription` is SECURITY DEFINER executable by anon/authenticated with mutable search_path; `next_document_number` executable by authenticated (intentional per PR #20); INFO — `admin_audit_log` has RLS enabled but no policies (locked down; intentional if only service-role writes).
- **Vercel** (`invios.online`, team koussays): production READY, auto-deploy from GitHub `main`, crons registered, security headers + CSP in `next.config.ts`. Legacy alias `invios-phase1-koss.vercel.app` is 308-redirected to the canonical domain by middleware.
- **Creem billing:** checkout/portal/webhook routes present; `PRO_BILLING_ENABLED` active since June 28.
- **Resend:** used for app-sent mail (welcome, password reset/changed, reminders) via `src/lib/email.ts`. **Not** yet used for Supabase Auth's own emails (see below).

---

## 4. Confirmation email — root cause

Live auth logs (2026-07-12 15:23 UTC) show a real signup: `user_confirmation_requested` + `mail.send` … and **no verification ever completing**. Two independent failures:

1. **No route could consume the link.** `signUp()` used `emailRedirectTo: ${siteUrl}/app`. The Supabase link verified the token on *their* domain, then redirected to `/app?code=…`. The app has (had) **no `/auth/confirm` or `/auth/callback` handler**, so the code was never exchanged for a session; middleware saw an unauthenticated request to `/app` and bounced to `/sign-in`. Net effect: clicking the email appeared to do nothing, and the account stayed unconfirmed.
2. **Deliverability.** Auth mail is still sent from Supabase's shared SMTP (`noreply@mail.app.supabase.io`) — hard-limited (~2 emails/hour) and frequently spam-foldered. Many users never see the email at all.

Additional latent bugs found in the same flow:
- `supabase/config.toml` still pointed `site_url` + redirect allowlist at the **retired** `invios-phase1-koss.vercel.app` domain.
- Password-recovery links redirected to `/update-password` without any token exchange (same class of bug), and the middleware **redirected authenticated users away from `/update-password`**, which would have broken recovery even after a session was established.
- Email-change confirmations redirected to `/app` with the same dead-end.

## 5. Fix implemented (code — deploy to take effect)

| File | Change |
|---|---|
| `src/app/auth/confirm/route.ts` | **NEW.** Handles `?token_hash=&type=` (verifyOtp, preferred) and `?code=` (PKCE exchange, fallback). Sets session cookies, bootstraps the profile row, sends the Resend welcome email on signup, redirects to sanitized `next` (relative-only, blocks open redirects). Failures land on `/sign-in?error=confirmation_failed`. |
| `src/actions/auth.ts` | All email-link redirects now route through the handler: signup → `/auth/confirm?next=/app`; recovery → `/auth/confirm?next=/update-password`; email change → `/auth/confirm?next=/app/settings`. |
| `src/lib/supabase/middleware.ts` | `/update-password` removed from the "authenticated users get bounced to /app" list so recovery works. |
| `src/app/sign-in/page.tsx` | Shows a human-readable error banner for failed/expired links. |
| `supabase/templates/*.html` | All three templates now link to `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=…&next=…` — token-hash flow, works on any device/browser (no PKCE cookie dependency), immune to redirect-allowlist drift. |
| `supabase/config.toml` | `site_url` → `https://invios.online`; allowlist rebuilt (prod + localhost); `enable_confirmations = true`; templates + subjects wired for local dev / `config push`. |
| `supabase/templates/README.md` | Rewritten with the new flow, exact dashboard steps, and SMTP guidance. |

**Verified:** `tsc --noEmit` clean; all 188 unit tests pass.

## 6. Required manual steps (Supabase Dashboard — cannot be done via API)

1. **Authentication → URL Configuration:** Site URL = `https://invios.online`; Redirect URLs += `https://invios.online/auth/confirm`, `/app`, `/update-password`.
2. **Authentication → Email Templates:** paste the three updated files from `supabase/templates/` (subjects in the README table). This is the critical step — until done, emails still carry the old broken links.
3. **Project Settings → Authentication → SMTP (strongly recommended):** enable custom SMTP via Resend — host `smtp.resend.com`, port `465`, user `resend`, password = your Resend API key, sender from a verified `invios.online` domain. Fixes the 2-emails/hour cap and spam placement.
4. **Deploy** the code changes to Vercel (push to `main`).
5. Optional hardening while in the dashboard: enable leaked-password protection (advisor WARN).

## 7. End-to-end flow after fix

signup → Supabase sends branded email (Resend SMTP) → user clicks → `invios.online/auth/confirm?token_hash=…&type=signup&next=/app` → `verifyOtp` sets session + bootstraps profile + welcome email → redirect to `/app`, signed in. Recovery and email-change follow the same pattern via their own `type`/`next`.
