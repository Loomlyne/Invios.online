import { beforeEach, describe, expect, it, vi } from "vitest";

const mockGetQuotationById = vi.fn();
const mockRenderDocumentUrlToPdf = vi.fn();
const mockRequireSession = vi.fn();

vi.mock("@/lib/billing-data", () => ({
  getQuotationById: mockGetQuotationById,
}));

vi.mock("@/lib/document-pdf", () => ({
  renderDocumentUrlToPdf: mockRenderDocumentUrlToPdf,
}));

vi.mock("@/lib/require-session", () => ({
  requireSession: mockRequireSession,
}));

beforeEach(() => {
  vi.resetModules();
  vi.clearAllMocks();
  mockGetQuotationById.mockResolvedValue({
    quotationNumber: "Q-0001",
    shareToken: "share-token",
    userId: "user-1",
  });
  mockRenderDocumentUrlToPdf.mockResolvedValue(Buffer.from("pdf"));
});

describe("GET /api/quotations/[id]/pdf", () => {
  it("rejects unauthenticated exports before reading a quotation", async () => {
    mockRequireSession.mockRejectedValue(new Error("Unauthorized"));
    const { GET } = await import("./route");

    const response = await GET(
      new Request("https://invios.test/api/quotations/quotation-1/pdf"),
      { params: Promise.resolve({ id: "quotation-1" }) },
    );

    expect(response.status).toBe(401);
    expect(mockGetQuotationById).not.toHaveBeenCalled();
  });
});
