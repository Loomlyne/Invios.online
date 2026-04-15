# Architecture Research

**Domain:** Settings UX Redesign — Sidebar-based multi-section settings in Next.js App Router SaaS
**Researched:** 2026-04-15
**Confidence:** HIGH

## Standard Architecture

### System Overview

```
┌──────────────────────────────────────────────────────────────────┐
│  Route: /app/settings  (single server page, no sub-segments)     │
├──────────────────────────────────────────────────────────────────┤
│  page.tsx (Server Component)                                     │
│    └── getAppContext()  →  AppContext                            │
│    └── <SettingsShell context={context} />                      │
├──────────────────────────────────────────────────────────────────┤
│  SettingsShell (Client Component — layout only)                  │
│    ├── SettingsSidebar (nav, section state owner)               │
│    └── <section panel> (swapped in-place, no navigation)        │
├──────────────────────────────────────────────────────────────────┤
│  Section Panels (Client Components, each self-contained)         │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐           │
│  │ Profile  │ │ Branding │ │ Business │ │ General  │           │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘           │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐                         │
│  │  Emails  │ │Integrat. │ │ Billing  │                         │
│  └──────────┘ └──────────┘ └──────────┘                         │
├──────────────────────────────────────────────────────────────────┤
│  Server Actions  (src/actions/app.ts, src/actions/auth.ts)       │
│  One action per section — no cross-section Promise.all()         │
├──────────────────────────────────────────────────────────────────┤
│  Data layer: Supabase (profiles, branding, user_settings tables) │
└──────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Implementation |
|-----------|----------------|----------------|
| `settings/page.tsx` | Fetch AppContext, resolve active section from `?section=` searchParam, render shell | Server Component, async |
| `SettingsShell` | Own `activeSection` state, render sidebar + active panel side by side | `'use client'`, no data fetching |
| `SettingsSidebar` | Render nav items, emit section changes, show active indicator | Pure presentational client component |
| `ProfilePanel` | fullName, avatar upload, hourly rate, password change, sign out, danger zone | Client Component, owns its own save state |
| `BrandingPanel` | Colors, logo, header cover, invoice layouts, page background (migrated from /app/branding) | Client Component, formData-based actions |
| `BusinessInfoPanel` | Business name, email, phone, address, TRN, bank details, IBAN, SWIFT | Client Component |
| `GeneralPanel` | Language, currency, tax, numbering prefixes, payment terms, date format, notes, auto-receipt | Client Component |
| `EmailsPanel` | Reminder toggles per event type | Client Component |
| `IntegrationsPanel` | Placeholder list of third-party connections | Client Component (stub) |
| `BillingPanel` | Subscription/plan status | Client Component (stub) |

## Recommended Project Structure

```
src/
├── app/(app)/app/settings/
│   └── page.tsx                          # MODIFIED — updated section list, same shape
│
├── components/app/settings/
│   ├── settings-shell.tsx                # NEW — layout: sidebar + panel area (replaces SettingsWorkspace)
│   ├── settings-sidebar.tsx              # NEW — vertical nav, section switching
│   ├── panels/
│   │   ├── profile-panel.tsx             # NEW — fullName, avatar, hourly rate, password, danger zone
│   │   ├── branding-panel.tsx            # NEW — migrated from BrandingWorkspace identity/template tabs
│   │   ├── business-info-panel.tsx       # NEW — migrated from BrandingWorkspace business/documents tabs
│   │   ├── general-panel.tsx             # NEW — expanded from SettingsWorkspace general/invoices tabs
│   │   ├── emails-panel.tsx              # NEW — expanded from SettingsWorkspace notifications tab
│   │   ├── integrations-panel.tsx        # NEW — stub
│   │   └── billing-panel.tsx             # NEW — stub
│   └── shared/
│       ├── settings-section.tsx          # Shared Section+Field primitives (extracted from current file)
│       └── password-input.tsx            # Extracted from current ChangePasswordSection
│
├── components/app/
│   ├── settings-workspace.tsx            # DELETED — replaced by settings-shell + panels
│   └── branding-workspace.tsx            # DELETED — content migrated into panels
│
├── app/(app)/app/branding/
│   └── page.tsx                          # MODIFIED — redirect to /app/settings?section=branding
│
└── actions/
    └── app.ts                            # UNCHANGED — actions already exist per-section
```

### Structure Rationale

- **`components/app/settings/`**: Keeps all settings UI co-located under a dedicated folder rather than polluting the flat `components/app/` list. Mirrors how the existing `invoices/`, `clients/` sub-directories work in `app/(app)/app/`.
- **`panels/` subfolder**: Each section panel is its own file. Prevents the current monolith pattern from re-emerging. Panels can grow independently without merge conflicts.
- **`shared/`**: `Section` and `Field` primitives already exist as local functions in `settings-workspace.tsx`. Promote them to shared components so all panels use identical visual language.

## Architectural Patterns

### Pattern 1: Client-Side Section Switching (not route segments)

**What:** `SettingsShell` owns `activeSection` as `useState`. The URL is synced via `router.replace('/app/settings?section=X', { scroll: false })` — deep-link-friendly but no full navigation.

**When to use:** Settings pages where all data is already loaded server-side, sections share the same AppContext, and sub-route navigation would trigger unnecessary re-fetches.

**Trade-offs:**
- Pro: No additional round-trips. AppContext fetched once at page load covers all sections.
- Pro: Instant tab switching — no loading states between sections.
- Pro: Consistent with how BrandingWorkspace already works today.
- Con: Back button navigates away from settings entirely instead of between sections — acceptable for settings UX.
- Con: Cannot use React Suspense streaming per-section — not needed here since all data arrives at once.

**Why NOT route segments (`/app/settings/profile`, `/app/settings/branding`):** Route segments would require either (a) re-fetching `getAppContext()` on every section switch, or (b) a shared layout that fetches context and passes it down — which effectively recreates what the single-page approach already does. Given all data is already in `AppContext`, route segments add complexity with no data-fetching benefit. The URL-synced state approach preserves deep links while avoiding the extra round trip.

**Example:**
```typescript
// settings-shell.tsx
'use client';
export function SettingsShell({ context, initialSection }: Props) {
  const router = useRouter();
  const [activeSection, setActiveSection] = useState<SettingsSection>(initialSection);

  const navigate = useCallback((section: SettingsSection) => {
    setActiveSection(section);
    router.replace(`/app/settings?section=${section}`, { scroll: false });
  }, [router]);

  return (
    <div className="flex gap-6">
      <SettingsSidebar active={activeSection} onNavigate={navigate} />
      <div className="flex-1 min-w-0">
        {activeSection === 'profile' && <ProfilePanel context={context} />}
        {activeSection === 'branding' && <BrandingPanel context={context} />}
        {/* ... */}
      </div>
    </div>
  );
}
```

### Pattern 2: Per-Section Independent Save

**What:** Each panel owns its own save button, loading state, and dirty detection. No cross-section `Promise.all()`.

**When to use:** When sections have unrelated data domains and coupling their saves creates false dependencies (e.g., changing a color should not fail because a notification preference has a validation error).

**Trade-offs:**
- Pro: Failure in one section does not block saving another. Cleaner error attribution.
- Pro: Each panel is independently testable.
- Pro: Matches how the existing branding actions already work (each tab in BrandingWorkspace saves independently).
- Con: User must save each section explicitly — no "save everything" shortcut. Acceptable for settings; this is the standard pattern (Stripe, Linear, Notion settings all work this way).

**Example:**
```typescript
// profile-panel.tsx
'use client';
export function ProfilePanel({ context }: { context: AppContext }) {
  const [fullName, setFullName] = useState(context.userState.profile.fullName);
  const savedFullName = useRef(context.userState.profile.fullName);
  const isDirty = fullName !== savedFullName.current;
  // save via saveProfileAction (new), update ref on success
}
```

### Pattern 3: Branding Consolidation via Redirect

**What:** `/app/branding` becomes a redirect to `/app/settings?section=branding`. The `BrandingWorkspace` component is removed. Branding content is split across two panels: `BrandingPanel` (visual identity — colors, logo, fonts, template) and `BusinessInfoPanel` (business details, bank info).

**When to use:** When an existing standalone page is being absorbed into a unified settings hub and external links to the old URL must remain valid.

**Trade-offs:**
- Pro: No broken links from sidebar nav, existing deep links, or mobile bottom nav.
- Con: Adds one redirect hop for any hardcoded `/app/branding` links in the codebase — these should be updated in the same phase.

**Redirect implementation:**
```typescript
// app/(app)/app/branding/page.tsx — after migration
import { redirect } from 'next/navigation';
export default function BrandingPage() {
  redirect('/app/settings?section=branding');
}
```

## Data Flow

### Request Flow (Page Load)

```
User navigates to /app/settings?section=branding
    ↓
settings/page.tsx (Server Component)
    ↓
getAppContext() — single fetch, covers ALL sections
    ↓ (AppContext includes profile, branding, settings, userState)
<SettingsShell context={context} initialSection="branding" />
    ↓
Client renders sidebar + active panel with data already in props
    ↓ (no additional fetches)
User interacts — instant section switches via useState
```

### Save Flow (Per Section)

```
User edits field in ProfilePanel
    ↓
Local useState update (dirty detection via useRef snapshot)
    ↓
User clicks "Save" (per-panel button)
    ↓
startTransition → saveProfileAction({...})
    ↓
Server action: validate (zod) → upsert Supabase → revalidatePath("/app/settings")
    ↓
ActionState returned → panel shows success/error inline
    ↓
On success: update savedRef snapshot, clear dirty state
```

### SettingsSection Type — Required Update

The existing `SettingsSection` type in `src/lib/types.ts` covers only the old tabs:
```typescript
// current — to be replaced
export type SettingsSection = "general" | "invoices" | "notifications" | "account";

// replacement
export type SettingsSection =
  | "profile"
  | "branding"
  | "business"
  | "general"
  | "emails"
  | "integrations"
  | "billing";
```

The `settings/page.tsx` `validSections` set must be updated to match. The `AppNavItemConfig` and `SetupItemStatus` types reference `SettingsSection | BrandingSection` for setup checklist links — update those links to use the new section keys.

## Integration Points

### Existing Code — Modified vs Deleted vs Unchanged

| File | Status | Change |
|------|--------|--------|
| `src/lib/types.ts` | MODIFIED | `SettingsSection` union expanded; `BrandingSection` type can be removed after migration |
| `src/app/(app)/app/settings/page.tsx` | MODIFIED | `validSections` set updated to new section keys; `initialSection` default changes to `"profile"` |
| `src/app/(app)/app/branding/page.tsx` | MODIFIED | Replace content with `redirect('/app/settings?section=branding')` |
| `src/lib/constants.ts` | MODIFIED | `appNavItems` branding entry href updated to `/app/settings?section=branding`, or branding removed as top-level nav item |
| `src/lib/setup.ts` | MODIFIED | Setup checklist branding step href updated |
| `src/actions/app.ts` | UNCHANGED | All save actions already exist and are section-scoped — no changes needed |
| `src/actions/auth.ts` | UNCHANGED | `changePasswordAction`, `deleteAccountAction`, `signOutAction` all used as-is in ProfilePanel |
| `src/lib/data.ts` | UNCHANGED | `getAppContext()` already returns everything all panels need |
| `src/components/app/settings-workspace.tsx` | DELETED | Replaced by `settings-shell.tsx` + panel files |
| `src/components/app/branding-workspace.tsx` | DELETED | Content migrated into `branding-panel.tsx` + `business-info-panel.tsx` |
| `src/components/app/app-sidebar-nav.tsx` | MODIFIED | Update or remove branding nav item; Settings item already exists and routes to /app/settings |
| `src/components/app/bottom-nav.tsx` | MODIFIED | Verify/update any branding href |

### Actions Already Available Per Panel

| Panel | Actions to call |
|-------|----------------|
| ProfilePanel | `saveProfileAction` (new — split from saveGeneralSettingsAction), `changePasswordAction`, `signOutAction`, `deleteAccountAction` |
| BrandingPanel | `saveIdentityAction`, `saveTemplateAction`, `uploadCustomFontAction`, `deleteCustomFontAction` |
| BusinessInfoPanel | `saveBusinessInfoAction`, `saveDocumentsAction` |
| GeneralPanel | `saveGeneralSettingsAction` (currency, language, tax, timezone), `saveInvoiceDefaultsAction` |
| EmailsPanel | `saveNotificationsAction` |
| IntegrationsPanel | No existing action — stub UI only |
| BillingPanel | No existing action — stub UI only |

### New Actions Needed

| Action | File | Purpose |
|--------|------|---------|
| `saveProfileAction` | `src/actions/app.ts` | Save `fullName`, `avatarPath`, `hourlyRate` — split from current `saveGeneralSettingsAction` which conflates profile and preferences |
| `uploadAvatarAction` | `src/actions/app.ts` | Upload avatar image to `branding-assets` bucket, save path to `profiles.avatar_path` |

Both follow the exact same pattern as `uploadFileToStorage` + upsert already established in `saveIdentityAction`.

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| Current (single user sessions) | Single `getAppContext()` call per settings page visit is fine |
| If AppContext grows large | Extract per-section data fetchers so only relevant data loads — not needed now |
| If settings panels become heavy | Add per-panel lazy loading with `next/dynamic` — not needed now |

## Anti-Patterns

### Anti-Pattern 1: Re-introducing a Monolithic Shell Component

**What people do:** Move all 7 panels into a single `SettingsShell` file with sections as functions at the bottom.

**Why it's wrong:** The existing `settings-workspace.tsx` is already 629 lines covering only 4 sections. 7 sections in one file = 1,100+ lines, impossible to navigate, high merge conflict risk across parallel plan execution.

**Do this instead:** One file per panel in `components/app/settings/panels/`. `SettingsShell` only handles layout — sidebar + panel-slot rendering.

### Anti-Pattern 2: Route Segments for Section Navigation

**What people do:** Create `/app/settings/profile/page.tsx`, `/app/settings/branding/page.tsx`, etc.

**Why it's wrong:** Each segment would re-run `getAppContext()` on navigation — a Supabase query + signed URL generation on every tab click. All sections share the same `AppContext` already fetched server-side. Route segments add latency and complexity with no benefit for this use case.

**Do this instead:** Single `/app/settings/page.tsx`, client-side `useState` for active section, URL sync via `router.replace` for deep links.

### Anti-Pattern 3: Cross-Panel Global Save

**What people do:** Keep a single "Save Changes" button that calls all section actions via `Promise.all()`.

**Why it's wrong:** The current `settings-workspace.tsx` does this and it is the primary UX problem being fixed. If the user only touched Branding, the global save fires all actions. Validation errors in untouched sections block saving the one the user actually changed.

**Do this instead:** Save button per panel, dirty state tracked per panel via `useRef` snapshot.

### Anti-Pattern 4: Removing the Branding Route Without Redirecting First

**What people do:** Delete `/app/branding/page.tsx` and update nav, missing internal hrefs in setup checklist or app-shell.

**Why it's wrong:** `appNavItems`, setup checklist `SetupItemStatus` hrefs, and the branding shortcut link in `settings-workspace.tsx` all reference `/app/branding`. Breaking these silently.

**Do this instead:** Replace `page.tsx` with a `redirect()` first, then audit all hrefs with grep before deleting anything.

## Build Order (Phase Dependencies)

Each step unblocks the next:

1. **Update `SettingsSection` type** in `src/lib/types.ts` — all other files import from here; TypeScript errors will surface broken references immediately.

2. **Create shared primitives** — extract `Section`, `Field`, `PasswordInput` from `settings-workspace.tsx` into `components/app/settings/shared/`. Used by all panels.

3. **Build `SettingsSidebar`** — pure presentational, no data dependencies.

4. **Build `SettingsShell`** — layout shell with sidebar wired to `useState`, URL sync via `router.replace`. Use placeholder divs for panel slots while individual panels are built.

5. **Add new actions** — `saveProfileAction` and `uploadAvatarAction` in `src/actions/app.ts` before building ProfilePanel.

6. **Migrate panels in order (least-to-most-complex):**
   - `EmailsPanel` — direct port of notifications tab, one action
   - `GeneralPanel` — port of general + invoices tabs, two actions
   - `BusinessInfoPanel` — port of branding business/documents tabs, two actions
   - `BrandingPanel` — port of branding identity/template tabs, most complex (file upload, live preview, custom fonts)
   - `ProfilePanel` — new avatar upload + password change + danger zone
   - `IntegrationsPanel` — stub
   - `BillingPanel` — stub

7. **Update `settings/page.tsx`** — swap `SettingsWorkspace` for `SettingsShell`, update `validSections`.

8. **Redirect branding route** — replace `branding/page.tsx` content with `redirect()`.

9. **Update nav references** — `app-sidebar-nav.tsx`, `bottom-nav.tsx`, `constants.ts`, `setup.ts`.

10. **Delete old files** — `settings-workspace.tsx`, `branding-workspace.tsx` only after steps 7-9 confirm nothing imports them.

## Sources

- Direct codebase inspection (HIGH confidence): `settings-workspace.tsx`, `branding-workspace.tsx`, `settings/page.tsx`, `branding/page.tsx`, `actions/app.ts`, `actions/auth.ts`, `lib/types.ts`, `lib/data.ts`, `app-shell.tsx`, `app-sidebar-nav.tsx`
- All findings based on live code, not training data assumptions.

---
*Architecture research for: Settings UX Redesign (v1.2)*
*Researched: 2026-04-15*
