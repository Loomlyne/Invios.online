# Invoices Full Audit (2026-07-12)

Scope: everything under /app/invoices (list, new, detail, edit), public share page, portal, PDF/PNG/CSV export, crons, server actions, schema, branding/templates. Produced by 3 parallel agents (feature inventory, UI/UX design, data layer), verified by orchestrator spot-checks.

---

## PART A. Feature inventory

### A1. Route map

| Route / File | Purpose |
|---|---|
| `src/app/(app)/app/invoices/page.tsx` | List: search, status filter, kanban/list/table switcher, stats, CSV export, New CTA |
| `src/app/(app)/app/invoices/loading.tsx` | Skeleton for list |
| `src/app/(app)/app/invoices/new/page.tsx` | Create (DocumentBuilder), blocks if zero clients |
| `src/app/(app)/app/invoices/[slug]/page.tsx` | Detail: preview, payments, expenses, profit, versions, actions |
| `src/app/(app)/app/invoices/[slug]/edit/page.tsx` | Edit (same builder, prefilled) |
| `[slug]/status-button.tsx` | Optimistic status dropdown |
| `[slug]/export-button.tsx` | PDF / PNG / copy-as-image |
| `[slug]/recurring-button.tsx` | Recurring schedule dialog |
| `src/app/invoices/public/[shareToken]/page.tsx` | Public unauthenticated view, `?print=1` bare mode |
| `src/app/portal/[portalToken]/page.tsx` | Client portal (all docs for one client) |
| `src/app/api/invoices/[id]/pdf` / `png` | Playwright + @sparticuz/chromium render of public page |
| `src/app/api/export/invoices/route.ts` | CSV export with collected/outstanding/profit columns |
| `src/app/api/cron/reminders` / `recurring` | Reminder emails (Resend), recurring generation |
| `src/actions/invoices.ts`, `payments.ts`, `expenses.ts`, `versions.ts`, `recurring.ts` | Server actions |
| `src/components/invoice/invoice-preview.tsx` | Single shared renderer (editor, detail, public, PDF/PNG) |
| `src/components/data-view/configs/invoice-config.tsx` | Kanban/list/table config |
| Settings → Branding | Templates, logo, colors, fonts, signature, spacing |

### A2. Features (exists / how / limits)

- Create: Zod-validated, `next_document_number` RPC (atomic, race-free), unique slug + 36-hex share token. Currency is free text, not ISO-validated.
- Edit: revalidates, recomputes totals, snapshots version (cap 10, oldest pruned).
- Line items: dynamic rows, qty/price/notes, Arabic bilingual description, table/cards layouts per template.
- Tax/discount: single flat % each; discount first, tax on discounted base (`computeDocumentTotals`, `src/lib/billing-utils.ts:28`).
- Numbering: per-user counter `document_counters`, editable prefix, `PREFIX-0001`. Note June 23 hotfix history (revoked/restored EXECUTE grant).
- Statuses: draft → sent → partial_paid / paid / overpaid / overdue. Auto-recompute on payment add/delete; `syncOverdueStatuses` on load. Manual override allows ANY transition (see D-7).
- Templates/branding: 3 templates (classic/executive/minimal), logo, cover, colors, fonts + custom font upload, spacing, signature (upload/draw/typed). Page background image/video tabs visible but disabled.
- Preview: one `InvoicePreview` component for editor/detail/public/print. Strong consistency, but any defect propagates to customer PDFs.
- PDF/PNG: headless Chromium screenshots the public share page. 60s max. Depends on public URL reachability.
- CSV: per-list + dashboard, computed financial columns (`src/lib/export-csv.ts`).
- Share link: permanent, no expiry, no revoke/regenerate.
- Recurring: weekly/monthly/quarterly, claim-then-generate idempotency (advances `next_due_date` before insert). Solid.
- Reminders: before/due/after/second, per-user settings, `reminder_logs` dedup (24h), 100-user batch. UTC-only (see D-3).
- Payments: cash/bank_transfer/cheque/other, drives status automation.
- Expenses + profit summary per invoice.
- Versions: full snapshot per edit, restore preserves payments/expenses, recomputes status.
- Slug aliases: old UUIDs and renamed slugs 301-redirect.

### A3. Data model (supabase/migrations)

`invoices` (totals, jsonb line_items, enum status, trn, share_token, unique (user_id, invoice_number), (user_id, slug), share_token) · `payments` · `expenses` · `document_counters` · `invoice_versions` · `recurring_schedules` · `reminder_logs` · `document_slug_aliases` · `branding` · `user_settings`.
RLS: owner-scoped `auth.uid() = user_id` on select/insert/update everywhere. Public/portal reads use the service-role admin client; the token is the only access control (standard for share links). **DELETE policy on `invoices` is missing entirely** (see D-1, verified).

### A4. Integrations

- Supabase (DB, RLS, storage for logo/signature/cover).
- Creem = Invios's own SaaS subscription billing only. Zero connection to the `invoices` table.
- Resend: reminder emails only. No "send invoice" transactional email exists.
- Playwright/chromium: shared PDF+PNG pipeline.

### A5. Confirmed absent (gaps)

No per-line/multi-tax · no credit notes/refund workflow · no online "Pay now" on public page · no attachments · no one-off duplicate invoice · no manual send-by-email · no pagination (hard cap 200 rows, search only scans those 200) · no share-link revoke/expiry · languages limited to EN/AR/bilingual · `formatDateDisplay` hardcodes `dd.mm.yyyy` and ignores the user's date_format setting · currency free text, always formatted with `en-AE` locale.

---

## PART B. Critical + High issues (merged, prioritized)

| # | Sev | Area | Where | Problem | Fix |
|---|-----|------|-------|---------|-----|
| D-1 | **Critical** | Data | `202604060130_phase2_documents.sql:190-204`, `src/actions/invoices.ts:314` | No DELETE RLS policy on `public.invoices`. `deleteInvoiceAction` uses the session client, matches 0 rows, always returns "not found or no permission". **Delete is broken in production.** Verified by orchestrator grep: only payments/expenses have `for delete` policies. | Migration: `create policy "invoices are deletable by owner" on public.invoices for delete using (auth.uid() = user_id);` Same check for quotations. |
| D-2 | High | Money | `src/lib/preview.ts:107-129` vs `billing-utils.ts:28-47` | `getInvoiceTotals` (builder preview AND the public/print page that becomes the customer PDF) recomputes totals with NO rounding; stored values round every step. Cent-level divergence between PDF shown to client and stored total / CSV / dashboard. Verified: no `roundCurrency`/`Math.round` in preview.ts. | Saved invoices: render stored subtotal/discount/tax/total. Route both preview paths through `computeDocumentTotals`. |
| U-1 | Critical→moot | UX | `invoice-delete-button.tsx:18-37` | Single-click delete, no confirmation, errors via `window.alert()`. (Currently masked by D-1; becomes live data-loss risk the moment D-1 is fixed.) | Fix together with D-1: shadcn AlertDialog + toast. |
| D-3 | High | Cron | `api/cron/reminders/route.ts:28`, `lib/cron-utils.ts:31-56` | Reminder "today" is UTC; `user_settings.timezone` never consulted; trigger is exact-day match with no catch-up. Missed boundary = reminder never sent. | Per-user timezone day calc, or `>=` window + reminder_logs dedup. |
| U-2 | High | Contrast | `invoice-preview.tsx` (~24 occurrences) | `#A8A29E` labels on white ≈ 2.5:1 at 11px. Fails WCAG AA, and it's on the customer-facing PDF. | Replace with `text-muted` (#6b6359 ≈ 5:1) token. |
| U-3 | High | Mobile | `data-view-toolbar.tsx:71` | Search input `hidden sm:block`: mobile users cannot search invoices at all. | Show on mobile, stack toolbar below `sm`. |
| U-4 | High | Data loss | `document-builder.tsx` | No unsaved-changes guard, no autosave. Back/refresh discards entire draft. | Dirty-state `beforeunload` + router intercept; optional localStorage draft keyed by id/"new" (D-9). |
| U-5 | High | Consistency | `document-status-badge.tsx:17` vs `invoice-config.tsx:25` | overdue = amber badge but red kanban dot; overdue and rejected share amber; overpaid = blue. Semantic mismatch. | Add red/danger badge variant for overdue; align badge and kanban colors. |
| U-6 | High | A11y | `table-view.tsx:93-97` | Row nav via `onClick` on `<tr>`: not keyboard-focusable, no focus ring. | Real `<Link>` in first cell or tabIndex+Enter+focus-visible. |
| U-7 | High | A11y | `export-button.tsx`, `status-button.tsx`, `document-builder.tsx:593-675` | Custom dropdowns: no menu roles, aria-expanded, arrow keys, Escape. | Rebuild on Radix DropdownMenu/Popover (shadcn already present). |

## PART C. Medium

| # | Area | Where | Problem | Fix |
|---|------|-------|---------|-----|
| D-4 | Validation | `lib/billing.ts:55-73` | Dates only `z.string().min(1)`: no format check, no `dueDate >= issueDate`. Bad payload = raw DB 500. | `.refine()` ISO format + cross-field. |
| D-5 | Export | `lib/export-csv.ts:21-28` | CSV formula injection: leading `= + - @` in client name/notes not neutralized. | Prefix `'` on risky first chars. |
| D-6 | Tests | `actions/invoices.test.ts` | Only Zod schemas tested; zero coverage of create/update/delete/status actions. D-1 shipped with green tests. | Server-action tests with mocked Supabase; rounding-boundary tests for totals. |
| D-7 | Integrity | `actions/invoices.ts:294-312` | Manual status change allows any transition (paid → draft etc.), disagreeing with payment-derived status. | Allow-list manual transitions; derive paid/overpaid/overdue only from payments. |
| U-8 | Validation UX | `document-builder.tsx:294-431` | Line items accept empty title/qty 0; no inline errors or required markers, only server banner. | Client-side per-field validation. |
| U-9 | Hierarchy | `[slug]/page.tsx:100-111` | Delete is the FIRST action in the row, ahead of Edit/Status/Export. | Move to end or overflow menu. |
| U-10 | Theming | `loading.tsx`, `document-builder.tsx`, `status-button.tsx`, `invoice-preview.tsx` | Dozens of hardcoded hex (`#FFF8EE #FFF7EA #FFF1D6 #92700C #A8A29E`) bypass globals.css tokens. No `.dark` block exists anywhere; dark mode impossible until fixed. | Replace with tokens (`bg-surface-subtle`, `border-border`, `text-muted`). |
| U-11 | Loading | `loading.tsx` vs `page.tsx:25` | Skeleton is a LIST layout but default view is KANBAN: shape mismatch + layout shift. | View-agnostic or kanban-shaped skeleton. |
| U-12 | Feedback | app-wide | 4 feedback idioms: alert(), inline banner, ephemeral icon swap, silent optimistic. No toasts. | Adopt sonner; unify status/delete/export feedback. |
| U-13 | Branding | `invoice-preview.tsx:275,322,395,...` | User accentColor applied to totals/title with no contrast guardrail; light brand color = unreadable amount. | Clamp luminance or dark fallback for text roles. |
| D-8 | API | `api/invoices/[id]/pdf`, `png` | No explicit auth check in route; relies solely on RLS via session client. Correct today, zero defense-in-depth. | Add explicit `requireSession()` + ownership check. |

## PART D. Low

- D-9 memory: client defaults to `clients[0]`, not last-used; no per-client remembered tax/terms.
- D-10 bounds: qty/price have no `.max()`; 1e9 accepted until numeric(12,2) overflows as raw DB error.
- U-14 kanban icon-only Plus link lacks aria-label (`kanban-view.tsx:152`).
- U-15 `text-muted/60` decorative text below AA (`kanban-view.tsx:167`, `table-view.tsx:64`).
- U-16 disabled buttons only `opacity-60`, contrast unverified.
- U-17 `InvoiceMeta` truncate silently clips client name/currency (`[slug]/page.tsx:121-135`).
- Date display ignores user `date_format` setting (hardcoded `dd.mm.yyyy`).

## PART E. What is genuinely good

Single shared `InvoicePreview` across editor/detail/public/PDF (app ↔ PDF always match) · atomic numbering RPC · idempotent recurring cron · crypto share tokens + unique constraints · version history with restore · optimistic kanban with rollback · proper form label association · fluid spacing tokens · prefers-reduced-motion handling · notes/terms XSS-safe (plain JSX, no dangerouslySetInnerHTML) · sensible create defaults (issue today, due +7d, settings-driven currency/tax).

## PART F. Recommended execution order

1. **Hotfix migration**: invoices (+ quotations) DELETE RLS policy, plus AlertDialog confirm (D-1 + U-1). One PR.
2. **Money unification**: preview/print reads stored totals; kill `getInvoiceTotals` divergence (D-2). Add rounding-boundary tests (D-6).
3. **PDF contrast + tokens**: `#A8A29E` → `text-muted`, hardcoded hex → tokens (U-2, U-10).
4. **Form safety**: unsaved-changes guard, inline validation, date refinements (U-4, U-8, D-4).
5. **A11y/mobile batch**: toolbar search, table rows, Radix dropdowns, badge colors (U-3, U-5, U-6, U-7).
6. **Cron timezone fix** (D-3), CSV injection (D-5), status transition guard (D-7), explicit route auth (D-8).
7. Backlog: pagination past 200, duplicate action, send-by-email, share-link revoke, Pay-now, credit notes, per-client memory.
