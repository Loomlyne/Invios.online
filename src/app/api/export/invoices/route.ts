import { NextResponse } from "next/server";
import { requireSession } from "@/lib/require-session";
import { listInvoices } from "@/lib/billing-data";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  buildInvoicesCsv,
  csvResponse,
  timestampSuffix,
  type InvoiceExportRow,
} from "@/lib/export-csv";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireSession();
  } catch {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const supabase = await createSupabaseServerClient();
  const invoices = await listInvoices({});

  const paymentsResult = supabase
    ? await supabase
        .from("payments")
        .select("invoice_id,amount")
        .returns<{ invoice_id: string; amount: string }[]>()
    : { data: [] as { invoice_id: string; amount: string }[], error: null };

  const expensesResult = supabase
    ? await supabase
        .from("expenses")
        .select("invoice_id,amount")
        .returns<{ invoice_id: string; amount: string }[]>()
    : { data: [] as { invoice_id: string; amount: string }[], error: null };

  const paymentByInvoice = new Map<string, number>();
  for (const p of paymentsResult.data ?? []) {
    paymentByInvoice.set(p.invoice_id, (paymentByInvoice.get(p.invoice_id) ?? 0) + Number(p.amount));
  }
  const expenseByInvoice = new Map<string, number>();
  for (const e of expensesResult.data ?? []) {
    expenseByInvoice.set(e.invoice_id, (expenseByInvoice.get(e.invoice_id) ?? 0) + Number(e.amount));
  }

  const rows: InvoiceExportRow[] = invoices.map((invoice) => {
    const collected = paymentByInvoice.get(invoice.id) ?? 0;
    const expenses = expenseByInvoice.get(invoice.id) ?? 0;
    const outstanding = Math.max(invoice.total - collected, 0);
    const profit = collected - expenses;
    return {
      invoice,
      collectedAmount: collected,
      outstandingAmount: outstanding,
      expenseAmount: expenses,
      profitAmount: profit,
    };
  });

  const csv = buildInvoicesCsv(rows);
  return csvResponse(csv, `invios-invoices-${timestampSuffix()}.csv`);
}
