import { describe, it, expect, vi, beforeEach } from "vitest";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

vi.mock("@/lib/supabase/admin", () => ({
  createSupabaseAdminClient: vi.fn(),
}));

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

// ---------------------------------------------------------------------------
// acceptQuotationPublicAction
// ---------------------------------------------------------------------------

describe("acceptQuotationPublicAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns error for invalid share token", async () => {
    const { acceptQuotationPublicAction } = await import("@/actions/public-quotations");

    const mockMaybeSingle = vi.fn().mockResolvedValue({ data: null, error: null });
    const mockEq = vi.fn().mockReturnValue({ maybeSingle: mockMaybeSingle });
    const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });
    const mockFrom = vi.fn().mockReturnValue({ select: mockSelect });
    (createSupabaseAdminClient as ReturnType<typeof vi.fn>).mockReturnValue({ from: mockFrom });

    const formData = new FormData();
    const result = await acceptQuotationPublicAction("invalid-token", { status: "idle" }, formData);

    expect(result.status).toBe("error");
    expect(result.message).toMatch(/invalid|token/i);
  });

  it("returns error when quotation status is not sent", async () => {
    const { acceptQuotationPublicAction } = await import("@/actions/public-quotations");

    const mockQuotation = {
      id: "quo-uuid-123",
      share_token: "valid-share-token",
      status: "draft",
      expiry_date: "2026-12-31",
    };

    const mockMaybeSingle = vi.fn().mockResolvedValue({ data: mockQuotation, error: null });
    const mockEq = vi.fn().mockReturnValue({ maybeSingle: mockMaybeSingle });
    const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });
    const mockFrom = vi.fn().mockReturnValue({ select: mockSelect });
    (createSupabaseAdminClient as ReturnType<typeof vi.fn>).mockReturnValue({ from: mockFrom });

    const formData = new FormData();
    const result = await acceptQuotationPublicAction("valid-share-token", { status: "idle" }, formData);

    expect(result.status).toBe("error");
  });

  it("accepts quotation in sent status", async () => {
    const { acceptQuotationPublicAction } = await import("@/actions/public-quotations");

    const mockQuotation = {
      id: "quo-uuid-123",
      share_token: "valid-share-token",
      status: "sent",
      expiry_date: "2026-12-31",
    };

    const mockSingle = vi.fn().mockResolvedValue({ data: { id: "quo-uuid-123" }, error: null });
    const mockEqUpdate = vi.fn().mockReturnValue({ select: vi.fn().mockReturnValue({ single: mockSingle }) });
    const mockUpdate = vi.fn().mockReturnValue({ eq: mockEqUpdate });

    const mockMaybeSingle = vi.fn().mockResolvedValue({ data: mockQuotation, error: null });
    const mockEqSelect = vi.fn().mockReturnValue({ maybeSingle: mockMaybeSingle });
    const mockSelect = vi.fn().mockReturnValue({ eq: mockEqSelect });

    const mockFrom = vi.fn().mockImplementation(() => ({
      select: mockSelect,
      update: mockUpdate,
    }));
    (createSupabaseAdminClient as ReturnType<typeof vi.fn>).mockReturnValue({ from: mockFrom });

    const formData = new FormData();
    const result = await acceptQuotationPublicAction("valid-share-token", { status: "idle" }, formData);

    expect(result.status).toBe("success");
  });

  it("prevents double-accept on already accepted quotation", async () => {
    const { acceptQuotationPublicAction } = await import("@/actions/public-quotations");

    const mockQuotation = {
      id: "quo-uuid-123",
      share_token: "valid-share-token",
      status: "accepted",
      expiry_date: "2026-12-31",
    };

    const mockMaybeSingle = vi.fn().mockResolvedValue({ data: mockQuotation, error: null });
    const mockEq = vi.fn().mockReturnValue({ maybeSingle: mockMaybeSingle });
    const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });
    const mockFrom = vi.fn().mockReturnValue({ select: mockSelect });
    (createSupabaseAdminClient as ReturnType<typeof vi.fn>).mockReturnValue({ from: mockFrom });

    const formData = new FormData();
    const result = await acceptQuotationPublicAction("valid-share-token", { status: "idle" }, formData);

    expect(result.status).toBe("error");
  });
});

// ---------------------------------------------------------------------------
// rejectQuotationPublicAction
// ---------------------------------------------------------------------------

describe("rejectQuotationPublicAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects quotation in sent status", async () => {
    const { rejectQuotationPublicAction } = await import("@/actions/public-quotations");

    const mockQuotation = {
      id: "quo-uuid-123",
      share_token: "valid-share-token",
      status: "sent",
      expiry_date: "2026-12-31",
    };

    const mockSingle = vi.fn().mockResolvedValue({ data: { id: "quo-uuid-123" }, error: null });
    const mockEqUpdate = vi.fn().mockReturnValue({ select: vi.fn().mockReturnValue({ single: mockSingle }) });
    const mockUpdate = vi.fn().mockReturnValue({ eq: mockEqUpdate });

    const mockMaybeSingle = vi.fn().mockResolvedValue({ data: mockQuotation, error: null });
    const mockEqSelect = vi.fn().mockReturnValue({ maybeSingle: mockMaybeSingle });
    const mockSelect = vi.fn().mockReturnValue({ eq: mockEqSelect });

    const mockFrom = vi.fn().mockImplementation(() => ({
      select: mockSelect,
      update: mockUpdate,
    }));
    (createSupabaseAdminClient as ReturnType<typeof vi.fn>).mockReturnValue({ from: mockFrom });

    const formData = new FormData();
    formData.set("rejectionReason", "Too expensive");
    const result = await rejectQuotationPublicAction("valid-share-token", { status: "idle" }, formData);

    expect(result.status).toBe("success");
  });

  it("stores rejection_reason from form data", async () => {
    const { rejectQuotationPublicAction } = await import("@/actions/public-quotations");

    const mockQuotation = {
      id: "quo-uuid-123",
      share_token: "valid-share-token",
      status: "sent",
      expiry_date: "2026-12-31",
    };

    const mockSingle = vi.fn().mockResolvedValue({ data: { id: "quo-uuid-123" }, error: null });
    const mockSelectAfterUpdate = vi.fn().mockReturnValue({ single: mockSingle });
    const mockEqUpdate = vi.fn().mockReturnValue({ select: mockSelectAfterUpdate });
    const mockUpdate = vi.fn().mockReturnValue({ eq: mockEqUpdate });

    const mockMaybeSingle = vi.fn().mockResolvedValue({ data: mockQuotation, error: null });
    const mockEqSelect = vi.fn().mockReturnValue({ maybeSingle: mockMaybeSingle });
    const mockSelect = vi.fn().mockReturnValue({ eq: mockEqSelect });

    const mockFrom = vi.fn().mockImplementation(() => ({
      select: mockSelect,
      update: mockUpdate,
    }));
    (createSupabaseAdminClient as ReturnType<typeof vi.fn>).mockReturnValue({ from: mockFrom });

    const formData = new FormData();
    formData.set("rejectionReason", "Budget changed");
    await rejectQuotationPublicAction("valid-share-token", { status: "idle" }, formData);

    // Verify the update call included the rejection_reason
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ rejection_reason: "Budget changed" }),
    );
  });

  it("returns error for non-sent quotation", async () => {
    const { rejectQuotationPublicAction } = await import("@/actions/public-quotations");

    const mockQuotation = {
      id: "quo-uuid-123",
      share_token: "valid-share-token",
      status: "accepted",
      expiry_date: "2026-12-31",
    };

    const mockMaybeSingle = vi.fn().mockResolvedValue({ data: mockQuotation, error: null });
    const mockEq = vi.fn().mockReturnValue({ maybeSingle: mockMaybeSingle });
    const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });
    const mockFrom = vi.fn().mockReturnValue({ select: mockSelect });
    (createSupabaseAdminClient as ReturnType<typeof vi.fn>).mockReturnValue({ from: mockFrom });

    const formData = new FormData();
    formData.set("rejectionReason", "Changed mind");
    const result = await rejectQuotationPublicAction("valid-share-token", { status: "idle" }, formData);

    expect(result.status).toBe("error");
  });
});
