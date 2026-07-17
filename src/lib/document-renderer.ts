import chromium from "@sparticuz/chromium";
import { chromium as playwright, type Browser, type Page } from "playwright-core";

const DOCUMENT_VIEWPORT = { width: 794, height: 1123 }; // A4 at 96 DPI

let browserPromise: Promise<Browser> | null = null;

async function getDocumentBrowser(): Promise<Browser> {
  if (!browserPromise) {
    browserPromise = playwright.launch({
      args: [...chromium.args, "--single-process"],
      executablePath: await chromium.executablePath(),
      headless: true,
    }).catch((error: unknown) => {
      browserPromise = null;
      throw error;
    });
  }

  const browser = await browserPromise;
  if (browser.isConnected()) return browser;

  browserPromise = null;
  return getDocumentBrowser();
}

export async function withDocumentPage<T>(render: (page: Page) => Promise<T>): Promise<T> {
  const browser = await getDocumentBrowser();
  let context: Awaited<ReturnType<Browser["newContext"]>> | undefined;

  try {
    // A context is cheap, clean, and keeps concurrent exports isolated while the
    // warm browser process avoids a fresh Chromium launch for every request.
    context = await browser.newContext({
      colorScheme: "light",
      viewport: DOCUMENT_VIEWPORT,
    });
    const page = await context.newPage();
    await page.emulateMedia({ media: "screen" });

    return await render(page);
  } catch (error) {
    if (!browser.isConnected()) browserPromise = null;
    throw error;
  } finally {
    await context?.close();
  }
}

export async function loadDocumentPage(page: Page, url: string): Promise<void> {
  // Print pages are server-rendered. Waiting for DOM readiness avoids the long
  // and unnecessary network-idle delay while fonts still guarantee final layout.
  const response = await page.goto(url, {
    waitUntil: "domcontentloaded",
    timeout: 15_000,
  });

  if (!response?.ok()) {
    throw new Error(`Document render page returned HTTP ${response?.status() ?? "unknown"}.`);
  }

  await page.waitForSelector("[data-document-template]", { timeout: 10_000 });
  await page.evaluate(async () => {
    await document.fonts.ready;
  });
}
