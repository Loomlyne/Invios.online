# Phase 4: Public Trust Surfaces - Research

**Researched:** 2026-04-09
**Domain:** Next.js 15 public routes, RTL/bilingual rendering, UAE compliance, slug routing, token-based access
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Public Document Pages**
- D-01: Public document pages render as a branded landing page: business logo/name in a header bar, document preview centered, sticky "Download PDF" button, "Powered by Invios" footer link.
- D-02: Download PDF triggers direct file download via existing Playwright PDF route — no print preview step.
- D-03: Public invoice pages show a visible status badge (Draft, Sent, Partial Paid, Paid, Overdue).
- D-04: Public quotation pages include Accept/Reject buttons (PUB-05 pulled forward). One-click action, optional "Add a note" textarea revealed after click — not pre-shown.
- D-05: Rejection note stored as `rejection_reason` on the quotation record (field already exists).

**Client Portal**
- D-06: Client portal at `/portal/[portalToken]` — branded page showing all invoices and quotations for that client. Each row: document number, status badge, date, total; links to public document page.
- D-07: Portal access via token URL only — no login, no email magic link. User copies URL from client detail page.
- D-08: Portal shows business branding: logo and business name in header bar using accent color.

**UAE Compliance & Bilingual Rendering**
- D-09: Bilingual (language="bilingual") uses side-by-side column layout: English left, Arabic RTL right. Line items show both `description` and `arabicDescription`. Document stays LTR overall, Arabic flows RTL within its column.
- D-10: TRN displayed as labeled field in business info header: "TRN: 100XXXXXXXXX". Both user TRN and client TRN (if available) shown.
- D-11: Arabic-only (language="ar") gets full RTL flip: `dir="rtl"` on document container, text right-aligned, sections reordered. Numbers remain LTR.

**Canonical URLs & Visual Quality**
- D-12: Document routes switch from ID-based (`/app/invoices/[id]`) to slug-based (`/app/invoices/[slug]`). Old ID-based URLs redirect to slug version.
- D-13: When slug changes, old slugs stored as aliases with 301 permanent redirects to current slug. Requires slug alias tracking mechanism.
- D-14: UX-03 visual quality pass covers ALL views — public and private. Comprehensive polish.

### Claude's Discretion
- Exact header bar layout and styling for branded landing page
- Empty state for client portal when no documents exist
- Slug alias storage mechanism (separate table vs. JSONB history column)
- Specific visual improvements in UX-03 pass — Claude identifies highest-impact areas
- Mobile-specific adaptations for public document page and client portal
- Font loading strategy for Arabic text in bilingual documents

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope.
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| PUB-01 | Client can open a public invoice page without authentication using a secure token | Existing `getPublicInvoiceByToken` + admin Supabase client pattern confirmed; needs branded chrome added |
| PUB-02 | Client can open a public quotation page without authentication using a secure token | Existing `getPublicQuotationByToken` pattern confirmed; needs branded chrome + Accept/Reject |
| PUB-03 | Public document pages display branding, line items, totals, status, and download action clearly | `InvoicePreview` already renders these; needs branded wrapper page + `DocumentStatusBadge` |
| PUB-04 | User can create a client portal link that shows all invoices/quotations for a client | `portal_token` field exists on clients table; needs `/portal/[portalToken]` route + `getClientByPortalToken` |
| PUB-05 | Client can explicitly accept or reject quotations from the public quotation page | New public server action pattern (token-based auth, no `requireSession`); `rejection_reason` field exists |
| SET-03 | User can issue UAE-friendly tax invoices with AED currency and TRN support | TRN field exists on `InvoicePreviewData`, `invoiceType` enum has `tax_invoice`; needs D-10 rendering |
| SET-04 | User can render documents with English/Arabic bilingual support and RTL-safe layout | `language` field exists; `arabicDescription` on line items exists; needs InvoicePreview RTL/bilingual branches |
| UX-03 | Public and private document views maintain premium, trustworthy visual quality | Comprehensive pass; no new library needed — Tailwind CSS already in use |
| UX-04 | Canonical slug-based URLs for clients and documents, with alias support when slugs change | `slug` field exists on invoices/quotations; D-12/D-13 routing migration needed; alias table needed |
</phase_requirements>

---

## Summary

Phase 4 has strong foundations already in place: token-based document lookup via admin Supabase client exists and works, `InvoicePreview` already accepts `language`, `trn`, and `arabicDescription` fields, the `slug` and `portal_token` fields are already on the DB records, and `rejection_reason` is already on quotations. This phase is primarily a **surface completion** — adding branded chrome to bare wrappers, wiring RTL/bilingual rendering logic that was designed for but never implemented, and establishing the slug routing migration.

The three hardest technical decisions are: (1) how to store slug aliases for D-13 (separate table is cleaner and more queryable than JSONB), (2) how to implement token-based server actions for PUB-05 without `requireSession` (pass `shareToken` as a hidden form field and validate via admin Supabase — same trust model as the page load), and (3) how to handle the ID-to-slug route migration for D-12 without breaking existing links. The solution is a middleware-free approach: rename the route segment from `[id]` to `[slug]`, add a fallback lookup in `getInvoiceBySlugOrId` that handles UUIDs as a transparent migration, and register a `next.config.ts` redirect only if a fixed mapping is needed.

**Primary recommendation:** Build against the existing token/admin pattern. All mutations on public pages use `createSupabaseAdminClient()` with `shareToken` as the authorization credential. No new auth libraries. The slug alias mechanism should be a `document_slug_aliases` table (not JSONB) for query simplicity.

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| next/font/google `IBM_Plex_Sans_Arabic` | ships with Next.js 15.5.14 | Arabic text rendering in bilingual/RTL documents | Available in this project's Next.js version; professional weight range (100–700); supports `arabic`, `latin`, `latin-ext`, `cyrillic-ext` subsets |
| `@supabase/supabase-js` | already installed | Admin client for public page queries and public mutations | Existing pattern; `createSupabaseAdminClient()` already used on public invoice/quotation pages |
| Tailwind CSS (v4 via `@import "tailwindcss"`) | already installed | RTL layout utilities (`dir` attribute targeting, `rtl:` variant) | Already the project CSS framework |
| Vitest | already installed (`vitest run`) | Unit tests for new pure functions (slug alias resolution, token validation) | Existing test infrastructure |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `next/font/google Noto_Sans_Arabic` | ships with Next.js 15.5.14 | Alternative Arabic font — wider Unicode coverage | Use if IBM Plex Sans Arabic renders poorly for specific Arabic ligatures |
| `next/navigation permanentRedirect` | Next.js 15.5.14 | 308 redirect from old ID-based route to slug | Use in the `[slug]` page when param looks like a UUID |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `IBM_Plex_Sans_Arabic` | `Noto_Sans_Arabic` | Noto has broader Unicode coverage but less typographic polish; IBM Plex is more professional for financial documents |
| `IBM_Plex_Sans_Arabic` | `@fontsource/ibm-plex-sans-arabic` | Self-hosted via Fontsource avoids Google CDN call but adds a package dependency; `next/font` automatic optimization is preferable |
| Separate `document_slug_aliases` table | JSONB `slug_history` column on invoices/quotations | JSONB makes indexed lookups harder; separate table allows simple `eq("alias", slug)` query and per-table RLS |
| `permanentRedirect()` from Next.js | 301 via `next.config.ts` | `next.config.ts` redirects are static — cannot be dynamic per-document. Use `permanentRedirect()` in-page (issues 308, which is semantically identical to 301 for GET requests) |

**Installation (new fonts only — all other deps already present):**
No new npm packages needed. `IBM_Plex_Sans_Arabic` is available via the installed `next/font/google` in Next.js 15.5.14.

---

## Architecture Patterns

### Recommended Project Structure (new files only)

```
src/
├── app/
│   ├── invoices/public/[shareToken]/
│   │   └── page.tsx              # ADD: branded chrome + status badge
│   ├── quotations/public/[shareToken]/
│   │   └── page.tsx              # ADD: branded chrome + Accept/Reject
│   ├── portal/[portalToken]/
│   │   └── page.tsx              # NEW: client portal page
│   └── (app)/app/
│       ├── invoices/
│       │   ├── [slug]/           # RENAME from [id]/ — route segment renamed
│       │   │   ├── page.tsx      # UPDATE: slug lookup + UUID fallback redirect
│       │   │   ├── edit/
│       │   │   ├── status-button.tsx
│       │   │   └── export-button.tsx
│       └── quotations/
│           └── [slug]/           # RENAME from [id]/
│               └── page.tsx
├── lib/
│   ├── billing-data.ts           # ADD: getInvoiceBySlug, getQuotationBySlug,
│   │                             #      getInvoiceBySlugOrId, getQuotationBySlugOrId,
│   │                             #      getClientByPortalToken,
│   │                             #      getInvoicesByPortalToken, getQuotationsByPortalToken,
│   │                             #      getSlugAliasRedirect (invoices), getSlugAliasRedirect (quotations)
│   └── public-documents.ts       # ADD: logo URL resolution for branded pages
└── actions/
    └── public-quotations.ts      # NEW: acceptQuotationAction, rejectQuotationAction
                                  #      (token-based, no requireSession)
supabase/migrations/
└── 20260410XXXXXX_phase4_slug_aliases.sql  # NEW: document_slug_aliases table
```

### Pattern 1: Branded Public Document Page Chrome

**What:** Wrap `InvoicePreview` with a business-branded header bar (logo + business name + accent color) and a sticky download button. The `getOwnerUserState` call already provides branding data.

**When to use:** All public-facing document pages (invoice, quotation, portal document links).

```tsx
// src/app/invoices/public/[shareToken]/page.tsx (outline)
// Source: existing pattern in src/lib/public-documents.ts

export default async function PublicInvoicePage({ params, searchParams }) {
  const { shareToken } = await params;
  const invoice = await getPublicInvoiceByToken(shareToken);
  if (!invoice) notFound();

  const ownerState = await getOwnerUserState(invoice.userId);
  const preview = buildInvoicePreviewFromRecord({ userState: ownerState }, invoice);

  return (
    <div className="min-h-screen bg-background">
      {/* Branded header bar */}
      <header style={{ backgroundColor: ownerState.branding.primaryColor }}>
        {/* logo + business name */}
      </header>

      {/* Document + sticky download */}
      <main className="mx-auto max-w-5xl px-4 py-10">
        <DocumentStatusBadge status={invoice.status} />
        <InvoicePreview preview={preview} mode="public" />
      </main>

      {/* Footer */}
      <footer>
        <a href="https://invios.online">Powered by Invios</a>
      </footer>
    </div>
  );
}
```

### Pattern 2: Token-Based Public Mutation (PUB-05)

**What:** Server actions that authorize via `shareToken` using admin Supabase client — no `requireSession`. The token acts as the credential. Identical trust model to page load.

**When to use:** Accept/Reject actions on the public quotation page.

```ts
// src/actions/public-quotations.ts
"use server";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

export async function acceptQuotationPublicAction(
  shareToken: string,
  _prevState: ActionState,
  _formData: FormData,
): Promise<ActionState> {
  const supabase = createSupabaseAdminClient();
  if (!supabase) return { status: "error", message: "Server error." };

  // Authorize: shareToken must match a real quotation
  const { data: quotation } = await supabase
    .from("quotations")
    .select("id, status")
    .eq("share_token", shareToken)
    .maybeSingle();

  if (!quotation) return { status: "error", message: "Invalid token." };
  if (quotation.status !== "sent") return { status: "error", message: "Quotation cannot be accepted." };

  await supabase
    .from("quotations")
    .update({ status: "accepted", accepted_date: new Date().toISOString() })
    .eq("id", quotation.id);

  revalidatePath(`/quotations/public/${shareToken}`);
  return { status: "success" };
}
```

### Pattern 3: Bilingual Side-by-Side Layout in InvoicePreview

**What:** When `preview.language === "bilingual"`, render a two-column grid: English column (LTR) on the left, Arabic column (`dir="rtl"`) on the right. Document container stays `dir="ltr"`. Numbers (tabular-nums) stay LTR in both columns — CSS `unicode-bidi` handles this automatically for digits.

**When to use:** `InvoicePreview` component, triggered by `language` prop.

```tsx
// Inside InvoicePreview — line items section, bilingual branch
{preview.language === "bilingual" ? (
  <div className="grid grid-cols-2 gap-0">
    {/* English column — LTR (default) */}
    <div>
      <span className="font-medium">{item.description}</span>
    </div>
    {/* Arabic column — RTL within its container only */}
    <div dir="rtl" style={{ fontFamily: "var(--font-arabic), sans-serif" }}>
      <span className="font-medium">{item.arabicDescription || item.description}</span>
    </div>
  </div>
) : (
  <span className="font-medium">{item.description}</span>
)}
```

### Pattern 4: Full RTL Document (language="ar")

**What:** Apply `dir="rtl"` to the outer document container. The document's internal CSS grid (`grid`, `flex`) flips automatically because Tailwind's RTL variants and CSS flex-direction respond to `dir` attribute on the container. Numbers rendered with `tabular-nums` stay LTR automatically via Unicode BiDi algorithm.

**When to use:** `InvoicePreview` when `preview.language === "ar"`.

```tsx
<div
  className="overflow-hidden rounded-[1.6rem] border border-black/8 bg-white"
  dir={preview.language === "ar" ? "rtl" : undefined}
  style={{ fontFamily: preview.language !== "en" ? "var(--font-arabic), var(--font-sans), sans-serif" : undefined }}
>
```

### Pattern 5: Slug Route with UUID Fallback Redirect (D-12)

**What:** Rename route segment `[id]` to `[slug]`. In the page component, check if the param is a UUID. If yes, look up the current slug and redirect 308 (permanent). If the param is a slug, look up by slug directly. This provides zero-downtime migration — old links keep working.

**When to use:** `/app/invoices/[slug]/page.tsx` and `/app/quotations/[slug]/page.tsx`.

```tsx
// src/app/(app)/app/invoices/[slug]/page.tsx
const { slug } = await params;

// UUID detection — 36 chars, 8-4-4-4-12 pattern
const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug);

if (isUuid) {
  const invoice = await getInvoiceById(slug); // existing function
  if (!invoice) notFound();
  permanentRedirect(`/app/invoices/${invoice.slug}`); // 308
}

const invoice = await getInvoiceBySlug(slug);

if (!invoice) {
  // Check alias table before 404
  const redirect = await getInvoiceSlugAliasRedirect(slug);
  if (redirect) permanentRedirect(`/app/invoices/${redirect}`);
  notFound();
}
```

### Pattern 6: Slug Alias Table (D-13)

**What:** A `document_slug_aliases` table tracks old slugs pointing to current document IDs. When a slug changes (during an update), INSERT the old slug into this table. On page load, if slug not found directly, check aliases.

**DB schema:**
```sql
create table public.document_slug_aliases (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('invoice', 'quotation')),
  old_slug text not null,
  document_id uuid not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
create index on public.document_slug_aliases (kind, old_slug);
```

**Why table over JSONB:** Simple `eq("old_slug", slug)` query. Indexed. Separate RLS per row. Easy to clean up orphaned aliases.

### Pattern 7: Client Portal Page

**What:** `/portal/[portalToken]` — public Server Component. Uses `getClientByPortalToken` (admin Supabase) to resolve the client, then `listInvoicesForClientPublic` / `listQuotationsForClientPublic` (also admin — because the user is unauthenticated). Renders a branded document list.

**Key:** Portal must only show documents owned by the same `user_id` as the client. The `portal_token` is unique per client (DB constraint verified), so `client.user_id` scopes all subsequent document queries.

```ts
// src/lib/billing-data.ts (new functions)
export async function getClientByPortalToken(portalToken: string) {
  const supabase = createSupabaseAdminClient();
  const { data } = await supabase
    .from("clients")
    .select("*")
    .eq("portal_token", portalToken)
    .is("archived_at", null)
    .maybeSingle<ClientRow>();
  return data ? mapClient(data) : null;
}
```

### Anti-Patterns to Avoid

- **Calling `requireSession` in public actions:** Public mutations (PUB-05 accept/reject) must NOT call `requireSession`. Use `createSupabaseAdminClient()` with token validation instead.
- **Applying `dir="rtl"` to the entire page:** RTL should be applied only to the document container in bilingual mode, or to the whole document container for `language="ar"`. The portal/public page chrome stays LTR.
- **Using JSONB for slug aliases:** Makes index-based lookups awkward. Use a separate table.
- **Using `redirect()` for slug migration:** `redirect()` is temporary (307). Use `permanentRedirect()` (308) for slug-to-slug and UUID-to-slug transitions.
- **Loading Arabic font in root layout for everyone:** Load `IBM_Plex_Sans_Arabic` only in the `InvoicePreview` component tree or public pages, not in `src/app/layout.tsx`. Current `layout.tsx` loads only `DM_Sans` and `Cormorant_Garamond` for latin — keep it that way to avoid loading Arabic fonts on every page.
- **Passing `shareToken` in URL params to server actions:** Use `bind` partial application or hidden form fields so the token does not appear in the form action URL or browser history.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Arabic font loading with automatic optimization | Manual `@font-face` + self-hosted WOFF2 | `IBM_Plex_Sans_Arabic` from `next/font/google` | Built-in preload, subset isolation, `font-display: swap`, CSS variable injection — all automatic |
| CSS RTL layout flip | Manual mirror of every spacing/padding/alignment class | `dir="rtl"` on the container — browser + CSS handle flex/grid mirroring | Browsers implement the Unicode Bidirectional Algorithm correctly; numbers stay LTR automatically |
| Token generation for aliases or portal tokens | Custom random string gen | `createShareToken()` in `src/lib/billing-utils.ts` already exists | Cryptographically random 36-char hex using `crypto.getRandomValues` |
| Slug uniqueness | Custom collision check | `buildUniqueSlug()` in `src/lib/billing-utils.ts` already exists | Handles suffix incrementing |
| PDF download | Custom rendering | Existing `ExportButton` / Playwright PDF route already works | Phase 2 already solved this; D-02 says reuse it |
| Document totals | Manual arithmetic | `getInvoiceTotals()` in `src/lib/preview.ts`, `computeDocumentTotals()` in `src/lib/billing-utils.ts` | Already handles discount + tax rounding |

**Key insight:** Most of the hard work is already done. Phase 4 is connecting existing pieces (token lookup, branding data, InvoicePreview, slug generation) rather than building from scratch. The main net-new pieces are: branded page chrome, RTL/bilingual InvoicePreview branches, portal route, public server actions, slug alias table + lookup, and route rename.

---

## Common Pitfalls

### Pitfall 1: Arabic Font Applied Too Broadly

**What goes wrong:** Loading `IBM_Plex_Sans_Arabic` in `src/app/layout.tsx` causes the font to load on every page, even pages with no Arabic content, slowing down dashboard and list pages.

**Why it happens:** Developers copy the font loading pattern from `layout.tsx` without thinking about scope.

**How to avoid:** Pass the Arabic font CSS variable only to the `InvoicePreview` component (or its host page). Use the `variable` option of `IBM_Plex_Sans_Arabic` and apply it locally:

```tsx
// In the public page or a dedicated provider component
const arabic = IBM_Plex_Sans_Arabic({ subsets: ["arabic"], weight: ["400", "500", "600"], variable: "--font-arabic" });
return <div className={arabic.variable}><InvoicePreview ... /></div>
```

**Warning signs:** Network tab shows Arabic font loading on dashboard page.

---

### Pitfall 2: Public Mutation CSRF / Replay Attack

**What goes wrong:** The Accept/Reject server action can be replayed by anyone who captures the network request — there is no session token.

**Why it happens:** Server Actions in Next.js 15 generate encrypted action IDs but do not prevent replay at the business logic level.

**How to avoid:** The `shareToken` credential is the authorization layer. Always verify: (a) token exists in DB, (b) quotation is in `sent` state before accepting. Accepting/rejecting an already-accepted or rejected quotation must return an error, not silently succeed. The `accepted_date`/`rejected_date` fields prevent double-accept.

**Warning signs:** Accept action can be called twice and both calls succeed.

---

### Pitfall 3: Route Segment Rename Breaks `typedRoutes`

**What goes wrong:** Renaming `[id]` to `[slug]` in the route directory means every `as Route` cast pointing to `/app/invoices/${id}` will now have a TypeScript error because the type-safe route parameter changed.

**Why it happens:** `typedRoutes: true` in `next.config.ts` generates route types from the file system. After rename, old `Route` casts no longer compile.

**How to avoid:** After renaming the directory, do a project-wide search for `/app/invoices/${` and `/app/quotations/${` and update all callsites to use `invoice.slug` / `quotation.slug` instead of `invoice.id` / `quotation.id`. This includes: `DocumentSummaryRow` hrefs in `clients/[slug]/page.tsx`, action redirect returns in `src/actions/invoices.ts` / `src/actions/quotations.ts`, and any `Link` components in detail/edit pages.

**Warning signs:** `tsc --noEmit` errors after directory rename.

---

### Pitfall 4: Portal Data Leakage

**What goes wrong:** The portal page leaks documents from other clients or other users by querying without user-scoping.

**Why it happens:** Developer queries `listInvoicesForClient(client.id)` but `listInvoicesForClient` uses the authenticated server Supabase client (session-scoped), which will fail because the portal page is unauthenticated.

**How to avoid:** Create dedicated admin-client functions: `listInvoicesForClientPublic(clientId, userId)` and `listQuotationsForClientPublic(clientId, userId)`. Always pass both `client_id` and `user_id` filters. The `user_id` comes from the resolved client record (not from session).

**Warning signs:** Portal page throws "You need to be signed in" or shows empty results.

---

### Pitfall 5: `permanentRedirect` Issues 308, Not 301

**What goes wrong:** Planner assumes `permanentRedirect()` sends a 301. Some crawlers and older clients handle 308 differently.

**Why it happens:** Next.js 15 `permanentRedirect()` uses HTTP 308 (Permanent Redirect), not 301. Verified from `node_modules/next/dist/client/components/redirect-status-code.js`: `PermanentRedirect = 308`.

**How to avoid:** For slug alias redirects and UUID-to-slug redirects within the App Router, 308 is semantically correct (preserves method for GET requests, equivalent behavior for browsers). No action needed for typical use. If a strict 301 is required (e.g., for external SEO tools), use `next.config.ts` `redirects()` with `permanent: true` and `statusCode: 301` — but this cannot be dynamic.

**Warning signs:** SEO audit tools report 308 instead of expected 301 — this is acceptable behavior.

---

### Pitfall 6: Arabic Number Direction in RTL Containers

**What goes wrong:** Numeric values (AED 5,000.00) appear right-to-left digit order in RTL containers.

**Why it happens:** If `dir="rtl"` is set on a container and numbers are inside text with Arabic characters, some browsers may apply Arabic-Indic numeral rendering.

**How to avoid:** Keep all numeric table cells in `tabular-nums` with explicit `dir="ltr"` on the cell or use the Unicode directional mark `\u202A` (LTR mark) before numbers. The safest approach is `<td dir="ltr" className="tabular-nums">`. In the bilingual layout, number columns are always in the LTR (English) side, so this is automatic.

---

### Pitfall 7: Slug Alias Table Missing RLS

**What goes wrong:** A user can look up aliases for documents belonging to another user.

**Why it happens:** Developer creates the table without RLS or with overly permissive policy.

**How to avoid:** Apply RLS: `select` policy requires `auth.uid() = user_id`. Public lookup (for slug redirect on private routes) must use the authenticated server client. For portal/public redirects (unlikely to need aliases), use admin client with both `old_slug` and implicit trust that aliases are only generated server-side.

---

## Code Examples

### Loading IBM_Plex_Sans_Arabic in Next.js 15 (verified API)

```tsx
// In the public page layout or InvoicePreview wrapper
import { IBM_Plex_Sans_Arabic } from "next/font/google";

const arabicFont = IBM_Plex_Sans_Arabic({
  subsets: ["arabic"],
  weight: ["400", "500", "600"],
  variable: "--font-arabic",
  display: "swap",
  preload: false, // Only preload if the page always has Arabic content
});

// Apply the variable to the document container
<div className={arabicFont.variable}>
  <InvoicePreview ... />
</div>
```

### Verified font API from `node_modules/next/dist/compiled/@next/font/dist/google/index.d.ts`:
- `IBM_Plex_Sans_Arabic` — weights: 100–700, subsets: `arabic | cyrillic-ext | latin | latin-ext`
- `Noto_Sans_Arabic` — also available as fallback

### RTL container with number protection

```tsx
// Full RTL document
<div
  dir="rtl"
  style={{ fontFamily: "var(--font-arabic), var(--font-sans), sans-serif" }}
>
  {/* Numbers stay LTR via Unicode BiDi — no explicit dir needed for pure digits */}
  <span className="tabular-nums">{formatCurrency(total, currency)}</span>
</div>
```

### UUID detection for route migration

```tsx
// UUID v4 regex — reliable for Supabase-generated IDs
const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug);
```

### Admin Supabase for unauthenticated portal queries

```ts
// Existing pattern — already used in getPublicInvoiceByToken
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function getClientByPortalToken(portalToken: string) {
  const supabase = createSupabaseAdminClient();
  if (!supabase) return null;
  const { data } = await supabase
    .from("clients")
    .select("*")
    .eq("portal_token", portalToken)
    .is("archived_at", null)
    .maybeSingle();
  return data ? mapClient(data) : null;
}
```

### slug alias migration in update action

```ts
// In updateInvoiceAction — after slug recompute, before DB update
const oldSlug = existingInvoice.slug;
const newSlug = buildUniqueSlug(/* ... */);

if (oldSlug !== newSlug) {
  // Register old slug as alias
  await supabase.from("document_slug_aliases").insert({
    kind: "invoice",
    old_slug: oldSlug,
    document_id: parsed.data.id,
    user_id: userId,
  });
}
```

---

## UAE Tax Invoice Compliance Reference

**TRN format (confirmed from FTA guidance and multi-source research):**
- UAE TRN is a 15-digit number issued by the Federal Tax Authority
- Display format: plain 15 digits, no mandatory separator — but grouping as `100-XXXXXXX-XXXXX` is common in practice
- Mandatory for tax invoices: supplier name, address, TRN; date; description; VAT amount; total
- Both supplier TRN and recipient TRN (if VAT-registered) should appear
- Invoice type label must say "Tax Invoice" (not just "Invoice") for `invoiceType === "tax_invoice"`

**AED formatting:** Standard `AED 1,000.00` or with Arabic-Indic script for RTL documents. The `formatCurrency` utility in `src/lib/utils.ts` handles this — verify it uses `Intl.NumberFormat` with the correct locale for Arabic output.

**e-Invoicing note:** UAE mandatory e-invoicing (XML/UBL via ASP) is planned for phased rollout starting 2026. This phase does NOT need to implement XML/UBL — display compliance only.

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `dir` attribute only on `<html>` for RTL | Per-container `dir="rtl"` for scoped RTL (bilingual layouts) | CSS3/HTML5 living standard | Enables side-by-side EN/AR without a full-page RTL flip |
| 301 HTTP redirect | 308 permanent redirect via `permanentRedirect()` in Next.js App Router | Next.js 13+ | 308 preserves request method; effectively identical for GET navigation |
| `@font-face` self-hosted | `next/font/google` with `subset`, `preload`, `display` options | Next.js 13+ | Automatic preloading, zero CLS, no layout shift |

**Deprecated/outdated:**
- `useRouter().push()` for server-side redirects: In Next.js 15 App Router, `permanentRedirect()` and `redirect()` from `next/navigation` are for Server Components/Actions. Client Components use `useRouter`.

---

## Open Questions

1. **Arabic font scope: page-level vs component-level**
   - What we know: `IBM_Plex_Sans_Arabic` must not load on every page. The `next/font` module caches font instances and deduplicates by config.
   - What's unclear: Whether defining the font in a Server Component page (e.g., the public invoice page) and passing the CSS variable down is sufficient for `InvoicePreview` to use it, or whether `InvoicePreview` needs its own font definition.
   - Recommendation: Define the font in the public page layout and inject via `className={arabicFont.variable}` on the wrapper div. `InvoicePreview` references `var(--font-arabic)` via inline style. Test confirms font loads only on public pages and document preview.

2. **`getClientByPortalToken` — should archived clients block portal access?**
   - What we know: `clients` table has `archived_at` field. `getClientBySlug` includes `.is("archived_at", null)`.
   - What's unclear: Should archived clients have their portal disabled? D-06/D-07 don't address this.
   - Recommendation: Block portal access for archived clients (`.is("archived_at", null)` in query) and return `notFound()`. This prevents stale portal links showing deleted client data.

3. **Slug alias lookup on public pages vs. private routes**
   - What we know: D-12 says public pages remain token-based; slug routing is for private routes only.
   - What's unclear: Do slug aliases need to exist for private routes only, or also for public pages?
   - Recommendation: Aliases only apply to private routes (`/app/invoices/[slug]`). Public pages stay on shareToken — no alias redirect needed there.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|---------|
| Next.js 15 | All routes | ✓ | 15.5.14 | — |
| `IBM_Plex_Sans_Arabic` via `next/font/google` | SET-04 bilingual/RTL | ✓ | Ships with Next.js 15.5.14 (confirmed in `@next/font` dist) | `Noto_Sans_Arabic` (also available) |
| Supabase admin client | PUB-01..05, portal | ✓ | Already in use | — |
| Vitest | Unit tests | ✓ | Config at `vitest.config.ts`, `test` script in package.json | — |
| Playwright | E2E tests | ✓ | Config at `playwright.config.ts`, `test:e2e` script | — |

**No missing dependencies.**

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest (node environment) |
| Config file | `vitest.config.ts` |
| Quick run command | `pnpm test` (runs `vitest run`) |
| Full suite command | `pnpm test && pnpm typecheck` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| PUB-01 | `getPublicInvoiceByToken` returns null for invalid token | unit | `pnpm test -- --reporter=verbose src/lib/billing-data.test.ts` | ❌ Wave 0 |
| PUB-02 | `getPublicQuotationByToken` returns null for invalid token | unit | `pnpm test -- --reporter=verbose src/lib/billing-data.test.ts` | ❌ Wave 0 |
| PUB-04 | `getClientByPortalToken` returns null for invalid/archived | unit | `pnpm test -- --reporter=verbose src/lib/billing-data.test.ts` | ❌ Wave 0 |
| PUB-05 | `acceptQuotationPublicAction` rejects if status !== "sent" | unit | `pnpm test -- --reporter=verbose src/actions/public-quotations.test.ts` | ❌ Wave 0 |
| PUB-05 | `rejectQuotationPublicAction` stores rejection_reason | unit | `pnpm test -- --reporter=verbose src/actions/public-quotations.test.ts` | ❌ Wave 0 |
| UX-04 | UUID param triggers `permanentRedirect` to slug | unit | `pnpm test -- --reporter=verbose src/lib/billing-utils.test.ts` | ✅ (extend existing) |
| UX-04 | `buildUniqueSlug` produces unique slug on collision | unit | `pnpm test` | ✅ (exists in billing-utils.test.ts) |
| SET-03 | TRN display present on tax invoice preview data | unit | `pnpm test -- --reporter=verbose src/lib/billing-utils.test.ts` | ✅ (extend existing) |
| SET-04 | bilingual layout — arabicDescription falls back to description | unit | `pnpm test -- --reporter=verbose src/lib/billing-utils.test.ts` | ✅ (extend existing) |

### Sampling Rate

- **Per task commit:** `pnpm test`
- **Per wave merge:** `pnpm test && pnpm typecheck`
- **Phase gate:** Full suite green + `pnpm typecheck` clean before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] `src/lib/billing-data.test.ts` — unit tests for new public data functions (`getClientByPortalToken`, slug alias lookup). Pure schema/logic tests only (mock Supabase client).
- [ ] `src/actions/public-quotations.test.ts` — unit tests for Accept/Reject action guard logic.
- Note: These are pure function / guard tests, not integration tests. They do not require a live Supabase instance.

---

## Project Constraints (from CLAUDE.md)

CLAUDE.md contains a single directive: `@AGENTS.md`, which resolves to:

> **This is NOT the Next.js you know.** This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

**Applied constraint:** All Next.js API usage in this research has been verified against `node_modules/next` (version 15.5.14) directly. Key verified facts:
- `permanentRedirect()` issues HTTP 308 (not 301) — confirmed in `redirect-status-code.js`
- `IBM_Plex_Sans_Arabic` is available in the installed `next/font/google` — confirmed in `@next/font/dist/google/index.d.ts`
- `params` is a `Promise` in Next.js 15 — confirmed in existing page files (`const { shareToken } = await params`)
- `typedRoutes: true` is active in `next.config.ts` — all new routes must use `as Route` casts

The `node_modules/next/dist/docs/` directory does not exist in this installation (no markdown docs bundled at that path). Verification was performed directly against compiled source files in `node_modules/next/dist/`.

---

## Sources

### Primary (HIGH confidence)
- `node_modules/next/dist/client/components/redirect-status-code.js` — confirms `permanentRedirect` = HTTP 308
- `node_modules/next/dist/compiled/@next/font/dist/google/index.d.ts` — confirms `IBM_Plex_Sans_Arabic` availability and weight/subset options
- `src/lib/billing-data.ts` — existing `getPublicInvoiceByToken`, `getPublicQuotationByToken` patterns
- `src/lib/public-documents.ts` — existing `getOwnerUserState` pattern for unauthenticated branding
- `src/lib/billing-utils.ts` — confirms `createShareToken()`, `buildUniqueSlug()` exist
- `supabase/migrations/202604060130_phase2_documents.sql` — confirms `slug`, `share_token`, `portal_token`, `rejection_reason`, `language` fields exist
- `src/lib/types.ts` — confirms `InvoicePreviewData` has `trn`, `language`, `arabicDescription` on line items; `BrandingSettings` has `arabicBusinessName`, `arabicAddress`

### Secondary (MEDIUM confidence)
- [Next.js redirects docs](https://nextjs.org/docs/app/api-reference/config/next-config-js/redirects) — static redirects via `next.config.ts`
- [IBM Plex Sans Arabic — Google Fonts](https://fonts.google.com/specimen/IBM+Plex+Sans+Arabic) — font availability confirmed
- [GitHub: 301 redirect in RSC discussion #54182](https://github.com/vercel/next.js/discussions/54182) — community confirmation of 308 behavior
- [RTL Styling guide](https://rtlstyling.com/posts/rtl-styling/) — per-container `dir="rtl"` pattern for scoped RTL
- [UAE Tax Invoice Format 2025 — Arnifi](https://arnifi.com/blog/tax-invoice-format-in-uae-explained-for-2025/) — TRN display requirements

### Tertiary (LOW confidence)
- UAE e-invoicing XML/UBL requirements (2026 rollout) — not applicable to this phase; display compliance only needed now

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — verified against installed `node_modules`
- Architecture patterns: HIGH — based on existing code patterns in the codebase
- RTL/bilingual rendering: MEDIUM — CSS spec behavior is well-established; browser-specific Arabic numeral rendering edge cases exist
- UAE compliance: MEDIUM — TRN display requirements confirmed from multiple sources; strict FTA field ordering not formally documented for non-XML invoices
- Pitfalls: HIGH — derived from actual code inspection (typedRoutes, route rename impact, RLS gap)

**Research date:** 2026-04-09
**Valid until:** 2026-05-09 (stable — no fast-moving dependencies except Next.js patch releases)
