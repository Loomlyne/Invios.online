import { requireAdmin } from "@/lib/admin/guard";
import { listAuditLog } from "@/lib/admin/audit";
import { AdminComingSoon } from "@/components/admin/coming-soon";
import { Badge } from "@/components/ui/badge";

export default async function AdminLogsPage() {
  const { admin } = await requireAdmin();
  const entries = await listAuditLog(admin, { limit: 50 });

  return (
    <div className="grid gap-[var(--space-section)]">
      <AdminComingSoon
        wave="Wave 4"
        title="Errors, logs & data export"
        description="A per-account error feed and one-click CSV export to hand users their data are coming next. The audit trail below is already live — every operator action is recorded."
      />

      <div className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-muted">
          Audit log
        </h2>
        {entries.length === 0 ? (
          <div className="rounded-[var(--radius-card)] border border-black/8 bg-surface p-6 text-sm text-muted subtle-shadow">
            No operator actions recorded yet.
          </div>
        ) : (
          <div className="overflow-hidden rounded-[var(--radius-card)] border border-black/8 bg-surface subtle-shadow">
            {entries.map((entry) => (
              <div
                key={entry.id}
                className="flex items-center justify-between gap-3 border-b border-border px-4 py-3 last:border-b-0"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">
                    {entry.action}
                  </p>
                  <p className="truncate text-xs text-muted">
                    {entry.admin_email}
                    {entry.target_resource ? ` · ${entry.target_resource}` : ""}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <Badge variant="default">
                    {new Date(entry.created_at).toLocaleString()}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
