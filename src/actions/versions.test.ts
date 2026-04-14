import { describe, it, expect, vi, beforeEach } from "vitest";
import { requireSession } from "@/lib/require-session";
import { computeAndWriteInvoiceStatus } from "@/lib/billing-data";
import { snapshotInvoiceVersion, restoreInvoiceVersionAction } from "@/actions/versions";
import { MAX_VERSIONS } from "@/lib/billing";

vi.mock("@/lib/require-session", () => ({
  requireSession: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: vi.fn(),
}));

vi.mock("@/lib/supabase/admin", () => ({
  createSupabaseAdminClient: vi.fn(),
}));

vi.mock("@/lib/billing-data", () => ({
  computeAndWriteInvoiceStatus: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

// ---------------------------------------------------------------------------
// Shared fixture
// ---------------------------------------------------------------------------

const mockSnapshot = {
  invoice_number: "INV-001",
  client_id: "client-uuid",
  client_name: "Acme Corp",
  issue_date: "2026-04-01",
  due_date: "2026-04-30",
  currency: "AED",
  tax_rate: 5,
  discount: 0,
  subtotal: 1000,
  discount_amount: 0,
  tax_amount: 50,
  total: 1050,
  line_items: [],
  notes: "",
  terms: "",
  language: "en",
  trn: "",
  invoice_type: "invoice",
};

// ---------------------------------------------------------------------------
// snapshotInvoiceVersion
// ---------------------------------------------------------------------------

describe("snapshotInvoiceVersion", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("inserts a snapshot row with invoice_id, user_id, and snapshot", async () => {
    const mockInsert = vi.fn().mockResolvedValue({ error: null });
    const mockOrder = vi.fn().mockResolvedValue({ data: [], error: null });
    const mockEqUser = vi.fn().mockReturnValue({ order: mockOrder });
    const mockEqInvoice = vi.fn().mockReturnValue({ eq: mockEqUser });
    const mockSelectVersions = vi.fn().mockReturnValue({ eq: mockEqInvoice });

    const mockFrom = vi.fn().mockReturnValue({
      insert: mockInsert,
      select: mockSelectVersions,
      delete: vi.fn().mockReturnValue({ in: vi.fn().mockResolvedValue({ error: null }) }),
    });

    const mockSupabase = { from: mockFrom } as never;

    await snapshotInvoiceVersion(mockSupabase, "invoice-uuid", "user-uuid", mockSnapshot);

    expect(mockInsert).toHaveBeenCalledWith({
      invoice_id: "invoice-uuid",
      user_id: "user-uuid",
      snapshot: mockSnapshot,
    });
  });

  it("does NOT call delete when version count is at or below MAX_VERSIONS (10)", async () => {
    const mockDeleteIn = vi.fn().mockResolvedValue({ error: null });
    const mockDelete = vi.fn().mockReturnValue({ in: mockDeleteIn });

    // Exactly MAX_VERSIONS (10) existing — at cap, no delete
    const existingVersions = Array.from({ length: 10 }, (_, i) => ({
      id: `version-${i}`,
      created_at: `2026-04-${String(i + 1).padStart(2, "0")}T00:00:00Z`,
    }));

    const mockOrder = vi.fn().mockResolvedValue({ data: existingVersions, error: null });
    const mockEqUser = vi.fn().mockReturnValue({ order: mockOrder });
    const mockEqInvoice = vi.fn().mockReturnValue({ eq: mockEqUser });
    const mockSelectVersions = vi.fn().mockReturnValue({ eq: mockEqInvoice });
    const mockInsert = vi.fn().mockResolvedValue({ error: null });

    const mockFrom = vi.fn().mockReturnValue({
      insert: mockInsert,
      select: mockSelectVersions,
      delete: mockDelete,
    });

    const mockSupabase = { from: mockFrom } as never;

    await snapshotInvoiceVersion(mockSupabase, "invoice-uuid", "user-uuid", mockSnapshot);

    expect(mockDeleteIn).not.toHaveBeenCalled();
  });

  it("calls delete for oldest versions when count exceeds MAX_VERSIONS (11)", async () => {
    const mockDeleteIn = vi.fn().mockResolvedValue({ error: null });
    const mockDelete = vi.fn().mockReturnValue({ in: mockDeleteIn });

    // 11 existing versions (1 over cap) — oldest 1 should be deleted
    const existingVersions = Array.from({ length: 11 }, (_, i) => ({
      id: `version-${i}`,
      created_at: `2026-04-${String(i + 1).padStart(2, "0")}T00:00:00Z`,
    }));

    const mockOrder = vi.fn().mockResolvedValue({ data: existingVersions, error: null });
    const mockEqUser = vi.fn().mockReturnValue({ order: mockOrder });
    const mockEqInvoice = vi.fn().mockReturnValue({ eq: mockEqUser });
    const mockSelectVersions = vi.fn().mockReturnValue({ eq: mockEqInvoice });
    const mockInsert = vi.fn().mockResolvedValue({ error: null });

    const mockFrom = vi.fn().mockReturnValue({
      insert: mockInsert,
      select: mockSelectVersions,
      delete: mockDelete,
    });

    const mockSupabase = { from: mockFrom } as never;

    await snapshotInvoiceVersion(mockSupabase, "invoice-uuid", "user-uuid", mockSnapshot);

    // Should delete IDs beyond MAX_VERSIONS (index 10 onwards)
    const expectedDeleteIds = existingVersions.slice(MAX_VERSIONS).map((v) => v.id);
    expect(mockDeleteIn).toHaveBeenCalledWith("id", expectedDeleteIds);
  });
});

// ---------------------------------------------------------------------------
// restoreInvoiceVersionAction
// ---------------------------------------------------------------------------

describe("restoreInvoiceVersionAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("applies snapshot fields and calls computeAndWriteInvoiceStatus", async () => {
    const mockUpdateSingle = vi.fn().mockResolvedValue({ data: { slug: "inv-001-acme" }, error: null });
    const mockUpdateSelectSingle = vi.fn().mockReturnValue({ single: mockUpdateSingle });
    const mockUpdateEqUser = vi.fn().mockReturnValue({ select: mockUpdateSelectSingle });
    const mockUpdateEqInvoice = vi.fn().mockReturnValue({ eq: mockUpdateEqUser });
    const mockUpdate = vi.fn().mockReturnValue({ eq: mockUpdateEqInvoice });

    const mockFetchSingle = vi.fn().mockResolvedValue({ data: { snapshot: mockSnapshot }, error: null });
    const mockFetchEqUser = vi.fn().mockReturnValue({ single: mockFetchSingle });
    const mockFetchEqInvoice = vi.fn().mockReturnValue({ eq: mockFetchEqUser });
    const mockFetchEqVersion = vi.fn().mockReturnValue({ eq: mockFetchEqInvoice });
    const mockSelectVersions = vi.fn().mockReturnValue({ eq: mockFetchEqVersion });

    const mockFrom = vi.fn().mockImplementation((table: string) => {
      if (table === "invoice_versions") {
        return { select: mockSelectVersions };
      }
      if (table === "invoices") {
        return { update: mockUpdate };
      }
      return {};
    });

    const mockSupabase = { from: mockFrom };
    (requireSession as ReturnType<typeof vi.fn>).mockResolvedValue({
      supabase: mockSupabase,
      user: { id: "user-uuid" },
    });

    const result = await restoreInvoiceVersionAction("version-uuid", "invoice-uuid");

    expect(result.status).toBe("success");
    expect(result.message).toBe("Invoice restored to selected version.");
    expect(computeAndWriteInvoiceStatus).toHaveBeenCalledWith(
      mockSupabase,
      "invoice-uuid",
      "user-uuid",
    );
  });

  it("returns error when version not found", async () => {
    const mockSingle = vi.fn().mockResolvedValue({
      data: null,
      error: { message: "not found" },
    });
    const mockEq3 = vi.fn().mockReturnValue({ single: mockSingle });
    const mockEq2 = vi.fn().mockReturnValue({ eq: mockEq3 });
    const mockEq1 = vi.fn().mockReturnValue({ eq: mockEq2 });
    const mockSelectVersions = vi.fn().mockReturnValue({ eq: mockEq1 });
    const mockFrom = vi.fn().mockReturnValue({ select: mockSelectVersions });

    const mockSupabase = { from: mockFrom };
    (requireSession as ReturnType<typeof vi.fn>).mockResolvedValue({
      supabase: mockSupabase,
      user: { id: "user-uuid" },
    });

    const result = await restoreInvoiceVersionAction("bad-version-uuid", "invoice-uuid");

    expect(result.status).toBe("error");
    expect(result.message).toBeTruthy();
  });
});
