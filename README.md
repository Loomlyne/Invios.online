# Invios

Premium web invoicing for freelancers, solo operators, and small agencies. Create branded quotations and invoices, track payments and expenses, share polished public links, and see what is paid, outstanding, and profitable — in one operator-style console.

**Live product:** [https://invios.online](https://invios.online)

---

## What Invios is

Invios is an installable, mobile-friendly invoicing SaaS — not full accounting software. It is built for service businesses (especially UAE-based and internationally mobile operators) who today juggle chat, spreadsheets, PDFs, and design tools to get paid.

Core loop:

1. Sign up and complete onboarding (business profile, branding, defaults).
2. Add clients and create quotations or invoices.
3. Share a public link or export PDF/PNG.
4. Record payments and expenses; convert quotes to invoices.
5. Use reminders, recurring billing, and analytics to stay on top of cash flow.

UAE-aware features include AED currency, TRN on tax invoices, and bilingual English/Arabic document rendering with RTL-safe layouts.

---

## Accessing the live app

| Who | URL | Notes |
| --- | --- | --- |
| Anyone | [https://invios.online](https://invios.online) | Marketing landing page |
| New users | [https://invios.online/sign-up](https://invios.online/sign-up) | Create an account |
| Returning users | [https://invios.online/sign-in](https://invios.online/sign-in) | Sign in |
| Authenticated app | [https://invios.online/app](https://invios.online/app) | Dashboard (requires login) |
| Public invoice | `https://invios.online/invoices/public/{shareToken}` | No login; token from share link |
| Public quotation | `https://invios.online/quotations/public/{shareToken}` | No login; token from share link |
| Client portal | `https://invios.online/portal/{portalToken}` | Client-facing portal link |

After sign-in, the main app lives under `/app/*`. Install the app from the browser (PWA) for a mobile-friendly shell.

---

## Features (shipped)

### Documents & clients

- Branded **quotations** and **invoices** with live preview, PDF/PNG export, and version history
- **Client** management with status, notes, and CSV import
- **Quote → invoice** conversion with history preserved
- **Public share links** for documents (revocable from settings)
- Custom **document templates**, numbering, payment terms, and default notes

### Cash flow & profitability

- **Payment** recording (including partial and overpaid states)
- **Expense** tracking per invoice
- Outstanding balance and **profit per invoice**
- **Analytics dashboard**: revenue trend, aging, month-over-month deltas

### Automation

- **Recurring invoices** (daily cron on production)
- **Payment reminders** via email (daily cron on production)
- Email notifications for key events (configurable in Settings → Emails)

### Branding & locale

- Logo, colors, layouts, custom fonts, header cover
- Language, currency, tax, date format, document numbering
- Bilingual **English/Arabic** document support

### Settings (v1.2)

Settings use a sidebar with sections: Profile, Branding, Business Info, General, Emails, Integrations, and Billing (display-only plan info; no Stripe checkout in-app).

---

## Tech stack

| Layer | Technology |
| --- | --- |
| Framework | [Next.js 15](https://nextjs.org) (App Router), React 19, TypeScript |
| Styling | Tailwind CSS 4, Radix UI |
| Database & auth | [Supabase](https://supabase.com) (Postgres + Auth) |
| Email | [Resend](https://resend.com) |
| PDF | Playwright + `@sparticuz/chromium` (serverless) |
| Charts | Recharts |
| Forms / validation | react-hook-form, Zod |
| Testing | Vitest (unit), Playwright (e2e) |
| Hosting | [Vercel](https://vercel.com) |

---

## Prerequisites

- **Node.js** 20+ (LTS recommended)
- **pnpm** or **npm** (repo includes both lockfiles; pnpm is preferred if you use it locally)
- A **Supabase** project (URL, anon key, service role key)
- A **Resend** API key (for transactional email)
- For production-style cron jobs: **Vercel** with cron enabled and a shared `CRON_SECRET`

---

## Local development

### 1. Clone and install

```bash
git clone https://github.com/Loomlyne/INV.git
cd INV
pnpm install   # or: npm install
```

### 2. Environment variables

Copy the example file and fill in your values:

```bash
cp .env.example .env.local
```

| Variable | Required | Description |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Yes | Supabase anon / publishable key |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Service role key (server-only; PDF/public routes) |
| `NEXT_PUBLIC_SITE_URL` | Yes | Canonical site URL. Local: `http://localhost:3000`. Prod: `https://invios.online` |
| `RESEND_API_KEY` | Yes | Resend API key for outbound email |
| `EMAIL_FROM` | No | Sender address (default: `Invios <onboarding@resend.dev>`) |
| `CRON_SECRET` | Prod / cron testing | Bearer token for `/api/cron/*` routes |

The app shows a configuration warning when Supabase variables are missing.

### 3. Database migrations

SQL migrations live in `supabase/migrations/`. Apply them to your Supabase project in filename order, for example via the Supabase CLI:

```bash
# If using Supabase CLI linked to your project:
supabase db push
```

Or run each migration manually in the Supabase SQL editor (oldest timestamp first):

- `202604051800_phase1_foundation.sql`
- `202604060130_phase2_documents.sql`
- … through latest files in that folder

Ensure Supabase Auth is enabled and redirect URLs include your local and production domains (e.g. `http://localhost:3000/**`, `https://invios.online/**`).

### 4. Run the dev server

```bash
pnpm dev   # or: npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Scripts

| Command | Description |
| --- | --- |
| `pnpm dev` | Start Next.js dev server |
| `pnpm build` | Production build |
| `pnpm start` | Run production server locally |
| `pnpm lint` | ESLint |
| `pnpm typecheck` | TypeScript check |
| `pnpm test` | Vitest unit tests |
| `pnpm test:e2e` | Playwright end-to-end tests |

---

## App routes (reference)

### Marketing & auth

- `/` — landing
- `/sign-in`, `/sign-up`, `/forgot-password`, `/update-password`

### Authenticated app (`/app`)

- `/app` — dashboard & analytics
- `/app/clients`, `/app/clients/[slug]`
- `/app/invoices`, `/app/invoices/new`, `/app/invoices/[slug]`, `/app/invoices/[slug]/edit`
- `/app/quotations`, `/app/quotations/new`, `/app/quotations/[slug]`, `/app/quotations/[slug]/edit`
- `/app/settings?section=profile|branding|business|general|emails|integrations|billing`
- `/app/branding`, `/app/notes`, `/app/get-started/create-invoice`

### Public (no auth)

- `/invoices/public/[shareToken]`
- `/quotations/public/[shareToken]`
- `/portal/[portalToken]`

### API (selected)

- Document export: PDF/PNG, CSV/XLS exports
- Cron (Vercel): `/api/cron/recurring`, `/api/cron/reminders` — require `Authorization: Bearer $CRON_SECRET`

---

## Deployment (Vercel)

Production runs on **Vercel** at **https://invios.online**.

1. Import the GitHub repository into Vercel.
2. Set all environment variables from the table above for **Production** (and Preview if needed).
3. Set `NEXT_PUBLIC_SITE_URL=https://invios.online` in production.
4. Set `CRON_SECRET` to a long random string; Vercel cron jobs must send it as a Bearer token.

Scheduled jobs are defined in `vercel.json`:

| Path | Schedule (UTC) | Purpose |
| --- | --- | --- |
| `/api/cron/recurring` | Daily 06:00 | Generate/send recurring invoices |
| `/api/cron/reminders` | Daily 07:00 | Payment reminder emails |

After deploy, confirm auth redirect URLs and email domain (Resend) are configured for `invios.online`.

---

## Project structure

```
src/
  app/              # Next.js App Router (marketing, auth, /app, public pages, API)
  components/       # UI and feature components
  lib/              # Supabase clients, env, types, utilities
supabase/
  migrations/       # Postgres schema migrations
tests/              # Vitest and Playwright tests
.planning/          # Internal roadmap and specs (optional reading)
```

---

## Roadmap (high level)

- **v1.0 / v1.1** — Shipped: full billing lifecycle, public share, automation, CSV import, analytics.
- **v1.2** — In progress: settings UX redesign (sidebar sections).
- **v2.0** — Planned: named client portals, CRM, time tracking, automation rules, integrations hub, AI co-pilot (no Stripe payment collection in-app).

See `.planning/PROJECT.md` and `.planning/MILESTONES.md` for internal planning detail.

---

## Contributing & support

This repository is the source for the live product at [invios.online](https://invios.online). For bugs or feature work, use your team’s usual GitHub issue or PR workflow.

When opening issues, include whether the problem is on **production**, **preview**, or **local**, and attach steps to reproduce (route, user state, browser).

---

## License

Private / all rights reserved unless a `LICENSE` file is added to this repository.
