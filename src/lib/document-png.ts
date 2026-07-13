import { loadDocumentPage, withDocumentPage } from "@/lib/document-renderer";

export async function renderDocumentUrlToPng(url: string) {
  return withDocumentPage(async (page) => {
    await loadDocumentPage(page, url);

    const screenshot = await page.screenshot({
      fullPage: true,
      type: "png",
    });

    return Buffer.from(screenshot);
  });
}
