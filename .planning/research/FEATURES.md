# Feature Research: v1.2 Settings UX Redesign

**Domain:** SaaS settings UX — invoicing operator console (Invios v1.2)
**Researched:** 2026-04-15
**Confidence:** HIGH (existing codebase fully audited; patterns from Linear, Vercel, shadcn confirmed)

---

## Feature Landscape

### Table Stakes (Users Expect These)

Features the settings area must have. Absence makes the product feel unfinished or untrustworthy.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Vertical sidebar navigation | Best-in-class SaaS (Linear, Vercel, Stripe) all use left-side nav for settings with 5+ sections; horizontal tabs overflow with 8 items | LOW | shadcn `Sidebar` component (late 2024) or flex-col `TabsList` — both production-ready. Route per section, not query params. |
| Per-tab URL routing | Users expect `/app/settings/profile` to work as a direct link from email notifications or bookmarks. Vercel design guidelines explicitly require deep-linking everything. | MEDIUM | File-system routes: `/app/settings/[section]/page.tsx`. Each section is its own page, sidebar is a shared layout. |
| Profile tab — name, email, avatar, password, danger zone | Every reference product consolidates personal identity, credentials, and destructive actions in one named section | MEDIUM | Avatar upload is new. `ChangePasswordSection` and `DeleteAccountSection` migrate from current Account tab. Name/email migrate from General. |
| Section-level save (not global save) | Linear, Vercel, Stripe all use per-section Save. Global save across tabs is ambiguous — users don't know what they're committing | MEDIUM | Current `SettingsWorkspace` monolith with one `saveAll()` must be retired. Each section component owns its own save state and Server Action call. |
| Branding consolidated into settings | Having `/app/branding` as a separate top-level page creates two mental models for "where do I configure my account." One settings entry point is the standard. | MEDIUM | `BrandingWorkspace` moves inside settings layout. `/app/branding` gets a 301 redirect to `/app/settings/branding`. |
| Business Info as a dedicated tab | Personal profile vs. business entity vs. payment details are three distinct concerns. Conflating them (as current General does with name) is confusing. | LOW | All fields already exist in `profiles` table: phone, website, address, tax_id, bank_name, account_number, iban, swift. Pure UI rearrangement, no schema change. |
| Mobile-responsive layout | Settings on small screens needs a workable nav — the current `lg:hidden` branding shortcut card is an acknowledged workaround, not a real solution | MEDIUM | On mobile: full-width section list as a navigation landing page (`/app/settings` root) before entering a section. On lg+: sidebar always visible. |
| Visual save feedback inline (not toast) | Toasts are missed; inline success/error below the Save button is the standard pattern and already used in `ChangePasswordSection` | LOW | Generalize the `{ type: "success" | "error"; text: string }` pattern from `ChangePasswordSection` into a shared `SaveFeedback` component. |
| Keyboard navigation across sidebar | WCAG 2.1 — sidebar nav must be operable with Tab, arrow keys, and Enter | LOW | shadcn Sidebar and Radix primitives handle this. Must add `aria-current="page"` on active item. |
| Danger zone visually separated | GitHub, Linear, and Vercel all use a red-border section at the bottom of the relevant page, not a separate tab | LOW | Already implemented in current `DeleteAccountSection` with `danger` prop on `Section`. Migrate the visual pattern to Profile tab. |

### Differentiators (Competitive Advantage)

Features that raise perceived quality above typical indie SaaS settings.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Per-event email notification toggles | Current implementation is a reminder config (days before/after). Linear's Dec 2024 redesign organizes by channel, then event type. Users want "invoice viewed" on, "reminder sent" off — not a master kill switch. | MEDIUM | New Emails tab. Per-event booleans: `invoice_sent`, `invoice_viewed`, `payment_recorded`, `quotation_accepted`, `reminder_sent`. Stored in `user_settings` as individual columns or JSONB. Saved per-toggle (optimistic `aria-checked` Switch, Server Action on change). |
| Integrations tab with honest empty state | A placeholder that shows what's coming (Xero, QuickBooks, Zapier) builds trust and manages expectations better than hiding the section entirely | LOW | Static page, integration card grid. Each card: logo + name + "Coming soon" badge. One CTA: "Request an integration" → mailto or Tally form. No backend needed. |
| Billing tab with current plan display | Even on free tier, showing "Free plan — what's included" with a future upgrade path is the standard. Users expect to know where they stand. | LOW | Static card, hard-coded "Free" plan for v1.2. Placeholder upgrade button. No Stripe integration — that is v2. |
| Avatar upload with initials fallback | Every best-in-class product (Linear, Vercel, Notion) shows initials when no avatar is set, and allows image upload. Currently Invios uses the initials-only Radix DropdownMenu avatar introduced in v1.1. | MEDIUM | File input → Supabase Storage upload (`avatars/[user_id]`) → signed URL stored in `profiles.avatar_url`. Crop is optional for v1.2 — upload and circle-fit is sufficient. |
| Hourly rate field in Profile | Freelancers track profitability per project. Storing hourly rate in profile enables future "time-to-invoice" features and signals product understanding of their workflow. | LOW | Single `numeric` field on `profiles` table (new column). No downstream consumers in v1.2 — purely for completeness and forward compatibility. |
| Document numbering per doc type | Users want INV-001 for invoices and QUO-001 for quotes — separate sequences. Currently one prefix+number setting covers both. | LOW | `user_settings` already has `invoice_prefix` and `next_invoice_number`. Add `quote_prefix` and `next_quote_number`. UI: two side-by-side numbering fields in General tab. |
| Date format preference | UAE users prefer DD/MM/YYYY; international clients expect YYYY-MM-DD. Per-account date format is a localization detail that matters. | LOW | New `user_settings` column: `date_format` enum (e.g., `'DD/MM/YYYY'`, `'MM/DD/YYYY'`, `'YYYY-MM-DD'`). Applied at document render and all date displays. |

### Anti-Features (Avoid)

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Global save button spanning all tabs | Feels safe — one save for everything | Users don't know what they're committing. Dirty state across 13 disparate fields is already confusing in current implementation. | Per-section Save button. Each section is self-contained, saves independently. |
| Live autosave on every keystroke | Feels modern, like Google Docs | Network noise, race conditions on slow connections, removes user's ability to discard accidental edits | Explicit Save button with dirty indicator per section. |
| Image crop modal for avatar | Polished feel | Canvas API or third-party library (react-image-crop), accessibility burden, significant complexity for a marginal gain at solo-operator scale | Upload and circle-fit. User reuploads if composition is bad. |
| Dark mode toggle | Power user appeal | HSL token system and brand-color theming make dark mode a full-surface redesign, not a CSS variable swap | Ship light-only for v1.2. Dark mode is a post-PMF feature. |
| Tab state via query params | Enables deep linking | Less semantically meaningful than route segments, breaks browser back behavior, invisible in address bar on mobile | File-system routes per section: `/app/settings/profile`, `/app/settings/branding`, etc. |
| Notification digest / summary emails | Advanced preference users want it | Requires email scheduling infrastructure beyond Resend one-shot sends; digest queue and per-user frequency logic is v2 email infra. | Ship per-event boolean toggles. Frequency/digest is a v2 story. |
| Two-factor authentication settings | Security-conscious users expect it | Supabase Auth MFA (TOTP) requires enrollment flows, recovery codes, and session management — not a settings UX problem but a separate auth surface | Placeholder text "Two-factor authentication — Coming soon" in Profile security section. No interactive UI. |
| Settings search / command palette | Power user productivity | Adds significant complexity for a settings surface with 8 sections and ~30 total fields — overkill at this scale | Well-labeled sidebar items with descriptive section titles are sufficient. |

---

## Feature Dependencies

```
Vertical sidebar navigation (SET-01)
    └── required by all other tabs (SET-02 through SET-08)
    └── requires route restructure

Per-tab URL routing (/app/settings/[section])
    └── required by sidebar (SET-01)
    └── requires file-system route segments, not query params
    └── requires shared layout: /app/settings/layout.tsx

Profile tab (SET-02)
    └── consolidates: fullName, email (from current General tab)
    └── consolidates: ChangePasswordSection (from current Account tab)
    └── consolidates: DeleteAccountSection (from current Account tab)
    └── adds: avatar upload (new — Supabase Storage + profiles.avatar_url)
    └── adds: hourly_rate (new — profiles column)

Branding tab (SET-03)
    └── absorbs: BrandingWorkspace component
    └── requires: 301 redirect /app/branding → /app/settings/branding
    └── no logic changes to BrandingWorkspace

Business Info tab (SET-04)
    └── uses existing: profiles columns (phone, website, address, tax_id,
        bank_name, account_number, iban, swift)
    └── no schema changes needed

General tab (SET-05)
    └── loses: fullName (moves to Profile)
    └── retains: currency, language, tax rate, tax enabled, timezone, default notes, default terms
    └── gains: date_format (new user_settings column)
    └── gains: quote_prefix + next_quote_number (new user_settings columns)

Emails tab (SET-06)
    └── requires: new per-event boolean columns in user_settings
        (invoice_sent, invoice_viewed, payment_recorded,
         quotation_accepted, reminder_sent)
    └── consumed by: reminder cron and future notification sends

Integrations tab (SET-07)
    └── no backend dependencies — static content only

Billing tab (SET-08)
    └── no backend dependencies for v1.2 — static content only

Per-section Save pattern
    └── conflicts with: global isDirty + saveAll() in current SettingsWorkspace
    └── replaces: SettingsWorkspace monolith → individual section components
    └── each section: owns dirty state, calls its own Server Action
```

### Dependency Notes

- **Route restructure is the load-bearing change.** Moving from a single `/app/settings` page with client-side tabs to `/app/settings/[section]` file-system routes is the highest-complexity structural change in the milestone. Every other tab depends on it being done first.
- **Branding absorption requires redirect.** Existing users may have `/app/branding` bookmarked. A Next.js `permanentRedirect` in the old route is essential to prevent broken links.
- **Per-section save conflicts with the current monolith.** The `SettingsWorkspace` dirty-detection model (`isDirty` across 13 fields, one `saveAll()`) must be retired. This is a refactor, not an extension — the monolith does not survive the redesign.
- **Emails tab requires a schema migration.** Current `user_settings` has reminder fields only. Per-event toggles need at minimum 5 new boolean columns (or a JSONB preferences field). Migration must ship before the Emails tab can be functional.
- **Avatar upload requires Supabase Storage bucket.** A `avatars` bucket with appropriate RLS policies must exist before the upload flow can work. If the bucket doesn't exist, this needs provisioning as part of the phase.

---

## MVP Definition

### Launch With (v1.2)

All 8 SET requirements from PROJECT.md. These define the milestone.

- [ ] **Vertical sidebar nav + URL routing** — structural foundation, required first (SET-01)
- [ ] **Profile tab** — name, email (read-only), avatar upload, hourly rate, password, danger zone (SET-02)
- [ ] **Branding tab** — BrandingWorkspace absorbed, /app/branding redirects here (SET-03)
- [ ] **Business Info tab** — business details + payment details from profiles table (SET-04)
- [ ] **General tab** — restructured: language, currency, tax, date format, doc numbering per type, default notes/terms (SET-05)
- [ ] **Emails tab** — per-event notification toggles with Switch components (SET-06)
- [ ] **Integrations tab** — honest "coming soon" placeholder (SET-07)
- [ ] **Billing tab** — current plan display placeholder (SET-08)

### Add After Validation (v1.x)

- [ ] **Dark mode** — full token audit, system preference detection, significant design cost
- [ ] **Two-factor authentication** — Supabase MFA enrollment flow, separate auth surface
- [ ] **Notification digest preferences** — email scheduling infrastructure prerequisite
- [ ] **Avatar crop UI** — only if upload-and-fit proves inadequate based on user feedback

### Future Consideration (v2+)

- [ ] **Integrations (live)** — Xero, QuickBooks, Zapier; needs OAuth connection management
- [ ] **Billing (live)** — Stripe subscription management, plan upgrades, invoice history
- [ ] **Team members** — multi-seat, roles/permissions; entire new surface area
- [ ] **Settings search** — only worthwhile when settings surface area exceeds ~50 configurable fields

---

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Vertical sidebar + URL routing | HIGH | MEDIUM | P1 |
| Profile tab consolidation | HIGH | MEDIUM | P1 |
| Per-section save pattern (refactor) | HIGH | MEDIUM | P1 |
| Branding tab absorption + redirect | HIGH | LOW | P1 |
| Business Info tab | HIGH | LOW | P1 |
| General tab (restructured) | HIGH | LOW | P1 |
| Emails tab (per-event toggles) | HIGH | MEDIUM | P1 |
| Integrations tab (placeholder) | MEDIUM | LOW | P1 |
| Billing tab (placeholder) | MEDIUM | LOW | P1 |
| Avatar upload | MEDIUM | MEDIUM | P1 |
| Date format preference | MEDIUM | LOW | P1 |
| Doc numbering per type (quotes) | MEDIUM | LOW | P1 |
| Hourly rate field | LOW | LOW | P2 |
| 2FA placeholder text | LOW | LOW | P2 |
| Password visibility aria-label fix | LOW | LOW | P2 — accessibility debt in current code |

---

## Competitor Feature Analysis

| Feature | Linear (2024-2026) | Vercel Dashboard | Our Approach |
|---------|-------------------|-----------------|--------------|
| Settings nav structure | Left sidebar, 4 sections: Account / Features / Administration / Teams | Left sidebar, unified across team+project levels | Left sidebar, 8 sections — same model |
| URL routing | Route per section | Route per section | `/app/settings/[section]` file-system routes |
| Notification organization | By channel (desktop/mobile/email/Slack), then event type per channel | Per-event toggles in Notifications section | Per-event toggles in Emails tab (email channel only for v1.2) |
| Save pattern | Per-section Save button | Per-section Save button | Per-section Save (refactor from current global) |
| Danger zone placement | Bottom of Account section, red border | Bottom of Account section | Bottom of Profile tab, red border |
| Integrations | Full OAuth connection management | Full OAuth, storage, domains | Static "coming soon" placeholder |
| Billing | Full Stripe subscription UI + usage | Full subscription + usage UI | Static current plan + future upgrade CTA |
| Avatar | Initials fallback + upload | Initials fallback + upload | Upload + circle-fit, initials fallback |
| Mobile nav | Bottom sheet for settings navigation | Floating bottom bar | Section list at `/app/settings` root on mobile, sidebar on lg+ |
| Branding/appearance | Theme settings in Account | Appearance tab in Account | Full Branding tab (logo, colors, layouts) |

---

## Existing Component Inventory (v1.2 Dependencies)

Components that exist and must be migrated or extended — not rebuilt from scratch.

| Component | Current Location | v1.2 Action |
|-----------|-----------------|-------------|
| `SettingsWorkspace` | `src/components/app/settings-workspace.tsx` | Retire monolith. Split into per-section components. |
| `BrandingWorkspace` | `src/components/app/branding-workspace.tsx` | Move inside settings layout. No logic changes. |
| `ChangePasswordSection` | Inside `SettingsWorkspace` | Extract as standalone component → Profile tab. |
| `DeleteAccountSection` | Inside `SettingsWorkspace` | Extract as standalone component → Profile tab danger zone. |
| `app-sidebar-nav.tsx` | `src/components/app/app-sidebar-nav.tsx` | Inspect to understand existing sidebar pattern before building settings sidebar. |
| `saveGeneralSettingsAction` | `src/actions/app.ts` | Keep. Refactor to exclude fullName (moves to profile action). |
| `saveInvoiceDefaultsAction` | `src/actions/app.ts` | Keep. Rename or extend for General tab. |
| `saveNotificationsAction` | `src/actions/app.ts` | Extend to handle per-event boolean toggles (Emails tab). |
| `signOutAction`, `changePasswordAction`, `deleteAccountAction` | `src/actions/auth.ts` | Keep as-is. |
| `Switch` (shadcn) | `src/components/ui/` | Verify it exists and has `aria-checked`. If not, add it — required for Emails tab toggles. |

---

## Accessibility Requirements (Non-Negotiable)

These are baseline expectations for any settings interface in 2025+.

| Pattern | Requirement | Implementation |
|---------|-------------|----------------|
| Sidebar nav | `role="navigation"`, `aria-label="Settings navigation"`, `aria-current="page"` on active item | shadcn Sidebar or custom `<nav>` with Radix primitives |
| Notification toggles | `role="switch"`, `aria-checked`, visible text label, 44x44px min touch target | shadcn `Switch` component (wraps Radix `Switch`) — check if already in project |
| Confirmation dialogs | `role="alertdialog"`, `aria-labelledby`, `aria-describedby`, focus trap on open | shadcn `Dialog` (Radix) — already used in `DeleteAccountSection` |
| Form field labels | Every `<input>` has an associated `<label>` or `aria-label` | Existing `Field` component already handles this — generalize it |
| Save feedback | `aria-live="polite"` live region for inline save success/error messages | Current implementation uses visual-only divs — must add `aria-live` |
| Password visibility toggle | `aria-label` must update: "Show password" / "Hide password" | Current `PasswordInput` uses `tabIndex=-1` button with no `aria-label` — known accessibility debt, fix in v1.2 |
| Keyboard sidebar navigation | Tab to focus sidebar, arrow keys to move between items, Enter to navigate | Radix primitives handle this if used; verify with keyboard-only test |

---

## Sources

- Linear Changelog — [Personalized sidebar and new settings pages, Dec 2024](https://linear.app/changelog/2024-12-18-personalized-sidebar)
- Linear — [How we redesigned the Linear UI](https://linear.app/now/how-we-redesigned-the-linear-ui)
- Vercel — [New dashboard navigation](https://vercel.com/changelog/new-dashboard-navigation-available)
- Vercel — [Dashboard redesign rollout (Feb 2026)](https://vercel.com/changelog/dashboard-navigation-redesign-rollout)
- shadcn/ui — [Vertical Tabs Layout Pattern](https://www.shadcn.io/patterns/tabs-layout-1)
- shadcn/ui — [Account Danger Zone block](https://www.shadcn.io/blocks/account-danger-zone-01)
- TestParty — [Accessible Toggle Buttons in Modern Web Apps](https://testparty.ai/blog/accessible-toggle-buttons-modern-web-apps-complete-guide)
- W3C WAI-ARIA — [ARIA Practices Guide](https://wai-aria-practices.netlify.app/aria-practices/)
- Smashing Magazine — [How to Manage Dangerous Actions in UIs (2024)](https://www.smashingmagazine.com/2024/09/how-manage-dangerous-actions-user-interfaces/)
- Existing codebase audit: `settings-workspace.tsx` (629 lines), current tab structure, action signatures, component inventory

---

*Feature research for: Invios v1.2 Settings UX Redesign*
*Researched: 2026-04-15*
