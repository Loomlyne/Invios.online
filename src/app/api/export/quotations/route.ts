import { NextResponse } from "next/server";
import { requireSession } from "@/lib/require-session";
import { listQuotations } from "@/lib/billing-data";
import { buildQuotationsCsv, csvResponse, timestampSuffix } from "@/lib/export-csv";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireSession();
  } catch {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const quotations = await listQuotations({});
  const csv = buildQuotationsCsv(quotations);
  return csvResponse(csv, `invios-quotations-${timestampSuffix()}.csv`);
}
