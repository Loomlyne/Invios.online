# Invios Email Templates

Branded HTML email templates for Supabase Auth. These files are version-controlled copies of what must be set in the Supabase Dashboard (or pushed via `supabase config push`).

## How the links work (IMPORTANT)

All templates use the **token-hash flow**: links point to our own domain at
`{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=<type>&next=<path>`.

The `/auth/confirm` route handler (`src/app/auth/confirm/route.ts`) calls
`supabase.auth.verifyOtp()`, sets the session cookies, and redirects to `next`.
This works in any browser/device (no PKCE code-verifier cookie required) and is
the flow recommended by Supabase for server-side auth.

Do NOT revert to `{{ .ConfirmationURL }}` unless you also keep the Site URL and
redirect allowlist perfectly in sync — the token-hash flow is more robust.

## How to apply

1. Supabase Dashboard > project `kwprfrplurkjztedglaf` > **Authentication** > **Email Templates**
2. Paste each file's HTML into the corresponding slot:

| File | Dashboard slot | Subject line | Link type/next |
|------|----------------|--------------|----------------|
| `confirmation.html` | Confirm signup | `Confirm your Invios email` | `type=signup&next=/app` |
| `recovery.html` | Reset Password | `Reset your Invios password` | `type=recovery&next=/update-password` |
| `email-change.html` | Change Email Address | `Confirm your new Invios email` | `type=email_change&next=/app/settings` |

3. Click **Save** for each template.

## Required Auth settings (Dashboard > Authentication > URL Configuration)

- **Site URL:** `https://invios.online`
- **Redirect URLs:** `https://invios.online/auth/confirm`, `https://invios.online/app`, `https://invios.online/update-password` (+ localhost equivalents for dev)

## Custom SMTP (deliverability)

Default Supabase SMTP (`noreply@mail.app.supabase.io`) is rate-limited (~2 emails/hour) and often lands in spam. Configure custom SMTP under **Project Settings > Authentication > SMTP** using Resend (an API key already exists in env): host `smtp.resend.com`, port `465`, user `resend`, password = Resend API key, sender = a verified `invios.online` address.

## Template variables

- `{{ .TokenHash }}` — hashed OTP used by `/auth/confirm`
- `{{ .SiteURL }}` — configured Site URL
- `{{ .Email }}` — the user's email address

## Design

All templates use the Invios design system:
- Background: `#f8f4ee`
- Card: `#fffdf9` with subtle border
- Accent/CTA: `#ca8a04` (gold)
- Text: `#17120f` (headings), `#6b6359` (body)
- Logo: Inline SVG data URI (no hosted image needed)
- Layout: Table-based for maximum email client compatibility
