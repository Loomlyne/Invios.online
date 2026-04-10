import Link from "next/link";
import type { Metadata } from "next";
import type { Route } from "next";
import { ArrowUpRight, Palette, Plus, UserPlus } from "lucide-react";
import { MetricCard } from "@/components/app/metric-card";
import { DashboardRangeToggle } from "@/components/app/dashboard-range-toggle";
import { PageHeader } from "@/components/app/page-header";
import { SetupChecklist } from "@/components/app/setup-checklist";
import { EmptyState } from "@/components/app/empty-state";
import { DocumentSummaryRow } from "@/components/documents/document-summary-row";
import { DocumentStatusBadge } from "@/components/documents/document-status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  dashboardMetricKeys,
  dashboardRangeKeys,
  type DashboardMetricKey,
  type DashboardRangeKey,
} from "@/lib/billing";
import { getAppContext } from "@/lib/data";
import { formatDateDisplay, formatCurrency } from "@/lib/utils";
import {
  getDashboardDrilldown,
  getDashboardInsights,
  getDashboardMetrics,
  getDashboardRecentInvoices,
  getDashboardRecentQuotations,
} from "@/lib/billing-data";

export const metadata: Metadata = {
  title: "Dashboard",
};

const dashboardMetricCopy: Record<
  DashboardMetricKey,
  { title: string; description: string; fullPageHref: Route }
> = {
  "total-billed": {
    title: "Billed invoices",
    description: "All non-draft invoices issued in the selected range.",
    fullPageHref: "/app/invoices?view=table" as Route,
  },
  collected: {
    title: "Collected invoices",
    description: "Invoices with payment activity recorded in the selected range.",
    fullPageHref: "/app/invoices?view=table" as Route,
  },
  outstanding: {
    title: "Outstanding invoices",
    description: "Open receivables still waiting on collection.",
    fullPageHref: "/app/invoices?view=table&status=open" as Route,
  },
  "collection-rate": {
    title: "Collection rate breakdown",
    description: "Billed versus collected versus outstanding for invoices in range.",
    fullPageHref: "/app/invoices?view=table" as Route,
  },
};

function parseRange(value?: string): DashboardRangeKey {
  return dashboardRangeKeys.includes(value as DashboardRangeKey)
    ? (value as DashboardRangeKey)
    : "all";
}

function parseMetric(value?: string): DashboardMetricKey {
  return dashboardMetricKeys.includes(value as DashboardMetricKey)
    ? (value as DashboardMetricKey)
    : "total-billed";
}

function buildDashboardHref(metric: DashboardMetricKey, range: DashboardRangeKey) {
  return `/app?metric=${metric}&range=${range}`;
}

function formatMetricValue(value: number, currency: string) {
  return value > 0 ? formatCurrency(value, currency) : "\u2014";
}

function formatAnalyticsValue(value: number, currency: string) {
  return formatCurrency(value, currency);
}

export default async function AppHomePage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = (await searchParams) ?? {};
  const currentRange = parseRange(typeof params.range === "string" ? params.range : undefined);
  const currentMetric = parseMetric(typeof params.metric === "string" ? params.metric : undefined);
  const context = await getAppContext();
  const userId = context.userId ?? "";
  const [metrics, drilldownRows, insights, recentInvoices, recentQuotations] = await Promise.all([
    getDashboardMetrics(userId, currentRange),
    getDashboardDrilldown(userId, currentMetric, currentRange),
    getDashboardInsights(userId, currentRange),
    getDashboardRecentInvoices(userId, currentRange),
    getDashboardRecentQuotations(userId, currentRange),
  ]);

  const currency = context.userState.settings.defaultCurrency;
  const hasData = recentInvoices.length > 0 || recentQuotations.length > 0;
  const setupItems = context.setupProgress.items;
  const nextItem = setupItems.find((item) => !item.complete) ?? setupItems[setupItems.length - 1];
  const pageDescription = !context.setupProgress.complete
    ? `Finish ${nextItem.label.toLowerCase()} to complete setup.`
    : hasData
      ? "Operator view for billing, follow-up, and cash flow."
      : "Workspace is ready. Create your first invoice to start tracking.";
  const drilldownCopy = dashboardMetricCopy[currentMetric];
  const emphasizeCollectionRate = currentMetric === "collection-rate";

  return (
    <div className="grid gap-[var(--space-section)]">
      <PageHeader
        title="Dashboard"
        description={pageDescription}
        actions={
          <Button asChild variant="accent">
            <Link href={"/app/invoices/new" as Route}>
              <Plus className="size-4" />
              New invoice
            </Link>
          </Button>
        }
      />

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">
            Time window
          </p>
          <p className="mt-1 text-sm text-muted">
            Switch the dashboard between lifetime and recent operator ranges.
          </p>
        </div>
        <DashboardRangeToggle currentRange={currentRange} currentMetric={currentMetric} />
      </div>

      <div className="grid grid-cols-2 gap-[var(--space-grid)] md:grid-cols-4">
        <MetricCard
          label="Total billed"
          value={formatMetricValue(metrics.totalBilled, currency)}
          interactive
          active={currentMetric === "total-billed"}
          href={buildDashboardHref("total-billed", currentRange)}
        />
        <MetricCard
          label="Collected"
          value={formatMetricValue(metrics.totalCollected, currency)}
          interactive
          active={currentMetric === "collected"}
          href={buildDashboardHref("collected", currentRange)}
        />
        <MetricCard
          label="Outstanding"
          value={formatMetricValue(metrics.outstanding, currency)}
          interactive
          active={currentMetric === "outstanding"}
          href={buildDashboardHref("outstanding", currentRange)}
        />
        <MetricCard
          label="Collection rate"
          value={metrics.collectionRate !== null ? `${metrics.collectionRate}%` : "\u2014"}
          accent={metrics.collectionRate === 100}
          interactive
          active={currentMetric === "collection-rate"}
          href={buildDashboardHref("collection-rate", currentRange)}
        />
      </div>

      <Card>
        <CardHeader className="gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle>{drilldownCopy.title}</CardTitle>
            <CardDescription>{drilldownCopy.description}</CardDescription>
          </div>
          <Button asChild size="sm" variant="secondary">
            <Link href={drilldownCopy.fullPageHref}>
              View full page
              <ArrowUpRight className="size-4" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {drilldownRows.length === 0 ? (
            <EmptyState
              title="No matching invoices in this view."
              description="Switch the range or select another metric to inspect a different slice of the pipeline."
            />
          ) : (
            <>
            {/* Mobile card list */}
            <div className="grid gap-2 xl:hidden">
              {drilldownRows.map((row) => (
                <Link
                  key={row.id}
                  href={`/app/invoices/${row.slug}` as Route}
                  className="rounded-[var(--radius-inner)] border border-black/7 bg-[#FFF8EE] px-4 py-4 transition hover:border-[#D7C4A7] hover:bg-[#FFF4E3]"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-foreground">
                        {row.invoiceNumber}
                      </p>
                      <p className="mt-1 truncate text-sm text-muted-strong">
                        {row.client.name}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <span className="text-sm font-semibold text-foreground">
                        {formatCurrency(row.total, row.currency)}
                      </span>
                      <DocumentStatusBadge status={row.status} />
                    </div>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
                    <span>Due {formatDateDisplay(row.dueDate)}</span>
                    {emphasizeCollectionRate ? (
                      <>
                        <span className="font-semibold text-[#6B4A0D]">
                          Collected {formatCurrency(row.collectedAmount, row.currency)}
                        </span>
                        <span className="font-semibold text-[#8D3D2E]">
                          Owed {formatCurrency(row.outstandingAmount, row.currency)}
                        </span>
                      </>
                    ) : (
                      <span>Outstanding {formatCurrency(row.outstandingAmount, row.currency)}</span>
                    )}
                  </div>
                </Link>
              ))}
            </div>

            {/* Desktop table */}
            <div className="hidden overflow-x-auto rounded-[var(--radius-card)] border border-black/7 xl:block">
              <table className="min-w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-[#FFF7EA]">
                    {[
                      "Invoice",
                      "Client",
                      "Status",
                      "Issued",
                      "Due",
                      "Billed",
                      "Collected",
                      "Outstanding",
                      "Profit",
                    ].map((label) => (
                      <th
                        key={label}
                        className="px-3 py-2.5 text-left text-xs font-medium uppercase tracking-wider text-muted"
                      >
                        {label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {drilldownRows.map((row) => (
                    <tr
                      key={row.id}
                      className="border-t border-black/5 bg-[#FFF8EE] transition hover:bg-[#FFF4E3]"
                    >
                      <td className="px-3 py-2.5">
                        <Link
                          href={`/app/invoices/${row.slug}` as Route}
                          className="font-semibold text-foreground hover:text-[#8A5E12]"
                        >
                          {row.invoiceNumber}
                        </Link>
                      </td>
                      <td className="px-3 py-2.5">
                        <div>
                          <p className="font-medium text-foreground">{row.client.name}</p>
                          {row.client.company ? (
                            <p className="text-xs text-muted">{row.client.company}</p>
                          ) : null}
                        </div>
                      </td>
                      <td className="px-3 py-2.5">
                        <DocumentStatusBadge status={row.status} />
                      </td>
                      <td className="px-3 py-2.5 text-muted-strong">
                        {formatDateDisplay(row.issueDate)}
                      </td>
                      <td className="px-3 py-2.5 text-muted-strong">
                        {formatDateDisplay(row.dueDate)}
                      </td>
                      <td className="px-3 py-2.5 font-medium text-foreground">
                        {formatCurrency(row.total, row.currency)}
                      </td>
                      <td
                        className={
                          emphasizeCollectionRate
                            ? "px-3 py-2.5 font-semibold text-[#6B4A0D]"
                            : "px-3 py-2.5 text-muted-strong"
                        }
                      >
                        {formatCurrency(row.collectedAmount, row.currency)}
                      </td>
                      <td
                        className={
                          emphasizeCollectionRate
                            ? "px-3 py-2.5 font-semibold text-[#8D3D2E]"
                            : "px-3 py-2.5 text-muted-strong"
                        }
                      >
                        {formatCurrency(row.outstandingAmount, row.currency)}
                      </td>
                      <td className="px-3 py-2.5 text-muted-strong">
                        {formatCurrency(row.profitAmount, row.currency)}
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

      <div className="flex flex-wrap gap-3">
        <Button asChild variant="secondary">
          <Link href={"/app/invoices/new" as Route}>
            <Plus className="size-4" />
            New invoice
          </Link>
        </Button>
        <Button asChild variant="secondary">
          <Link href={"/app/quotations/new" as Route}>
            <Plus className="size-4" />
            New quotation
          </Link>
        </Button>
        <Button asChild variant="secondary">
          <Link href={"/app/clients?create=1" as Route}>
            <UserPlus className="size-4" />
            New client
          </Link>
        </Button>
        <Button asChild variant="secondary">
          <Link href={"/app/settings" as Route}>
            <Palette className="size-4" />
            Branding
          </Link>
        </Button>
      </div>

      <div className="grid gap-[var(--space-grid)] md:grid-cols-2">
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
                  className="mt-2 text-xs text-muted hover:text-foreground transition"
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
                  className="mt-2 text-xs text-muted hover:text-foreground transition"
                >
                  View all quotations
                </Link>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Analytics strip</CardTitle>
          <CardDescription>Compact financial readout for the selected time window.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-[var(--space-grid)] sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5">
            {[
              { label: "Billed", value: formatAnalyticsValue(insights.analytics.totalBilled, currency) },
              { label: "Collected", value: formatAnalyticsValue(insights.analytics.totalCollected, currency) },
              { label: "Expenses", value: formatAnalyticsValue(insights.analytics.totalExpenses, currency) },
              { label: "Net profit", value: formatAnalyticsValue(insights.analytics.netProfit, currency) },
              { label: "Avg invoice", value: formatAnalyticsValue(insights.analytics.averageInvoice, currency) },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-[var(--radius-inner)] border border-black/7 bg-[#FFF8EE] px-4 py-4"
              >
                <p className="text-xs uppercase tracking-[0.18em] text-muted">{item.label}</p>
                <p className="mt-2 text-lg font-semibold text-foreground">{item.value}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-[var(--space-grid)] xl:grid-cols-2">
        <Card>
          <CardHeader className="gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <CardTitle>Follow-up queue</CardTitle>
              <CardDescription>Overdue and still-open invoices that need attention.</CardDescription>
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

      <div className="grid gap-[var(--space-grid)] xl:grid-cols-[1.15fr_0.85fr]">
        <Card>
          <CardHeader className="gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <CardTitle>Top clients</CardTitle>
              <CardDescription>Clients driving the most receivable and billing volume.</CardDescription>
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
            <CardDescription>Latest invoice, quotation, payment, and expense events.</CardDescription>
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

      <SetupChecklist context={context} />
    </div>
  );
}
