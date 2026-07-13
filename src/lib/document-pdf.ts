import { loadDocumentPage, withDocumentPage } from "@/lib/document-renderer";

export async function renderDocumentUrlToPdf(url: string) {
  return withDocumentPage(async (page) => {
    await loadDocumentPage(page, url);

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
  });
}
