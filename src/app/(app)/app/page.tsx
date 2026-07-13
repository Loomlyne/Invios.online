import Link from "next/link";
import type { Metadata } from "next";
import type { Route } from "next";
import { redirect } from "next/navigation";
import { DashboardRefresher } from "@/components/app/dashboard-refresher";
import { CircleAlert, FileClock, Plus } from "lucide-react";
import { MetricCard } from "@/components/app/metric-card";
import { DashboardRangeToggle } from "@/components/app/dashboard-range-toggle";
import { ExportDataButton } from "@/components/app/export-button";
import { PageHeader } from "@/components/app/page-header";
import { SetupChecklist } from "@/components/app/setup-checklist";
import { EmptyState } from "@/components/app/empty-state";
import { RevenueChartCard } from "@/components/app/analytics-row";
import { DocumentSummaryRow } from "@/components/documents/document-summary-row";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  dashboardRangeKeys,
  type DashboardRangeKey,
} from "@/lib/billing";
import { getAppContext } from "@/lib/data";
import { formatDateDisplay, formatCurrency } from "@/lib/utils";
import {
  buildRevenueTrend,
  buildMomDeltas,
} from "@/lib/dashboard";
import {
  getDashboardInsights,
  getDashboardMetrics,
  getDashboardRecentInvoices,
  getDashboardRecentQuotations,
  getDashboardAnalyticsData,
} from "@/lib/billing-data";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Dashboard",
};


function parseRange(value?: string): DashboardRangeKey {
  return dashboardRangeKeys.includes(value as DashboardRangeKey)
    ? (value as DashboardRangeKey)
    : "all";
}

function formatMetricValue(value: number, currency: string) {
  return value > 0 ? formatCurrency(value, currency) : "—";
}

export default async function AppHomePage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = (await searchParams) ?? {};
  const currentRange = parseRange(typeof params.range === "string" ? params.range : undefined);
  const context = await getAppContext();

  // Without a resolved user id, the dashboard queries below would run
  // `.eq("user_id", "")` against a uuid column and throw
  // `invalid input syntax for type uuid: ""`, crashing the render. The layout
  // redirects unauthenticated requests, but layout and page render
  // concurrently, so guard here too and bounce cleanly to sign-in.
  if (!context.userId) {
    redirect("/sign-in");
  }

  const userId = context.userId;
  const [metrics, insights, recentInvoices, recentQuotations, analyticsData] = await Promise.all([
    getDashboardMetrics(userId, currentRange),
    getDashboardInsights(userId, currentRange),
    getDashboardRecentInvoices(userId, currentRange),
    getDashboardRecentQuotations(userId, currentRange),
    getDashboardAnalyticsData(userId, currentRange),
  ]);

  const today = new Date().toISOString().split("T")[0];
  const revenueTrend = buildRevenueTrend(analyticsData.rows, analyticsData.payments, today);
  const momDeltas = buildMomDeltas(analyticsData.rows, currentRange, today);
  const hasChartData = analyticsData.rows.some((r) => r.status !== "draft");

  const currency = context.userState.settings.defaultCurrency;
  const hasData = recentInvoices.length > 0 || recentQuotations.length > 0;
  const setupItems = context.setupProgress.items;
  const nextItem = setupItems.find((item) => !item.complete) ?? setupItems[setupItems.length - 1];
  const pageDescription = !context.setupProgress.complete
    ? `Finish ${nextItem.label.toLowerCase()} to complete setup.`
    : hasData
      ? "Billing, receivables, and follow-up at a glance."
      : "Workspace is ready. Create your first invoice to start tracking.";

  return (
    <div className="grid gap-[var(--space-section)]">
      <PageHeader
        title="Dashboard"
        description={pageDescription}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <DashboardRangeToggle currentRange={currentRange} />
            <ExportDataButton href={`/api/export/dashboard?range=${currentRange}`} />
            <Button asChild variant="accent">
              <Link href={"/app/invoices/new" as Route}>
                <Plus className="size-4" />
                New invoice
              </Link>
            </Button>
          </div>
        }
      />

      {/* KPI metric cards */}
      <div className="grid grid-cols-2 gap-[var(--space-grid)] md:grid-cols-4">
        <MetricCard
          label="Total billed"
          value={formatMetricValue(metrics.totalBilled, currency)}
          currency={currency}
          momBadge={momDeltas.totalBilled !== null ? { delta: momDeltas.totalBilled, unit: "percent" } : undefined}
        />
        <MetricCard
          label="Collected"
          value={formatMetricValue(metrics.totalCollected, currency)}
          currency={currency}
          momBadge={momDeltas.totalCollected !== null ? { delta: momDeltas.totalCollected, unit: "percent" } : undefined}
        />
        <MetricCard
          label="Outstanding"
          value={formatMetricValue(metrics.outstanding, currency)}
          currency={currency}
          momBadge={momDeltas.outstanding !== null ? { delta: momDeltas.outstanding, unit: "percent" } : undefined}
        />
        <MetricCard
          label="Collection rate"
          value={metrics.collectionRate !== null ? `${metrics.collectionRate}%` : "—"}
          accent={metrics.collectionRate === 100}
          currency={currency}
          momBadge={momDeltas.collectionRate !== null ? { delta: momDeltas.collectionRate, unit: "pp" } : undefined}
        />
      </div>

      {/* Profitability insight strip */}
      <div className="grid gap-[var(--space-grid)] sm:grid-cols-3">
        {[
          { label: "Expenses", value: formatCurrency(insights.analytics.totalExpenses, currency) },
          { label: "Net profit", value: formatCurrency(insights.analytics.netProfit, currency) },
          { label: "Avg invoice", value: formatCurrency(insights.analytics.averageInvoice, currency) },
        ].map((item) => (
          <div
            key={item.label}
            className="rounded-[var(--radius-inner)] border border-black/7 bg-[#FFF8EE] px-4 py-4"
          >
            <p className="text-xs uppercase tracking-[0.18em] text-muted">{item.label}</p>
            <p className="mt-2 text-base font-semibold text-foreground">{item.value}</p>
          </div>
        ))}
      </div>

      {/* Revenue and automated action center */}
      <div className="grid gap-[var(--space-grid)] xl:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardHeader>
            <CardTitle>Revenue trend</CardTitle>
            <CardDescription>Billed vs. collected over the last 12 months.</CardDescription>
          </CardHeader>
          <CardContent className="min-h-[240px] md:min-h-[280px]">
            <RevenueChartCard
              data={revenueTrend}
              currency={currency}
              hasChartData={hasChartData}
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Action center</CardTitle>
            <CardDescription>Live priorities calculated from your invoices and quotations.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            {[
              {
                icon: CircleAlert,
                title: "Open receivables",
                description: metrics.outstanding > 0
                  ? `${formatCurrency(metrics.outstanding, currency)} currently waiting for collection.`
                  : "No money is currently waiting for collection.",
                href: "/app/invoices?view=table&status=open" as Route,
                action: "Review invoices",
              },
              {
                icon: FileClock,
                title: "Quotes awaiting a reply",
                description: insights.quotationPipeline.count > 0
                  ? `${insights.quotationPipeline.count} quote${insights.quotationPipeline.count === 1 ? "" : "s"} worth ${formatCurrency(insights.quotationPipeline.total, currency)} await a decision${insights.quotationPipeline.expiresSoonCount > 0 ? ` · ${insights.quotationPipeline.expiresSoonCount} expiring soon` : ""}.`
                  : "No quotations are waiting for a client decision.",
                href: "/app/quotations?view=table&status=sent" as Route,
                action: "Review quotations",
              },
            ].map(({ icon: Icon, title, description, href, action }) => (
              <Link
                key={title}
                href={href}
                className="group rounded-[var(--radius-inner)] border border-black/7 bg-[#FFF8EE] p-4 transition hover:border-border-brand hover:bg-[#FFF4E3]"
              >
                <div className="flex items-start gap-3">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-surface text-accent-strong shadow-[0_4px_14px_rgba(202,138,4,0.12)]">
                    <Icon className="size-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground">{title}</p>
                    <p className="mt-1 text-sm leading-6 text-muted-strong">{description}</p>
                    <p className="mt-3 text-xs font-semibold uppercase tracking-[0.16em] text-accent-strong group-hover:text-foreground">{action}</p>
                  </div>
                </div>
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Needs attention */}
      <div>
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-muted">Needs attention</p>
        <div className="grid gap-[var(--space-grid)] sm:grid-cols-2">
          <Card>
            <CardHeader className="gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <CardTitle>Follow-up queue</CardTitle>
                <CardDescription>Overdue and still-open invoices that need collection.</CardDescription>
              </div>
              <Button asChild size="sm" variant="secondary">
                <Link href={"/app/invoices?view=table&status=open" as Route}>Open invoices</Link>
              </Button>
            </CardHeader>
            <CardContent className="grid gap-3">
              {insights.followUpQueue.length === 0 ? (
                <EmptyState
                  title="No urgent follow-up."
                  description="Nothing open is demanding collection right now."
                />
              ) : (
                insights.followUpQueue.map((row) => (
                  <DocumentSummaryRow
                    key={row.id}
                    href={`/app/invoices/${row.slug}`}
                    documentNumber={row.invoiceNumber}
                    subtitle={`${row.client.name} · due ${formatDateDisplay(row.dueDate)}`}
                    status={row.status}
                    amount={formatCurrency(row.outstandingAmount, row.currency)}
                  />
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <CardTitle>Pending quotations</CardTitle>
                <CardDescription>Sent work that still needs a yes, no, or follow-up.</CardDescription>
              </div>
              <Button asChild size="sm" variant="secondary">
                <Link href={"/app/quotations?view=table&status=sent" as Route}>Sent quotations</Link>
              </Button>
            </CardHeader>
            <CardContent className="grid gap-3">
              {insights.pendingQuotations.length === 0 ? (
                <EmptyState
                  title="No quotations need chasing."
                  description="Accepted, rejected, or draft quotations are already out of the queue."
                />
              ) : (
                insights.pendingQuotations.map((quotation) => (
                  <DocumentSummaryRow
                    key={quotation.id}
                    href={`/app/quotations/${quotation.slug}`}
                    documentNumber={quotation.quotationNumber}
                    subtitle={`${quotation.client.name} · expires ${formatDateDisplay(quotation.expiryDate)}`}
                    status={quotation.status}
                    amount={formatCurrency(quotation.total, quotation.currency)}
                  />
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Recent work */}
      <div>
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-muted">Recent work</p>
        <div className="grid gap-[var(--space-grid)] sm:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Recent invoices</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-2">
              {recentInvoices.length === 0 ? (
                <EmptyState
                  title="No invoices yet"
                  description="Create your first invoice to start tracking."
                />
              ) : (
                <>
                  {recentInvoices.map((invoice) => (
                    <DocumentSummaryRow
                      key={invoice.id}
                      href={`/app/invoices/${invoice.slug}`}
                      documentNumber={invoice.invoiceNumber}
                      subtitle={invoice.client.name}
                      status={invoice.status}
                      amount={formatCurrency(invoice.total, invoice.currency)}
                    />
                  ))}
                  <Link
                    href={"/app/invoices" as Route}
                    className="mt-2 text-xs text-muted transition hover:text-foreground"
                  >
                    View all invoices
                  </Link>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent quotations</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-2">
              {recentQuotations.length === 0 ? (
                <EmptyState
                  title="No quotations yet"
                  description="Create your first quotation to start tracking."
                />
              ) : (
                <>
                  {recentQuotations.map((quotation) => (
                    <DocumentSummaryRow
                      key={quotation.id}
                      href={`/app/quotations/${quotation.slug}`}
                      documentNumber={quotation.quotationNumber}
                      subtitle={quotation.client.name}
                      status={quotation.status}
                      amount={formatCurrency(quotation.total, quotation.currency)}
                    />
                  ))}
                  <Link
                    href={"/app/quotations" as Route}
                    className="mt-2 text-xs text-muted transition hover:text-foreground"
                  >
                    View all quotations
                  </Link>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Deep dive */}
      <div className="grid gap-[var(--space-grid)] xl:grid-cols-[1.15fr_0.85fr]">
        <Card>
          <CardHeader className="gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <CardTitle>Top clients</CardTitle>
              <CardDescription>Clients driving the most billing and receivable volume.</CardDescription>
            </div>
            <Button asChild size="sm" variant="secondary">
              <Link href={"/app/clients?view=table" as Route}>Client list</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {insights.topClients.length === 0 ? (
              <EmptyState
                title="No client analytics yet."
                description="Client summaries appear once invoices have been issued."
              />
            ) : (
              <>
              {/* Mobile card list */}
              <div className="grid gap-2 md:hidden">
                {insights.topClients.map((client) => (
                  <Link
                    key={client.clientId}
                    href={client.href as Route}
                    className="rounded-[var(--radius-inner)] border border-black/7 bg-[#FFF8EE] px-4 py-4 transition hover:border-[#D7C4A7] hover:bg-[#FFF4E3]"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-foreground">
                          {client.clientName}
                        </p>
                        {client.company ? (
                          <p className="truncate text-xs text-muted">{client.company}</p>
                        ) : null}
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-sm font-semibold text-[#8D3D2E]">
                          {formatCurrency(client.outstandingTotal, currency)}
                        </p>
                        <p className="text-xs text-muted">
                          {client.invoiceCount} invoice{client.invoiceCount !== 1 ? "s" : ""}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>

              {/* Desktop table */}
              <div className="hidden overflow-x-auto rounded-[var(--radius-card)] border border-black/7 md:block">
                <table className="min-w-full border-collapse text-sm">
                  <thead>
                    <tr className="bg-[#FFF7EA]">
                      {["Client", "Invoices", "Billed", "Collected", "Outstanding"].map((label) => (
                        <th
                          key={label}
                          className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted"
                        >
                          {label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {insights.topClients.map((client) => (
                      <tr key={client.clientId} className="border-t border-black/5 bg-[#FFF8EE]">
                        <td className="px-4 py-3">
                          <Link
                            href={client.href as Route}
                            className="font-semibold text-foreground hover:text-[#8A5E12]"
                          >
                            {client.clientName}
                          </Link>
                          {client.company ? (
                            <p className="text-xs text-muted">{client.company}</p>
                          ) : null}
                        </td>
                        <td className="px-4 py-3 text-muted-strong">{client.invoiceCount}</td>
                        <td className="px-4 py-3 text-muted-strong">
                          {formatCurrency(client.billedTotal, currency)}
                        </td>
                        <td className="px-4 py-3 text-muted-strong">
                          {formatCurrency(client.collectedTotal, currency)}
                        </td>
                        <td className="px-4 py-3 font-semibold text-[#8D3D2E]">
                          {formatCurrency(client.outstandingTotal, currency)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent activity</CardTitle>
            <CardDescription>Latest invoice, payment, and expense events.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            {insights.recentActivity.length === 0 ? (
              <EmptyState
                title="No activity yet."
                description="Create work or record movement to populate the activity feed."
              />
            ) : (
              insights.recentActivity.map((activity) => (
                <Link
                  key={activity.id}
                  href={activity.href as Route}
                  className="rounded-[var(--radius-inner)] border border-black/7 bg-[#FFF8EE] px-4 py-4 transition hover:border-[#D7C4A7] hover:bg-[#FFF4E3]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground">{activity.title}</p>
                      <p className="mt-1 text-sm text-muted-strong">{activity.subtitle}</p>
                      <p className="mt-1 text-xs uppercase tracking-[0.16em] text-muted">
                        {activity.kind} · {formatDateDisplay(activity.date)}
                      </p>
                    </div>
                    {activity.amount !== undefined ? (
                      <span className="shrink-0 text-sm font-semibold text-foreground">
                        {formatCurrency(activity.amount, activity.currency ?? currency)}
                      </span>
                    ) : null}
                  </div>
                </Link>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {!context.setupProgress.complete && <SetupChecklist context={context} />}
      <DashboardRefresher />
    </div>
  );
}
