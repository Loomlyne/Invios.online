import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createCreemCheckout, isCreemConfigured } from "@/lib/creem";
import { PRO_BILLING_ENABLED } from "@/lib/constants";

export const runtime = "nodejs";

// Starts a Creem checkout for the signed-in user and redirects to the hosted
// payment page. Driven by a POST form on the pricing page (no JS required).
export async function POST(request: NextRequest) {
  const origin = request.nextUrl.origin;

  if (!PRO_BILLING_ENABLED) {
    console.log("[checkout] blocked: PRO_BILLING_ENABLED=false");
    return NextResponse.redirect(new URL("/pricing", origin), { status: 303 });
  }

  const supabase = await createSupabaseServerClient();
  const { data } = supabase
    ? await supabase.auth.getUser()
    : { data: { user: null } };
  const user = data.user;

  if (!user) {
    console.log("[checkout] blocked: no user session");
    return NextResponse.redirect(new URL("/sign-up?next=/pricing", origin), { status: 303 });
  }

  if (!isCreemConfigured()) {
    console.log("[checkout] blocked: Creem not configured (check CREEM_API_KEY / CREEM_PRODUCT_ID env vars)");
    return NextResponse.redirect(new URL("/pricing?billing=unavailable", origin), { status: 303 });
  }

  console.log("[checkout] calling Creem for user", user.id);
  const checkoutUrl = await createCreemCheckout({
    userId: user.id,
    email: user.email ?? undefined,
    successUrl: `${origin}/app/settings?section=billing&upgraded=1`,
  });

  if (!checkoutUrl) {
    console.log("[checkout] Creem returned no URL");
    return NextResponse.redirect(new URL("/pricing?billing=error", origin), { status: 303 });
  }

  console.log("[checkout] redirecting to Creem:", checkoutUrl.slice(0, 80));
  return NextResponse.redirect(checkoutUrl, { status: 303 });
}
