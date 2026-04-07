import chromium from "@sparticuz/chromium";
import { chromium as playwright } from "playwright-core";

export async function renderDocumentUrlToPng(url: string) {
  const browser = await playwright.launch({
    args: chromium.args,
    executablePath: await chromium.executablePath(),
    headless: true,
  });

  try {
    const page = await browser.newPage({
      colorScheme: "light",
      viewport: { width: 794, height: 1123 },
    });

    await page.emulateMedia({ media: "screen" });
    await page.goto(url, {
      waitUntil: "networkidle",
      timeout: 30_000,
    });
    await page.waitForSelector("[data-document-template]", { timeout: 15_000 });
    await page.evaluate(async () => {
      await document.fonts.ready;
    });

    const screenshot = await page.screenshot({
      fullPage: true,
      type: "png",
    });

    return Buffer.from(screenshot);
  } finally {
    await browser.close();
  }
}
