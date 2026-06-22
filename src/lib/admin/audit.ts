import type { SupabaseClient } from "@supabase/supabase-js";

export interface AuditEntry {
  adminEmail: string;
  action: string;
  targetUserId?: string | null;
  targetResource?: string | null;
  metadata?: Record<string, unknown>;
}

export interface AuditLogRow {
  id: string;
  admin_email: string;
  action: string;
  target_user_id: string | null;
  target_resource: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

/**
 * Append an entry to the admin audit log. Must be called by every safe action
 * after it succeeds. Best-effort: a logging failure is swallowed so it can never
 * mask or roll back the action itself, but it is surfaced to the server console.
 *
 * `admin` must be a service-role client (the audit table has no RLS policies).
 */
export async function writeAuditLog(
  admin: SupabaseClient,
  entry: AuditEntry,
): Promise<void> {
  try {
    const { error } = await admin.from("admin_audit_log").insert({
      admin_email: entry.adminEmail,
      action: entry.action,
      target_user_id: entry.targetUserId ?? null,
      target_resource: entry.targetResource ?? null,
      metadata: entry.metadata ?? {},
    });
    if (error) {
      console.error("[admin-audit] failed to write entry:", error.message);
    }
  } catch (err) {
    console.error("[admin-audit] unexpected error writing entry:", err);
  }
}

/**
 * Read recent audit entries, optionally scoped to a single account.
 * `admin` must be a service-role client.
 */
export async function listAuditLog(
  admin: SupabaseClient,
  options: { targetUserId?: string; limit?: number } = {},
): Promise<AuditLogRow[]> {
  const limit = Math.min(options.limit ?? 100, 500);
  let query = admin
    .from("admin_audit_log")
    .select("id,admin_email,action,target_user_id,target_resource,metadata,created_at")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (options.targetUserId) {
    query = query.eq("target_user_id", options.targetUserId);
  }

  const { data, error } = await query.returns<AuditLogRow[]>();
  if (error) {
    console.error("[admin-audit] failed to list entries:", error.message);
    return [];
  }
  return data ?? [];
}
