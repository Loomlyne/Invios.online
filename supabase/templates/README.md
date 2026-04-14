# Invios Email Templates

Branded HTML email templates for Supabase Auth. These files are version-controlled copies of what must be set in the Supabase Dashboard.

## How to apply

1. Go to [Supabase Dashboard](https://supabase.com/dashboard) > your project > **Authentication** > **Email Templates**
2. For each template below, paste the HTML content into the corresponding template slot:

| File | Dashboard location | Subject line |
|------|-------------------|-------------|
| `recovery.html` | Reset Password | `Reset your Invios password` |
| `confirmation.html` | Confirm signup | `Confirm your Invios email` |
| `email-change.html` | Change Email Address | `Confirm your new Invios email` |

3. Click **Save** for each template

## Template variables

Supabase automatically injects these variables at send time:

- `{{ .ConfirmationURL }}` — the action link (reset password, confirm email, etc.)
- `{{ .Email }}` — the user's email address
- `{{ .SiteURL }}` — configured site URL
- `{{ .Token }}` — OTP token (if using token-based flow)

## Design

All templates use the Invios design system:
- Background: `#f8f4ee`
- Card: `#fffdf9` with subtle border
- Accent/CTA: `#ca8a04` (gold)
- Text: `#17120f` (headings), `#6b6359` (body)
- Logo: Inline SVG data URI (no hosted image needed)
- Layout: Table-based for maximum email client compatibility
