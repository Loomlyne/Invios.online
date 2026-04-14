# Phase 6: CSV Client Import - Context

**Gathered:** 2026-04-14
**Status:** Ready for planning

<domain>
## Phase Boundary

Users can import their existing client roster from a CSV file into Invios without manual data entry. The feature covers file upload, column mapping, row validation, duplicate detection, and batch insert — all within a multi-step overlay wizard on the clients page.

</domain>

<decisions>
## Implementation Decisions

### Wizard Flow
- **D-01:** MobileSheet overlay (Vaul drawer on mobile, Dialog on desktop) — not a dedicated route. User stays on `/app/clients` throughout.
- **D-02:** 4-step wizard: Upload → Map → Preview → Result. The explicit mapping step gives users full control over messy CSV headers.

### Column Mapping
- **D-03:** Auto-detect common headers by fuzzy matching (Name, Email, Company, Phone, Address, TRN), then show a dropdown per client field where user can change the mapped CSV column or set it to "skip". Auto-map for convenience, full manual control via dropdowns.
- **D-04:** Downloadable CSV template — a link below the file input in step 1: "Download template" generates a .csv with correct headers (name, company, email, phone, address, trn).

### Duplicate Handling
- **D-05:** Duplicate detection by email match against existing clients. Flagged with a ⚠️ badge in the preview table. User can uncheck duplicate rows to skip them, or leave them checked to import as new. Result summary shows "N duplicates skipped."

### Error Display
- **D-06:** Inline per-row validation errors in the preview table. Invalid rows have red highlight + error text beneath (e.g., "Invalid email format"). Valid rows show green check. User can uncheck invalid rows before importing. No separate error panel.

### Claude's Discretion
- Exact fuzzy matching algorithm for auto-mapping headers (e.g., "e-mail" → "email", "phone number" → "phone")
- CSV parsing configuration (delimiter detection, header row detection)
- Result summary layout (inline banner vs toast vs step content)
- "Import CSV" button placement and icon on the clients page

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Research
- `.planning/research/SUMMARY.md` — Synthesized research findings for CSV import and analytics
- `.planning/research/FEATURES.md` — Table stakes vs differentiators for CSV import UX
- `.planning/research/ARCHITECTURE.md` — Data flow, new components, server action design, build order
- `.planning/research/PITFALLS.md` — Critical pitfalls: FormData truncation, slug accumulation, batch insert limits

### Existing Code
- `src/actions/clients.ts` — Existing `createClientAction`, `quickCreateClientAction` patterns, slug generation
- `src/lib/billing.ts` — `clientFormSchema` (Zod), `clientStatuses` array
- `src/lib/billing-utils.ts` — `buildUniqueSlug(baseValue, takenSlugs[])` for conflict-free slug generation
- `src/components/ui/mobile-sheet.tsx` — MobileSheet wrapper (Vaul on mobile, Dialog on desktop)
- `src/components/app/onboarding-wizard.tsx` — Multi-step wizard pattern with state-driven navigation and file upload via native input
- `src/app/(app)/app/clients/page.tsx` — Clients list page layout, PageHeader actions area for "Import CSV" button
- `next.config.ts` — Must be updated with `serverActions.bodySizeLimit` before upload action is written

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `clientFormSchema` (Zod): Direct reuse for per-row validation of CSV data
- `buildUniqueSlug(baseValue, takenSlugs[])`: Slug generation for all imported clients; must pre-fetch existing slugs and accumulate in a running Set
- `MobileSheet`: Adaptive modal primitive — Vaul drawer on mobile, Dialog on desktop
- `ActionState` return type: Consistent success/error pattern for server action results
- Native `<input type="file">` pattern from onboarding logo upload — no third-party upload library needed

### Established Patterns
- Server actions receive FormData or typed objects, validate with Zod, return `ActionState`
- All mutations use `requireSession()` for auth + Supabase client
- After mutation: `revalidatePath("/app/clients")` to bust cache
- Multi-step UI flows use React state to track current step (OnboardingWizard pattern)

### Integration Points
- Clients list page PageHeader: Add "Import CSV" button next to existing "Add client" button
- `importClientsAction` as new server action in `src/actions/clients.ts`
- New components under `src/components/clients/csv-import/`
- PapaParse install: `pnpm add papaparse && pnpm add -D @types/papaparse`

</code_context>

<specifics>
## Specific Ideas

- User wants auto-mapping that's smart but never takes away manual control — dropdowns must always be overridable
- Template download should be prominent enough that new users see it before uploading a badly formatted CSV
- The 200-row cap should show a clear message when exceeded, not silently truncate

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 06-csv-client-import*
*Context gathered: 2026-04-14*
