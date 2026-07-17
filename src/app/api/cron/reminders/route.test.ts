import { describe, it, expect, vi, beforeEach } from "vitest";
import type { NextRequest } from "next/server";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

// Mock @/lib/env — bypasses isCronAuthenticated when Bearer test-cron-secret
// is provided, and provides a stable siteUrl for public link construction.
vi.mock("@/lib/env", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/env")>();
  return {
    ...actual,
    env: { ...actual.env, cronSecret: "test-cron-secret", siteUrl: "https://invios.test" },
    isCronAuthenticated: (authHeader: string | null) =>
      authHeader === "Bearer test-cron-secret",
  };
});

// Mock @/lib/email — capture sendReminderEmail invocations.
const mockSendReminderEmail = vi.fn();
vi.mock("@/lib/email", () => ({
  sendReminderEmail: mockSendReminderEmail,
}));

// Mock @/lib/supabase/admin — returns a fluent query builder.
// Each table call (from("table")) returns a chain that supports select/eq/in/
// order/limit/maybeSingle/single/gte/insert, resolving to per-table mock data.
function createMockSupabase() {
  // Data store keyed by table name.
  const tableData: Record<string, unknown[]> = {
    user_settings: [],
    invoices: [],
    branding: [],
    reminder_logs: [],
    clients: [],
    payments: [],
  };

  function buildChain(table: string): unknown {
    // Collect chain state — but for simplicity we just resolve to table data
    // after the terminal call.
    let resolvedData = tableData[table] ?? [];

    const chain: any = {
      select: vi.fn(() => chain),
      eq: vi.fn(() => chain),
      in: vi.fn(() => chain),
      order: vi.fn(() => chain),
      gte: vi.fn(() => chain),
      limit: vi.fn(() => {
        // terminal-ish but we need to return a thenable for awaited calls
        return {
          ...chain,
          then(resolve: any) {
            Promise.resolve({ data: resolvedData, error: null }).then(resolve);
          },
          catch() {},
        };
      }),
      maybeSingle: vi.fn(() => {
        return {
          then(resolve: any) {
            Promise.resolve({ data: resolvedData[0] ?? null, error: null }).then(resolve);
          },
          catch() {},
        };
      }),
      single: vi.fn(() => {
        return {
          then(resolve: any) {
            Promise.resolve({ data: resolvedData[0] ?? null, error: null }).then(resolve);
          },
          catch() {},
        };
      }),
      insert: vi.fn(() => ({
        then(resolve: any) {
          Promise.resolve({ data: null, error: null }).then(resolve);
        },
        catch() {},
      })),
    };

    // Make chain itself thenable (awaited after .limit() etc.)
    chain.then = function (resolve: any) {
      Promise.resolve({ data: resolvedData, error: null }).then(resolve);
    };
    chain.catch = function () {};

    return chain;
  }

  const mockSupabase = {
    from: vi.fn((table: string) => buildChain(table)),
  };

  return { mockSupabase, tableData };
}

const { mockSupabase, tableData } = createMockSupabase();

vi.mock("@/lib/supabase/admin", () => ({
  createSupabaseAdminClient: () => mockSupabase,
}));

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("GET /api/cron/reminders", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset data store
    tableData.user_settings = [];
    tableData.invoices = [];
    tableData.branding = [];
    tableData.reminder_logs = [];
    tableData.clients = [];
    tableData.payments = [];
  });

  function makeRequest(headers: Record<string, string> = {}): NextRequest {
    return new Request("http://localhost/api/cron/reminders", { headers }) as NextRequest;
  }

  it("returns 401 without auth header", async () => {
    const { GET } = await import("./route");
    const response = await GET(makeRequest());
    expect(response.status).toBe(401);
  });

  it("returns 401 with wrong token", async () => {
    const { GET } = await import("./route");
    const response = await GET(makeRequest({ authorization: "Bearer wrong" }));
    expect(response.status).toBe(401);
  });

  it("returns processed:0 when no users have reminders enabled", async () => {
    const { GET } = await import("./route");
    const response = await GET(makeRequest({ authorization: "Bearer test-cron-secret" }));
    const body = await response.json();
    expect(body).toEqual({ processed: 0 });
  });

  it("sends a reminder when daysPastDue matches reminderDaysAfter", async () => {
    tableData.user_settings = [
      {
        user_id: "user-1",
        reminder_days_before: 3,
        reminder_days_after: 7,
        remind_on_due_date: true,
        second_reminder_days: 14,
        timezone: "UTC",
      },
    ];

    // 7 days ago → daysPastDue === 7 === reminderDaysAfter → "after" fires
    const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString().split("T")[0];
    tableData.invoices = [
      {
        id: "inv-1",
        invoice_number: "INV-001",
        total: 1000,
        currency: "AED",
        due_date: sevenDaysAgo,
        share_token: "token-abc",
        client_id: "client-1",
        status: "sent",
      },
    ];

    tableData.branding = [{ business_name: "Acme Studio" }];
    tableData.clients = [{ name: "Acme Client", email: "client@example.com" }];
    tableData.payments = [{ amount: 0 }];

    const { GET } = await import("./route");
    const response = await GET(makeRequest({ authorization: "Bearer test-cron-secret" }));
    const body = await response.json();

    expect(body.sent).toBe(1);
    expect(mockSendReminderEmail).toHaveBeenCalledTimes(1);
    const emailArgs = mockSendReminderEmail.mock.calls[0][0];
    expect(emailArgs.clientEmail).toBe("client@example.com");
    expect(emailArgs.invoiceNumber).toBe("INV-001");
    expect(emailArgs.publicUrl).toContain("token-abc");
    expect(emailArgs.businessName).toBe("Acme Studio");
  });

  it("skips when a reminder was already logged (dedup)", async () => {
    tableData.user_settings = [
      {
        user_id: "user-1",
        reminder_days_before: 3,
        reminder_days_after: 7,
        remind_on_due_date: true,
        second_reminder_days: 14,
        timezone: "UTC",
      },
    ];

    const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString().split("T")[0];
    tableData.invoices = [
      {
        id: "inv-1",
        invoice_number: "INV-001",
        total: 1000,
        currency: "AED",
        due_date: sevenDaysAgo,
        share_token: "token-abc",
        client_id: "client-1",
        status: "sent",
      },
    ];

    // Simulate an existing reminder log within 24h
    tableData.reminder_logs = [{ id: "log-1" }];
    tableData.branding = [{ business_name: "Acme Studio" }];
    tableData.clients = [{ name: "Acme Client", email: "client@example.com" }];

    const { GET } = await import("./route");
    const response = await GET(makeRequest({ authorization: "Bearer test-cron-secret" }));
    const body = await response.json();

    expect(body.sent).toBe(0);
    expect(body.skipped).toBe(1);
    expect(mockSendReminderEmail).not.toHaveBeenCalled();
  });

  it("skips when client has no email", async () => {
    tableData.user_settings = [
      {
        user_id: "user-1",
        reminder_days_before: 3,
        reminder_days_after: 7,
        remind_on_due_date: true,
        second_reminder_days: 14,
        timezone: "UTC",
      },
    ];

    const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString().split("T")[0];
    tableData.invoices = [
      {
        id: "inv-1",
        invoice_number: "INV-001",
        total: 1000,
        currency: "AED",
        due_date: sevenDaysAgo,
        share_token: "token-abc",
        client_id: "client-1",
        status: "sent",
      },
    ];

    tableData.reminder_logs = [];
    tableData.branding = [{ business_name: "Acme Studio" }];
    // Client with no email
    tableData.clients = [{ name: "Acme Client", email: null }];

    const { GET } = await import("./route");
    const response = await GET(makeRequest({ authorization: "Bearer test-cron-secret" }));
    const body = await response.json();

    expect(body.sent).toBe(0);
    expect(body.skipped).toBe(1);
    expect(mockSendReminderEmail).not.toHaveBeenCalled();
  });
});
