import { NextResponse } from "next/server";
import { getInvoiceById } from "@/lib/billing-data";
import { renderDocumentUrlToPng } from "@/lib/document-png";

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
  const pngBuffer = await renderDocumentUrlToPng(
    `${origin}/invoices/public/${invoice.shareToken}?print=1`,
  );

  return new NextResponse(pngBuffer, {
    headers: {
      "Content-Type": "image/png",
      "Content-Disposition": `inline; filename="${invoice.invoiceNumber}.png"`,
    },
  });
}
