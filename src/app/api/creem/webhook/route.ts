import type { NextRequest } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { verifyCreemSignature } from "@/lib/creem";
import { sendSubscriptionActivatedEmail, sendSubscriptionCanceledEmail } from "@/lib/email";

export const runtime = "nodejs";

const CREEM_WEBHOOK_SECRET = process.env.CREEM_WEBHOOK_SECRET ?? "";

type Json = Record<string, unknown>;

const asObject = (v: unknown): Json | undefined =>
  v && typeof v === "object" ? (v as Json) : undefined;
const asString = (v: unknown): string | undefined =>
  typeof v === "string" && v.length > 0 ? v : undefined;

// Map a Creem subscription status string to our internal status vocabulary.
function mapStatus(s: string | undefined): string {
  switch (s) {
    case "active":
    case "paid":
      return "active";
    case "trialing":
      return "trialing";
    case "past_due":
    case "unpaid":
      return "past_due";
    case "canceled":
    case "cancelled":
      return "canceled";
    case "expired":
    case "paused":
      return "revoked";
    default:
      return "inactive";
  }
}

// Pull the fields we care about out of a Creem subscription/checkout object,
// tolerating both nested-object and flat-id shapes.
function extract(obj: Json) {
  const subObj = asObject(obj.subscription);
  const subscriptionId =
    asString(obj.subscription) ??
    asString(subObj?.id) ??
    (obj.object === "subscription" ? asString(obj.id) : undefined);

  const source = subObj ?? obj;

  const customer = asObject(source.customer) ?? asObject(obj.customer);
  const customerId =
    asString(source.customer) ??
    asString(obj.customer) ??
    asString(customer?.id);
  const email = asString(customer?.email) ?? asString(source.customer_email);

  const status = asString(source.status) ?? asString(obj.status);

  const periodEnd =
    asString(source.current_period_end_date) ??
    asString(source.current_period_end) ??
    asString(source.next_transaction_date) ??
    null;

  const metadata = asObject(source.metadata) ?? asObject(obj.metadata) ?? {};
  const userId =
    asString(metadata.userId) ??
    asString(metadata.user_id) ??
    asString(obj.request_id);

  const checkoutId = obj.object === "checkout" ? asString(obj.id) : undefined;

  return { subscriptionId, customerId, email, status, periodEnd, metadata, userId, checkoutId };
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
  const sigHeader = request.headers.get("creem-signature");

  if (!CREEM_WEBHOOK_SECRET) {
    return new Response("Webhook secret not configured", { status: 500 });
  }
  if (!verifyCreemSignature(body, sigHeader, CREEM_WEBHOOK_SECRET)) {
    return new Response("Invalid signature", { status: 400 });
  }

  let event: Json;
  try {
    event = JSON.parse(body) as Json;
  } catch {
    return new Response("Bad JSON", { status: 400 });
  }

  const eventType = asString(event.eventType) ?? asString(event.type) ?? "";
  const obj = asObject(event.object) ?? asObject(event.data) ?? {};

  const admin = createSupabaseAdminClient();
  if (!admin) return new Response("DB unavailable", { status: 500 });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = admin as any;

  try {
    const isActivation =
      eventType === "checkout.completed" ||
      eventType === "subscription.active" ||
      eventType === "subscription.paid";
    const isUpdate = eventType === "subscription.trialing" || eventType === "subscription.update";
    const isCancel =
      eventType === "subscription.canceled" || eventType === "subscription.scheduled_cancel";
    const isEnded = eventType === "subscription.expired" || eventType === "subscription.paused";

    if (isActivation || isUpdate || isCancel || isEnded) {
      const f = extract(obj);

      // Resolve the account: prefer checkout metadata, fall back to email.
      let userId = f.userId ?? null;
      if (!userId && f.email) userId = await resolveUserByEmail(admin, f.email);

      // For cancel/ended events without metadata, fall back to the stored sub id.
      if (!userId && f.subscriptionId) {
        const { data: row } = await db
          .from("subscriptions")
          .select("user_id")
          .eq("creem_subscription_id", f.subscriptionId)
          .maybeSingle();
        userId = row?.user_id ?? null;
      }
      if (!userId) {
        console.warn("[creem/webhook] Could not resolve user for", eventType);
        return new Response("OK", { status: 200 });
      }

      const status = isActivation
        ? "active"
        : isCancel
          ? "canceled"
          : isEnded
            ? "revoked"
            : mapStatus(f.status);

      const { data: existing } = await db
        .from("subscriptions")
        .select("id, status")
        .eq("user_id", userId)
        .maybeSingle();

      await db.from("subscriptions").upsert(
        {
          user_id: userId,
          status,
          current_period_end: f.periodEnd,
          plan: "monthly",
          ...(f.subscriptionId ? { creem_subscription_id: f.subscriptionId } : {}),
          ...(f.customerId ? { creem_customer_id: f.customerId } : {}),
          ...(f.checkoutId ? { creem_checkout_id: f.checkoutId } : {}),
        },
        { onConflict: "user_id" },
      );

      // Notify on a fresh activation only (avoid duplicate emails on renewals).
      const email =
        f.email ??
        (await admin.auth.admin.getUserById(userId)).data?.user?.email ??
        undefined;

      if (isActivation && email && existing?.status !== "active") {
        sendSubscriptionActivatedEmail(email, "monthly");
      }
      if (isCancel && email && f.periodEnd) {
        const formatted = new Date(f.periodEnd).toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        });
        sendSubscriptionCanceledEmail(email, formatted);
      }
    } else if (eventType === "refund.created" || eventType === "dispute.created") {
      // Logged for visibility; status changes ride on the subscription events.
      console.info("[creem/webhook] Received", eventType);
    }
  } catch (err) {
    console.error("[creem/webhook] Error handling event:", eventType, err);
    return new Response("Internal error", { status: 500 });
  }

  return new Response("OK", { status: 200 });
}
