import chromium from "@sparticuz/chromium";
import { chromium as playwright } from "playwright-core";

export async function renderDocumentUrlToPdf(url: string) {
  const browser = await playwright.launch({
    args: chromium.args,
    executablePath: await chromium.executablePath(),
    headless: true,
  });

  try {
    const page = await browser.newPage({
      colorScheme: "light",
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

    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: {
        top: "12mm",
        right: "12mm",
        bottom: "12mm",
        left: "12mm",
      },
    });

    return Buffer.from(pdf);
  } finally {
    await browser.close();
  }
}
