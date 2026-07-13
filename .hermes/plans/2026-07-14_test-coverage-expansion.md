# Test Coverage Expansion

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task.

**Goal:** Close the real test gaps in the highest-risk untested areas: billing math, payment allocation, and cron logic. Focus on edge cases the existing suite misses, not blanket coverage.

**Architecture:** Vitest unit tests for pure functions, mocked Supabase for data-layer and server actions. The project already has 21 test files and a working `vitest.config.ts` — we extend, not rebuild.

**Tech Stack:** Vitest, existing test patterns from `src/lib/dashboard.test.ts`.

---

## Current state (investigated)

The suite is bigger than I first reported. **Already tested:**
- `src/lib/dashboard.test.ts` — revenue trend, aging, MoM, metrics (637 lines, solid)
- `src/lib/billing-utils.test.ts` — billing utilities
- `src/lib/cron-utils.test.ts` — cron reminder scheduling
- `src/lib/billing-data.test.ts` — data layer (mocked)
- `src/lib/export-csv.test.ts` — CSV export
- `src/actions/invoices.test.ts` — invoice server actions
- `src/actions/quotations.test.ts` — quotation server actions
- `src/actions/payments.test.ts` — payment actions
- `src/actions/expenses.test.ts` — expense actions
- `src/actions/clients.test.ts` — client actions
- `src/actions/auth.test.ts` — auth actions
- `src/actions/versions.test.ts` — version history
- `src/actions/public-quotations.test.ts` — public quotation accept/reject
- `src/lib/csv-import.test.ts`, `src/lib/setup.test.ts`, `src/lib/env.test.ts`, `src/lib/profile-bootstrap.test.ts`
- `src/lib/supabase/cookies.test.ts`, `src/lib/supabase/middleware.test.ts`
- `src/components/ui/button.test.ts`, `src/components/status-badges.test.ts`

**Real gaps (what's NOT tested):**
1. `src/lib/document-pdf.ts` — PDF generation (hard to test, skip)
2. **Billing math edge cases** — discount + tax + multi-line combos not in `billing-utils.test.ts`
3. **Payment allocation logic** — partial payment, overpayment, payment status computation edge cases
4. **Cron route handlers** — `src/app/api/cron/reminders/route.ts` and `src/app/api/cron/recurring/route.ts` are completely untested
5. **Email composition** — `src/lib/email.ts` template functions untested
6. **`utils.ts` pure functions** — `formatCurrency`, `formatDateDisplay`, `parseBankDetails` (used in banking info rendering) untested

---

## Tasks

### Task 1: Expand `billing-utils.test.ts` — math edge cases

**Objective:** Cover discount + tax + multi-line combinations.

**Files:**
- Modify: `src/lib/billing-utils.test.ts`

**Add tests for:**
- Line items with 0% and 100% discount
- Tax rate of 0 (tax-exempt invoice)
- Rounding: subtotal 100.005 with 5% tax → verify banker's rounding behavior
- Empty line items array → total should be 0
- Negative discount rejection (if validation exists)
- Multi-line: 3 lines with different discounts + global discount + tax

**First, read `src/lib/billing-utils.ts` to see what functions exist and what they compute, then write tests that exercise every branch.**

**Run:** `pnpm test src/lib/billing-utils.test.ts`

---

### Task 2: Write `utils.test.ts` — pure functions

**Objective:** Cover `formatCurrency`, `formatDateDisplay`, `parseBankDetails`, `toSlug`, `hasValue`.

**Files:**
- Create: `src/lib/utils.test.ts`

**Test cases:**

```ts
import { describe, it, expect } from "vitest";
import { formatCurrency, formatDateDisplay, parseBankDetails, toSlug, hasValue } from "./utils";

describe("formatCurrency", () => {
  it("formats AED by default", () => {
    expect(formatCurrency(1000)).toContain("1,000");
  });
  it("respects currency param", () => {
    expect(formatCurrency(50, "USD")).toContain("50");
  });
  it("handles zero", () => {
    expect(formatCurrency(0)).toContain("0");
  });
});

describe("formatDateDisplay", () => {
  it("formats ISO date to DD.MM.YYYY", () => {
    expect(formatDateDisplay("2026-07-14")).toBe("14.07.2026");
  });
  it("returns empty string for empty input", () => {
    expect(formatDateDisplay("")).toBe("");
  });
});

describe("toSlug", () => {
  it("lowercases and hyphenates", () => {
    expect(toSlug("Acme Corp LLC")).toBe("acme-corp-llc");
  });
  it("removes special chars", () => {
    expect(toSlug("Foo & Bar!")).toBe("foo-bar");
  });
});

describe("hasValue", () => {
  it("returns false for null/undefined/empty/whitespace", () => {
    expect(hasValue(null)).toBe(false);
    expect(hasValue(undefined)).toBe(false);
    expect(hasValue("")).toBe(false);
    expect(hasValue("   ")).toBe(false);
  });
  it("returns true for non-empty", () => {
    expect(hasValue("hello")).toBe(true);
  });
});

describe("parseBankDetails", () => {
  it("parses pipe-separated label:value", () => {
    const result = parseBankDetails("Bank: Emirates NBD | IBAN: AE960260001015011977756");
    expect(result).toHaveLength(2);
    expect(result[0].label).toBe("Bank");
    expect(result[1].label).toBe("IBAN");
  });
  it("detects IBAN by pattern", () => {
    const result = parseBankDetails("AE96 0260 0010 1501 1977 756");
    expect(result[0].label).toBe("IBAN");
  });
  it("returns empty array for empty input", () => {
    expect(parseBankDetails("")).toEqual([]);
  });
});
```

**Run:** `pnpm test src/lib/utils.test.ts`

---

### Task 3: Write `email.test.ts` — email composition

**Objective:** Verify email template functions produce correct HTML/subject.

**Files:**
- Read: `src/lib/email.ts` to identify exported functions
- Create: `src/lib/email.test.ts`

**Approach:** Mock `resend.emails.send` with `vi.fn()` to capture what would be sent. Assert on the `html`, `subject`, `to`, `from` args without actually sending.

```ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { sendReminderEmail } from "./email";

// Mock the resend module
vi.mock("./resend-client", () => ({
  resend: { emails: { send: vi.fn() } },
}));

describe("sendReminderEmail", () => {
  it("includes invoice number in subject and body", async () => {
    // Capture the args passed to resend.emails.send
    // Assert subject contains invoiceNumber
    // Assert html contains the publicUrl
  });
});
```

**Note:** The exact mock structure depends on how `email.ts` imports Resend. Read the file first and adjust.

**Run:** `pnpm test src/lib/email.test.ts`

---

### Task 4: Write cron route integration tests

**Objective:** Test the reminder and recurring cron handlers with a mocked Supabase admin client.

**Files:**
- Create: `src/app/api/cron/reminders/route.test.ts`

**Approach:**

1. Mock `@/lib/supabase/admin` to return a fake Supabase client with chainable query builder.
2. Mock `@/lib/email` to capture `sendReminderEmail` calls.
3. Hit the GET handler with a valid `Authorization: Bearer ${CRON_SECRET}` header.
4. Assert the response shape `{ sent, skipped, errors }`.

```ts
import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock admin client with a fluent query builder
const mockSelect = vi.fn().mockReturnThis();
const mockEq = vi.fn().mockReturnThis();
// ... build the chain

vi.mock("@/lib/supabase/admin", () => ({
  createSupabaseAdminClient: () => mockSupabase,
}));

vi.mock("@/lib/email", () => ({
  sendReminderEmail: vi.fn(),
}));

describe("GET /api/cron/reminders", () => {
  it("returns 401 without auth", async () => {
    const { GET } = await import("./route");
    const response = await GET(new Request("http://localhost/api/cron/reminders"));
    expect(response.status).toBe(401);
  });

  it("processes users with reminders enabled", async () => {
    // Setup mock data: one user, one overdue invoice, one payment
    // Call GET with valid auth header
    // Assert sendReminderEmail was called once
    // Assert response.json() has { sent: 1 }
  });
});
```

**Run:** `pnpm test src/app/api/cron/reminders/route.test.ts`

---

### Task 5: Verify full suite passes

**Run:**
```bash
pnpm test
pnpm typecheck
pnpm lint
```

**Commit:**
```bash
git add src/lib/utils.test.ts src/lib/email.test.ts \
        src/lib/billing-utils.test.ts \
        src/app/api/cron/reminders/route.test.ts
git commit -m "test: expand coverage for utils, email, billing math, and cron handlers"
```

---

## Risks / edge cases

- **Mocking Supabase fluent API is fiddly:** The `.select().eq().order()` chain needs careful mock setup. Look at how `src/lib/billing-data.test.ts` already does it and copy that pattern.
- **Resend mock:** Depends on how `email.ts` imports the Resend client. If it's a top-level `const resend = new Resend(key)`, mock the `Resend` constructor.
- **`parseBankDetails` is fragile:** It uses regex heuristics. Tests should pin current behavior, not assert ideal behavior — if it's wrong, that's a separate fix.

## Effort estimate

~3 hours. The cron route test is the hardest (~1.5 hours alone). Utils + email + billing math are straightforward (~1.5 hours total).
