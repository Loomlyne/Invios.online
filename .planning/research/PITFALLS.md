# Pitfalls Research

**Domain:** Settings UX redesign — sidebar nav, monolith decomposition, file uploads, form dirty state, accessibility
**Researched:** 2026-04-15
**Confidence:** HIGH (grounded in reading the actual existing implementation)

---

## Critical Pitfalls

### Pitfall 1: Global dirty state breaks per-section independent saves

**What goes wrong:**
The current `settings-workspace.tsx` uses a single `isDirty` flag, a single `saving` boolean, and a single `saveAll()` that fires three Server Actions in parallel. When the workspace is split into multiple sidebar sections (Profile, General, Branding, Emails, etc.) each with their own Save button, carrying this pattern forward means every section must still share one save call — or you introduce multiple disconnected dirty states that don't reflect reality. The failure mode: user edits Profile, switches to General, makes an edit, hits Save — saves General but silently drops the Profile edit, or saves everything at once when the user intended to save only General.

**Why it happens:**
The monolith works because there is one save button for one blob of state. When sections split, developers copy the existing pattern per-section and forget that `savedProfile.current` and `savedSettings.current` are now duplicated across components with no shared coordinator. Alternatively they keep a global coordinator but the UI shows per-section save buttons — creating a misleading contract.

**How to avoid:**
Commit to one model before writing any section component — do not hybrid:
- **Model A — Per-section independent save (recommended):** Each section owns its own state slice, its own `isDirty`, its own `saving`, its own Server Action call. The save button is scoped to that section's card. Tab switching does not trigger saves.
- **Model B — Global save with dirty indicator per section:** One lifted state, one Save button in the sidebar header. Section indicators show unsaved dots.

Model A is recommended because sections like Billing and Integrations are pure placeholders (no form state), and the Password section is already self-contained in the existing code. Model A maps cleanly onto the new structure.

**Warning signs:**
- A `useEffect` syncing state between section components
- A `savedRef` defined at the layout level but mutated inside a section component
- A Save button disabled when `!isDirty` but `isDirty` encompasses fields from a different visible tab

**Phase to address:**
Phase 1 (Sidebar scaffold + state architecture). Lock the model before any section content is written.

---

### Pitfall 2: Branding route consolidation creates a split-brain at `/app/branding`

**What goes wrong:**
`/app/branding` is a live, navigable route with its own `page.tsx` and `BrandingWorkspace` component. When branding moves into the settings sidebar as a tab, the old route still exists. Users with bookmarks, the existing mobile shortcut link in `settings-workspace.tsx` (`href="/app/branding"`), and any nav items pointing to it still work — but they land on the old standalone page, not the unified settings experience. This creates two places to edit branding with potentially diverging save logic.

**Why it happens:**
Developers add the Branding tab to settings, test it there, and forget to redirect or remove the old route. `BrandingWorkspace` continues to work independently.

**How to avoid:**
In the same phase that the Branding tab is added to settings:
1. Add a `redirect("/app/settings?section=branding")` to `/app/branding/page.tsx` immediately — before the tab content is even complete.
2. Remove the `href="/app/branding"` shortcut link in `settings-workspace.tsx` (the mobile `lg:hidden` card).
3. Update any sidebar nav links in `AppShell` / bottom nav that point to `/app/branding`.
4. After verification, delete `src/app/(app)/app/branding/` entirely.

The redirect must go in before anything else. It costs 3 lines and prevents the split-brain from ever existing.

**Warning signs:**
- `/app/branding` returns 200 after the Branding tab is live in settings
- `BrandingWorkspace` is imported in two places simultaneously
- Bottom nav or sidebar nav still lists Branding as a top-level destination

**Phase to address:**
Phase 2 (Branding tab consolidation). Day one of that phase: add the redirect.

---

### Pitfall 3: Avatar upload reuses branding storage paths and breaks signed URL flow

**What goes wrong:**
The existing branding upload flow (logo, signature, favicon, custom fonts) goes through Server Actions that write to Supabase Storage. When avatar upload is added to the Profile tab, it is tempting to reuse the same upload action pattern. Avatar images are user identity assets, not document branding assets. They belong in a different storage path with different public/private rules. If they land in the same bucket as logos, a public bucket means avatar URLs are guessable; a private bucket means the avatar needs a signed URL refreshed on every page load — adding latency to the layout render.

The existing pattern uses `useRef<HTMLInputElement>` → `onChange` → `FormData` → Server Action. Avatar upload adds a client-side preview requirement (show the image immediately without a round-trip). If the preview is wired to the Supabase signed URL (which expires in 1 hour), the preview breaks after token expiry even though the image is still saved.

**How to avoid:**
- Use a separate storage path: `avatars/{userId}/avatar.{ext}` distinct from `branding/{userId}/logo.{ext}`.
- Store the avatar URL as a permanent public URL (if the avatars bucket is public) or as a path that is re-signed in `getAppContext` alongside `logoUrl` and `signatureUrl`.
- For client-side preview: use `URL.createObjectURL(file)` on the selected file immediately, and only replace it with the persisted URL after the upload Server Action returns. Do not use the Supabase signed URL as the preview source.
- Add avatar URL to the `previewData` shape in `AppContext` so the layout and sidebar avatar can read it from the same server-fetched source.

**Warning signs:**
- Avatar URL stored in `userState.profile` but not fetched through `getAppContext`'s URL-signing path
- `<img src={supabaseSignedUrl}>` with a 1-hour expiry used as the live preview
- Avatar and logo assets sharing the same storage bucket with the same RLS policy

**Phase to address:**
Phase 3 (Profile tab — avatar upload). Audit storage bucket config before writing the upload action.

---

### Pitfall 4: Sidebar on mobile collapses to nothing — sections become unreachable

**What goes wrong:**
A vertical sidebar that works at desktop width has no natural mobile equivalent. The most common mistake is hiding the sidebar on mobile (`hidden lg:block`) and showing only the active section's content — but then there is no way to switch sections. The second most common mistake is rendering the sidebar as a horizontal scroll strip, which clips on narrow viewports and is unusable one-handed.

The existing settings page uses horizontal `<Tabs>` which degrade gracefully on mobile (shadcn Tabs scroll natively). A vertical sidebar does not degrade gracefully by default.

**How to avoid:**
Design the mobile pattern explicitly before coding it:
- **Recommended:** On mobile, render a "section picker" as a full-width list (native settings app pattern). Tapping a section navigates to a detail view showing only that section's content, with a back button. This is a two-level navigation pattern.
- **Alternative:** A sheet/drawer triggered by a menu button, listing all sidebar sections. Selecting closes the drawer and activates the section.
- Do not use `overflow-x: auto` on the sidebar — it looks broken on iOS Safari.
- The `lg:` breakpoint (1024px) is the correct split point per the project's design system. Below `lg`, the sidebar must be replaced entirely, not just shrunk.

**Warning signs:**
- `hidden lg:flex` on the sidebar with no mobile fallback component
- Sidebar items that are accidentally clickable on mobile because the sidebar is narrow but not fully hidden
- Settings page passing a11y audit on desktop but failing on mobile because section switching is impossible

**Phase to address:**
Phase 1 (Sidebar scaffold). Mobile pattern must be decided and stubbed before any section content is added.

---

### Pitfall 5: `searchParams`-based section navigation uses `router.push` and pollutes history

**What goes wrong:**
The current settings page uses `?section=general` via `searchParams` to set the initial tab. When the sidebar navigation updates the URL to `?section=profile`, if `router.push` is used, switching sections pushes a new history entry. The browser back button now steps through every section the user visited inside settings, instead of returning to the previous page (e.g., the dashboard). Navigating Profile → General → Branding → Emails requires four back presses to leave settings.

**Why it happens:**
Using `router.push` for section changes (to keep the URL in sync for bookmarkability) creates history entries. This is correct for top-level navigation but wrong for within-page tab switching.

**How to avoid:**
Use `router.replace` instead of `router.push` when switching settings sections. This updates the URL (preserving deep-link bookmarkability and the initial `searchParams` pattern already in place) without stacking history entries. The user's back button returns to wherever they came from before settings, not to the previous settings section.

**Warning signs:**
- `router.push(\`/app/settings?section=\${section}\`)` in sidebar item click handlers
- Settings section history visibly building up when pressing the browser back button during testing

**Phase to address:**
Phase 1 (Sidebar scaffold). The click handler for sidebar items must use `replace`, not `push`.

---

### Pitfall 6: Notification toggles fire concurrent Server Actions instead of saving on explicit commit

**What goes wrong:**
Email notification preference toggles (new Emails tab) are tempting to wire as `onChange → Server Action` — save on every toggle flip. This creates two problems: rapid toggling fires multiple concurrent Server Actions, potentially leaving the DB in a race-condition state; and if the action fails midway, the toggle UI shows the wrong state while the DB has the old value.

**Why it happens:**
Toggle switches feel like they should save immediately (like a native mobile toggle). Developers skip the Save button for toggles because it feels redundant.

**How to avoid:**
Two valid approaches:
- **Optimistic UI with revert:** Flip the toggle UI immediately, fire the Server Action, revert to previous state on error and show a toast. Requires storing `previousValue` before the optimistic update.
- **Explicit save button (recommended):** Keep the per-section Save pattern consistent. Toggles update local state only; the section save button commits them. Simpler, consistent with the rest of settings, and avoids race conditions entirely.

Do not fire a Server Action per toggle-flip without debounce.

**Warning signs:**
- `onCheckedChange={(checked) => saveNotificationAction({ ...prefs, [key]: checked })}` directly in a Switch component
- No loading state on individual toggles (means no feedback if save fails)
- Network tab showing multiple overlapping fetch calls to the same action when toggles are clicked quickly

**Phase to address:**
Phase 4 (Emails tab). Establish the pattern before implementing any toggle.

---

### Pitfall 7: `SettingsSection` type and `validSections` Set diverge silently

**What goes wrong:**
`SettingsSection` is currently `"general" | "invoices" | "notifications" | "account"`. When the redesign adds new sections (`"profile"`, `"branding"`, `"business"`, `"emails"`, `"integrations"`, `"billing"`), the type must be updated. The existing `validSections` Set in `settings/page.tsx` is a manual `new Set<SettingsSection>([...])`. Adding a new union member to the type does not automatically update the Set. Result: `?section=profile` silently falls through to `"general"`. No error thrown.

**Why it happens:**
The type and the validation set are two separate constructs. TypeScript catches type errors in the Set literal only if you annotate it with the full union — most developers don't.

**How to avoid:**
Replace the manual Set with a derived constant that is the single source of truth:
```ts
export const SETTINGS_SECTIONS = [
  "profile", "branding", "business", "general", "emails", "integrations", "billing"
] as const;
export type SettingsSection = typeof SETTINGS_SECTIONS[number];
```
Then `settings/page.tsx` imports and uses `new Set(SETTINGS_SECTIONS)`. TypeScript will error if a section string in the array is not handled in a switch/conditional. Any new section added to the array automatically appears in both the type and the validation set.

**Warning signs:**
- `?section=profile` in the URL but the General tab is active
- `SettingsSection` type updated in `types.ts` but `validSections` in `page.tsx` still lists old values
- A new sidebar section is clickable and navigates but always renders the default section content

**Phase to address:**
Phase 1 (Sidebar scaffold). Fix the type architecture before any section content is built.

---

### Pitfall 8: Hidden file input unmounts during re-render, breaking the ref

**What goes wrong:**
The avatar and logo upload flows use `useRef<HTMLInputElement>` for the hidden file input, triggering `ref.current.click()` from a button. If the parent component re-renders (e.g., a save action completing and updating state) and the input is conditionally rendered, the ref detaches. `ref.current` becomes `null` on the next click. The existing branding workspace handles this correctly — all four file inputs (`logoInputRef`, `signatureInputRef`, `faviconInputRef`, `fontInputRef`) are always rendered in the DOM. When the branding upload is refactored into the new Branding settings section, developers may conditionally render the hidden input as an optimization, breaking the ref.

**How to avoid:**
Always render the hidden file input unconditionally in the DOM — use `className="sr-only"` or `style={{ display: 'none' }}` rather than conditional rendering. Never unmount it. Never create refs inside conditional blocks.

**Warning signs:**
- `Cannot read properties of null (reading 'click')` in console when clicking the upload button a second time
- File input rendered inside `{showUpload && <input ref={inputRef} .../>}`

**Phase to address:**
Phase 2 (Branding tab) and Phase 3 (Profile/avatar). Apply at both upload touchpoints.

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Keep `BrandingWorkspace` at `/app/branding` alongside new settings Branding tab | Zero migration effort | Split-brain state, two edit paths, user confusion | Never — add redirect immediately |
| Share global `isDirty` across all settings sections | Simple implementation | Save button state lies to the user; wrong fields saved | Never in a per-section save model |
| Use `router.push` instead of `router.replace` for section switching | Works on first build | Back button trapped inside settings history | Never — costs nothing to fix |
| Skip mobile sidebar and link to individual section URLs from a settings landing page | Avoids two-level nav complexity | Settings feels like disconnected pages, not a workspace | Acceptable as Phase 1 stub if mobile nav is clearly marked TODO |
| Fire Server Action per toggle flip (no Save button on Emails tab) | Toggle feels instant | Race conditions, confusing failure states, inconsistency | Only with full optimistic UI + revert logic |

---

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Supabase Storage (avatar upload) | Reuse same bucket and RLS policy as branding assets | Separate `avatars/` path; sign URL in `getAppContext` alongside `logoUrl` |
| Supabase Auth (password change) | Call `supabase.auth.updateUser` from a Client Component | Route through existing `changePasswordAction` Server Action — already implemented |
| Supabase Auth (avatar in session) | Store avatar as Supabase user metadata and rely on session for freshness | Store in `profiles` table, fetch in `getAppContext`, treat like any other profile field |
| shadcn Switch component | Wire `onCheckedChange` directly to a Server Action | Update local state only; commit on section Save |
| Next.js `searchParams` (section routing) | `router.push` for section navigation | `router.replace` — same URL update, no history pollution |
| Next.js App Router layout | Re-fetch `getAppContext` on every section switch | `getAppContext` runs once at page load; section switching is client-side state only |

---

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Re-running `getAppContext` on every section change | Network waterfall on each sidebar click | Section switching must be client-side state only — data passed as props once | Immediately on first tab switch if Next.js navigation is used instead of client state |
| Mounting `InvoicePreview` (Playwright-heavy) in Branding tab without `next/dynamic + ssr:false` | Slow settings page load; SSR error if preview uses browser APIs | Wrap InvoicePreview in `dynamic(() => import(...), { ssr: false })` | Always, especially on low-end mobile |
| Avatar `<img>` without `next/image` | Layout shift on profile tab load | Use `next/image` with explicit width/height on avatar; `priority` if above the fold | At slow connections |
| Fetching signed URL for avatar inside a Client Component | Signed URL request happens on every render | Sign in `getAppContext` server-side, pass as a prop | On every client component re-mount |

---

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| Returning raw Supabase Storage path (not a signed URL) as the avatar URL | Guessable URLs expose private user assets | Always sign storage URLs server-side in `getAppContext`; never expose raw bucket paths to the client |
| Accepting avatar MIME type from the client's `file.type` field | Malicious file disguised as image/jpeg bypasses check | Validate MIME type server-side, or restrict to `image/*` at the Storage bucket level via RLS |
| Simplifying `changePasswordAction` during refactor | Accidental removal of `currentPassword` verification enables account takeover | Preserve `changePasswordAction` exactly — it is already correctly implemented |
| Removing the "DELETE" typed confirmation from the danger zone | Accidental account deletion with one click | Preserve `DeleteAccountSection` exactly as-is during the refactor |

---

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| No unsaved changes warning when navigating away from a dirty section | User loses edits silently | Show a persistent "unsaved changes" banner or confirmation dialog when `isDirty === true` and the user navigates away |
| Save button disabled until a field changes, but disabled state looks like broken UI | User thinks Save is broken | Muted/ghost when disabled, accent/filled when enabled — always show "Save changes" text |
| Sidebar section indicators have no active state in mobile fallback | User doesn't know which section they are editing | Active section visually distinct in both desktop sidebar and mobile section picker |
| Integrations and Billing tabs are empty white cards | Looks like a bug, not a roadmap | Render a "Coming soon" card with a brief description and a disabled CTA |
| Avatar upload accepts a raw 4MB photo with no resize | Slow upload, oversized storage, distorted avatar circle | Client-side resize to 256×256px before upload using `canvas.toBlob()` at 0.85 quality |

---

## "Looks Done But Isn't" Checklist

- [ ] **Branding route redirect:** `/app/branding` returns 200 — if it does, the old route was not removed. Verify it redirects to `/app/settings?section=branding`.
- [ ] **Section deep-link:** `?section=profile` in URL activates the Profile tab. If General renders instead, `validSections` Set was not updated.
- [ ] **Mobile section switching:** On a 375px viewport, every section is reachable without horizontal scroll. If not, the mobile nav pattern is missing.
- [ ] **Avatar signed URL in layout:** The sidebar avatar renders from `getAppContext` data, not a placeholder. If it shows initials only, the URL is not being passed through.
- [ ] **Dirty state isolation:** Editing Profile, switching to General, then clicking Save saves General only — not Profile. If both save, dirty state is global.
- [ ] **Back button behavior:** Navigating Profile → General → Branding → pressing browser back goes to dashboard, not Branding. If it goes to Branding, `router.push` is being used.
- [ ] **Notification toggles:** Rapidly toggling 3 switches and clicking Save fires exactly one Server Action with the final state. If the network tab shows 3 calls, toggles are saving on change.
- [ ] **Password section isolation:** Password change fields clear after a successful update and are not wired to the general section `isDirty`.

---

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Branding split-brain (both routes live in production) | LOW | Add `redirect()` to `/app/branding/page.tsx`; update all nav links; delete the page file |
| Global dirty state distributed across sections | MEDIUM | Identify shared ref or state; move into each section component; add per-section `savedRef` |
| Section navigation using `router.push` (history pollution already shipped) | LOW | Find all `router.push` calls in sidebar click handler; change to `router.replace` |
| Avatar in wrong storage bucket with wrong RLS | MEDIUM | Migration to move avatars to correct path; update `getAppContext` signing path; update storage RLS |

---

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Global dirty state breaks per-section saves | Phase 1 — Sidebar scaffold + state architecture | Tab switch + edit + save = only active section saved |
| Branding route consolidation leaves dead `/app/branding` | Phase 2 — Branding tab | `/app/branding` returns 301 redirect |
| Avatar upload breaks storage rules | Phase 3 — Profile tab | Avatar URL signed in `getAppContext`, separate path from branding assets |
| Mobile sidebar has no section switching | Phase 1 — Sidebar scaffold | 375px viewport: all sections reachable |
| Back button history pollution | Phase 1 — Sidebar scaffold | Browser back from settings returns to dashboard, not previous section |
| Notification toggles fire concurrent Server Actions | Phase 4 — Emails tab | Network tab shows 1 action call on Save, not per-toggle |
| `SettingsSection` type / `validSections` Set diverge | Phase 1 — Sidebar scaffold | `?section=profile` URL activates Profile tab |
| File upload ref detaches on re-render | Phase 2 (branding) + Phase 3 (avatar) | Upload button works after a save action completes |

---

## Sources

- Direct code reading: `src/components/app/settings-workspace.tsx` — monolith under refactor; source of dirty state, saveAll, validSections pattern
- Direct code reading: `src/components/app/branding-workspace.tsx` — route being consolidated; source of upload ref pattern
- Direct code reading: `src/app/(app)/app/settings/page.tsx` — searchParams + validSections Set
- Direct code reading: `src/app/(app)/app/layout.tsx` — brand token injection, AppShell wiring
- Direct code reading: `src/lib/types.ts` — SettingsSection, BrandingSection union types
- Project memory: `technical_v11_research.md` — next/dynamic+ssr:false for InvoicePreview, FormData patterns
- Project memory: `feedback_detail_header_layout.md` — responsive breakpoint strategy, lg=1024px split point
- Project memory: `feedback_use_server_exports.md` — Server Action constraints (async functions only)
- Project context: `PROJECT.md` — v1.2 milestone requirements SET-01 through SET-08

---
*Pitfalls research for: Settings UX redesign in Next.js 15 App Router + shadcn/ui + Supabase*
*Researched: 2026-04-15*
