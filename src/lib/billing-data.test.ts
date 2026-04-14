import { describe, it, expect, vi, beforeEach } from "vitest";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  getClientByPortalToken,
  getRecurringSchedule,
  getSlugAliasRedirect,
  listInvoiceVersions,
} from "@/lib/billing-data";

vi.mock("@/lib/supabase/admin", () => ({
  createSupabaseAdminClient: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: vi.fn(),
}));

// ---------------------------------------------------------------------------
// getClientByPortalToken
// ---------------------------------------------------------------------------

describe("getClientByPortalToken", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns mapped client for valid portal token", async () => {
    const mockRow = {
      id: "client-uuid-123",
      user_id: "user-uuid-456",
      name: "Acme Corp",
      company: "Acme Corporation",
      email: "billing@acme.com",
      phone: "+971501234567",
      address: "Dubai, UAE",
      status: "active",
      slug: "acme-corp",
      trn: "100123456789012",
      tax_code: "VAT",
      portal_token: "valid-portal-token-abc",
      logo_path: null,
      archived_at: null,
      created_at: "2026-01-01T00:00:00Z",
      updated_at: "2026-01-01T00:00:00Z",
    };

    const mockMaybeSingle = vi.fn().mockResolvedValue({ data: mockRow, error: null });
    const mockIs = vi.fn().mockReturnValue({ maybeSingle: mockMaybeSingle });
    const mockEq = vi.fn().mockReturnValue({ is: mockIs });
    const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });
    const mockFrom = vi.fn().mockReturnValue({ select: mockSelect });
    (createSupabaseAdminClient as ReturnType<typeof vi.fn>).mockReturnValue({ from: mockFrom });

    const result = await getClientByPortalToken("valid-portal-token-abc");

    expect(result).not.toBeNull();
    expect(result?.portalToken).toBe("valid-portal-token-abc");
    expect(result?.name).toBe("Acme Corp");
    expect(result?.id).toBe("client-uuid-123");
  });

  it("returns null for invalid/unknown portal token", async () => {
    const mockMaybeSingle = vi.fn().mockResolvedValue({ data: null, error: null });
    const mockIs = vi.fn().mockReturnValue({ maybeSingle: mockMaybeSingle });
    const mockEq = vi.fn().mockReturnValue({ is: mockIs });
    const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });
    const mockFrom = vi.fn().mockReturnValue({ select: mockSelect });
    (createSupabaseAdminClient as ReturnType<typeof vi.fn>).mockReturnValue({ from: mockFrom });

    const result = await getClientByPortalToken("invalid-token");

    expect(result).toBeNull();
  });

  it("returns null for archived client", async () => {
    // The .is("archived_at", null) filter excludes archived rows — mock returns null
    const mockMaybeSingle = vi.fn().mockResolvedValue({ data: null, error: null });
    const mockIs = vi.fn().mockReturnValue({ maybeSingle: mockMaybeSingle });
    const mockEq = vi.fn().mockReturnValue({ is: mockIs });
    const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });
    const mockFrom = vi.fn().mockReturnValue({ select: mockSelect });
    (createSupabaseAdminClient as ReturnType<typeof vi.fn>).mockReturnValue({ from: mockFrom });

    const result = await getClientByPortalToken("archived-client-token");

    expect(result).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// getSlugAliasRedirect
// ---------------------------------------------------------------------------

describe("getSlugAliasRedirect", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns current slug when alias exists", async () => {
    // First call: look up alias
    const mockMaybeSingleAlias = vi.fn().mockResolvedValue({
      data: { document_id: "invoice-uuid-123" },
      error: null,
    });
    const mockEqAlias = vi.fn().mockReturnValue({ maybeSingle: mockMaybeSingleAlias });
    const mockSelectAlias = vi.fn().mockReturnValue({ eq: mockEqAlias });

    // Second call: look up invoice by ID to get current slug
    const mockSingleInvoice = vi.fn().mockResolvedValue({
      data: { slug: "current-slug" },
      error: null,
    });
    const mockEqInvoice = vi.fn().mockReturnValue({ single: mockSingleInvoice });
    const mockSelectInvoice = vi.fn().mockReturnValue({ eq: mockEqInvoice });

    let callCount = 0;
    const mockFrom = vi.fn().mockImplementation(() => {
      callCount += 1;
      if (callCount === 1) {
        return { select: mockSelectAlias };
      }
      return { select: mockSelectInvoice };
    });

    (createSupabaseAdminClient as ReturnType<typeof vi.fn>).mockReturnValue({ from: mockFrom });

    const result = await getSlugAliasRedirect("old-slug", "invoice");

    expect(result).toBe("current-slug");
  });

  it("returns null when no alias exists", async () => {
    const mockMaybeSingle = vi.fn().mockResolvedValue({ data: null, error: null });
    const mockEq = vi.fn().mockReturnValue({ maybeSingle: mockMaybeSingle });
    const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });
    const mockFrom = vi.fn().mockReturnValue({ select: mockSelect });
    (createSupabaseAdminClient as ReturnType<typeof vi.fn>).mockReturnValue({ from: mockFrom });

    const result = await getSlugAliasRedirect("nonexistent-slug", "invoice");

    expect(result).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// listInvoiceVersions (AUTO-01, AUTO-02)
// ---------------------------------------------------------------------------

describe("listInvoiceVersions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns versions for a given invoice ordered by created_at desc", async () => {
    const mockVersionRows = [
      {
        id: "version-2",
        snapshot: { invoice_number: "INV-001", total: 1100 },
        created_at: "2026-04-12T10:00:00Z",
      },
      {
        id: "version-1",
        snapshot: { invoice_number: "INV-001", total: 1000 },
        created_at: "2026-04-11T10:00:00Z",
      },
    ];

    const mockLimit = vi.fn().mockResolvedValue({ data: mockVersionRows, error: null });
    const mockOrder = vi.fn().mockReturnValue({ limit: mockLimit });
    const mockEqUser = vi.fn().mockReturnValue({ order: mockOrder });
    const mockEqInvoice = vi.fn().mockReturnValue({ eq: mockEqUser });
    const mockSelect = vi.fn().mockReturnValue({ eq: mockEqInvoice });
    const mockFrom = vi.fn().mockReturnValue({ select: mockSelect });

    const mockGetUser = vi.fn().mockResolvedValue({
      data: { user: { id: "user-uuid-123" } },
    });

    const mockSupabase = {
      from: mockFrom,
      auth: { getUser: mockGetUser },
    };

    (createSupabaseServerClient as ReturnType<typeof vi.fn>).mockResolvedValue(mockSupabase);

    const result = await listInvoiceVersions("invoice-uuid-abc");

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({
      id: "version-2",
      snapshot: { invoice_number: "INV-001", total: 1100 },
      createdAt: "2026-04-12T10:00:00Z",
    });
    expect(result[1]).toEqual({
      id: "version-1",
      snapshot: { invoice_number: "INV-001", total: 1000 },
      createdAt: "2026-04-11T10:00:00Z",
    });

    expect(mockFrom).toHaveBeenCalledWith("invoice_versions");
    expect(mockSelect).toHaveBeenCalledWith("id, snapshot, created_at");
    expect(mockEqInvoice).toHaveBeenCalledWith("invoice_id", "invoice-uuid-abc");
    expect(mockEqUser).toHaveBeenCalledWith("user_id", "user-uuid-123");
    expect(mockOrder).toHaveBeenCalledWith("created_at", { ascending: false });
    expect(mockLimit).toHaveBeenCalledWith(10);
  });

  it("returns empty array when supabase client is null", async () => {
    (createSupabaseServerClient as ReturnType<typeof vi.fn>).mockResolvedValue(null);

    const result = await listInvoiceVersions("invoice-uuid-abc");

    expect(result).toEqual([]);
  });

  it("returns empty array when user is not authenticated", async () => {
    const mockGetUser = vi.fn().mockResolvedValue({
      data: { user: null },
    });

    const mockSupabase = {
      auth: { getUser: mockGetUser },
    };

    (createSupabaseServerClient as ReturnType<typeof vi.fn>).mockResolvedValue(mockSupabase);

    const result = await listInvoiceVersions("invoice-uuid-abc");

    expect(result).toEqual([]);
  });

  it("returns empty array on database error", async () => {
    const mockLimit = vi.fn().mockResolvedValue({ data: null, error: { message: "DB error" } });
    const mockOrder = vi.fn().mockReturnValue({ limit: mockLimit });
    const mockEqUser = vi.fn().mockReturnValue({ order: mockOrder });
    const mockEqInvoice = vi.fn().mockReturnValue({ eq: mockEqUser });
    const mockSelect = vi.fn().mockReturnValue({ eq: mockEqInvoice });
    const mockFrom = vi.fn().mockReturnValue({ select: mockSelect });

    const mockGetUser = vi.fn().mockResolvedValue({
      data: { user: { id: "user-uuid-123" } },
    });

    const mockSupabase = {
      from: mockFrom,
      auth: { getUser: mockGetUser },
    };

    (createSupabaseServerClient as ReturnType<typeof vi.fn>).mockResolvedValue(mockSupabase);

    const result = await listInvoiceVersions("invoice-uuid-abc");

    expect(result).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// getRecurringSchedule (AUTO-03)
// ---------------------------------------------------------------------------

describe("getRecurringSchedule", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns active recurring schedule for a given invoice", async () => {
    const mockScheduleRow = {
      id: "schedule-uuid-001",
      frequency: "monthly",
      next_due_date: "2026-05-12",
      is_active: true,
      created_at: "2026-04-12T10:00:00Z",
    };

    const mockMaybeSingle = vi.fn().mockResolvedValue({ data: mockScheduleRow, error: null });
    const mockEqActive = vi.fn().mockReturnValue({ maybeSingle: mockMaybeSingle });
    const mockEqUser = vi.fn().mockReturnValue({ eq: mockEqActive });
    const mockEqInvoice = vi.fn().mockReturnValue({ eq: mockEqUser });
    const mockSelect = vi.fn().mockReturnValue({ eq: mockEqInvoice });
    const mockFrom = vi.fn().mockReturnValue({ select: mockSelect });

    const mockGetUser = vi.fn().mockResolvedValue({
      data: { user: { id: "user-uuid-123" } },
    });

    const mockSupabase = {
      from: mockFrom,
      auth: { getUser: mockGetUser },
    };

    (createSupabaseServerClient as ReturnType<typeof vi.fn>).mockResolvedValue(mockSupabase);

    const result = await getRecurringSchedule("invoice-uuid-abc");

    expect(result).not.toBeNull();
    expect(result?.id).toBe("schedule-uuid-001");
    expect(result?.frequency).toBe("monthly");
    expect(result?.nextDueDate).toBe("2026-05-12");
    expect(result?.isActive).toBe(true);
    expect(result?.createdAt).toBe("2026-04-12T10:00:00Z");

    expect(mockFrom).toHaveBeenCalledWith("recurring_schedules");
    expect(mockSelect).toHaveBeenCalledWith("id, frequency, next_due_date, is_active, created_at");
    expect(mockEqInvoice).toHaveBeenCalledWith("source_invoice_id", "invoice-uuid-abc");
    expect(mockEqUser).toHaveBeenCalledWith("user_id", "user-uuid-123");
    expect(mockEqActive).toHaveBeenCalledWith("is_active", true);
  });

  it("returns null when no schedule exists", async () => {
    const mockMaybeSingle = vi.fn().mockResolvedValue({ data: null, error: null });
    const mockEqActive = vi.fn().mockReturnValue({ maybeSingle: mockMaybeSingle });
    const mockEqUser = vi.fn().mockReturnValue({ eq: mockEqActive });
    const mockEqInvoice = vi.fn().mockReturnValue({ eq: mockEqUser });
    const mockSelect = vi.fn().mockReturnValue({ eq: mockEqInvoice });
    const mockFrom = vi.fn().mockReturnValue({ select: mockSelect });

    const mockGetUser = vi.fn().mockResolvedValue({
      data: { user: { id: "user-uuid-123" } },
    });

    const mockSupabase = {
      from: mockFrom,
      auth: { getUser: mockGetUser },
    };

    (createSupabaseServerClient as ReturnType<typeof vi.fn>).mockResolvedValue(mockSupabase);

    const result = await getRecurringSchedule("invoice-uuid-no-schedule");

    expect(result).toBeNull();
  });

  it("returns null when supabase client is null", async () => {
    (createSupabaseServerClient as ReturnType<typeof vi.fn>).mockResolvedValue(null);

    const result = await getRecurringSchedule("invoice-uuid-abc");

    expect(result).toBeNull();
  });

  it("returns null when user is not authenticated", async () => {
    const mockGetUser = vi.fn().mockResolvedValue({
      data: { user: null },
    });

    const mockSupabase = {
      auth: { getUser: mockGetUser },
    };

    (createSupabaseServerClient as ReturnType<typeof vi.fn>).mockResolvedValue(mockSupabase);

    const result = await getRecurringSchedule("invoice-uuid-abc");

    expect(result).toBeNull();
  });
});
