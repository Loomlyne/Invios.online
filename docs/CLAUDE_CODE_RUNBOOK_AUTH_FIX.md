# Claude Code Runbook — Ship the Auth Email Fix

**Context:** The signup confirmation email flow was broken (full analysis: `audits/2026-07-12_INVESTIGATION_AND_AUTH_EMAIL_FIX.md`). The fix is **already committed locally** as `ce973a1` on `main` (1 commit ahead of `origin/main`). The DB hardening migration is **already applied live** to Supabase. What remains: push to GitHub (triggers Vercel), sync Supabase Auth config/templates, configure Resend SMTP, and verify end-to-end.

**How to use:** open a terminal in the repo root and run `claude`, then paste the prompt below.

---

## The prompt

```text
Ship the auth email confirmation fix for this repo. The code is already
committed locally on main (commit ce973a1, "fix(auth): repair email
confirmation flow end-to-end + DB hardening"). Full context is in
audits/2026-07-12_INVESTIGATION_AND_AUTH_EMAIL_FIX.md — read it first.

Do the following, in order, verifying each step before moving on:

1. PRE-FLIGHT
   - Confirm `git status` is clean and main is exactly 1 commit ahead of
     origin/main with ce973a1 at HEAD. If the tree is dirty or diverged, stop
     and show me what's different.
   - Run `pnpm install`, then `pnpm lint`, `pnpm typecheck`, `pnpm test`.
     All must pass (expect 188 tests passing).

2. PUSH & DEPLOY
   - `git push origin main`.
   - Watch the Vercel deployment for invios.online until it is READY
     (use `npx vercel ls invios.online` or the Vercel dashboard; the project
     auto-deploys from GitHub main, team "koussays").
   - If the build fails, read the build logs, fix forward, and redeploy.

3. SUPABASE AUTH CONFIG (project ref: kwprfrplurkjztedglaf)
   - The repo's supabase/config.toml already contains the correct auth config:
     site_url https://invios.online, redirect allowlist including
     /auth/confirm, enable_confirmations = true, and the three email templates
     wired via content_path.
   - Log in if needed (`supabase login`), then:
       supabase link --project-ref kwprfrplurkjztedglaf
       supabase config push
     Review the diff it shows before confirming — it must update Site URL,
     redirect URLs, confirmations, and the three templates.
   - If `supabase config push` is unavailable or fails, tell me and print the
     exact manual dashboard steps from supabase/templates/README.md instead.

4. CUSTOM SMTP VIA RESEND (fixes the ~2 emails/hour limit + spam placement)
   - Add the [auth.email.smtp] block to supabase/config.toml:
       enable = true, host = "smtp.resend.com", port = 465,
       user = "resend", pass = "env(SUPABASE_AUTH_SMTP_PASS)",
       admin_email = "noreply@invios.online", sender_name = "Invios"
   - Export SUPABASE_AUTH_SMTP_PASS from the Resend API key (same key as
     RESEND_API_KEY in Vercel env; ask me for it if you can't find it locally)
     and run `supabase config push` again.
   - Note: the sending domain invios.online must be verified in Resend —
     check https://resend.com/domains and tell me if it isn't.
   - Commit the config.toml change (never commit the key itself).

5. VERIFY END-TO-END
   - Hit https://invios.online/auth/confirm with no params — it must redirect
     to /sign-in?error=confirmation_failed (proves the route is live).
   - Sign up a fresh test account via https://invios.online/sign-up using a
     +tag email I can check. Confirm the email arrives (from invios.online if
     SMTP was configured), the link points at
     invios.online/auth/confirm?token_hash=...&type=signup&next=/app,
     and clicking it lands signed-in on /app.
   - Test password recovery: /forgot-password → email → link must land on
     /update-password with a working session (middleware no longer bounces it).
   - Check Supabase auth logs for the verification events and confirm no
     errors.

6. WRAP UP
   - Run the Supabase security advisors and confirm the two function warnings
     (search_path / anon EXECUTE on handle_new_user_subscription) are gone.
   - Summarize: deployment URL/state, config push result, SMTP status, and
     the end-to-end test outcome. List anything still requiring me
     (e.g. leaked-password protection toggle, MFA options — dashboard-only).

Constraints:
- Do not force-push, rebase, or amend ce973a1.
- Do not modify auth flow code unless a build/test failure forces it; if you
  must, explain why first.
- Do not print or commit any API keys.
```

---

## Reference

| Item | Value |
|---|---|
| Local commit to ship | `ce973a1` on `main` |
| Supabase project | `kwprfrplurkjztedglaf` (eu-north-1) |
| Vercel project | `invios.online`, team `koussays` (`prj_AtdNaRrzRFUUMpd2gKfhunuYVKzi`) |
| Canonical domain | `https://invios.online` |
| New route | `src/app/auth/confirm/route.ts` |
| Templates + manual dashboard steps | `supabase/templates/README.md` |
| Full root-cause analysis | `audits/2026-07-12_INVESTIGATION_AND_AUTH_EMAIL_FIX.md` |

## Already done (do NOT redo)

- Code fix committed locally (`ce973a1`) — typecheck clean, 188 tests pass
- DB migration `20260712160000_harden_subscription_functions.sql` **applied live** to production Supabase on 2026-07-12

## Manual-only items (Supabase Dashboard, if config push can't set them)

1. Authentication → Email Templates — paste the 3 files from `supabase/templates/`
2. Authentication → URL Configuration — Site URL `https://invios.online`; add `https://invios.online/auth/confirm` to Redirect URLs
3. Project Settings → Auth → SMTP — Resend (`smtp.resend.com:465`, user `resend`, pass = API key)
4. Optional: enable leaked-password protection + more MFA options (advisor WARNs)
