import Link from "next/link";
import type { Route } from "next";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink, Wallet, TrendingUp, AlertCircle, Receipt } from "lucide-react";
import { requireAdmin } from "@/lib/admin/guard";
import { getAccountDetail, type AccountDocument } from "@/lib/admin/admin-data";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDateDisplay } from "@/lib/utils";

function StatusPill({ status }: { status: string }) {
  return (
    <span className="rounded-full bg-black/5 px-2 py-0.5 text-[0.7rem] font-medium capitalize text-muted-strong">
      {status.replace(/_/g, " ")}
    </span>
  );
}

function DocumentTable({
  title,
  rows,
  basePath,
}: {
  title: string;
  rows: AccountDocument[];
  basePath: "invoices" | "quotations";
}) {
  return (
    <div className="space-y-3">
      <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-muted">
        {title} <span className="text-muted/60">({rows.length})</span>
      </h2>
      {rows.length === 0 ? (
        <div className="rounded-[var(--radius-card)] border border-black/8 bg-surface p-5 text-sm text-muted subtle-shadow">
          None yet.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-[var(--radius-card)] border border-black/8 bg-surface subtle-shadow">
          <table className="w-full min-w-[560px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-border text-left text-[0.7rem] uppercase tracking-wide text-muted">
                <th className="px-4 py-3 font-medium">Number</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 text-right font-medium">Total</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {rows.map((doc) => (
                <tr key={doc.id} className="border-b border-border last:border-b-0">
                  <td className="px-4 py-3 font-medium text-foreground">{doc.number}</td>
                  <td className="px-4 py-3"><StatusPill status={doc.status} /></td>
                  <td className="px-4 py-3 text-muted">{doc.date ? formatDateDisplay(doc.date) : "—"}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-foreground">
                    {formatCurrency(doc.total, doc.currency)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {doc.shareToken ? (
                      <Link
                        href={`/${basePath}/public/${doc.shareToken}` as Route}
                        target="_blank"
                        className="inline-flex items-center gap-1 text-xs font-medium text-accent transition hover:text-accent-strong"
                      >
                        View <ExternalLink className="size-3" />
                      </Link>
                    ) : (
                      <span className="text-xs text-muted/60">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default async function AdminAccountDetailPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { admin } = await requireAdmin();
  const { userId } = await params;
  const detail = await getAccountDetail(admin, userId);

  if (!detail) {
    notFound();
  }

  const stats = [
    { label: "Billed", value: detail.totals.billed, icon: Receipt },
    { label: "Collected", value: detail.totals.collected, icon: Wallet },
    { label: "Outstanding", value: detail.totals.outstanding, icon: AlertCircle },
    { label: "Expenses", value: detail.totals.expenses, icon: TrendingUp },
  ];

  return (
    <div className="grid gap-[var(--space-section)]">
      <div className="space-y-3">
        <Link
          href="/admin/accounts"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-muted transition hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" />
          All accounts
        </Link>

        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1">
            <h1 className="display-text text-3xl font-semibold text-foreground sm:text-4xl">
              {detail.businessName || detail.fullName || detail.email}
            </h1>
            <p className="text-sm text-muted">{detail.email}</p>
            <p className="text-xs text-muted">
              Joined {detail.createdAt ? formatDateDisplay(detail.createdAt) : "—"} ·{" "}
              {detail.onboardingComplete ? "Onboarded" : "Onboarding incomplete"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={
                detail.isPro
                  ? "rounded-full bg-accent-soft px-3 py-1 text-xs font-semibold text-accent-strong"
                  : "rounded-full bg-black/5 px-3 py-1 text-xs font-medium text-muted-strong"
              }
            >
              {detail.isPro ? "Pro" : "Free"}
            </span>
            {detail.subscriptionStatus && (
              <StatusPill status={detail.subscriptionStatus} />
            )}
          </div>
        </div>
      </div>

      {/* Financials */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map(({ label, value, icon: Icon }) => (
          <div
            key={label}
            className="rounded-[var(--radius-card)] border border-black/8 bg-white/84 p-5 subtle-shadow"
          >
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">{label}</p>
              <Icon className="size-4 text-accent" aria-hidden="true" />
            </div>
            <p className="display-text mt-3 text-2xl font-semibold text-foreground">
              {formatCurrency(value, detail.currency)}
            </p>
          </div>
        ))}
      </div>

      {/* Clients */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-muted">
          Clients <span className="text-muted/60">({detail.clients.length})</span>
        </h2>
        {detail.clients.length === 0 ? (
          <div className="rounded-[var(--radius-card)] border border-black/8 bg-surface p-5 text-sm text-muted subtle-shadow">
            No clients yet.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-[var(--radius-card)] border border-black/8 bg-surface subtle-shadow">
            <table className="w-full min-w-[560px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-border text-left text-[0.7rem] uppercase tracking-wide text-muted">
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Company</th>
                  <th className="px-4 py-3 font-medium">Email</th>
                  <th className="px-4 py-3 font-medium">Added</th>
                </tr>
              </thead>
              <tbody>
                {detail.clients.map((client) => (
                  <tr key={client.id} className="border-b border-border last:border-b-0">
                    <td className="px-4 py-3 font-medium text-foreground">{client.name}</td>
                    <td className="px-4 py-3 text-muted-strong">{client.company || "—"}</td>
                    <td className="px-4 py-3 text-muted">{client.email || "—"}</td>
                    <td className="px-4 py-3 text-muted">
                      {client.createdAt ? formatDateDisplay(client.createdAt) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <DocumentTable title="Invoices" rows={detail.invoices} basePath="invoices" />
      <DocumentTable title="Quotations" rows={detail.quotations} basePath="quotations" />
    </div>
  );
}
