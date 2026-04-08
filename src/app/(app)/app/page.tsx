import Link from "next/link";
import type { Metadata } from "next";
import type { Route } from "next";
import { Palette, Plus, UserPlus } from "lucide-react";
import { MetricCard } from "@/components/app/metric-card";
import { PageHeader } from "@/components/app/page-header";
import { SetupChecklist } from "@/components/app/setup-checklist";
import { EmptyState } from "@/components/app/empty-state";
import { DocumentSummaryRow } from "@/components/documents/document-summary-row";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getAppContext } from "@/lib/data";
import {
  getDashboardMetrics,
  listRecentInvoices,
  listRecentQuotations,
  listOverdueInvoices,
} from "@/lib/billing-data";
import { formatCurrency } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default async function AppHomePage() {
  const context = await getAppContext();
  const userId = context.userId ?? "";
  const [metrics, recentInvoices, recentQuotations, overdueInvoices] = await Promise.all([
    getDashboardMetrics(userId),
    listRecentInvoices(userId, 5),
    listRecentQuotations(userId, 5),
    listOverdueInvoices(userId),
  ]);

  const currency = context.userState.settings.defaultCurrency;
  const hasData = recentInvoices.length > 0 || recentQuotations.length > 0;
  const setupItems = context.setupProgress.items;
  const nextItem = setupItems.find((item) => !item.complete) ?? setupItems[setupItems.length - 1];

  const pageDescription = !context.setupProgress.complete
    ? `Finish ${nextItem.label.toLowerCase()} to complete setup.`
    : hasData
      ? "Here's where the money stands."
      : "Workspace is ready. Create your first invoice to start tracking.";

  return (
    <div className="grid gap-6">
      {/* 1. PageHeader */}
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

      {/* 2. Metric strip — 4 cards (all-time totals, no time filter per D-06) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard
          label="Total billed"
          value={metrics.totalBilled > 0 ? formatCurrency(metrics.totalBilled, currency) : "\u2014"}
        />
        <MetricCard
          label="Collected"
          value={metrics.totalCollected > 0 ? formatCurrency(metrics.totalCollected, currency) : "\u2014"}
        />
        <MetricCard
          label="Outstanding"
          value={metrics.outstanding > 0 ? formatCurrency(metrics.outstanding, currency) : "\u2014"}
        />
        <MetricCard
          label="Collection rate"
          value={metrics.collectionRate !== null ? `${metrics.collectionRate}%` : "\u2014"}
          accent={metrics.collectionRate === 100}
        />
      </div>

      {/* 3. Quick actions strip (per D-07) */}
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
          <Link href={"/app/clients/new" as Route}>
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

      {/* 4. Recent documents — side-by-side columns */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Recent invoices */}
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
                {recentInvoices.map((inv) => (
                  <DocumentSummaryRow
                    key={inv.id}
                    href={`/app/invoices/${inv.id}`}
                    documentNumber={inv.invoiceNumber}
                    subtitle={inv.client.name}
                    status={inv.status}
                    amount={formatCurrency(inv.total, inv.currency)}
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

        {/* Recent quotations */}
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
                {recentQuotations.map((quot) => (
                  <DocumentSummaryRow
                    key={quot.id}
                    href={`/app/quotations/${quot.id}`}
                    documentNumber={quot.quotationNumber}
                    subtitle={quot.client.name}
                    status={quot.status}
                    amount={formatCurrency(quot.total, quot.currency)}
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

      {/* 5. Overdue invoices — only rendered when overdue items exist (per D-07) */}
      {overdueInvoices.length > 0 && (
        <Card className="border-amber-700/20 bg-amber-50/60">
          <CardHeader>
            <div className="flex items-center gap-3">
              <Badge variant="warning">Overdue</Badge>
              <span className="text-sm font-medium text-muted">({overdueInvoices.length})</span>
            </div>
          </CardHeader>
          <CardContent className="grid gap-2">
            {overdueInvoices.map((inv) => (
              <DocumentSummaryRow
                key={inv.id}
                href={`/app/invoices/${inv.id}`}
                documentNumber={inv.invoiceNumber}
                subtitle={inv.client.name}
                status={inv.status}
                amount={formatCurrency(inv.total, inv.currency)}
              />
            ))}
          </CardContent>
        </Card>
      )}

      {/* 6. SetupChecklist — floating panel (keep as-is) */}
      <SetupChecklist context={context} />
    </div>
  );
}
