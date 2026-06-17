import type { NextRequest } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { sendSubscriptionActivatedEmail, sendSubscriptionCanceledEmail } from "@/lib/email";

export const runtime = "nodejs";

const PADDLE_WEBHOOK_SECRET = process.env.PADDLE_WEBHOOK_SECRET ?? "";

// Paddle Billing signs webhooks with:
//   header: paddle-signature = ts=TIMESTAMP;h1=HMAC_HEX
//   message: TIMESTAMP:raw_body
async function verifyPaddleSignature(secret: string, body: string, header: string): Promise<boolean> {
  const parts = Object.fromEntries(header.split(";").map((p) => p.split("=")));
  const ts = parts["ts"];
  const h1 = parts["h1"];
  if (!ts || !h1) return false;

  const message = `${ts}:${body}`;
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(message));
  const computed = Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  return computed === h1;
}

function mapPaddleStatus(s: string): string {
  const map: Record<string, string> = {
    active: "active",
    trialing: "trialing",
    past_due: "past_due",
    canceled: "canceled",
    paused: "canceled",
  };
  return map[s] ?? "inactive";
}

async function resolveUserByEmail(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  admin: any,
  email: string,
): Promise<string | null> {
  const { data, error } = await admin.auth.admin.listUsers();
  if (error || !data) return null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const match = data.users.find((u: any) => u.email === email);
  return match?.id ?? null;
}

export async function POST(request: NextRequest) {
  const body = await request.text();
  const sigHeader = request.headers.get("paddle-signature") ?? "";

  if (!PADDLE_WEBHOOK_SECRET) {
    return new Response("Webhook secret not configured", { status: 500 });
  }

  if (!sigHeader) {
    return new Response("Missing paddle-signature header", { status: 400 });
  }

  const valid = await verifyPaddleSignature(PADDLE_WEBHOOK_SECRET, body, sigHeader).catch(() => false);
  if (!valid) {
    return new Response("Invalid signature", { status: 400 });
  }

  let event: { event_type: string; data: Record<string, unknown> };
  try {
    event = JSON.parse(body);
  } catch {
    return new Response("Bad JSON", { status: 400 });
  }

  const admin = createSupabaseAdminClient();
  if (!admin) return new Response("DB unavailable", { status: 500 });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = admin as any;

  try {
    switch (event.event_type) {
      case "subscription.created":
      case "subscription.updated": {
        const sub = event.data;
        const customerEmail = (sub.customer as Record<string, unknown>)?.email as string | undefined;
        const userId = customerEmail ? await resolveUserByEmail(admin, customerEmail) : null;
        if (!userId) break;

        const status = mapPaddleStatus(sub.status as string ?? "");
        const periodEnd = (sub.current_billing_period as Record<string, unknown>)?.ends_at as string | undefined ?? null;
        const plan = "monthly";

        const { data: existing } = await db
          .from("subscriptions")
          .select("id")
          .eq("user_id", userId)
          .maybeSingle();

        await db.from("subscriptions").upsert({
          user_id: userId,
          paddle_subscription_id: sub.id as string ?? null,
          paddle_customer_id: sub.customer_id as string ?? null,
          status,
          current_period_end: periodEnd,
          plan,
        }, { onConflict: "user_id" });

        if (event.event_type === "subscription.created" && status === "active" && customerEmail && !existing) {
          sendSubscriptionActivatedEmail(customerEmail, plan);
        }
        break;
      }

      case "subscription.canceled": {
        const sub = event.data;
        const periodEnd = (sub.current_billing_period as Record<string, unknown>)?.ends_at as string | undefined ?? null;
        const subId = sub.id as string;

        const { data: row } = await db
          .from("subscriptions")
          .select("user_id")
          .eq("paddle_subscription_id", subId)
          .maybeSingle();

        if (row?.user_id) {
          await db.from("subscriptions")
            .update({ status: "canceled", current_period_end: periodEnd })
            .eq("paddle_subscription_id", subId);

          const { data: authData } = await admin.auth.admin.getUserById(row.user_id);
          if (authData?.user?.email && periodEnd) {
            const formattedDate = new Date(periodEnd).toLocaleDateString("en-US", {
              year: "numeric", month: "long", day: "numeric",
            });
            sendSubscriptionCanceledEmail(authData.user.email, formattedDate);
          }
        }
        break;
      }

      case "subscription.past_due": {
        const sub = event.data;
        await db.from("subscriptions")
          .update({ status: "past_due" })
          .eq("paddle_subscription_id", sub.id as string);
        break;
      }

      case "transaction.completed": {
        const tx = event.data;
        const subId = tx.subscription_id as string | undefined;
        const txId = tx.id as string | undefined;
        if (subId && txId) {
          await db.from("subscriptions")
            .update({ paddle_transaction_id: txId, status: "active" })
            .eq("paddle_subscription_id", subId);
        }
        break;
      }
    }
  } catch (err) {
    console.error("[paddle/webhook] Error handling event:", event.event_type, err);
    return new Response("Internal error", { status: 500 });
  }

  return new Response("OK", { status: 200 });
}
