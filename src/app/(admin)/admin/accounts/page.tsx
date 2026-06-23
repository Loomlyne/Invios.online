import Link from "next/link";
import type { Route } from "next";
import { Search, AlertTriangle, ChevronRight } from "lucide-react";
import { requireAdmin } from "@/lib/admin/guard";
import { listAccounts, type AccountRow, type AccountFlag } from "@/lib/admin/admin-data";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDateDisplay } from "@/lib/utils";

const flagLabels: Record<AccountFlag, string> = {
  lapsed_subscription: "Lapsed billing",
  no_activity: "No activity",
  stuck_onboarding: "Onboarding stuck",
};

type FilterKey = "all" | "pro" | "free" | "attention";

const filters: { key: FilterKey; label: string }[] = [
  { key: "all", label: "All" },
  { key: "pro", label: "Pro" },
  { key: "free", label: "Free" },
  { key: "attention", label: "Needs attention" },
];

function matchesFilter(row: AccountRow, filter: FilterKey): boolean {
  switch (filter) {
    case "pro":
      return row.isPro;
    case "free":
      return !row.isPro;
    case "attention":
      return row.flags.length > 0;
    default:
      return true;
  }
}

function matchesQuery(row: AccountRow, q: string): boolean {
  if (!q) return true;
  const haystack = [row.email, row.fullName ?? "", row.businessName ?? ""]
    .join(" ")
    .toLowerCase();
  return haystack.includes(q.toLowerCase());
}

export default async function AdminAccountsPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { admin } = await requireAdmin();
  const params = (await searchParams) ?? {};
  const q = typeof params.q === "string" ? params.q : "";
  const filter: FilterKey =
    typeof params.filter === "string" && ["pro", "free", "attention"].includes(params.filter)
      ? (params.filter as FilterKey)
      : "all";

  const all = await listAccounts(admin);
  const rows = all.filter((r) => matchesFilter(r, filter) && matchesQuery(r, q));

  return (
    <div className="grid gap-[var(--space-section)]">
      <div className="space-y-2">
        <Badge variant="accent">Accounts</Badge>
        <h1 className="display-text text-3xl font-semibold text-foreground sm:text-4xl">
          All accounts
        </h1>
        <p className="text-sm leading-7 text-muted-strong">
          {all.length} total · showing {rows.length}. Click any account to see
          everything they own.
        </p>
      </div>

      {/* Search + filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <form action="/admin/accounts" className="relative w-full sm:max-w-sm">
          {filter !== "all" && <input type="hidden" name="filter" value={filter} />}
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="Search email, name, or business…"
            className="w-full rounded-[var(--radius-inner)] border border-border bg-surface py-2.5 pl-9 pr-3 text-sm text-foreground outline-none transition focus:border-border-brand"
          />
        </form>

        <div className="flex flex-wrap gap-2">
          {filters.map((f) => {
            const active = f.key === filter;
            const query: Record<string, string> = {};
            if (f.key !== "all") query.filter = f.key;
            if (q) query.q = q;
            return (
              <Link
                key={f.key}
                href={{ pathname: "/admin/accounts", query }}
                className={
                  active
                    ? "rounded-full bg-[#17120F] px-3.5 py-1.5 text-xs font-semibold text-on-dark"
                    : "rounded-full border border-border bg-surface px-3.5 py-1.5 text-xs font-medium text-muted-strong transition hover:border-border-brand"
                }
              >
                {f.label}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Table */}
      {rows.length === 0 ? (
        <div className="rounded-[var(--radius-card)] border border-black/8 bg-surface p-8 text-center text-sm text-muted subtle-shadow">
          No accounts match.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-[var(--radius-card)] border border-black/8 bg-surface subtle-shadow">
          <table className="w-full min-w-[820px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-border text-left text-[0.7rem] uppercase tracking-wide text-muted">
                <th className="px-4 py-3 font-medium">Account</th>
                <th className="px-4 py-3 font-medium">Plan</th>
                <th className="px-4 py-3 text-right font-medium">Clients</th>
                <th className="px-4 py-3 text-right font-medium">Docs</th>
                <th className="px-4 py-3 text-right font-medium">Billed</th>
                <th className="px-4 py-3 text-right font-medium">Outstanding</th>
                <th className="px-4 py-3 font-medium">Last activity</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr
                  key={row.userId}
                  className="group border-b border-border last:border-b-0 transition hover:bg-black/[0.02]"
                >
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/accounts/${row.userId}` as Route}
                      className="block"
                    >
                      <p className="font-medium text-foreground">
                        {row.businessName || row.fullName || "—"}
                      </p>
                      <p className="text-xs text-muted">{row.email}</p>
                      {row.flags.length > 0 && (
                        <div className="mt-1 flex flex-wrap gap-1">
                          {row.flags.map((flag) => (
                            <span
                              key={flag}
                              className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[0.65rem] font-medium text-amber-700"
                            >
                              <AlertTriangle className="size-3" />
                              {flagLabels[flag]}
                            </span>
                          ))}
                        </div>
                      )}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={
                        row.isPro
                          ? "rounded-full bg-accent-soft px-2.5 py-1 text-xs font-semibold text-accent-strong"
                          : "rounded-full bg-black/5 px-2.5 py-1 text-xs font-medium text-muted-strong"
                      }
                    >
                      {row.isPro ? "Pro" : "Free"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-muted-strong">{row.clients}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-muted-strong">
                    {row.invoices + row.quotations}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-foreground">
                    {row.billed > 0 ? formatCurrency(row.billed, row.currency) : "—"}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-foreground">
                    {row.outstanding > 0 ? formatCurrency(row.outstanding, row.currency) : "—"}
                  </td>
                  <td className="px-4 py-3 text-muted">
                    {row.lastActivityAt ? formatDateDisplay(row.lastActivityAt) : "—"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/admin/accounts/${row.userId}` as Route} aria-label="Open account">
                      <ChevronRight className="size-4 text-muted transition group-hover:translate-x-0.5 group-hover:text-foreground" />
                    </Link>
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
