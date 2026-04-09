import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { env, isSupabaseConfigured } from "@/lib/env";

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

  const response = NextResponse.next({ request: { headers: requestHeaders } });

  // Apply any refreshed auth cookies to the response.
  pendingCookies.forEach(({ name, value, options }) => {
    response.cookies.set(name, value, options as Parameters<typeof response.cookies.set>[2]);
  });

  return response;
}
