# STACK

## Recommended Stack

- **Framework**: Next.js 15, App Router, React 19
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4, shadcn/ui
- **Auth / DB / Storage**: Supabase Auth, Postgres, Storage
- **SSR integration**: `@supabase/ssr` with cookie-based server/browser clients
- **Validation / forms**: Zod + React Hook Form
- **Tables / stateful list UX**: TanStack Table where needed, otherwise keep it simple
- **Deployment**: Vercel
- **Email / jobs later**: add a provider later, but isolate behind app services from day 1

## Why This Stack

- The project rules already mandate Next.js + Supabase + Vercel, so the real stack decision is about using the correct modern integration shape, not re-debating the foundation.
- Supabase’s current Next.js SSR guidance is based on `@supabase/ssr`, not the old Next.js auth helper package.
- Next.js App Router plus Server Actions is a strong fit for dense internal CRUD flows like onboarding, document builders, settings, payments, and expense mutations.
- Tailwind 4 plus shadcn/ui is fast to iterate with, but the product still needs strict visual direction or it will look like cloned admin UI.

## Specific Recommendations

### Auth
- Use Supabase email/password first.
- Add onboarding guard on authenticated app routes.
- Keep auth flows simple before adding OAuth.

### Data Access
- Use Server Components for dashboard and detail-page reads.
- Use Server Actions or route handlers for create/update flows.
- Revalidate narrowly after mutations.

### Document Rendering
- Build a shared document engine used by:
  - invoice preview
  - quotation preview
  - public share pages
  - PDF generation
- This avoids drift between preview, public page, and exported PDF.

### PWA / Installability
- Add web manifest, install affordance, icons, and app metadata early.
- Mobile app-like feel matters more than true offline-first behavior in the first release.
- Do not overbuild service worker caching before the core product is stable.

## What Not To Use

- **Old Supabase Auth Helpers**: Supabase now points Next.js SSR users to `@supabase/ssr`.
- **Heavy client-state architecture by default**: most operator-console data is server-owned; don’t turn the app into a global client-state mess.
- **Full offline-first PWA complexity in v1**: installability is enough early. Offline sync adds real edge-case cost.
- **Premature background-job infra**: reminder and recurring billing can start with simple scheduled execution later.

## Confidence

- Next.js 15 / App Router / Server Actions: High
- Supabase SSR integration: High
- Tailwind 4 + shadcn/ui for speed: High
- PWA install-first, offline later: High

## Sources

- Supabase Next.js auth quickstart: https://supabase.com/docs/guides/auth/quickstarts/nextjs
- Supabase SSR migration guidance: https://supabase.com/docs/guides/auth/auth-helpers/auth-ui
- Supabase SSR client creation for Next.js: https://supabase.com/docs/guides/auth/server-side/nextjs
- Next.js 15 release notes: https://nextjs.org/blog/next-15
- Next.js forms and mutations docs: https://nextjs.org/docs/13/app/building-your-application/data-fetching/forms-and-mutations
- Next.js PWA guide: https://nextjs.org/docs/app/guides/progressive-web-apps
- Tailwind CSS v4: https://tailwindcss.com/blog/tailwindcss-v4
