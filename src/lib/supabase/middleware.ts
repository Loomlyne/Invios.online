import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { env, isSupabaseConfigured } from "@/lib/env";
import { getSessionCookieOptions } from "@/lib/supabase/cookies";

// Routes requiring an active Pro subscription
const PAID_ONLY_PREFIXES = [
  "/api/invoices",
  "/api/quotations",
  "/api/export",
];

// The canonical user-facing host (e.g. "invios.online"), derived from
// NEXT_PUBLIC_SITE_URL.
const CANONICAL_HOST = (() => {
  try {
    return new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://invios.online").hostname;
  } catch {
    return "invios.online";
  }
})();

// Retired Vercel aliases. Requests landing here are bounced to the canonical
// domain so customers stop using an old-looking *.vercel.app URL and everyone
// converges on invios.online.
const LEGACY_REDIRECT_HOSTS = new Set(["invios-phase1-koss.vercel.app"]);

type PendingCookie = { name: string; value: string; options: Record<string, unknown> };

// Apply refreshed Supabase auth cookies to a response.
// Must be called on EVERY response path so rotated refresh tokens are not dropped.
function applyCookies(response: NextResponse, cookies: PendingCookie[]) {
  cookies.forEach(({ name, value, options }) => {
    response.cookies.set(name, value, options as Parameters<typeof response.cookies.set>[2]);
  });
  return response;
}

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

  // Redirect www → apex so auth cookies are always on a single domain.
  const host = request.headers.get("host") ?? "";
  if (host.startsWith("www.")) {
    const url = request.nextUrl.clone();
    url.host = host.slice(4); // strip "www."
    return NextResponse.redirect(url, { status: 308 });
  }

  // Bounce retired Vercel aliases to the canonical domain (converge on invios.online).
  if (LEGACY_REDIRECT_HOSTS.has(host)) {
    const url = request.nextUrl.clone();
    url.protocol = "https:";
    url.hostname = CANONICAL_HOST;
    url.port = "";
    return NextResponse.redirect(url, { status: 308 });
  }

  // Strip any client-supplied spoofed auth headers before trusting them downstream.
  const requestHeaders = new Headers(request.headers);
  requestHeaders.delete("x-middleware-user-id");
  requestHeaders.delete("x-middleware-user-email");

  // Track cookies that need to be set on the response.
  let pendingCookies: PendingCookie[] = [];

  const supabase = createServerClient(env.supabaseUrl, env.supabasePublishableKey, {
    cookieOptions: getSessionCookieOptions(host),
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        pendingCookies = cookiesToSet;
        // Append refreshed cookies to the forwarded request so Server Components
        // see the updated session without making another round-trip.
        const existing = requestHeaders.get("cookie") ?? "";
        const updated = cookiesToSet.map(({ name, value }) => `${name}=${value}`);
        requestHeaders.set("cookie", [existing, ...updated].filter(Boolean).join("; "));
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

  // Unauthenticated → redirect to sign-in for protected app pages.
  // Apply refreshed auth cookies on redirect so rotated tokens are not dropped.
  if (pathname.startsWith("/app") && !user) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/sign-in";
    redirectUrl.searchParams.set("next", pathname);
    return applyCookies(NextResponse.redirect(redirectUrl), pendingCookies);
  }

  // Authenticated users on auth pages → send to app.
  // Apply refreshed auth cookies on redirect so rotated tokens are not dropped.
  if (isAuthRoute && user) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/app";
    redirectUrl.search = "";
    return applyCookies(NextResponse.redirect(redirectUrl), pendingCookies);
  }

  // Premium API routes require an active paid subscription.
  const isPremiumRoute = PAID_ONLY_PREFIXES.some((p) => pathname.startsWith(p));
  if (isPremiumRoute && user) {
    const paid = await checkPaidSubscription(user.id);
    if (!paid) {
      return applyCookies(
        NextResponse.json(
          { error: "Pro subscription required", upgrade: "/pricing" },
          { status: 402 },
        ),
        pendingCookies,
      );
    }
  }

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  return applyCookies(response, pendingCookies);
}
