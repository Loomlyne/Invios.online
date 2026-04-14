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
- Supabase's current Next.js SSR guidance is based on `@supabase/ssr`, not the old Next.js auth helper package.
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
- **Heavy client-state architecture by default**: most operator-console data is server-owned; don't turn the app into a global client-state mess.
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

---

# Stack Research: v1.1 Client Import & Analytics

**Researched:** 2026-04-14
**Scope:** Two additive capabilities only — CSV parsing and charting. Everything else already exists and is not re-evaluated.

## CSV Parsing

**Recommended:** `papaparse@5.5.3` + `@types/papaparse@5.5.2`

**Why over alternatives:**

- PapaParse is the de-facto standard for browser-side CSV parsing in the JavaScript ecosystem. No serious alternative competes on feature parity for browser use.
- It handles streaming, web workers, quoted fields with embedded commas/newlines, BOM stripping, and header auto-detection — all of which are real-world CSV import edge cases.
- Zero runtime dependencies. Unpacked size 263KB (source); the browser bundle is significantly smaller.
- The `@types/papaparse` package is maintained in sync — current version 5.5.2 matches the library's 5.5.3 release closely.
- The alternative `csv-parse` is Node.js-first and requires a browser build shim. Avoid for this use case — the import flow is client-side (file picker in browser) and SSR involvement is only the final Supabase write, not the parse step.

**Install:**
```
pnpm add papaparse
pnpm add -D @types/papaparse
```

**Notes:**

- Use entirely browser-side (`'use client'` component handles file input and parse). Do not attempt to run PapaParse parse in a Server Action or Route Handler — stream the raw string if you need server-side validation, but the parse itself belongs in the browser.
- Use `Papa.parse(file, { header: true, skipEmptyLines: true, worker: false })` for files under ~5MB (typical client CSV). Worker mode requires a bundled worker file that adds webpack config complexity — skip it for this use case.
- PapaParse returns typed result objects: `{ data: Record<string, string>[], errors: ParseError[], meta: ParseMeta }`. Pass `data` directly to the field-mapping UI component.
- No SSR incompatibility. PapaParse has no `window`-only code paths at import time — only at parse time — so it can be imported in RSC-adjacent files without `dynamic(() => import(...), { ssr: false })` guards, though the invoking component must be `'use client'`.

## Charting

**Recommended:** `recharts@3.8.1` via the shadcn/ui chart component scaffold

**Install path (preferred — adds the shadcn chart wrapper component):**
```
pnpm dlx shadcn@latest add chart
```

This command installs `recharts` as a package dependency and scaffolds `src/components/ui/chart.tsx` — the shadcn chart wrapper that provides `ChartContainer`, `ChartTooltip`, `ChartTooltipContent`, `ChartLegend`, and `ChartLegendContent`. These wrappers handle CSS variable theming against the existing token system automatically.

**Direct install (if shadcn CLI is avoided):**
```
pnpm add recharts
```

**Why recharts over alternatives:**

- **vs shadcn/ui native chart** — shadcn chart IS recharts. The `shadcn add chart` command adds a thin wrapper. Use it; it wires CSS variables to the existing design token system at zero extra cost.
- **vs Tremor** — Tremor wraps recharts with opinionated Tailwind styling. Adds ~200KB to the bundle for components that would need to be de-styled anyway to match the existing HSL token design. Do not use.
- **vs Victory** — Victory is React-native first, heavier (recharts is ~1.1MB unminified, Victory is comparable), and has weaker TypeScript support. No advantage here.
- **vs Nivo** — Nivo is powerful but has poor SSR story (requires `dynamic` import for most chart types) and the bundle includes all chart types even if you only use two. Overkill for two chart types.
- **vs visx / D3 direct** — Correct choice for bespoke data-dense visualizations. Complete overkill for a bar chart and a summary table. Adds 3-4x implementation time.
- **Recharts 3.x (current) vs 2.x** — recharts 3.x is the stable latest. The 3.x series dropped the Redux dependency and cleaned up the internal architecture. `dist-tags.latest` is 3.8.1 as of 2026-04-14.

**Peer dependency check (all satisfied by existing package.json):**

| Peer dep | Required by recharts | Installed |
|---|---|---|
| `react` | `^16.8.0 \|\| ^17 \|\| ^18 \|\| ^19` | `19.2.0` |
| `react-dom` | `^16 \|\| ^17 \|\| ^18 \|\| ^19` | `19.2.0` |
| `react-is` | `^16.8.0 \|\| ^17 \|\| ^18 \|\| ^19` | not in package.json but latest is `19.2.5`, recharts installs it automatically |

No peer dependency conflicts. React 19 is explicitly supported.

**Notes — RSC / "use client" requirements:**

- Recharts components use React hooks and browser DOM internally. Any component that renders a `<BarChart>`, `<LineChart>`, or `<ResponsiveContainer>` must be a `'use client'` component.
- The correct pattern: keep the page/layout as RSC, fetch data server-side, pass serialized data down as props to a thin `'use client'` chart component.
- `ResponsiveContainer` from recharts requires a parent with defined height. Wrap in a `div` with explicit height (e.g., `className="h-64"`) — do not rely on `100%` height from flex containers as it will collapse to 0.
- The shadcn `ChartContainer` component handles the `ResponsiveContainer` wrapper and CSS variable injection. Use it.
- Bundle impact: recharts 3.x ships its own `victory-vendor` (d3-scale, d3-shape, etc.) as a peer/bundled dep. Unpackaged size ~6.7MB, but tree-shaking brings actual bundle contribution to roughly 150-200KB gzipped for two chart types (bar + line). Acceptable for a dashboard route that is not a landing page.

## What NOT to add

- **csv-parse**: Node.js-first CSV library. Requires browser shim config in webpack/turbopack. PapaParse does the same job natively in the browser.
- **Tremor**: Wraps recharts with Tailwind styling that conflicts with this project's custom HSL token system. Adds bundle weight for components you'd fight against.
- **Nivo**: Requires `dynamic(() => import(...), { ssr: false })` for most chart types. Bundles all chart types regardless of use. No advantage for two charts.
- **Victory**: Heavier than recharts, weaker TypeScript, React-Native heritage creates occasional DOM quirks.
- **visx or raw D3**: Correct answer for custom visualization work, wrong answer for a standard bar chart + trend line on a dashboard page.
- **@tanstack/react-table for the aging table**: The aging buckets summary is a 4-column static summary, not a sortable/paginated data table. Use a plain HTML table or shadcn `Card` grid. TanStack Table is already listed in the v1.0 stack for actual data tables; do not add it again.
- **react-dropzone**: The CSV import flow only needs a standard `<input type="file" accept=".csv">`. Adding a drag-and-drop library for a one-shot import screen is unnecessary complexity.

## Sources

- PapaParse npm: https://www.npmjs.com/package/papaparse (verified 5.5.3 latest, 2026-04-14)
- @types/papaparse npm: https://www.npmjs.com/package/@types/papaparse (verified 5.5.2)
- Recharts npm: https://www.npmjs.com/package/recharts (verified 3.8.1 latest, 2026-04-14)
- shadcn/ui chart docs: https://ui.shadcn.com/docs/components/chart (confirmed recharts underneath, `pnpm dlx shadcn@latest add chart`)
- Recharts peer deps: verified via `npm show recharts peerDependencies` — React 19 in the supported range
