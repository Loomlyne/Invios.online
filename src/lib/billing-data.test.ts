import { describe, it, expect, vi, beforeEach } from "vitest";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { listInvoiceVersions } from "@/lib/billing-data";

vi.mock("@/lib/supabase/admin", () => ({
  createSupabaseAdminClient: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: vi.fn(),
}));

// ---------------------------------------------------------------------------
// listInvoiceVersions
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

    // Verify the query chain
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
