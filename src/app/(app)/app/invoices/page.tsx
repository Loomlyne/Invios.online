import Link from "next/link";
import type { Route } from "next";
import { ArrowRight, Plus } from "lucide-react";
import { DocumentStatusBadge } from "@/components/documents/document-status-badge";
import { EmptyState } from "@/components/app/empty-state";
import { PageHeader } from "@/components/app/page-header";
import { StatStrip } from "@/components/app/stat-strip";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { listInvoices } from "@/lib/billing-data";
import { formatCurrency } from "@/lib/utils";

export default async function InvoicesPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = (await searchParams) ?? {};
  const search = typeof params.search === "string" ? params.search : "";
  const status = typeof params.status === "string" ? params.status : "all";
  const hasFilters = search.trim().length > 0 || status !== "all";
  const invoices = await listInvoices({
    search,
    status: status === "all" ? "all" : status as "draft" | "sent" | "partial_paid" | "paid" | "overdue",
  });
  const draftCount = invoices.filter((inv) => inv.status === "draft").length;
  const sentCount = invoices.filter((inv) => inv.status === "sent").length;

  return (
    <div className="grid gap-6">
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

      <Card>
        <CardHeader>
          <form className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <input
              name="search"
              defaultValue={search}
              placeholder="Search invoice or client"
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
              <option value="partial_paid">Partial paid</option>
              <option value="paid">Paid</option>
              <option value="overdue">Overdue</option>
            </select>
            <Button type="submit" variant="secondary">
              Apply
            </Button>
          </form>
        </CardHeader>

        <CardContent className="grid gap-3">
          {invoices.length === 0 ? (
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
          ) : (
            invoices.map((invoice) => (
              <Link
                key={invoice.id}
                href={`/app/invoices/${invoice.id}` as Route}
                className="rounded-[1.25rem] border border-black/7 bg-[#FFF8EE] px-5 py-5 transition hover:border-[#D7C4A7] hover:bg-[#FFF4E3]"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <p className="text-lg font-semibold text-foreground">{invoice.invoiceNumber}</p>
                      <DocumentStatusBadge status={invoice.status} />
                    </div>
                    <p className="mt-2 text-sm leading-7 text-muted-strong">
                      {invoice.client.name}
                      {invoice.client.company ? ` · ${invoice.client.company}` : ""}
                    </p>
                    <p className="text-sm text-muted">
                      Issued {invoice.issueDate} · Due {invoice.dueDate}
                    </p>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-sm text-muted">Total</p>
                      <p className="text-base font-semibold text-foreground">
                        {formatCurrency(invoice.total, invoice.currency)}
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
