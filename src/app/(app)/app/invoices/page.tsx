import Link from "next/link";
import type { Route } from "next";
import { Plus } from "lucide-react";
import { EmptyState } from "@/components/app/empty-state";
import { PageHeader } from "@/components/app/page-header";
import { StatStrip } from "@/components/app/stat-strip";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { DataViewToolbar, DataViewRenderer, invoiceConfig } from "@/components/data-view";
import { listInvoices } from "@/lib/billing-data";
import type { ViewMode } from "@/components/data-view";

export default async function InvoicesPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = (await searchParams) ?? {};
  const search = typeof params.search === "string" ? params.search : "";
  const rawStatus = typeof params.status === "string" ? params.status : "all";
  const status = ["all", "open", "draft", "sent", "partial_paid", "paid", "overpaid", "overdue"].includes(rawStatus)
    ? rawStatus
    : "all";
  const rawView = typeof params.view === "string" ? params.view : "kanban";
  const view: ViewMode = ["list", "kanban", "table"].includes(rawView)
    ? (rawView as ViewMode)
    : "kanban";
  const hasFilters = search.trim().length > 0 || status !== "all";

  const invoices = await listInvoices({
    search,
    status:
      status === "all"
        ? "all"
        : (status as "open" | "draft" | "sent" | "partial_paid" | "paid" | "overpaid" | "overdue"),
  });
  const draftCount = invoices.filter((inv) => inv.status === "draft").length;
  const sentCount = invoices.filter((inv) => inv.status === "sent").length;

  return (
    <div className="grid gap-[var(--space-section)]">
      <PageHeader
        title="Invoices"
        description="Draft, review, share, and export invoices from one surface."
        actions={
          <Button asChild variant="accent">
            <Link href={"/app/invoices/new" as Route}>
              New invoice
              <Plus className="size-4" />
            </Link>
          </Button>
        }
      >
        <StatStrip
          items={[
            { label: "Total", value: String(invoices.length) },
            { label: "Draft", value: String(draftCount) },
            { label: "Sent", value: String(sentCount) },
          ]}
        />
      </PageHeader>

      <Card className="overflow-hidden">
        <CardHeader>
          <DataViewToolbar
            searchPlaceholder={invoiceConfig.searchPlaceholder}
            statusOptions={invoiceConfig.statusOptions}
            currentSearch={search}
            currentStatus={status}
            currentView={view}
          />
        </CardHeader>
        <CardContent>
          <DataViewRenderer
            items={invoices}
            configKey="invoice"
            view={view}
            emptyState={
              <EmptyState
                title={hasFilters ? "No invoices match the current filters." : "No invoices yet."}
                description={
                  hasFilters
                    ? "Clear the search or status filter to see all invoices."
                    : "Create the first invoice to start billing."
                }
                actions={
                  <>
                    <Button asChild variant="accent">
                      <Link href={"/app/invoices/new" as Route}>Create invoice</Link>
                    </Button>
                    {hasFilters ? (
                      <Button asChild variant="secondary">
                        <Link href={"/app/invoices" as Route}>Clear filters</Link>
                      </Button>
                    ) : null}
                  </>
                }
              />
            }
          />
        </CardContent>
      </Card>
    </div>
  );
}
