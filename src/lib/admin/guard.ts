import { notFound } from "next/navigation";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { isAdminEmail } from "@/lib/env";

export interface AdminSession {
  /** Service-role client that bypasses RLS. Server-only — never expose. */
  admin: SupabaseClient;
  adminEmail: string;
  adminId: string;
}

/**
 * Authoritative admin gate. Call at the top of every admin Server Component,
 * Server Action, and Route Handler.
 *
 * - Confirms there is a signed-in user whose email is on the ADMIN_EMAILS
 *   allowlist; otherwise renders a 404 (hides the existence of /admin).
 * - Returns a service-role Supabase client for cross-account reads/writes.
 *
 * This module transitively imports next/headers (via the server client), so it
 * can never be bundled into a client component.
 */
export async function requireAdmin(): Promise<AdminSession> {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    notFound();
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !isAdminEmail(user.email)) {
    notFound();
  }

  const admin = createSupabaseAdminClient();

  if (!admin) {
    // Allowlist is set but the service-role key is missing — misconfiguration.
    throw new Error(
      "Admin area is enabled but SUPABASE_SERVICE_ROLE_KEY is not configured.",
    );
  }

  return {
    admin: admin as SupabaseClient,
    adminEmail: user.email!,
    adminId: user.id,
  };
}
