import { beforeEach, describe, expect, it, vi } from "vitest";

const mockGetQuotationById = vi.fn();
const mockRenderDocumentUrlToPng = vi.fn();
const mockRequireSession = vi.fn();

vi.mock("@/lib/billing-data", () => ({
  getQuotationById: mockGetQuotationById,
}));

vi.mock("@/lib/document-png", () => ({
  renderDocumentUrlToPng: mockRenderDocumentUrlToPng,
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
  mockRenderDocumentUrlToPng.mockResolvedValue(Buffer.from("png"));
});

describe("GET /api/quotations/[id]/png", () => {
  it("returns a PNG for the authenticated quotation owner", async () => {
    mockRequireSession.mockResolvedValue({ user: { id: "user-1" } });
    const { GET } = await import("./route");

    const response = await GET(
      new Request("https://invios.test/api/quotations/quotation-1/png"),
      { params: Promise.resolve({ id: "quotation-1" }) },
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe("image/png");
    expect(response.headers.get("Content-Disposition")).toContain("Q-0001.png");
    expect(mockRenderDocumentUrlToPng).toHaveBeenCalledWith(
      "https://invios.test/quotations/public/share-token?print=1",
    );
  });
});
