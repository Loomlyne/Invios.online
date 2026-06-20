"use client";

import { createBrowserClient } from "@supabase/ssr";
import { env, isSupabaseConfigured } from "@/lib/env";

const SESSION_COOKIE_OPTIONS = {
  path: "/",
  sameSite: "lax" as const,
  httpOnly: false,
  maxAge: 400 * 24 * 60 * 60,
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
