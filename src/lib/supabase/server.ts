import { cookies, headers } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { env, isSupabaseConfigured, isSupabaseAdminConfigured } from "@/lib/env";
import { getSessionCookieOptions } from "@/lib/supabase/cookies";

export async function createSupabaseServerClient() {
  if (!isSupabaseConfigured()) {
    return null;
  }

  const cookieStore = await cookies();
  const headersList = await headers();
  const host = headersList.get("x-forwarded-host") ?? headersList.get("host");

  return createServerClient(env.supabaseUrl, env.supabasePublishableKey, {
    cookieOptions: getSessionCookieOptions(host),
    auth: {
      experimental: { passkey: true },
    },
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // Server components may attempt to set cookies during render; ignore.
        }
      },
    },
  });
}

export function createSupabaseAdminClient() {
  if (!isSupabaseAdminConfigured()) {
    return null;
  }

  return createClient(env.supabaseUrl, env.supabaseServiceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false, experimental: { passkey: true } },
  });
}
