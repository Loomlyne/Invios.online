import Link from "next/link";
import type { Route } from "next";
import { Plus } from "lucide-react";
import { EmptyState } from "@/components/app/empty-state";
import { ExportDataButton } from "@/components/app/export-button";
import { PageHeader } from "@/components/app/page-header";
import { StatStrip } from "@/components/app/stat-strip";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { DataViewToolbar, DataViewRenderer, quotationConfig } from "@/components/data-view";
import { listQuotations } from "@/lib/billing-data";
import type { ViewMode } from "@/components/data-view";

export default async function QuotationsPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = (await searchParams) ?? {};
  const search = typeof params.search === "string" ? params.search : "";
  const status = typeof params.status === "string" ? params.status : "all";
  const rawView = typeof params.view === "string" ? params.view : "kanban";
  const view: ViewMode = ["list", "kanban", "table"].includes(rawView)
    ? (rawView as ViewMode)
    : "kanban";
  const hasFilters = search.trim().length > 0 || status !== "all";

  const quotations = await listQuotations({
    search,
    status: status === "all" ? "all" : (status as "draft" | "sent" | "accepted" | "rejected" | "expired"),
  });
  const acceptedCount = quotations.filter((q) => q.status === "accepted").length;
  const sentCount = quotations.filter((q) => q.status === "sent").length;

  return (
    <div className="grid gap-[var(--space-section)]">
      <PageHeader
        title="Quotations"
        description="Scope work, share quotations, and convert accepted ones into invoices."
        actions={
          <>
            <ExportDataButton href="/api/export/quotations" />
            <Button asChild variant="accent">
              <Link href={"/app/quotations/new" as Route}>
                New quotation
                <Plus className="size-4" />
              </Link>
            </Button>
          </>
        }
      >
        <StatStrip
          items={[
            { label: "Total", value: String(quotations.length) },
            { label: "Sent", value: String(sentCount) },
            { label: "Accepted", value: String(acceptedCount) },
          ]}
        />
      </PageHeader>

      <Card className="overflow-hidden">
        <CardHeader>
          <DataViewToolbar
            searchPlaceholder={quotationConfig.searchPlaceholder}
            statusOptions={quotationConfig.statusOptions}
            currentSearch={search}
            currentStatus={status}
            currentView={view}
          />
        </CardHeader>
        <CardContent>
          <DataViewRenderer
            items={quotations}
            configKey="quotation"
            view={view}
            emptyState={
              <EmptyState
                title={hasFilters ? "No quotations match the current filters." : "No quotations yet."}
                description={
                  hasFilters
                    ? "Clear the search or status filter to see all quotations."
                    : "Create the first quotation to start scoping work."
                }
                actions={
                  <>
                    <Button asChild variant="accent">
                      <Link href={"/app/quotations/new" as Route}>Create quotation</Link>
                    </Button>
                    {hasFilters ? (
                      <Button asChild variant="secondary">
                        <Link href={"/app/quotations" as Route}>Clear filters</Link>
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
