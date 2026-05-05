# Phase 6: CSV Client Import - Research

**Researched:** 2026-04-14
**Domain:** Client-side CSV parsing, multi-step wizard UI, batch Supabase insert with slug deduplication
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** MobileSheet overlay (Vaul drawer on mobile, Dialog on desktop) — not a dedicated route. User stays on `/app/clients` throughout.
- **D-02:** 4-step wizard: Upload → Map → Preview → Result. The explicit mapping step gives users full control over messy CSV headers.
- **D-03:** Auto-detect common headers by fuzzy matching (Name, Email, Company, Phone, Address, TRN), then show a dropdown per client field where user can change the mapped CSV column or set it to "skip". Auto-map for convenience, full manual control via dropdowns.
- **D-04:** Downloadable CSV template — a link below the file input in step 1: "Download template" generates a .csv with correct headers (name, company, email, phone, address, trn).
- **D-05:** Duplicate detection by email match against existing clients. Flagged with a warning badge in the preview table. User can uncheck duplicate rows to skip them, or leave them checked to import as new. Result summary shows "N duplicates skipped."
- **D-06:** Inline per-row validation errors in the preview table. Invalid rows have red highlight + error text beneath (e.g., "Invalid email format"). Valid rows show green check. User can uncheck invalid rows before importing. No separate error panel.

### Claude's Discretion

- Exact fuzzy matching algorithm for auto-mapping headers (e.g., "e-mail" → "email", "phone number" → "phone")
- CSV parsing configuration (delimiter detection, header row detection)
- Result summary layout (inline banner vs toast vs step content)
- "Import CSV" button placement and icon on the clients page

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| CLNT-05 | User can upload a CSV file, map columns to client fields (name, company, email, phone, address, trn), preview validated rows with per-row error display, and import clients in batch — with duplicate detection by email and an import summary showing inserted, skipped, and errored rows. | PapaParse for client-side parse, Zod `clientFormSchema` for row validation, `buildUniqueSlug` + slug Set accumulation for batch slug generation, single `supabase.insert([...rows])` for batch DB write, MobileSheet + step state for wizard UI. |
</phase_requirements>

---

## Summary

Phase 6 adds a 4-step CSV import wizard that lets users onboard their existing client roster without manual entry. The implementation is heavily front-loaded on the client side: PapaParse runs in-browser to parse the CSV, the mapping and validation UI runs entirely in a `"use client"` component tree, and the Server Action only receives a clean pre-validated array for batch DB insertion. The feature spans two new surfaces — a CSV import button in `PageHeader.actions` on the clients page, and a full `src/components/clients/csv-import/` component subtree hosting the wizard.

The primary complexity points are: (1) slug deduplication during batch insert requires a single pre-fetch of all existing slugs plus an accumulated running Set in the insert loop; (2) duplicate email detection is application-level (not upsert) to avoid RLS edge cases; and (3) `next.config.ts` must receive body size configuration before any upload action is written.

**Primary recommendation:** Build in strict order — next.config.ts body size config first, then PapaParse install, then the wizard component tree, then the Server Action. The 200-row cap enforced client-side keeps the Server Action under Vercel Hobby's 10-second limit.

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| papaparse | 5.5.3 | Browser-side CSV parsing | Only viable browser CSV parser; handles BOM, quoted fields, header auto-detect, delimiter sniffing, streaming — zero dependencies |
| @types/papaparse | 5.5.2 | TypeScript types for papaparse | Pairs with papaparse; provides `ParseResult<T>`, `ParseConfig`, `ParseError` types |
| zod | 4.3.6 (already installed) | Per-row CSV row validation | `clientFormSchema` already exists; reuse directly for CSV row validation |

### Supporting (already installed, no additions needed)

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| vaul | ^1.1.2 | Vaul Drawer (mobile sheet) | MobileSheet primitive already wraps it — no direct usage needed |
| @radix-ui/react-dialog | 1.1.15 | Dialog (desktop sheet) | MobileSheet wraps it — no direct usage needed |
| react-hook-form | 7.72.1 | Form state management | NOT used for wizard step state — use plain `useState` to match OnboardingWizard pattern |
| lucide-react | 0.469.0 | Icons (Upload, Check, AlertTriangle, X) | Standard icon source throughout the app |

### New Packages to Install

**Installation:**
```bash
pnpm add papaparse && pnpm add -D @types/papaparse
```

**Version verification (confirmed 2026-04-14):**
- `papaparse` — 5.5.3 (npm registry)
- `@types/papaparse` — 5.5.2 (npm registry)

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| papaparse | csv-parse (Node-only) | csv-parse is Node.js only; cannot run in browser — eliminated |
| papaparse | fast-csv | Also Node-only — eliminated |
| Plain useState step tracking | react-hook-form multi-step | Overkill for 4-step wizard; OnboardingWizard uses plain useState — match existing pattern |

---

## Architecture Patterns

### Recommended Project Structure

```
src/
├── components/clients/csv-import/
│   ├── csv-import-wizard.tsx      # Root "use client" wizard — owns all step state
│   ├── step-upload.tsx            # Step 1: file input + template download link
│   ├── step-map.tsx               # Step 2: column mapping dropdowns
│   ├── step-preview.tsx           # Step 3: validation table with row check/uncheck
│   └── step-result.tsx            # Step 4: summary (inserted / skipped / failed counts)
├── lib/
│   └── csv-import.ts             # NON-"use server": types, Zod row schema, fuzzy-map fn, constants
└── actions/
    └── clients.ts                # ADD importClientsAction here (alongside existing actions)
```

### Pattern 1: Client-Side Parse → Server-Side Insert Boundary

**What:** PapaParse runs in the browser inside a `"use client"` component. The Server Action receives only a pre-validated typed array, never raw CSV bytes or a File object.

**When to use:** Any feature where the parsing tool is browser-only (FileReader, PapaParse).

**Example:**
```typescript
// src/components/clients/csv-import/csv-import-wizard.tsx  ("use client")
import Papa from "papaparse";

function handleFile(file: File) {
  const reader = new FileReader();
  readerRef.current = reader;  // store for abort on unmount
  reader.onload = (e) => {
    const text = e.target?.result as string;
    const result = Papa.parse<Record<string, string>>(text, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (h) => h.trim(),
    });
    setRawRows(result.data);
    setRawHeaders(result.meta.fields ?? []);
  };
  reader.readAsText(file);
}

// Cleanup on unmount — prevent state update on unmounted component
useEffect(() => {
  return () => { readerRef.current?.abort(); };
}, []);
```

### Pattern 2: Slug Accumulation for Batch Import

**What:** Fetch all existing slugs once, accumulate newly generated slugs in a Set during the loop, pass the full combined set to `buildUniqueSlug` for every row.

**When to use:** Any batch insert where slug uniqueness must hold across the entire batch, not just against DB state.

**Example:**
```typescript
// src/actions/clients.ts — inside importClientsAction
const existingSlugs = await getExistingClientSlugs(user.id);
const takenSlugs = new Set(existingSlugs);

const rows = validatedRows.map((row) => {
  const slugBase = row.company || row.name;
  const slug = buildUniqueSlug(slugBase, [...takenSlugs]);
  takenSlugs.add(slug);  // accumulate — critical for same-name rows
  return {
    user_id: user.id,
    name: row.name,
    company: row.company || null,
    email: row.email || null,
    phone: row.phone || null,
    address: row.address || null,
    trn: row.trn || null,
    status: "lead" as const,
    slug,
  };
});

const { error } = await supabase.from("clients").insert(rows);
```

### Pattern 3: Application-Level Duplicate Detection

**What:** SELECT existing client emails for the user, diff against CSV rows in memory, split into `newRows` (insert) vs `duplicateRows` (skip). Do not use Supabase upsert.

**When to use:** Whenever CSV rows could collide with existing DB records. Avoids RLS upsert pitfall.

**Example:**
```typescript
// In importClientsAction — before slug generation
const { data: existingClients } = await supabase
  .from("clients")
  .select("email")
  .eq("user_id", user.id)
  .not("email", "is", null);

const existingEmails = new Set(
  (existingClients ?? []).map((c) => c.email?.toLowerCase())
);

const newRows = validatedRows.filter(
  (r) => !r.email || !existingEmails.has(r.email.toLowerCase())
);
const skippedCount = validatedRows.length - newRows.length;
```

### Pattern 4: Non-Async Helpers in src/lib/ (not in actions file)

**What:** All non-async exports (Zod schemas, type definitions, fuzzy mapping constants/functions, field mapping arrays) live in `src/lib/csv-import.ts`. Only `importClientsAction` (async) goes in `src/actions/clients.ts`.

**When to use:** Always — `"use server"` files may only export async functions (Next.js constraint).

**Example:**
```typescript
// src/lib/csv-import.ts  — NO "use server" directive
import { z } from "zod";

export const CSV_FIELDS = ["name", "company", "email", "phone", "address", "trn"] as const;
export type CsvField = typeof CSV_FIELDS[number];

// Fuzzy header map: normalize header variants to canonical field names
const HEADER_ALIASES: Record<string, CsvField> = {
  name: "name", "client name": "name", "full name": "name", "contact": "name",
  company: "company", "company name": "company", "organization": "company", "business": "company",
  email: "email", "e-mail": "email", "email address": "email",
  phone: "phone", "phone number": "phone", "mobile": "phone", "tel": "phone",
  address: "address", "billing address": "address", "location": "address",
  trn: "trn", "tax registration number": "trn", "vat number": "trn",
};

export function autoMapHeaders(csvHeaders: string[]): Partial<Record<CsvField, string>> {
  const mapping: Partial<Record<CsvField, string>> = {};
  for (const header of csvHeaders) {
    const normalized = header.toLowerCase().trim();
    const field = HEADER_ALIASES[normalized];
    if (field && !mapping[field]) {
      mapping[field] = header;  // first match wins
    }
  }
  return mapping;
}

// CSV row Zod schema — looser than clientFormSchema (status not in CSV)
export const csvRowSchema = z.object({
  name: z.string().min(2, "Client name is required."),
  company: z.string().default(""),
  email: z.union([z.literal(""), z.string().email("Enter a valid email.")]).default(""),
  phone: z.string().default(""),
  address: z.string().default(""),
  trn: z.string().default(""),
});

export type CsvRowInput = z.input<typeof csvRowSchema>;
export type CsvRowValid = z.output<typeof csvRowSchema>;
```

### Pattern 5: MobileSheet Multi-Step Wizard

**What:** Wrap the wizard in `MobileSheet` / `MobileSheetContent`. Drive step navigation with a single `step` state value (1–4). Match the `OnboardingWizard` pattern of `useState` for step tracking — no router navigation needed.

**Example:**
```typescript
// csv-import-wizard.tsx ("use client")
const [open, setOpen] = useState(false);
const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

function reset() {
  setStep(1);
  setRawRows([]);
  setMapping({});
  setValidatedRows([]);
  setResult(null);
}

// When dialog closes, reset to step 1
function handleOpenChange(next: boolean) {
  setOpen(next);
  if (!next) reset();
}
```

### Pattern 6: next.config.ts Body Size (prerequisite — Wave 0)

**What:** Add both body size settings before writing any upload action. Missing these causes silent FormData truncation at 1MB.

```typescript
// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typedRoutes: true,
  experimental: {
    proxyClientMaxBodySize: "10mb",
  },
  serverActions: {
    bodySizeLimit: "5mb",
  },
};

export default nextConfig;
```

### Pattern 7: importClientsAction Return Shape

**What:** Return a structured result object with import summary counts (not generic `ActionState`) so the wizard can display the Result step content without parsing message strings.

```typescript
// src/actions/clients.ts
export type ImportResult = {
  status: "success" | "error";
  inserted: number;
  skipped: number;   // duplicates by email
  failed: number;    // validation errors (should be 0 — validated client-side)
  message?: string;
};

export async function importClientsAction(
  rows: CsvRowValid[],
  userCheckedRowIndices: number[],  // which rows user kept checked in preview
): Promise<ImportResult>
```

### Anti-Patterns to Avoid

- **Parsing in Server Action:** PapaParse and FileReader are browser-only. Never pass a `File` or CSV string to the Server Action.
- **Row-by-row DB inserts:** Each individual insert adds ~50ms round-trip. 200 rows = 10 seconds = Vercel Hobby timeout. Use `.insert([...rows])` once.
- **Slug fetch inside the loop:** Fetching existing slugs once per row adds N DB queries. Fetch once, accumulate in memory.
- **Supabase upsert for duplicate handling:** RLS requires both INSERT and UPDATE policies for upsert to work. App-level diff is predictable and correct.
- **Non-async exports in `"use server"` files:** Next.js throws at build time. Keep all schemas/types/helpers in `src/lib/`.
- **Skipping the FileReader abort:** Closing the dialog mid-parse triggers state updates on unmounted component. Always `readerRef.current?.abort()` in cleanup.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| CSV parsing | Custom string split / regex | `papaparse` | Quoted commas, escaped quotes, BOM, CRLF, varying delimiters — all handled by PapaParse |
| Row validation | Manual field checks | `csvRowSchema.safeParse()` (Zod 4) | Project already uses Zod 4 throughout; error messages are already written in `clientFormSchema` |
| Slug uniqueness | Custom hash or UUID suffix | `buildUniqueSlug(base, [...takenSlugs])` | Already handles numeric suffix increments, slug normalization via `toSlug()` |
| Adaptive modal | Conditional Vaul/Dialog logic | `MobileSheet` / `MobileSheetContent` | Already built, battle-tested, handles 1024px breakpoint |
| Duplicate detection (DB) | `ON CONFLICT DO UPDATE` (upsert) | App-level email Set diff | Upsert silently fails with partial RLS; app-level diff is explicit and gives preview counts |

**Key insight:** The slug accumulation pattern is the only genuinely new coordination logic in this phase. Everything else (validation, modal, slugging, server action shape) directly reuses or extends existing project patterns.

---

## Common Pitfalls

### Pitfall 1: Next.js 15.5.14 Proxy Truncates FormData Over 1MB

**What goes wrong:** The internal proxy layer defaults to a 1MB max. A CSV with 200+ clients easily exceeds this. The proxy truncates silently — no error thrown, just corrupt/empty data in the Server Action.

**Why it happens:** Next.js 15.5 introduced an internal proxy separate from the existing `serverActions.bodySizeLimit`. Both must be configured.

**How to avoid:** Set both limits in `next.config.ts` as the absolute first task of Wave 0, before any import-related code is written. `proxyClientMaxBodySize` must be >= `serverActions.bodySizeLimit`.

**Warning signs:** Server Action receives an empty or truncated `rows` array; no error thrown.

---

### Pitfall 2: Slug Collision in Batch Insert

**What goes wrong:** Two rows with identical company/name produce the same base slug. Without accumulation, `buildUniqueSlug` sees only DB state, not the slug already assigned to row N. Row N+1 gets the same slug. Supabase throws a unique constraint violation.

**Why it happens:** `buildUniqueSlug` only deduplicates against whatever `takenSlugs` you pass. If you don't accumulate generated slugs in memory, the Set doesn't know about previously generated slugs in the current batch.

**How to avoid:** After calling `buildUniqueSlug`, immediately call `takenSlugs.add(generatedSlug)` before moving to the next row.

**Warning signs:** `duplicate key value violates unique constraint "clients_slug_key"` on Supabase insert.

---

### Pitfall 3: "use server" File Cannot Export Non-Async Helpers

**What goes wrong:** Placing `csvRowSchema`, `CSV_FIELDS`, or `autoMapHeaders` inside `src/actions/clients.ts` causes Next.js to throw at build time: `A "use server" file can only export async functions`.

**Why it happens:** `"use server"` at the file level is a directive to the bundler — it marks every export as a server action boundary. Non-async exports violate this constraint.

**How to avoid:** All non-async exports go in `src/lib/csv-import.ts` (no directive). Only `importClientsAction` goes in the actions file.

**Warning signs:** Build error mentioning `"use server" file can only export async functions`.

---

### Pitfall 4: Upsert RLS Failure for Duplicate Rows

**What goes wrong:** Using Supabase `.upsert()` with `onConflict: 'email'` silently fails with HTTP 403 when the INSERT RLS policy passes but no UPDATE policy allows the upsert-as-update path.

**Why it happens:** Supabase evaluates INSERT policy first even on conflict. Both INSERT and UPDATE policies must cover the same row for upsert to succeed.

**How to avoid:** Application-level diff: SELECT existing emails, remove duplicates in memory, INSERT only truly new rows.

**Warning signs:** Some rows silently vanish after import with no error returned.

---

### Pitfall 5: FileReader Memory Leak on Dialog Close Mid-Parse

**What goes wrong:** User uploads a large CSV, immediately closes the dialog. The FileReader `onload` callback fires against unmounted component state. React 19 warns about state updates on unmounted components.

**Why it happens:** FileReader runs async; if the component unmounts before `onload` fires, the callback still executes.

**How to avoid:** Store `FileReader` in `useRef`. In `useEffect` cleanup (and on dialog `onOpenChange(false)`), call `readerRef.current?.abort()`.

**Warning signs:** Console warnings about state updates on unmounted components after rapidly opening/closing the dialog.

---

### Pitfall 6: 200-Row Cap Must Be Enforced Client-Side with Clear Message

**What goes wrong:** Silent truncation (slicing the array without telling the user) causes data loss — the user thinks all rows imported but only 200 did.

**Why it happens:** Post-parse array might contain 500+ rows; silently slicing is tempting for simplicity.

**How to avoid:** After parsing, if `rawRows.length > 200`, display a clear warning: "This file contains N rows — only the first 200 will be imported. Download a template and split your data into batches." Do not proceed to the mapping step until the user acknowledges or re-uploads a smaller file.

**Warning signs:** User reports "missing clients" after import.

---

### Pitfall 7: Zod 4 Error Shape Difference

**What goes wrong:** Zod 4 (installed as 4.3.6) changed some error utility APIs from Zod 3. Specifically, `z.ZodError.flatten()` output shape and `error.format()` behavior may differ. However `.issues[]` array and `.safeParse()` are stable across both.

**How to avoid:** Stick to the established project pattern: `result.error.issues[0]?.message` for simple extraction. For per-field display, iterate `result.error.issues` directly and index by `issue.path`. Do not use `error.flatten()` or `error.format()` — these were not used in the project before.

**Warning signs:** TypeScript error or runtime error on error display in the preview table.

---

## Code Examples

Verified patterns from existing codebase:

### Existing clientFormSchema (src/lib/billing.ts)
```typescript
export const clientFormSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(2, "Client name is required."),
  company: z.string().default(""),
  email: z.union([z.literal(""), z.string().email("Enter a valid client email.")]).default(""),
  phone: z.string().default(""),
  address: z.string().default(""),
  status: z.enum(clientStatuses),
  trn: z.string().default(""),
  taxCode: z.string().default(""),
  logoPath: z.string().nullable().optional(),
});
```

The CSV row schema omits `id`, `status`, `taxCode`, and `logoPath` (not user-supplied in CSV). Reuse the `name`, `company`, `email`, `phone`, `address`, `trn` validation patterns verbatim.

### buildUniqueSlug (src/lib/billing-utils.ts)
```typescript
export function buildUniqueSlug(baseValue: string, takenSlugs: string[]) {
  const baseSlug = toSlug(baseValue) || "document";
  const lookup = new Set(takenSlugs.filter(Boolean));
  if (!lookup.has(baseSlug)) return baseSlug;
  let suffix = 2;
  while (lookup.has(`${baseSlug}-${suffix}`)) suffix += 1;
  return `${baseSlug}-${suffix}`;
}
```

Accepts `string[]` — spread the running Set: `buildUniqueSlug(base, [...takenSlugs])`.

### getExistingClientSlugs (src/actions/clients.ts)
```typescript
async function getExistingClientSlugs(userId: string, excludeId?: string) {
  const { supabase } = await requireSession();
  let query = supabase.from("clients").select("slug").eq("user_id", userId);
  if (excludeId) query = query.neq("id", excludeId);
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data ?? []).map((item) => item.slug as string);
}
```

Reuse this private function for `importClientsAction` — call it once before the batch loop.

### MobileSheet usage pattern (src/components/ui/mobile-sheet.tsx)
```typescript
// Props: open, onOpenChange, children
// Sub-components: MobileSheetTrigger, MobileSheetContent, MobileSheetHeader

<MobileSheet open={open} onOpenChange={handleOpenChange}>
  <MobileSheetContent className="max-w-2xl" title="Import clients">
    <MobileSheetHeader title="Import clients" description="Upload a CSV to add clients in bulk." />
    {/* step content */}
  </MobileSheetContent>
</MobileSheet>
```

Note: `MobileSheetTrigger` renders `Drawer.Trigger asChild` on mobile and passes children through on desktop (Dialog wired by parent). The "Import CSV" button that opens the wizard should be placed in `PageHeader.actions` on the clients page — second button after "Add client".

### ActionState return type (src/lib/types.ts)
```typescript
export type ActionState = {
  status: "idle" | "success" | "error";
  message?: string;
  redirectTo?: string;
};
```

`importClientsAction` should NOT use `ActionState` — it needs to return import summary counts. Define `ImportResult` in `src/lib/csv-import.ts` (non-async, so not in actions file) and use it as the return type.

### PapaParse core API (papaparse 5.5.3)
```typescript
import Papa from "papaparse";

// Parse CSV string with header row detection
const result = Papa.parse<Record<string, string>>(csvText, {
  header: true,            // first row becomes field names
  skipEmptyLines: true,    // exclude blank rows
  transformHeader: (h) => h.trim(),  // strip whitespace from headers
});

// result.data    — array of row objects
// result.errors  — parse errors (malformed fields etc.)
// result.meta.fields  — ordered header names
```

### CSV Template Generation (client-side, no library needed)
```typescript
// In step-upload.tsx — "Download template" link
function downloadTemplate() {
  const headers = "name,company,email,phone,address,trn";
  const example = "Acme Corp,Acme LLC,info@acme.com,+971501234567,\"Dubai, UAE\",100123456789012";
  const csv = `${headers}\n${example}`;
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "invios-clients-template.csv";
  a.click();
  URL.revokeObjectURL(url);
}
```

No library needed — native `Blob` + `URL.createObjectURL`. Note the quoted `"Dubai, UAE"` in the example row to demonstrate that commas inside fields need quoting.

---

## Environment Availability

Step 2.6: SKIPPED — Phase 6 is a code-only change. No external services, CLIs, or runtimes beyond the project's own stack are required. `papaparse` is a new npm dependency (not a system-level tool).

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 3.2.4 |
| Config file | `vitest.config.ts` (exists) |
| Quick run command | `pnpm test` |
| Full suite command | `pnpm test` |

Note: `vitest.config.ts` uses `environment: "node"`. PapaParse runs browser-side — tests for `autoMapHeaders`, `csvRowSchema`, and slug accumulation logic are pure Node-compatible functions in `src/lib/csv-import.ts` and `src/actions/clients.ts` and can be tested without browser environment.

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| CLNT-05 | `csvRowSchema` validates valid row | unit | `pnpm test` | ❌ Wave 0: `src/lib/csv-import.test.ts` |
| CLNT-05 | `csvRowSchema` rejects invalid email | unit | `pnpm test` | ❌ Wave 0 |
| CLNT-05 | `autoMapHeaders` maps "E-mail" → "email" | unit | `pnpm test` | ❌ Wave 0 |
| CLNT-05 | `autoMapHeaders` maps "Full Name" → "name" | unit | `pnpm test` | ❌ Wave 0 |
| CLNT-05 | `importClientsAction` slug accumulation — two rows with same name get unique slugs | unit | `pnpm test` | ❌ Wave 0: extend `src/actions/clients.test.ts` |
| CLNT-05 | `importClientsAction` skips duplicate emails | unit | `pnpm test` | ❌ Wave 0 |
| CLNT-05 | `importClientsAction` inserts valid rows in single batch | unit | `pnpm test` | ❌ Wave 0 |
| CLNT-05 | 200-row cap enforced (client-side, no DB call) | unit | `pnpm test` | ❌ Wave 0: `src/lib/csv-import.test.ts` |

### Sampling Rate

- **Per task commit:** `pnpm test`
- **Per wave merge:** `pnpm test`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] `src/lib/csv-import.test.ts` — covers CLNT-05: schema validation, auto-mapping, row cap
- [ ] Extend `src/actions/clients.test.ts` — slug accumulation across batch, duplicate email skip, batch insert result shape
- [ ] No new framework install needed — Vitest 3.2.4 already installed and configured

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Parse CSV in Server Action | Parse client-side with PapaParse, send validated array | Next.js 15 — FileReader/PapaParse are browser-only | Server Action receives clean typed data only |
| Row-by-row Supabase inserts | Single `.insert([...rows])` batch | Vercel Hobby 10s limit | Entire 200-row import under 2 seconds |
| Upsert for duplicate handling | App-level email diff + INSERT only | Supabase RLS gap with upsert | Predictable, no silent 403 failures |
| `serverActions.bodySizeLimit` only | Both `proxyClientMaxBodySize` + `serverActions.bodySizeLimit` | Next.js 15.5 proxy layer added | Without both, FormData silently truncated at 1MB |

**Deprecated/outdated:**
- Supabase upsert for client merging: Do not use — RLS requires both INSERT + UPDATE policy coverage on the same row, which is non-obvious and error-prone.

---

## Open Questions

1. **Result step layout — banner vs step content vs toast**
   - What we know: D-06 specifies inline per-row errors; result summary layout is Claude's discretion
   - What's unclear: Whether a toast (dismiss-able) or a persistent step 4 panel better fits the MobileSheet constraints on mobile
   - Recommendation: Use step 4 as a persistent summary panel (like OnboardingWizard's completion step) — toast is too ephemeral for multi-count results; user needs to see "47 imported, 3 skipped, 2 failed" with time to read

2. **Failed rows download offer**
   - What we know: CONTEXT.md does not mention a failed-row CSV download, but ARCHITECTURE.md (SUMMARY.md) does
   - What's unclear: Whether offering a failed-row download in the result step is in scope for CLNT-05
   - Recommendation: Include it as a low-cost addition (client-side Blob generation, same pattern as template download); omit if it adds more than 1 task to the plan

3. **"Import CSV" button icon**
   - What we know: Placement is in `PageHeader.actions` alongside "Add client" — Claude's discretion
   - Recommendation: Use `Upload` icon from lucide-react (already installed at 0.469.0); label "Import CSV"

---

## Sources

### Primary (HIGH confidence)

- Existing codebase — `src/actions/clients.ts`, `src/lib/billing.ts`, `src/lib/billing-utils.ts`, `src/components/ui/mobile-sheet.tsx`, `src/components/app/onboarding-wizard.tsx`, `src/app/(app)/app/clients/page.tsx` — read directly 2026-04-14
- `.planning/research/SUMMARY.md` — synthesized research verified against official sources 2026-04-14
- `.planning/research/PITFALLS.md` — pitfall research with official source citations 2026-04-14
- npm registry — `papaparse@5.5.3`, `@types/papaparse@5.5.2` — version confirmed 2026-04-14
- `package.json` — exact dependency versions confirmed (Next.js 15.5.14, Zod 4.3.6, React 19.2.0, Vitest 3.2.4)

### Secondary (MEDIUM confidence)

- PapaParse docs (papaparse.github.io) — `header: true`, `skipEmptyLines`, `transformHeader`, `meta.fields` API — consistent with SUMMARY.md findings
- Next.js 15 serverActions + proxyClientMaxBodySize config — documented in PITFALLS.md with GitHub discussion links

### Tertiary (LOW confidence)

- None — all critical claims verified against codebase or official research already in SUMMARY.md/PITFALLS.md

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — papaparse version confirmed on npm registry; all other dependencies already installed and version-pinned
- Architecture: HIGH — patterns directly derived from reading existing codebase (clients.ts, billing-utils.ts, mobile-sheet.tsx, onboarding-wizard.tsx)
- Pitfalls: HIGH — each pitfall verified against PITFALLS.md which cites official Next.js docs, Supabase discussions, and GitHub issues

**Research date:** 2026-04-14
**Valid until:** 2026-05-14 (stable ecosystem — Next.js, Zod, PapaParse all on stable releases)
