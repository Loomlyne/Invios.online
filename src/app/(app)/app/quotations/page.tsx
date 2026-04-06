import Link from "next/link";
import type { Route } from "next";
import { ArrowRight, Plus } from "lucide-react";
import { DocumentStatusBadge } from "@/components/documents/document-status-badge";
import { EmptyState } from "@/components/app/empty-state";
import { PageHeader } from "@/components/app/page-header";
import { StatStrip } from "@/components/app/stat-strip";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { listQuotations } from "@/lib/billing-data";
import { formatCurrency } from "@/lib/utils";

export default async function QuotationsPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = (await searchParams) ?? {};
  const search = typeof params.search === "string" ? params.search : "";
  const status = typeof params.status === "string" ? params.status : "all";
  const hasFilters = search.trim().length > 0 || status !== "all";
  const quotations = await listQuotations({
    search,
    status: status === "all" ? "all" : status as "draft" | "sent" | "accepted" | "rejected" | "expired",
  });
  const acceptedCount = quotations.filter((q) => q.status === "accepted").length;
  const sentCount = quotations.filter((q) => q.status === "sent").length;

  return (
    <div className="grid gap-6">
      <PageHeader
        title="Quotations"
        description="Scope work, share quotations, and convert accepted ones into invoices."
        actions={
          <Button asChild variant="accent">
            <Link href={"/app/quotations/new" as Route}>
              New quotation
              <Plus className="size-4" />
            </Link>
          </Button>
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

      <Card>
        <CardHeader>
          <form className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <input
              name="search"
              defaultValue={search}
              placeholder="Search quotation or client"
              className="h-11 flex-1 rounded-[1rem] border border-border bg-white px-4 text-sm"
            />
            <select
              name="status"
              defaultValue={status}
              className="h-11 rounded-[1rem] border border-border bg-white px-4 text-sm sm:w-44"
            >
              <option value="all">All statuses</option>
              <option value="draft">Draft</option>
              <option value="sent">Sent</option>
              <option value="accepted">Accepted</option>
              <option value="rejected">Rejected</option>
              <option value="expired">Expired</option>
            </select>
            <Button type="submit" variant="secondary">
              Apply
            </Button>
          </form>
        </CardHeader>

        <CardContent className="grid gap-3">
          {quotations.length === 0 ? (
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
          ) : (
            quotations.map((quotation) => (
              <Link
                key={quotation.id}
                href={`/app/quotations/${quotation.id}` as Route}
                className="rounded-[1.25rem] border border-black/7 bg-[#FFF8EE] px-5 py-5 transition hover:border-[#D7C4A7] hover:bg-[#FFF4E3]"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <p className="text-lg font-semibold text-foreground">{quotation.quotationNumber}</p>
                      <DocumentStatusBadge status={quotation.status} />
                    </div>
                    <p className="mt-2 text-sm leading-7 text-muted-strong">
                      {quotation.client.name}
                      {quotation.client.company ? ` · ${quotation.client.company}` : ""}
                    </p>
                    <p className="text-sm text-muted">
                      Scoped {quotation.quotationDate} · Expires {quotation.expiryDate}
                    </p>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-sm text-muted">Total</p>
                      <p className="text-base font-semibold text-foreground">
                        {formatCurrency(quotation.total, quotation.currency)}
                      </p>
                    </div>
                    <ArrowRight className="size-4 text-muted" />
                  </div>
                </div>
              </Link>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
