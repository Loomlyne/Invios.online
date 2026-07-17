import { beforeEach, describe, expect, it, vi } from "vitest";
import { setInvoiceStatusAction } from "@/actions/invoices";
import { setQuotationStatusAction } from "@/actions/quotations";
import { requireSession } from "@/lib/require-session";
import { updateDocumentStatusAction } from "@/actions/status";

vi.mock("@/actions/invoices", () => ({
  setInvoiceStatusAction: vi.fn(),
}));

vi.mock("@/actions/quotations", () => ({
  setQuotationStatusAction: vi.fn(),
}));

vi.mock("@/lib/require-session", () => ({
  requireSession: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

describe("updateDocumentStatusAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("routes invoice Kanban moves through the invoice transition guard", async () => {
    vi.mocked(setInvoiceStatusAction).mockResolvedValue(undefined);

    await expect(updateDocumentStatusAction("invoices", "invoice-1", "paid")).resolves.toEqual({ ok: true });

    expect(setInvoiceStatusAction).toHaveBeenCalledWith("invoice-1", "paid");
    expect(requireSession).not.toHaveBeenCalled();
  });

  it("routes quotation Kanban moves through the timestamp-aware quotation action", async () => {
    vi.mocked(setQuotationStatusAction).mockResolvedValue(undefined);

    await expect(updateDocumentStatusAction("quotations", "quotation-1", "accepted")).resolves.toEqual({ ok: true });

    expect(setQuotationStatusAction).toHaveBeenCalledWith("quotation-1", "accepted");
    expect(requireSession).not.toHaveBeenCalled();
  });

  it("reports a failed client move when no owned row was updated", async () => {
    const single = vi.fn().mockResolvedValue({
      data: null,
      error: { message: "No client record was updated." },
    });
    const select = vi.fn().mockReturnValue({ single });
    const matchUser = vi.fn().mockReturnValue({ select });
    const matchClient = vi.fn().mockReturnValue({ eq: matchUser });
    const update = vi.fn().mockReturnValue({ eq: matchClient });
    const from = vi.fn().mockReturnValue({ update });

    vi.mocked(requireSession).mockResolvedValue({
      supabase: { from },
      user: { id: "user-1" },
    } as never);

    await expect(updateDocumentStatusAction("clients", "client-1", "active")).resolves.toEqual({
      ok: false,
      error: "No client record was updated.",
    });
    expect(select).toHaveBeenCalledWith("slug");
  });

  it("rejects statuses that do not belong to the dragged record type", async () => {
    await expect(updateDocumentStatusAction("clients", "client-1", "paid")).resolves.toEqual({
      ok: false,
      error: "Invalid status for clients.",
    });

    expect(requireSession).not.toHaveBeenCalled();
  });
});
