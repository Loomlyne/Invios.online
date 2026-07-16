import { createSupabaseServerClient } from "@/lib/supabase/server";
import { toReportingAmount } from "@/lib/fx";

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

// ---------------------------------------------------------------------------
// Slice 4 — LTV, health, and combined intelligence fetcher
// ---------------------------------------------------------------------------

export interface LTVInput {
  paidInvoices: { total: number }[];
}

/**
 * Pure computation: sums the totals of all paid/settled invoices for a client.
 * Returns 0 when there are no paid invoices.
 */
export function computeClientLTV(input: LTVInput): number {
  return input.paidInvoices.reduce((sum, inv) => sum + inv.total, 0);
}

export interface HealthInput {
  ltv: number;
  reliability: PaymentReliability | null;
  outstandingCount: number;
  totalInvoices: number;
}

export interface ClientHealth {
  score: number; // 0-100
  label: "new" | "healthy" | "at-risk" | "critical";
  suggestedAction: string;
}

/**
 * Composite health score (0-100) derived from LTV, payment reliability, and
 * the outstanding-invoice ratio.
 *
 * Weights (starting heuristics, pinned by tests):
 *   - LTV: up to +25   (>50k → +25, >10k → +15, >0 → +5)
 *   - Reliability: +15 / +8 / -10 / -20 by tier
 *   - Outstanding ratio: -15 (>50%), -8 (>30%)
 *
 * Fewer than 2 invoices short-circuits to the "new" label (score 50) so brand
 * new clients never appear critical.
 */
export function computeClientHealth(input: HealthInput): ClientHealth {
  if (input.totalInvoices < 2) {
    return {
      score: 50,
      label: "new",
      suggestedAction: "Send the first quotation to start the relationship.",
    };
  }

  let score = 50; // baseline

  if (input.ltv >= 50000) score += 25;
  else if (input.ltv >= 10000) score += 15;
  else if (input.ltv > 0) score += 5;

  if (input.reliability) {
    switch (input.reliability.tier) {
      case "fast":
        score += 15;
        break;
      case "standard":
        score += 8;
        break;
      case "slow":
        score -= 10;
        break;
      case "late":
        score -= 20;
        break;
    }
  }

  const outstandingRatio =
    input.totalInvoices > 0 ? input.outstandingCount / input.totalInvoices : 0;
  if (outstandingRatio > 0.5) score -= 15;
  else if (outstandingRatio > 0.3) score -= 8;

  score = Math.max(0, Math.min(100, score));

  let label: ClientHealth["label"];
  let suggestedAction: string;

  if (score >= 80) {
    label = "healthy";
    suggestedAction = "Priority client. Consider offering recurring billing.";
  } else if (score >= 30) {
    label = "at-risk";
    suggestedAction =
      input.reliability?.tier === "late" || input.reliability?.tier === "slow"
        ? "Send a payment reminder before the next project."
        : "Monitor payment patterns on the next invoice.";
  } else {
    label = "critical";
    suggestedAction = "Require upfront payment before taking on new work.";
  }

  return { score, label, suggestedAction };
}

export interface ClientIntelligence {
  ltv: number;
  reliability: PaymentReliability | null;
  health: ClientHealth;
}

/**
 * Combined data fetcher: queries all invoices + payments for a client and
 * computes LTV, payment reliability, and a composite health score.
 *
 * Returns null when the client has no invoices or when Supabase is unavailable.
 */
export async function getClientIntelligence(
  clientId: string,
): Promise<ClientIntelligence | null> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return null;

  const { data: invoices } = await supabase
    .from("invoices")
    .select("id, total, status, due_date, currency")
    .eq("client_id", clientId);

  if (!invoices || invoices.length === 0) return null;

  const settled = invoices.filter((inv) =>
    ["paid", "partial_paid", "overpaid"].includes(inv.status),
  );

  const settledIds = settled.map((inv) => inv.id);
  const { data: payments } = await supabase
    .from("payments")
    .select("invoice_id, created_at")
    .in("invoice_id", settledIds)
    .order("created_at", { ascending: true });

  const firstPaymentByInvoice = new Map<string, string>();
  for (const p of payments ?? []) {
    if (!firstPaymentByInvoice.has(p.invoice_id)) {
      firstPaymentByInvoice.set(p.invoice_id, p.created_at);
    }
  }

  const reliability = computePaymentReliability({
    paidInvoices: settled.map((inv) => ({
      dueDate: inv.due_date,
      paidAt: firstPaymentByInvoice.get(inv.id) ?? null,
    })),
  });

  const ltv = computeClientLTV({
    paidInvoices: settled.map((inv) => ({
      total: toReportingAmount(Number(inv.total), String(inv.currency ?? "AED")),
    })),
  });

  const outstandingCount = invoices.filter((inv) =>
    ["sent", "overdue", "partial_paid"].includes(inv.status),
  ).length;

  const health = computeClientHealth({
    ltv,
    reliability,
    outstandingCount,
    totalInvoices: invoices.length,
  });

  return { ltv, reliability, health };
}
