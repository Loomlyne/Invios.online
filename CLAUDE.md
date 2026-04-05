<!-- GSD:project-start source:PROJECT.md -->
## Project

**Invios**

Invios is a premium, installable web invoicing SaaS for freelancers, solo operators, and small agencies. It combines branded quotations and invoices, client management, payment tracking, expense tracking, reminders, recurring billing, public share experiences, and profitability visibility in one operator-style console. It is built for service businesses that currently run billing manually across chat, notes, spreadsheets, PDFs, and design tools.

**Core Value:** Make it dead simple for a service business to send a polished branded quote or invoice and reliably know what has been paid, what is still due, and what profit remains.

### Constraints

- **Tech stack**: Next.js App Router, TypeScript, Tailwind CSS, shadcn/ui, Supabase Auth, Supabase Postgres, Vercel, GitHub — mandated by project rules.
- **Product scope**: Web app only, installable from the browser — keeps delivery focused and matches the current product vision.
- **Market context**: UAE-aware from day 1 with AED, TRN, tax invoice support, and bilingual document rendering — avoids rewriting core document architecture later.
- **Build reality**: Side project, not immediate business validation — design can be ambitious, but implementation still needs ruthless phasing.
- **Quality bar**: Public-facing documents and links must feel polished enough to send to real clients — trust is part of the product.
<!-- GSD:project-end -->

<!-- GSD:stack-start source:research/STACK.md -->
## Technology Stack

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
<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->
## Conventions

Conventions not yet established. Will populate as patterns emerge during development.
<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->
## Architecture

Architecture not yet mapped. Follow existing patterns found in the codebase.
<!-- GSD:architecture-end -->

<!-- GSD:workflow-start source:GSD defaults -->
## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:
- `/gsd:quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd:debug` for investigation and bug fixing
- `/gsd:execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.

## Design Workflow Enforcement

For any frontend, UI, landing page, dashboard, public document, portal, or other visual design work in this repo:

1. Invoke [`aidesigner-frontend`](/Users/koss/Desktop/Develop/INV/.agents/skills/aidesigner-frontend/SKILL.md) first
2. Invoke [`ui-ux-pro-max`](/Users/koss/.agents/skills/ui-ux-pro-max/SKILL.md) immediately after
3. Only then move into implementation planning or code changes

This is mandatory for:
- onboarding screens
- dashboard work
- invoice / quotation builders
- public share pages
- client portal
- marketing / landing pages
- any redesign or visual polish task

Project-specific note: the user explicitly opted this project into the AIDesigner workflow for frontend design work, so using AIDesigner for design generation/refinement is approved when a design task starts.
<!-- GSD:workflow-end -->



<!-- GSD:profile-start -->
## Developer Profile

> Profile not yet configured. Run `/gsd:profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.
<!-- GSD:profile-end -->
