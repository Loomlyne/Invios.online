"use client";

import { createBrowserClient } from "@supabase/ssr";
import { env, isSupabaseConfigured } from "@/lib/env";

function getApexCookieDomain(): string | undefined {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (!siteUrl) return undefined;
  try {
    const hostname = new URL(siteUrl).hostname.replace(/^www\./, "");
    return hostname.includes(".") ? `.${hostname}` : undefined;
  } catch {
    return undefined;
  }
}

const COOKIE_DOMAIN = getApexCookieDomain();

const SESSION_COOKIE_OPTIONS = {
  path: "/",
  sameSite: "lax" as const,
  httpOnly: false,
  maxAge: 400 * 24 * 60 * 60,
  ...(COOKIE_DOMAIN ? { domain: COOKIE_DOMAIN } : {}),
};

let browserClient:
  | ReturnType<typeof createBrowserClient>
  | null = null;

export function createSupabaseBrowserClient() {
  if (!isSupabaseConfigured()) {
    return null;
  }

  if (!browserClient) {
    browserClient = createBrowserClient(
      env.supabaseUrl,
      env.supabasePublishableKey,
      {
        cookieOptions: SESSION_COOKIE_OPTIONS,
        auth: {
          persistSession: true,
          autoRefreshToken: true,
        },
      },
    );
  }

  return browserClient;
}
