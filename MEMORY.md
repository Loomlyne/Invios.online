# MEMORY

## Project
- Name: Invios
- Type: installable web invoicing SaaS / side project
- Stack mandate: Next.js App Router, TypeScript, Tailwind CSS, shadcn/ui, Supabase Auth + Postgres, Vercel, GitHub

## Current Product Thesis
- HoneyBook-style operator console for freelancers, solo operators, and small agencies
- Not just PDF generation
- Core loop: onboarding -> branded quotation/invoice -> public share -> payment tracking -> expense tracking -> profitability
- UAE-aware from day 1: AED, TRN, tax invoice support, bilingual English/Arabic documents

## Design Workflow
- For any frontend or visual design task, invoke `aidesigner-frontend` first
- Then invoke `ui-ux-pro-max`
- This is now a project-level rule and should be enforced automatically in UI-bearing phases

## Execution Workflow
- Backend is always assumed to be Supabase
- Hosting is always assumed to be Vercel
- Research, discussion, planning, and execution should check Supabase and Vercel in parallel whenever relevant
- A finished phase should bias toward deployed-and-verified, not just code completed locally

## User Direction
- User explicitly chose the ambitious direction: full HoneyBook-style clone
- Practical recommendation is still phased delivery, not giant-scope implementation in one pass
- Side-project mindset, not immediate business validation
- User requires web work to be pushed to Vercel by default after changes, not left as local-only fixes
- Default deployment behavior: every completed web change should end with a Vercel deploy and reported URL unless explicitly skipped

## Design Artifacts
- Primary design doc: `/Users/koss/.gstack/projects/INV/koss-unknown-design-20260405-144707.md`
- Related prior reference: `/Users/koss/.gstack/projects/Loomlyne-Brand-Invoice-Exporter/koss-main-design-20260328-151500.md`
- Design status: APPROVED

## Risks
- Scope explosion
- Generic SaaS look if design direction is not enforced
- Trying to build CRM/accounting breadth too early

## Immediate Next Step
- Stabilize and extend Phase 2 from the now-live clients and document engine foundation

## Current Status
- Phase 2 is implemented on the existing Next.js 15 App Router + Supabase stack
- Real clients, quotations, invoices, public share pages, and PDF routes now replace the prior placeholder collection shells
- Supabase service-role reads are wired for public documents and PDF export
- Hosted Supabase now has Phase 2 tables, RLS policies, indexes, and the `next_document_number` SQL function applied
- `@chenglou/pretext` now powers builder-side document fit diagnostics for recipient address, notes, and terms at the shared preview/PDF width
- Phase 2.1 is now layered on top: shared template registry, renderer parity, CTA/empty-state sweep, contrast fixes, and Playwright coverage
- Verified locally with `pnpm lint`, `pnpm test`, and `pnpm typecheck`
- Verified live on production: sign-up, client creation, quotation creation, quotation acceptance, quotation-to-invoice conversion, public quotation view, public invoice view, and invoice PDF rendering
- Verified live Playwright suite on production URL: sign-up, shell shortcuts/empty states, and the quotation-to-invoice public/PDF template loop all pass

## Latest Implementation
- Added Phase 2 migration for `clients`, `invoices`, `quotations`, and `document_counters`
- Added owner-only RLS policies and the atomic numbering function used for `INV-0001`, `QUO-0001`, etc.
- Added shared billing/domain schemas, totals math, slug generation, share-token generation, preview mappers, and PDF generation utilities
- Added a `pretext` integration in the document builder that measures long-form copy against the 480px shared document surface and flags dense/overflow-risk content before users publish or export
- Added full clients flow:
  - `/app/clients`
  - `/app/clients/[slug]`
  - create, edit, archive, and detail actions
- Added full invoice flow:
  - `/app/invoices`
  - `/app/invoices/new`
  - `/app/invoices/[id]`
  - `/app/invoices/[id]/edit`
- Added full quotation flow:
  - `/app/quotations`
  - `/app/quotations/new`
  - `/app/quotations/[id]`
  - `/app/quotations/[id]/edit`
- Added public document routes:
  - `/invoices/public/[shareToken]`
  - `/quotations/public/[shareToken]`
  - `/api/invoices/[id]/pdf`
  - `/api/quotations/[id]/pdf`
- Evolved the existing invoice preview into the shared renderer used by builder, detail, public, and PDF surfaces
- Fixed a production redirect bug in create/update server actions by rethrowing Next.js redirect control flow instead of surfacing `NEXT_REDIRECT` in the UI
- Added the Phase 2.1 global template system:
  - `classic`
  - `executive`
  - `minimal`
- Added `document_template` to `user_settings` and wired it through settings, preview payloads, public views, and PDF generation
- Switched PDF export to shared-renderer parity via the public print route instead of a separate freestyle document layout
- Added template selection UI in settings and onboarding
- Completed the shell/dashboard sweep so header shortcuts, workspace-map cards, and list empty states all route into real live surfaces
- Tightened dark-surface accessibility on shared buttons, badges, and key CTA surfaces
- Added Playwright E2E coverage for:
  - sign-up
  - shell shortcuts and empty states
  - client -> quotation -> invoice flow
  - public quotation/invoice rendering
  - PDF route response
  - template consistency checks across private/public/print outputs
- Fixed shared date picker overlay clipping by portaling the calendar panel to `document.body`, so expense/payment date inputs and builder date fields stay visible inside `overflow-hidden` cards
- Changed the expenses and payments table shells to `overflow-visible` so inline document entry controls can extend beyond the card boundary when open
- Matched the browser-preview polish for the expenses table by rounding the header top edge and the add-expense row bottom edge to preserve the card silhouette after enabling visible overflow
- Fixed the payment-method validation bug by replacing the free-text payment method field with an enum-backed select and normalizing stale free-text submissions server-side so old pages do not throw enum errors
- Updated the invoice detail metadata cards from a 2-column tablet layout to a 3-column by 2-row grid to match the browser-reviewed visual layout
- Moved the profitability summary into the top invoice detail card and expanded it into an explicit breakdown of income, expenses, net profit, and margin
- Updated the kanban status-dot color for completed/accepted states from green to the approved beige token `#d7c4a7` across invoices, quotations, and clients
- Added top-level invoice quick actions beside the back button: `Add income` and `Add expense`, each opening a modal form tied to the existing payment and expense flows
- Moved `Delete invoice` from the lower invoice status-actions block into the header action row beside `Edit` and `Export`, using the compact small-button sizing from the reviewed layout

## Live Deployment
- Production URL: `https://invios-phase1-koss.vercel.app`
- Latest preview URL: `https://invios-phase1-koss-e59wz2lyo-koussays.vercel.app`
- Latest production deployment URL: `https://invios-phase1-koss-kdfak2izf-koussays.vercel.app`
- Current runtime state on the live deployment: Phase 2 clients + document engine is live on hosted Supabase and Vercel

## Hosted Supabase
- Linked hosted Supabase project: `Invios` (`kwprfrplurkjztedglaf`)
- Applied Phase 1 migration to the hosted database via `supabase db query --linked -f ...`
- Verified hosted `public.profiles` and private `branding-assets` bucket now exist
- Hosted auth config now uses immediate email sign-up with no confirmation gate
- Applied Phase 2 migration via `supabase db push --linked --yes`
- Hosted database now includes `clients`, `invoices`, `quotations`, `document_counters`, and their RLS policies

## Production Environment
- Vercel production envs set:
  - `NEXT_PUBLIC_SUPABASE_URL=https://kwprfrplurkjztedglaf.supabase.co`
  - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` set from hosted project publishable key
  - `NEXT_PUBLIC_SITE_URL=https://invios-phase1-koss.vercel.app`
- Additional Vercel envs set:
  - `SUPABASE_SERVICE_ROLE_KEY` in Development and Production for public document/PDF reads
- Redeployed production after env + schema setup
- Verified live `/sign-up` no longer shows the missing Supabase env banner
- Verified live sign-up now creates a session and redirects directly into `/app`
- Verified live public invoice and quotation URLs render without auth
- Verified live invoice PDF route returns a browser-renderable PDF

## Local Supabase Validation
- Repo-local `.env.local` is configured against the provided local Supabase stack
- Phase 1 migration applied successfully to the running local Postgres container
- Verified persisted test account:
  - `profiles.onboarding_completed_at` set
  - `branding` row created
  - `user_settings` row created

## QA Notes
- Chrome DevTools automation did not reliably submit some server-action buttons via synthetic click on quotation detail pages
- Native `requestSubmit()` worked and confirmed the underlying status-change and conversion actions behave correctly in production
- No production code change was made for this QA-tool limitation after the redirect bug fix because the actual server actions and navigations completed successfully
- Local `pnpm build` is currently not authoritative because the workspace's installed `lucide-react@0.542.0` package is missing internal files under `dist/esm/shared/src/`
- Vercel production builds remain green with the same source tree, so deployment verification is currently the reliable build signal
- Local review tooling note: gstack's external review step was patched to use `codex exec` instead of `codex review` because the installed `codex-cli 0.46.0` does not expose a `review` subcommand
- Local review tooling note: ChatGPT-linked Codex login is healthy, but external review can still fail upstream with `insufficient funds`; when that happens, local/manual review is the fallback path

## Recent Invoice UI Updates
- Invoice detail header now includes top-level quick actions for `Add income` and `Add expense`, opening the existing overlay flows from the top of the page
- Invoice delete action moved out of the lower status-actions area into the header action row beside edit controls
- Profit summary moved into the top invoice detail card and expanded to show income, expenses, net profit, and margin
- Invoice metadata (`Issue date`, `Due date`, `Type`, `Currency`, `Client`, `Total`) was redesigned from boxed cards into a cleaner text-led three-column detail block
- Invoice detail now stacks the preview beneath the summary card, tightens the header into a title-plus-badges row, and rounds the payments table header/footer to match the reviewed browser polish
- Invoice detail browser-preview replay is now persisted exactly in source: stacked card/preview layout, 21px title-to-badge gap, nowrap badge row, 26px title height treatment, and full-width flex-wrapped metadata rows
- Follow-up browser-preview persistence is now deployed on Vercel preview: invoice quick-action/header rows use nowrap, invoice metadata stacks in a full-width vertical flex column, and quotation detail now mirrors the stacked card/preview layout
- Final invoice metadata follow-up is now live on production: the top invoice detail metadata container uses a row flex layout with zero gap, matching the latest browser preview
- Production deploy was briefly blocked by parser-sensitive additions in `src/lib/billing.ts`; this was resolved by simplifying the payment helper typing and moving payment-description trimming into `src/actions/payments.ts`
- Kanban status dots using the prior green accent were updated to the beige accent `#d7c4a7`
- Client kanban `Active` column now uses a green column marker again, while the in-card `Active` status badge uses the beige accent to avoid duplicating green treatments
- Payments now support an optional `description` / note field for bank names, references, and payment context in both the top `Add income` dialog and the inline payments form
- Linked Supabase migration history is currently drifted versus local, so the new `payments.description` column was applied safely via `supabase db query --linked` instead of `supabase db push`

## Next Step
- Expand Phase 2 depth:
  - invoice status transitions beyond draft/sent
  - stronger onboarding defaults/branding completion
  - broader browser QA around builder and detail actions on mobile widths

## Latest Dashboard Upgrade
- Dashboard upgraded into a query-driven operator cockpit:
  - `/app` now supports `metric` and `range` query state
  - top metric cards are clickable drilldown controls
  - inline invoice drilldown table renders billed, collected, outstanding, and profit per invoice
  - lower dashboard now includes follow-up queue, pending quotations, top clients, analytics strip, and recent activity
- Added pure dashboard selectors/loaders to derive metrics, drilldowns, and insights from existing invoices, quotations, payments, and expenses without a schema change
- Invoices list now supports a real status filter UI and a synthetic `open` filter for sent + partial-paid + overdue receivables, so dashboard deep-links can land on a meaningful filtered table

## Latest Verification Notes
- Local verification on 2026-04-08 for the dashboard cockpit pass was blocked by environment instability:
  - direct file reads on several repo paths intermittently returned macOS `dataless` / `ETIMEDOUT`
  - direct `tsc` and `eslint` invocations failed with filesystem read timeouts before type/lint evaluation
  - direct `vitest` startup failed with `Error: The service was stopped` from esbuild before reaching the new dashboard test file
# Project Memory

- 2026-04-08: Kept Kanban status badges on one line for clients, invoices, and quotations by adding status-badge `className` passthroughs, applying `whitespace-nowrap shrink-0` in Kanban cards, allowing title blocks to shrink with `min-w-0`, and widening shared Kanban columns from `260px` to `280px`.
