import crypto from "node:crypto";
import { env, isCreemConfigured } from "@/lib/env";

export { isCreemConfigured };

// Creem chooses the environment from the API key prefix:
//   creem_test_... -> sandbox, creem_... -> live
function apiBase(): string {
  return env.creemApiKey.startsWith("creem_test_")
    ? "https://test-api.creem.io"
    : "https://api.creem.io";
}

async function creemFetch(path: string, body: Record<string, unknown>) {
  const res = await fetch(`${apiBase()}${path}`, {
    method: "POST",
    headers: {
      "x-api-key": env.creemApiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const text = await res.text();
  if (!res.ok) {
    console.error(`[creem] ${path} failed (${res.status}):`, text.slice(0, 500));
    return null;
  }

  try {
    return JSON.parse(text) as Record<string, unknown>;
  } catch {
    console.error(`[creem] ${path} returned non-JSON:`, text.slice(0, 200));
    return null;
  }
}

/**
 * Create a hosted checkout session for the Pro subscription.
 * The userId is carried in metadata so the webhook can map the resulting
 * subscription back to the account without relying on email matching.
 */
export async function createCreemCheckout(params: {
  userId: string;
  email?: string;
  successUrl: string;
}): Promise<string | null> {
  if (!isCreemConfigured()) return null;

  const data = await creemFetch("/v1/checkouts", {
    product_id: env.creemProductId,
    success_url: params.successUrl,
    request_id: params.userId,
    metadata: { userId: params.userId },
    ...(params.email ? { customer: { email: params.email } } : {}),
  });
  if (!data) return null;

  const url = (data.checkout_url ?? data.checkoutUrl ?? data.url) as string | undefined;
  return url ?? null;
}

/**
 * Create a self-service customer billing portal link so the user can manage
 * payment methods, view invoices, and cancel.
 */
export async function createCreemBillingPortal(customerId: string): Promise<string | null> {
  if (!isCreemConfigured() || !customerId) return null;

  const data = await creemFetch("/v1/customers/billing", {
    customer_id: customerId,
  });
  if (!data) return null;

  const url = (data.customer_portal_link ??
    data.customerPortalLink ??
    data.portal_url ??
    data.url) as string | undefined;
  return url ?? null;
}

/**
 * Verify a Creem webhook signature. Creem signs the raw request body with
 * HMAC-SHA256 using the webhook secret and sends the hex digest in the
 * `creem-signature` header.
 */
export function verifyCreemSignature(rawBody: string, header: string | null, secret: string): boolean {
  if (!header || !secret) return false;

  const computed = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
  const provided = header.replace(/^sha256=/i, "").trim();

  const a = Buffer.from(computed, "utf8");
  const b = Buffer.from(provided, "utf8");
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}
