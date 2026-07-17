import { NextResponse } from "next/server";
import { getQuotationById } from "@/lib/billing-data";
import { renderDocumentUrlToPng } from "@/lib/document-png";
import { requireSession } from "@/lib/require-session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  // Explicit session + ownership check, matching invoice exports.
  let userId: string;
  try {
    const { user } = await requireSession();
    userId = user.id;
  } catch {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const quotation = await getQuotationById(id);
  if (!quotation || quotation.userId !== userId) {
    return NextResponse.json({ error: "Quotation not found." }, { status: 404 });
  }

  const origin = new URL(request.url).origin;
  const pngBuffer = await renderDocumentUrlToPng(
    `${origin}/quotations/public/${quotation.shareToken}?print=1`,
  );

  return new NextResponse(pngBuffer, {
    headers: {
      "Content-Type": "image/png",
      "Content-Disposition": `inline; filename="${quotation.quotationNumber}.png"`,
    },
  });
}
