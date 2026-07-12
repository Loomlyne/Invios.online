import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createCreemBillingPortal, isCreemConfigured } from "@/lib/creem";

export const runtime = "nodejs";

// Generates a Creem customer billing-portal link for the signed-in user and
// redirects to it. Driven by a POST form on the billing settings panel.
export async function POST(request: NextRequest) {
  const origin = request.nextUrl.origin;
  const settingsUrl = new URL("/app/settings?section=billing", origin);

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return NextResponse.redirect(settingsUrl, { status: 303 });
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.redirect(new URL("/sign-in?next=/app/settings", origin), { status: 303 });
  }

  if (!isCreemConfigured()) {
    return NextResponse.redirect(settingsUrl, { status: 303 });
  }

  const { data: sub } = await supabase
    .from("subscriptions")
    .select("creem_customer_id")
    .eq("user_id", user.id)
    .maybeSingle<{ creem_customer_id: string | null }>();

  const customerId = sub?.creem_customer_id ?? null;
  if (!customerId) {
    return NextResponse.redirect(settingsUrl, { status: 303 });
  }

  const portalUrl = await createCreemBillingPortal(customerId);
  return NextResponse.redirect(portalUrl ?? settingsUrl.toString(), { status: 303 });
}
