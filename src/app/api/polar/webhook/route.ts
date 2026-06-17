import type { NextRequest } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { sendSubscriptionActivatedEmail, sendSubscriptionCanceledEmail } from "@/lib/email";

export const runtime = "nodejs";

const POLAR_WEBHOOK_SECRET = process.env.POLAR_WEBHOOK_SECRET ?? "";

async function verifySignature(secret: string, body: string, signature: string): Promise<boolean> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["verify"],
  );
  const sigBytes = hexToBytes(signature);
  return crypto.subtle.verify("HMAC", key, sigBytes, encoder.encode(body));
}

function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.slice(i, i + 2), 16);
  }
  return bytes;
}

function mapPolarStatus(polarStatus: string): string {
  const map: Record<string, string> = {
    active: "active",
    trialing: "trialing",
    past_due: "past_due",
    canceled: "canceled",
    revoked: "revoked",
    unpaid: "past_due",
    incomplete: "inactive",
    incomplete_expired: "inactive",
  };
  return map[polarStatus] ?? "inactive";
}

async function resolveUserId(supabase: NonNullable<ReturnType<typeof createSupabaseAdminClient>>, email: string): Promise<string | null> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any).auth.admin.listUsers();
  if (error || !data) return null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const match = data.users.find((u: any) => u.email === email);
  return match?.id ?? null;
}

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get("webhook-signature") ?? request.headers.get("polar-signature") ?? "";

  if (!POLAR_WEBHOOK_SECRET || !signature) {
    return new Response("Unauthorized", { status: 400 });
  }

  const sigValue = signature.startsWith("v1=") ? signature.slice(3) : signature;

  const valid = await verifySignature(POLAR_WEBHOOK_SECRET, body, sigValue).catch(() => false);
  if (!valid) {
    return new Response("Invalid signature", { status: 400 });
  }

  let event: { type: string; data: Record<string, unknown> };
  try {
    event = JSON.parse(body);
  } catch {
    return new Response("Bad JSON", { status: 400 });
  }

  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    return new Response("DB unavailable", { status: 500 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  try {
    switch (event.type) {
      case "order.created": {
        const order = event.data as Record<string, unknown>;
        const customerEmail = (order.customer as Record<string, unknown>)?.email as string | undefined;
        const userId = customerEmail ? await resolveUserId(supabase, customerEmail) : null;

        if (userId) {
          await db.from("subscriptions").upsert({
            user_id: userId,
            polar_customer_id: order.customer_id as string ?? null,
            polar_order_id: order.id as string ?? null,
            status: "active",
          }, { onConflict: "user_id" });
        }
        break;
      }

      case "subscription.created":
      case "subscription.updated": {
        const sub = event.data as Record<string, unknown>;
        const customerEmail = (sub.customer as Record<string, unknown>)?.email as string | undefined;
        const userId = customerEmail ? await resolveUserId(supabase, customerEmail) : null;

        if (!userId) break;

        const interval = ((sub.price as Record<string, unknown>)?.interval as string | undefined);
        const plan = interval === "year" ? "annual" : "monthly";
        const polarStatus = sub.status as string ?? "inactive";
        const status = mapPolarStatus(polarStatus);
        const periodEnd = sub.current_period_end as string | undefined ?? null;

        const { data: existing } = await db
          .from("subscriptions")
          .select("access_key")
          .eq("user_id", userId)
          .maybeSingle();

        await db.from("subscriptions").upsert({
          user_id: userId,
          polar_customer_id: (sub.customer_id as string) ?? null,
          polar_subscription_id: sub.id as string,
          status,
          current_period_end: periodEnd,
          plan,
        }, { onConflict: "user_id" });

        // Send activation email if newly active and no access_key yet
        if (event.type === "subscription.created" && status === "active" && customerEmail && !existing?.access_key) {
          sendSubscriptionActivatedEmail(customerEmail, plan);
        }
        break;
      }

      case "subscription.canceled": {
        const sub = event.data as Record<string, unknown>;
        const periodEnd = sub.current_period_end as string | undefined ?? null;
        const subscriptionId = sub.id as string;

        const { data: row } = await db
          .from("subscriptions")
          .select("user_id")
          .eq("polar_subscription_id", subscriptionId)
          .maybeSingle();

        if (row?.user_id) {
          await db.from("subscriptions")
            .update({ status: "canceled", current_period_end: periodEnd })
            .eq("polar_subscription_id", subscriptionId);

          // Look up email for notification
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const { data: authData } = await (supabase as any).auth.admin.getUserById(row.user_id);
          if (authData?.user?.email && periodEnd) {
            const formattedDate = new Date(periodEnd).toLocaleDateString("en-US", {
              year: "numeric", month: "long", day: "numeric",
            });
            sendSubscriptionCanceledEmail(authData.user.email, formattedDate);
          }
        }
        break;
      }

      case "subscription.revoked": {
        const sub = event.data as Record<string, unknown>;
        await db.from("subscriptions")
          .update({ status: "revoked", current_period_end: new Date().toISOString() })
          .eq("polar_subscription_id", sub.id as string);
        break;
      }

      case "license_key.created": {
        const lk = event.data as Record<string, unknown>;
        const orderId = lk.order_id as string | undefined;
        const key = lk.key as string | undefined;
        if (orderId && key) {
          await db.from("subscriptions")
            .update({ access_key: key })
            .eq("polar_order_id", orderId);
        }
        break;
      }

      case "refund.created": {
        const refund = event.data as Record<string, unknown>;
        const order = refund.order as Record<string, unknown> | undefined;
        const subId = order?.subscription_id as string | undefined;

        if (subId) {
          await db.from("subscriptions")
            .update({ status: "revoked", current_period_end: new Date().toISOString() })
            .eq("polar_subscription_id", subId);
        } else {
          const orderId = order?.id as string | undefined;
          if (orderId) {
            await db.from("subscriptions")
              .update({ status: "inactive", access_key: null })
              .eq("polar_order_id", orderId);
          }
        }
        break;
      }
    }
  } catch (err) {
    console.error("[polar/webhook] Error handling event:", event.type, err);
    return new Response("Internal error", { status: 500 });
  }

  return new Response("OK", { status: 200 });
}
