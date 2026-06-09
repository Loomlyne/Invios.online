import { NextResponse } from "next/server";
import { requireSession } from "@/lib/require-session";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getAppContext } from "@/lib/data";
import {
  getDashboardDrilldown,
  getDashboardInsights,
  getDashboardMetrics,
} from "@/lib/billing-data";
import { dashboardRangeKeys, type DashboardRangeKey } from "@/lib/billing";
import {
  buildDashboardCsv,
  csvResponse,
  timestampSuffix,
  type DashboardExportPayload,
} from "@/lib/export-csv";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const rangeLabels: Record<DashboardRangeKey, string> = {
  all: "All time",
  "30d": "Last 30 days",
  "90d": "Last 90 days",
  "12m": "Last 12 months",
};

export async function GET(request: Request) {
  try {
    await requireSession();
  } catch {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const url = new URL(request.url);
  const rawRange = url.searchParams.get("range") ?? "all";
  const range: DashboardRangeKey = dashboardRangeKeys.includes(rawRange as DashboardRangeKey)
    ? (rawRange as DashboardRangeKey)
    : "all";

  const context = await getAppContext();
  const userId = context.userId ?? "";
  const currency = context.userState.settings.defaultCurrency;

  const [metrics, drilldownRows, insights] = await Promise.all([
    getDashboardMetrics(userId, range),
    getDashboardDrilldown(userId, "total-billed", range),
    getDashboardInsights(userId, range),
  ]);

  const supabase = await createSupabaseServerClient();
  const paymentsResult = supabase
    ? await supabase
        .from("payments")
        .select("*")
        .eq("user_id", userId)
        .order("date_paid", { ascending: false })
        .returns<{
          id: string;
          invoice_id: string;
          user_id: string;
          amount: string;
          date_paid: string;
          method: string;
          description: string | null;
          created_at: string;
        }[]>()
    : { data: [], error: null as null };
  const expensesResult = supabase
    ? await supabase
        .from("expenses")
        .select("*")
        .eq("user_id", userId)
        .order("date", { ascending: false })
        .returns<{
          id: string;
          invoice_id: string;
          user_id: string;
          amount: string;
          date: string;
          description: string;
          vendor: string | null;
          created_at: string;
        }[]>()
    : { data: [], error: null as null };

  const payments = (paymentsResult.data ?? []).map((row) => ({
    id: row.id,
    invoiceId: row.invoice_id,
    userId: row.user_id,
    amount: Number(row.amount),
    datePaid: row.date_paid,
    method: row.method as "cash" | "bank_transfer" | "cheque" | "other",
    description: row.description ?? "",
    createdAt: row.created_at,
  }));

  const expenses = (expensesResult.data ?? []).map((row) => ({
    id: row.id,
    invoiceId: row.invoice_id,
    userId: row.user_id,
    amount: Number(row.amount),
    date: row.date,
    description: row.description,
    vendor: row.vendor ?? "",
    createdAt: row.created_at,
  }));

  const payload: DashboardExportPayload = {
    rangeLabel: rangeLabels[range],
    currency,
    metrics,
    analytics: insights.analytics,
    invoiceRows: drilldownRows,
    topClients: insights.topClients,
    followUpQueue: insights.followUpQueue,
    pendingQuotations: insights.pendingQuotations,
    recentActivity: insights.recentActivity,
    payments,
    expenses,
  };

  const csv = buildDashboardCsv(payload);
  return csvResponse(csv, `invios-dashboard-${range}-${timestampSuffix()}.csv`);
}
