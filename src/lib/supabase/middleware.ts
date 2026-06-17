import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { env, isSupabaseConfigured } from "@/lib/env";

// These API routes require an active paid subscription
const PAID_ONLY_PREFIXES = [
  "/api/invoices",
  "/api/quotations",
  "/api/export",
];

function createAdminClient() {
  if (!env.supabaseUrl || !env.supabaseServiceRoleKey) return null;
  return createClient(env.supabaseUrl, env.supabaseServiceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

async function checkPaidSubscription(userId: string): Promise<boolean> {
  const admin = createAdminClient();
  if (!admin) return true; // fail open if admin client is unavailable
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: sub } = await (admin as any)
    .from("subscriptions")
    .select("status, current_period_end")
    .eq("user_id", userId)
    .maybeSingle();

  if (!sub) return false;
  if (sub.status === "active" || sub.status === "trialing") return true;
  if (sub.status === "canceled" && sub.current_period_end) {
    return new Date(sub.current_period_end) > new Date();
  }
  return false;
}

export async function updateSession(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.next({ request });
  }

  // Strip any client-supplied spoofed auth headers before trusting them downstream.
  const requestHeaders = new Headers(request.headers);
  requestHeaders.delete("x-middleware-user-id");
  requestHeaders.delete("x-middleware-user-email");

  // Track cookies that need to be set on the response.
  let pendingCookies: { name: string; value: string; options: Record<string, unknown> }[] = [];

  const supabase = createServerClient(env.supabaseUrl, env.supabasePublishableKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        pendingCookies = cookiesToSet;
        cookiesToSet.forEach(({ name, value }) => requestHeaders.set(`cookie`, `${name}=${value}`));
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Forward verified auth info to Server Components so they can skip a second getUser() call.
  if (user) {
    requestHeaders.set("x-middleware-user-id", user.id);
    requestHeaders.set("x-middleware-user-email", user.email ?? "");
  }

  const { pathname } = request.nextUrl;

  const isAuthRoute =
    pathname.startsWith("/sign-in") ||
    pathname.startsWith("/sign-up") ||
    pathname.startsWith("/forgot-password") ||
    pathname.startsWith("/update-password");

  // Unauthenticated → redirect to sign-in for protected app pages
  if (pathname.startsWith("/app") && !user) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/sign-in";
    redirectUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // Authenticated users on auth pages → send to app
  if (isAuthRoute && user) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/app";
    redirectUrl.search = "";
    return NextResponse.redirect(redirectUrl);
  }

  // Premium API routes require an active paid subscription
  const isPremiumRoute = PAID_ONLY_PREFIXES.some((p) => pathname.startsWith(p));
  if (isPremiumRoute && user) {
    const paid = await checkPaidSubscription(user.id);
    if (!paid) {
      return Response.json(
        { error: "Pro subscription required", upgrade: "/pricing" },
        { status: 402 },
      );
    }
  }

  const response = NextResponse.next({ request: { headers: requestHeaders } });

  // Apply any refreshed auth cookies to the response.
  pendingCookies.forEach(({ name, value, options }) => {
    response.cookies.set(name, value, options as Parameters<typeof response.cookies.set>[2]);
  });

  return response;
}
