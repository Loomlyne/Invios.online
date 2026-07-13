import { NextResponse } from "next/server";
import { getQuotationById } from "@/lib/billing-data";
import { renderDocumentUrlToPdf } from "@/lib/document-pdf";
import { requireSession } from "@/lib/require-session";
import { sendPdfEmail } from "@/lib/email";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  // Session + ownership check (defense-in-depth beyond RLS).
  let userId: string;
  let userEmail: string;
  try {
    const { user } = await requireSession();
    userId = user.id;
    userEmail = user.email ?? "";
  } catch {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  if (!userEmail) {
    return NextResponse.json({ error: "No email address on account." }, { status: 400 });
  }

  const quotation = await getQuotationById(id);
  if (!quotation || quotation.userId !== userId) {
    return NextResponse.json({ error: "Quotation not found." }, { status: 404 });
  }

  const origin = new URL(request.url).origin;
  const pdfBuffer = await renderDocumentUrlToPdf(
    `${origin}/quotations/public/${quotation.shareToken}?print=1`,
  );

  await sendPdfEmail({
    to: userEmail,
    documentNumber: quotation.quotationNumber,
    pdfBuffer,
    kind: "quotation",
  });

  return NextResponse.json({ sent: true });
}
