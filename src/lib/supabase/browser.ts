"use client";

import { createBrowserClient } from "@supabase/ssr";
import { env, isSupabaseConfigured } from "@/lib/env";
import { getSessionCookieOptions } from "@/lib/supabase/cookies";

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
        cookieOptions: getSessionCookieOptions(window.location.hostname),
        auth: {
          persistSession: true,
          autoRefreshToken: true,
        },
      },
    );
  }

  return browserClient;
}
