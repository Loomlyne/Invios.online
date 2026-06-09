import { NextResponse } from "next/server";
import { requireSession } from "@/lib/require-session";
import { listClients, listInvoices } from "@/lib/billing-data";
import {
  buildClientsCsv,
  csvResponse,
  timestampSuffix,
  type ClientExportRow,
} from "@/lib/export-csv";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireSession();
  } catch {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const [clients, invoices] = await Promise.all([
    listClients({}),
    listInvoices({}),
  ]);

  const { createSupabaseServerClient } = await import("@/lib/supabase/server");
  const supabase = await createSupabaseServerClient();
  const quotationsResult = supabase
    ? await supabase
        .from("quotations")
        .select("client_id,status")
        .returns<{ client_id: string; status: string }[]>()
    : { data: [] as { client_id: string; status: string }[], error: null };
  const paymentsResult = supabase
    ? await supabase
        .from("payments")
        .select("invoice_id,amount")
        .returns<{ invoice_id: string; amount: string }[]>()
    : { data: [] as { invoice_id: string; amount: string }[], error: null };

  const paymentByInvoice = new Map<string, number>();
  for (const p of paymentsResult.data ?? []) {
    paymentByInvoice.set(p.invoice_id, (paymentByInvoice.get(p.invoice_id) ?? 0) + Number(p.amount));
  }

  const stats = new Map<
    string,
    { invoiceCount: number; billedTotal: number; collectedTotal: number; outstandingTotal: number }
  >();
  for (const inv of invoices) {
    if (inv.status === "draft") continue;
    const collected = paymentByInvoice.get(inv.id) ?? 0;
    const outstanding = Math.max(inv.total - collected, 0);
    const current = stats.get(inv.clientId) ?? {
      invoiceCount: 0,
      billedTotal: 0,
      collectedTotal: 0,
      outstandingTotal: 0,
    };
    current.invoiceCount += 1;
    current.billedTotal += inv.total;
    current.collectedTotal += collected;
    current.outstandingTotal += outstanding;
    stats.set(inv.clientId, current);
  }

  const quotationStats = new Map<string, { quotationCount: number; acceptedQuotations: number }>();
  for (const q of quotationsResult.data ?? []) {
    const current = quotationStats.get(q.client_id) ?? { quotationCount: 0, acceptedQuotations: 0 };
    current.quotationCount += 1;
    if (q.status === "accepted") current.acceptedQuotations += 1;
    quotationStats.set(q.client_id, current);
  }

  const rows: ClientExportRow[] = clients.map((client) => {
    const s = stats.get(client.id) ?? {
      invoiceCount: 0,
      billedTotal: 0,
      collectedTotal: 0,
      outstandingTotal: 0,
    };
    const q = quotationStats.get(client.id) ?? { quotationCount: 0, acceptedQuotations: 0 };
    return {
      client,
      invoiceCount: s.invoiceCount,
      billedTotal: s.billedTotal,
      collectedTotal: s.collectedTotal,
      outstandingTotal: s.outstandingTotal,
      quotationCount: q.quotationCount,
      acceptedQuotations: q.acceptedQuotations,
    };
  });

  const csv = buildClientsCsv(rows);
  return csvResponse(csv, `invios-clients-${timestampSuffix()}.csv`);
}
