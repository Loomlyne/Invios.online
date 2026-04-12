import { describe, it, expect, vi, beforeEach } from "vitest";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getClientByPortalToken, getSlugAliasRedirect } from "@/lib/billing-data";

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
