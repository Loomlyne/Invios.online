import type { SupabaseClient } from "@supabase/supabase-js";

export interface PlatformSummary {
  accounts: number;
  clients: number;
  invoices: number;
  quotations: number;
  payments: number;
  activeSubscriptions: number;
}

/**
 * Cross-account counts for the admin landing page. Uses head-only `count`
 * queries (no rows transferred) via the service-role client, which bypasses
 * RLS. This is intentionally lightweight; richer per-account data lands in
 * later waves (accounts list / account deep view).
 *
 * `admin` must be a service-role client (from requireAdmin()).
 */
export async function getPlatformSummary(
  admin: SupabaseClient,
): Promise<PlatformSummary> {
  async function countAll(table: string): Promise<number> {
    const { count, error } = await admin
      .from(table)
      .select("*", { count: "exact", head: true });
    if (error) {
      console.error(`[admin-data] count(${table}) failed:`, error.message);
      return 0;
    }
    return count ?? 0;
  }

  async function countActiveSubscriptions(): Promise<number> {
    const { count, error } = await admin
      .from("subscriptions")
      .select("*", { count: "exact", head: true })
      .in("status", ["active", "trialing"]);
    if (error) {
      console.error("[admin-data] count(active subscriptions) failed:", error.message);
      return 0;
    }
    return count ?? 0;
  }

  const [accounts, clients, invoices, quotations, payments, activeSubscriptions] =
    await Promise.all([
      countAll("profiles"),
      countAll("clients"),
      countAll("invoices"),
      countAll("quotations"),
      countAll("payments"),
      countActiveSubscriptions(),
    ]);

  return { accounts, clients, invoices, quotations, payments, activeSubscriptions };
}
