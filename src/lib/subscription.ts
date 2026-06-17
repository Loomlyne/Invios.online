import { createSupabaseAdminClient } from "@/lib/supabase/admin";

type SubRow = { status: string; current_period_end: string | null } | null;

export async function getSubscription(userId: string): Promise<SubRow> {
  const admin = createSupabaseAdminClient();
  if (!admin) return null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (admin as any)
    .from("subscriptions")
    .select("status, current_period_end")
    .eq("user_id", userId)
    .maybeSingle();
  return data ?? null;
}

export function isSubscriptionActive(sub: SubRow): boolean {
  if (!sub) return false;
  if (sub.status === "active" || sub.status === "trialing") return true;
  if (sub.status === "canceled" && sub.current_period_end) {
    return new Date(sub.current_period_end) > new Date();
  }
  return false;
}

export async function isPaidUser(userId: string): Promise<boolean> {
  return isSubscriptionActive(await getSubscription(userId));
}
