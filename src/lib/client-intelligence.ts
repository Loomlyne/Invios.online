import { createSupabaseServerClient } from "@/lib/supabase/server";

export interface ReliabilityInput {
  paidInvoices: { dueDate: string; paidAt: string | null }[];
}

export interface PaymentReliability {
  avgDaysToPay: number;
  tier: "fast" | "standard" | "slow" | "late";
}

/**
 * Pure computation: given paid invoices with due dates and payment dates,
 * compute the average days-to-pay and classify the client into a tier.
 *
 * Tiers:
 *   - fast:     avg <= 7 days
 *   - standard: 8–21 days
 *   - slow:     22–45 days
 *   - late:     > 45 days
 *
 * Returns null when there are no invoices with a payment date.
 */
export function computePaymentReliability(input: ReliabilityInput): PaymentReliability | null {
  const settled = input.paidInvoices.filter((inv) => inv.paidAt);
  if (settled.length === 0) return null;

  const days = settled.map((inv) => {
    const due = new Date(inv.dueDate).getTime();
    const paid = new Date(inv.paidAt!).getTime();
    return Math.max(0, Math.round((paid - due) / (1000 * 60 * 60 * 24)));
  });

  const avgDaysToPay = days.reduce((a, b) => a + b, 0) / days.length;

  let tier: PaymentReliability["tier"];
  if (avgDaysToPay <= 7) tier = "fast";
  else if (avgDaysToPay <= 21) tier = "standard";
  else if (avgDaysToPay <= 45) tier = "slow";
  else tier = "late";

  return { avgDaysToPay, tier };
}

/**
 * Data fetcher: queries settled invoices + their earliest payment for a client,
 * then runs computePaymentReliability. Returns null when the client has no
 * paid/partial/overpaid invoices or when Supabase is unavailable.
 */
export async function getClientPaymentReliability(
  clientId: string,
): Promise<PaymentReliability | null> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return null;

  // Fetch all invoices for this client that are paid or partially paid.
  const { data: invoices } = await supabase
    .from("invoices")
    .select("id, due_date")
    .eq("client_id", clientId)
    .in("status", ["paid", "partial_paid", "overpaid"]);

  if (!invoices || invoices.length === 0) return null;

  // Fetch the earliest payment date for each invoice.
  const invoiceIds = invoices.map((inv) => inv.id);
  const { data: payments } = await supabase
    .from("payments")
    .select("invoice_id, created_at")
    .in("invoice_id", invoiceIds)
    .order("created_at", { ascending: true });

  const firstPaymentByInvoice = new Map<string, string>();
  for (const p of payments ?? []) {
    if (!firstPaymentByInvoice.has(p.invoice_id)) {
      firstPaymentByInvoice.set(p.invoice_id, p.created_at);
    }
  }

  return computePaymentReliability({
    paidInvoices: invoices.map((inv) => ({
      dueDate: inv.due_date,
      paidAt: firstPaymentByInvoice.get(inv.id) ?? null,
    })),
  });
}
