import { beforeEach, describe, expect, it, vi } from "vitest";

const mockPdf = vi.fn().mockResolvedValue(Buffer.from("pdf"));
const mockScreenshot = vi.fn().mockResolvedValue(Buffer.from("png"));
const mockGoto = vi.fn().mockResolvedValue({ ok: () => true, status: () => 200 });
const mockPage = {
  addStyleTag: vi.fn().mockResolvedValue(undefined),
  emulateMedia: vi.fn().mockResolvedValue(undefined),
  evaluate: vi.fn().mockResolvedValue(undefined),
  goto: mockGoto,
  pdf: mockPdf,
  screenshot: mockScreenshot,
  setViewportSize: vi.fn().mockResolvedValue(undefined),
  waitForSelector: vi.fn().mockResolvedValue(undefined),
};
const mockContextClose = vi.fn().mockResolvedValue(undefined);
const mockNewContext = vi.fn().mockResolvedValue({ close: mockContextClose, newPage: vi.fn().mockResolvedValue(mockPage) });
const mockBrowserClose = vi.fn().mockResolvedValue(undefined);
const mockBrowser = {
  close: mockBrowserClose,
  isConnected: vi.fn(() => true),
  newContext: mockNewContext,
  newPage: vi.fn().mockResolvedValue(mockPage),
};
const mockLaunch = vi.fn().mockResolvedValue(mockBrowser);
const mockExecutablePath = vi.fn().mockResolvedValue("/tmp/chromium");

vi.mock("@sparticuz/chromium", () => ({
  default: {
    args: ["--serverless"],
    executablePath: mockExecutablePath,
  },
}));

vi.mock("playwright-core", () => ({
  chromium: {
    launch: mockLaunch,
  },
}));

beforeEach(() => {
  vi.resetModules();
  vi.clearAllMocks();
  mockBrowser.isConnected.mockReturnValue(true);
});

describe("document rendering", () => {
  it("reuses a connected browser while isolating sequential PDF exports", async () => {
    const { renderDocumentUrlToPdf } = await import("./document-pdf");

    await renderDocumentUrlToPdf("https://invios.test/invoices/public/one?print=1");
    await renderDocumentUrlToPdf("https://invios.test/invoices/public/two?print=1");

    expect(mockLaunch).toHaveBeenCalledTimes(1);
    expect(mockNewContext).toHaveBeenCalledTimes(2);
    expect(mockContextClose).toHaveBeenCalledTimes(2);
    expect(mockBrowserClose).not.toHaveBeenCalled();
  });

  it("uses the same fast readiness path for PNG exports", async () => {
    const { renderDocumentUrlToPng } = await import("./document-png");

    await renderDocumentUrlToPng("https://invios.test/quotations/public/one?print=1");

    expect(mockLaunch).toHaveBeenCalledWith(expect.objectContaining({
      args: expect.arrayContaining(["--single-process"]),
    }));
    expect(mockNewContext).toHaveBeenCalledWith({
      colorScheme: "light",
      viewport: { height: 1123, width: 794 },
    });
    expect(mockGoto).toHaveBeenCalledWith(
      "https://invios.test/quotations/public/one?print=1",
      { timeout: 15_000, waitUntil: "domcontentloaded" },
    );
  });
});
