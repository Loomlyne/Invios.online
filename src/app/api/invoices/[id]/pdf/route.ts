import { NextResponse } from "next/server";
import { getInvoiceById } from "@/lib/billing-data";
import { renderDocumentUrlToPdf } from "@/lib/document-pdf";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const invoice = await getInvoiceById(id);

  if (!invoice) {
    return NextResponse.json({ error: "Invoice not found." }, { status: 404 });
  }

  const origin = new URL(request.url).origin;
  const pdfBuffer = await renderDocumentUrlToPdf(
    `${origin}/invoices/public/${invoice.shareToken}?print=1`,
  );

  return new NextResponse(pdfBuffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${invoice.invoiceNumber}.pdf"`,
    },
  });
}
