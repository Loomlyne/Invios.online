const A4_PAGE_WIDTH_MM = 210;
const A4_PAGE_HEIGHT_MM = 297;
const DOCUMENT_CAPTURE_SELECTOR = '[data-document-template][data-document-mode="page"]';

type PdfPagePlanInput = {
  canvasHeight: number;
  canvasWidth: number;
  pageHeightMm: number;
  pageWidthMm: number;
};

type PdfPagePlan = {
  imageHeightMm: number;
  positionsMm: number[];
};

export function getPdfPagePlan({
  canvasHeight,
  canvasWidth,
  pageHeightMm,
  pageWidthMm,
}: PdfPagePlanInput): PdfPagePlan {
  if (canvasWidth <= 0 || canvasHeight <= 0) {
    throw new Error("The document preview has no visible size.");
  }

  const imageHeightMm = Number(((canvasHeight * pageWidthMm) / canvasWidth).toFixed(3));
  // Canvas pixels rarely map to an exact A4 ratio. Ignore sub-millimetre
  // rounding so a one-page invoice never receives a blank trailing page.
  const pageCount = Math.max(1, Math.ceil((imageHeightMm / pageHeightMm) - 0.001));
  const positionsMm = Array.from(
    { length: pageCount },
    (_, index) => (index === 0 ? 0 : -(index * pageHeightMm)),
  );

  return { imageHeightMm, positionsMm };
}

function waitForImages(root: HTMLElement): Promise<void> {
  const images = Array.from(root.querySelectorAll("img"));

  return Promise.all(images.map((image) => {
    if (image.complete) return Promise.resolve();

    return new Promise<void>((resolve) => {
      image.addEventListener("load", () => resolve(), { once: true });
      image.addEventListener("error", () => resolve(), { once: true });
    });
  })).then(() => undefined);
}

function createCaptureCopy(source: HTMLElement): { clone: HTMLElement; host: HTMLDivElement } {
  const host = document.createElement("div");
  host.setAttribute("aria-hidden", "true");
  host.style.cssText = [
    "position:fixed",
    "top:0",
    "left:-100000px",
    "width:794px",
    "background:#ffffff",
    "pointer-events:none",
    "z-index:-1",
  ].join(";");

  const clone = source.cloneNode(true) as HTMLElement;
  clone.style.width = "794px";
  clone.style.maxWidth = "none";
  clone.style.border = "0";
  clone.style.borderRadius = "0";
  host.appendChild(clone);
  document.body.appendChild(host);

  return { clone, host };
}

export function preloadFastPdfExporter(): void {
  void Promise.all([import("html2canvas"), import("jspdf")]).catch(() => undefined);
}

export async function exportCurrentDocumentAsPdf(filename: string): Promise<number> {
  const source = document.querySelector<HTMLElement>(DOCUMENT_CAPTURE_SELECTOR);
  if (!source) throw new Error("Document preview is unavailable.");

  const startedAt = performance.now();
  const { clone, host } = createCaptureCopy(source);

  try {
    await document.fonts?.ready;
    await waitForImages(clone);

    const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
      import("html2canvas"),
      import("jspdf"),
    ]);
    const canvas = await html2canvas(clone, {
      backgroundColor: "#ffffff",
      logging: false,
      scale: Math.min(2, Math.max(1, window.devicePixelRatio || 1)),
      useCORS: true,
      windowWidth: 794,
    });
    const pdf = new jsPDF({
      compress: true,
      format: "a4",
      orientation: "portrait",
      unit: "mm",
    });
    const { imageHeightMm, positionsMm } = getPdfPagePlan({
      canvasHeight: canvas.height,
      canvasWidth: canvas.width,
      pageHeightMm: A4_PAGE_HEIGHT_MM,
      pageWidthMm: A4_PAGE_WIDTH_MM,
    });
    const imageData = canvas.toDataURL("image/jpeg", 0.92);

    positionsMm.forEach((positionMm, index) => {
      if (index > 0) pdf.addPage();
      pdf.addImage(
        imageData,
        "JPEG",
        0,
        positionMm,
        A4_PAGE_WIDTH_MM,
        imageHeightMm,
        undefined,
        "FAST",
      );
    });
    pdf.save(filename);

    return performance.now() - startedAt;
  } finally {
    host.remove();
  }
}
