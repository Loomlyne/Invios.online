import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createCreemCheckout, isCreemConfigured } from "@/lib/creem";
import { PRO_BILLING_ENABLED } from "@/lib/constants";

export const runtime = "nodejs";

// Starts a Creem checkout for the signed-in user and redirects to the hosted
// payment page. Driven by a POST form on the pricing page (no JS required).
export async function POST(request: NextRequest) {
  const origin = request.nextUrl.origin;

  // Pro billing not activated yet: the plan is shown but not purchasable.
  // Send shoppers back to the pricing page instead of starting a charge.
  if (!PRO_BILLING_ENABLED) {
    return NextResponse.redirect(new URL("/pricing", origin), { status: 303 });
  }

  const supabase = await createSupabaseServerClient();
  const { data } = supabase
    ? await supabase.auth.getUser()
    : { data: { user: null } };
  const user = data.user;

  // Must be signed in so the subscription is tied to an account.
  if (!user) {
    return NextResponse.redirect(new URL("/sign-up?next=/pricing", origin), { status: 303 });
  }

  if (!isCreemConfigured()) {
    return NextResponse.redirect(new URL("/pricing?billing=unavailable", origin), { status: 303 });
  }

  const checkoutUrl = await createCreemCheckout({
    userId: user.id,
    email: user.email ?? undefined,
    successUrl: `${origin}/app/settings?section=billing&upgraded=1`,
  });

  if (!checkoutUrl) {
    return NextResponse.redirect(new URL("/pricing?billing=error", origin), { status: 303 });
  }

  return NextResponse.redirect(checkoutUrl, { status: 303 });
}
