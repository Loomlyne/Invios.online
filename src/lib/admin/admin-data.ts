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
 * RLS.
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

// ---------------------------------------------------------------------------
// Accounts overview (Wave 1)
// ---------------------------------------------------------------------------

export type AccountFlag = "lapsed_subscription" | "no_activity" | "stuck_onboarding";

export interface AccountRow {
  userId: string;
  email: string;
  fullName: string | null;
  businessName: string | null;
  createdAt: string;
  onboardingComplete: boolean;
  isPro: boolean;
  subscriptionStatus: string | null;
  clients: number;
  invoices: number;
  quotations: number;
  billed: number;
  collected: number;
  outstanding: number;
  currency: string;
  lastActivityAt: string | null;
  flags: AccountFlag[];
}

function isActiveStatus(status: string | null | undefined, periodEnd: string | null | undefined): boolean {
  if (!status) return false;
  if (status === "active" || status === "trialing") return true;
  if (status === "canceled" && periodEnd) return new Date(periodEnd) > new Date();
  return false;
}

function maxIso(a: string | null, b: string | null | undefined): string | null {
  if (!b) return a;
  if (!a) return b;
  return new Date(b) > new Date(a) ? b : a;
}

/**
 * Assemble a row per account with stats and health flags. Reads every row of a
 * handful of tables via the service-role client and aggregates in memory.
 *
 * This is intentionally simple and correct for the current scale. If account /
 * document volume grows large, replace the per-table scans with a SQL view
 * (e.g. a materialized `account_stats`) — the call site here stays the same.
 */
export async function listAccounts(admin: SupabaseClient): Promise<AccountRow[]> {
  const [
    profilesRes,
    brandingRes,
    settingsRes,
    subsRes,
    clientsRes,
    invoicesRes,
    quotationsRes,
    paymentsRes,
  ] = await Promise.all([
    admin.from("profiles").select("id,email,full_name,onboarding_completed_at,created_at"),
    admin.from("branding").select("user_id,business_name"),
    admin.from("user_settings").select("user_id,default_currency"),
    admin.from("subscriptions").select("user_id,status,current_period_end"),
    admin.from("clients").select("user_id"),
    admin.from("invoices").select("user_id,status,total,updated_at"),
    admin.from("quotations").select("user_id,updated_at"),
    admin.from("payments").select("user_id,amount"),
  ]);

  for (const [label, res] of Object.entries({
    profiles: profilesRes,
    branding: brandingRes,
    settings: settingsRes,
    subscriptions: subsRes,
    clients: clientsRes,
    invoices: invoicesRes,
    quotations: quotationsRes,
    payments: paymentsRes,
  })) {
    if (res.error) console.error(`[admin-data] listAccounts ${label} failed:`, res.error.message);
  }

  type Row = Record<string, unknown>;
  const profiles = (profilesRes.data ?? []) as Row[];
  const branding = new Map(
    ((brandingRes.data ?? []) as Row[]).map((r) => [r.user_id as string, r.business_name as string | null]),
  );
  const currency = new Map(
    ((settingsRes.data ?? []) as Row[]).map((r) => [
      r.user_id as string,
      (r.default_currency as string | null) ?? "AED",
    ]),
  );
  const subs = new Map(
    ((subsRes.data ?? []) as Row[]).map((r) => [r.user_id as string, r]),
  );

  const clientCount = new Map<string, number>();
  for (const r of (clientsRes.data ?? []) as Row[]) {
    const uid = r.user_id as string;
    clientCount.set(uid, (clientCount.get(uid) ?? 0) + 1);
  }

  const invStats = new Map<string, { count: number; billed: number; lastActivity: string | null }>();
  for (const r of (invoicesRes.data ?? []) as Row[]) {
    const uid = r.user_id as string;
    const cur = invStats.get(uid) ?? { count: 0, billed: 0, lastActivity: null };
    cur.count += 1;
    if (r.status !== "draft") cur.billed += Number(r.total ?? 0);
    cur.lastActivity = maxIso(cur.lastActivity, r.updated_at as string | null);
    invStats.set(uid, cur);
  }

  const quoStats = new Map<string, { count: number; lastActivity: string | null }>();
  for (const r of (quotationsRes.data ?? []) as Row[]) {
    const uid = r.user_id as string;
    const cur = quoStats.get(uid) ?? { count: 0, lastActivity: null };
    cur.count += 1;
    cur.lastActivity = maxIso(cur.lastActivity, r.updated_at as string | null);
    quoStats.set(uid, cur);
  }

  const collected = new Map<string, number>();
  for (const r of (paymentsRes.data ?? []) as Row[]) {
    const uid = r.user_id as string;
    collected.set(uid, (collected.get(uid) ?? 0) + Number(r.amount ?? 0));
  }

  const now = Date.now();
  const threeDaysMs = 3 * 24 * 60 * 60 * 1000;

  const rows: AccountRow[] = profiles.map((p) => {
    const userId = p.id as string;
    const sub = subs.get(userId);
    const subStatus = (sub?.status as string | null) ?? null;
    const periodEnd = (sub?.current_period_end as string | null) ?? null;
    const isPro = isActiveStatus(subStatus, periodEnd);

    const inv = invStats.get(userId) ?? { count: 0, billed: 0, lastActivity: null };
    const quo = quoStats.get(userId) ?? { count: 0, lastActivity: null };
    const billed = inv.billed;
    const coll = collected.get(userId) ?? 0;
    const outstanding = Math.max(billed - coll, 0);
    const onboardingComplete = Boolean(p.onboarding_completed_at);
    const createdAt = (p.created_at as string) ?? "";
    const lastActivityAt = maxIso(maxIso(inv.lastActivity, quo.lastActivity), createdAt || null);

    const flags: AccountFlag[] = [];
    if (subStatus === "past_due" || (subStatus === "canceled" && periodEnd && new Date(periodEnd).getTime() < now)) {
      flags.push("lapsed_subscription");
    }
    if (inv.count === 0 && quo.count === 0) flags.push("no_activity");
    if (!onboardingComplete && createdAt && now - new Date(createdAt).getTime() > threeDaysMs) {
      flags.push("stuck_onboarding");
    }

    return {
      userId,
      email: (p.email as string) ?? "",
      fullName: (p.full_name as string | null) ?? null,
      businessName: branding.get(userId) ?? null,
      createdAt,
      onboardingComplete,
      isPro,
      subscriptionStatus: subStatus,
      clients: clientCount.get(userId) ?? 0,
      invoices: inv.count,
      quotations: quo.count,
      billed,
      collected: coll,
      outstanding,
      currency: currency.get(userId) ?? "AED",
      lastActivityAt,
      flags,
    };
  });

  rows.sort((a, b) => {
    const at = a.lastActivityAt ? new Date(a.lastActivityAt).getTime() : 0;
    const bt = b.lastActivityAt ? new Date(b.lastActivityAt).getTime() : 0;
    return bt - at;
  });

  return rows;
}

// ---------------------------------------------------------------------------
// Per-account deep view (Wave 1)
// ---------------------------------------------------------------------------

export interface AccountClient {
  id: string;
  name: string;
  company: string | null;
  email: string | null;
  createdAt: string;
}

export interface AccountDocument {
  id: string;
  number: string;
  status: string;
  total: number;
  currency: string;
  date: string;
  shareToken: string | null;
}

export interface AccountDetail {
  userId: string;
  email: string;
  fullName: string | null;
  businessName: string | null;
  currency: string;
  createdAt: string;
  onboardingComplete: boolean;
  subscriptionStatus: string | null;
  isPro: boolean;
  totals: { billed: number; collected: number; outstanding: number; expenses: number };
  clients: AccountClient[];
  invoices: AccountDocument[];
  quotations: AccountDocument[];
}

/**
 * Full detail for one account. `admin` must be a service-role client.
 * Returns null if the account (profile) does not exist.
 */
export async function getAccountDetail(
  admin: SupabaseClient,
  userId: string,
): Promise<AccountDetail | null> {
  type Row = Record<string, unknown>;

  const [profileRes, brandingRes, settingsRes, subRes, clientsRes, invoicesRes, quotationsRes, paymentsRes, expensesRes] =
    await Promise.all([
      admin.from("profiles").select("id,email,full_name,onboarding_completed_at,created_at").eq("id", userId).maybeSingle(),
      admin.from("branding").select("business_name").eq("user_id", userId).maybeSingle(),
      admin.from("user_settings").select("default_currency").eq("user_id", userId).maybeSingle(),
      admin.from("subscriptions").select("status,current_period_end").eq("user_id", userId).maybeSingle(),
      admin.from("clients").select("id,name,company,email,created_at").eq("user_id", userId).order("created_at", { ascending: false }),
      admin.from("invoices").select("id,invoice_number,status,total,currency,issue_date,share_token,updated_at").eq("user_id", userId).order("updated_at", { ascending: false }),
      admin.from("quotations").select("id,quotation_number,status,total,currency,quotation_date,share_token,updated_at").eq("user_id", userId).order("updated_at", { ascending: false }),
      admin.from("payments").select("amount").eq("user_id", userId),
      admin.from("expenses").select("amount").eq("user_id", userId),
    ]);

  const profile = profileRes.data as Row | null;
  if (!profile) return null;

  const currency = ((settingsRes.data as Row | null)?.default_currency as string | null) ?? "AED";
  const subStatus = ((subRes.data as Row | null)?.status as string | null) ?? null;
  const periodEnd = ((subRes.data as Row | null)?.current_period_end as string | null) ?? null;

  const invoices = ((invoicesRes.data ?? []) as Row[]).map((r) => ({
    id: r.id as string,
    number: (r.invoice_number as string) ?? "—",
    status: (r.status as string) ?? "draft",
    total: Number(r.total ?? 0),
    currency: (r.currency as string) ?? currency,
    date: (r.issue_date as string) ?? "",
    shareToken: (r.share_token as string | null) ?? null,
  }));

  const quotations = ((quotationsRes.data ?? []) as Row[]).map((r) => ({
    id: r.id as string,
    number: (r.quotation_number as string) ?? "—",
    status: (r.status as string) ?? "draft",
    total: Number(r.total ?? 0),
    currency: (r.currency as string) ?? currency,
    date: (r.quotation_date as string) ?? "",
    shareToken: (r.share_token as string | null) ?? null,
  }));

  const billed = invoices
    .filter((i) => i.status !== "draft")
    .reduce((sum, i) => sum + i.total, 0);
  const collected = ((paymentsRes.data ?? []) as Row[]).reduce((s, r) => s + Number(r.amount ?? 0), 0);
  const expenses = ((expensesRes.data ?? []) as Row[]).reduce((s, r) => s + Number(r.amount ?? 0), 0);

  return {
    userId: profile.id as string,
    email: (profile.email as string) ?? "",
    fullName: (profile.full_name as string | null) ?? null,
    businessName: ((brandingRes.data as Row | null)?.business_name as string | null) ?? null,
    currency,
    createdAt: (profile.created_at as string) ?? "",
    onboardingComplete: Boolean(profile.onboarding_completed_at),
    subscriptionStatus: subStatus,
    isPro: isActiveStatus(subStatus, periodEnd),
    totals: { billed, collected, outstanding: Math.max(billed - collected, 0), expenses },
    clients: ((clientsRes.data ?? []) as Row[]).map((r) => ({
      id: r.id as string,
      name: (r.name as string) ?? "—",
      company: (r.company as string | null) ?? null,
      email: (r.email as string | null) ?? null,
      createdAt: (r.created_at as string) ?? "",
    })),
    invoices,
    quotations,
  };
}
