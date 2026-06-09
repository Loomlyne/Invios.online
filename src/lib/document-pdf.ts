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

    await page.setViewportSize({ width: 794, height: 1123 }); // A4 at 96 DPI
    await page.emulateMedia({ media: "screen" });
    await page.goto(url, {
      waitUntil: "networkidle",
      timeout: 30_000,
    });
    await page.waitForSelector("[data-document-template]", { timeout: 15_000 });
    await page.evaluate(async () => {
      await document.fonts.ready;
    });

    // Override app theme background so every PDF page is white, not cream.
    // Also prevent signature/footer sections from orphaning at the top of a page.
    await page.addStyleTag({
      content: `
        html, body { background: white !important; background-color: white !important; }
        [data-document-template] { background: white !important; }
        @page { margin: 12mm; background: white; }
      `,
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
