import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { env, isSupabaseConfigured } from "@/lib/env";

function createAdminClient() {
  if (!env.supabaseUrl || !env.supabaseServiceRoleKey) return null;
  return createClient(env.supabaseUrl, env.supabaseServiceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
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

  const isAuthRoute =
    request.nextUrl.pathname.startsWith("/sign-in") ||
    request.nextUrl.pathname.startsWith("/sign-up") ||
    request.nextUrl.pathname.startsWith("/forgot-password") ||
    request.nextUrl.pathname.startsWith("/update-password");

  if (request.nextUrl.pathname.startsWith("/app") && !user) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/sign-in";
    redirectUrl.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(redirectUrl);
  }

  if (isAuthRoute && user) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/app";
    redirectUrl.search = "";
    return NextResponse.redirect(redirectUrl);
  }

  // Subscription gate: only for authenticated /app routes, allow /app/settings so users can manage billing
  const isAppRoute = request.nextUrl.pathname.startsWith("/app");
  const isSettingsRoute = request.nextUrl.pathname.startsWith("/app/settings");

  if (isAppRoute && !isSettingsRoute && user) {
    const adminClient = createAdminClient();
    if (adminClient) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: sub } = await (adminClient as any)
        .from("subscriptions")
        .select("status, current_period_end")
        .eq("user_id", user.id)
        .maybeSingle();

      const now = new Date();
      const isActive =
        sub &&
        (sub.status === "active" ||
          sub.status === "trialing" ||
          (sub.status === "canceled" &&
            sub.current_period_end &&
            new Date(sub.current_period_end) > now));

      if (!isActive) {
        const redirectUrl = request.nextUrl.clone();
        redirectUrl.pathname = "/pricing";
        redirectUrl.search = "";
        return NextResponse.redirect(redirectUrl);
      }
    }
  }

  const response = NextResponse.next({ request: { headers: requestHeaders } });

  // Apply any refreshed auth cookies to the response.
  pendingCookies.forEach(({ name, value, options }) => {
    response.cookies.set(name, value, options as Parameters<typeof response.cookies.set>[2]);
  });

  return response;
}
