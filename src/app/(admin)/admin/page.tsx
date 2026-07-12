import Link from "next/link";
import {
  UsersRound,
  Building2,
  ReceiptText,
  FileText,
  CreditCard,
  Wallet,
  ArrowRight,
} from "lucide-react";
import { requireAdmin } from "@/lib/admin/guard";
import { getPlatformSummary } from "@/lib/admin/admin-data";
import { Badge } from "@/components/ui/badge";

const numberFormat = new Intl.NumberFormat("en-US");

export default async function AdminOverviewPage() {
  const { admin } = await requireAdmin();
  const summary = await getPlatformSummary(admin);

  const stats = [
    { label: "Accounts", value: summary.accounts, icon: UsersRound },
    { label: "Active subscriptions", value: summary.activeSubscriptions, icon: CreditCard },
    { label: "Clients", value: summary.clients, icon: Building2 },
    { label: "Invoices", value: summary.invoices, icon: ReceiptText },
    { label: "Quotations", value: summary.quotations, icon: FileText },
    { label: "Payments", value: summary.payments, icon: Wallet },
  ];

  const roadmap = [
    {
      title: "Accounts overview & search",
      description: "Find any account, see plan, stats, and who needs help.",
      href: "/admin/accounts" as const,
      status: "Live",
    },
    {
      title: "Per-account deep view",
      description: "Drill into one account: clients, documents, payments, settings.",
      href: "/admin/accounts" as const,
      status: "Live",
    },
    {
      title: "Billing & subscription control",
      description: "Reconcile Creem subscriptions and open billing portals.",
      href: "/admin/billing" as const,
      status: "Next",
    },
    {
      title: "Errors, logs & data export",
      description: "Per-account error feed, audit log, and CSV export to send users.",
      href: "/admin/logs" as const,
      status: "Planned",
    },
  ];

  return (
    <div className="grid gap-[var(--space-section)]">
      <div className="space-y-2">
        <Badge variant="accent">Operator console</Badge>
        <h1 className="display-text text-3xl font-semibold text-foreground sm:text-4xl">
          Platform overview
        </h1>
        <p className="max-w-2xl text-sm leading-7 text-muted-strong">
          Live totals across every account. This is the secure foundation —
          account search, deep views, billing tools, and data export are rolling
          out next.
        </p>
      </div>

      {/* Platform stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map(({ label, value, icon: Icon }) => (
          <div
            key={label}
            className="rounded-[var(--radius-card)] border border-black/8 bg-white/84 p-6 subtle-shadow"
          >
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">
                {label}
              </p>
              <div className="flex size-9 items-center justify-center rounded-xl bg-accent-soft">
                <Icon className="size-4 text-accent" aria-hidden="true" />
              </div>
            </div>
            <p className="display-text mt-4 text-3xl font-semibold text-foreground">
              {numberFormat.format(value)}
            </p>
          </div>
        ))}
      </div>

      {/* Roadmap */}
      <div className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-muted">
          Rolling out
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {roadmap.map((item) => (
            <Link
              key={item.title}
              href={item.href}
              className="group flex items-start justify-between gap-3 rounded-[var(--radius-card)] border border-black/8 bg-surface p-5 subtle-shadow transition hover:border-border-brand"
            >
              <div className="space-y-1">
                <p className="text-sm font-semibold text-foreground">{item.title}</p>
                <p className="text-sm leading-6 text-muted">{item.description}</p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <span className="rounded-full bg-accent-soft px-2.5 py-1 text-[0.7rem] font-semibold text-accent-strong">
                  {item.status}
                </span>
                <ArrowRight className="size-4 text-muted transition group-hover:translate-x-0.5 group-hover:text-foreground" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
