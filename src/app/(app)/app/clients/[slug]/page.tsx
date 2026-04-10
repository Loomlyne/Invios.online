import Link from "next/link";
import type { Route } from "next";
import { notFound } from "next/navigation";
import { FileText, ReceiptText } from "lucide-react";
import { DocumentSummaryRow } from "@/components/documents/document-summary-row";
import { ClientEditButton } from "@/components/clients/client-edit-sheet";
import { ClientStatusBadge } from "@/components/clients/client-status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getClientBySlug, listInvoicesForClient, listQuotationsForClient } from "@/lib/billing-data";
import { formatCurrency } from "@/lib/utils";

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const client = await getClientBySlug(slug);

  if (!client) {
    notFound();
  }

  const [invoices, quotations] = await Promise.all([
    listInvoicesForClient(client.id),
    listQuotationsForClient(client.id),
  ]);

  const billedTotal = invoices.reduce((sum, invoice) => sum + invoice.total, 0);
  const quotedTotal = quotations.reduce((sum, quotation) => sum + quotation.total, 0);

  return (
    <div className="grid gap-[var(--space-section)]">
      <section className="grid gap-[var(--space-grid)] xl:grid-cols-[1.05fr_0.95fr]">
        <Card className="overflow-hidden border-black/10 bg-[#17120F] p-0 text-[#FFF9F0]">
          <div className="bg-[radial-gradient(circle_at_top_left,rgba(202,138,4,0.24),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(255,255,255,0.08),transparent_26%)] px-6 py-7 sm:px-8">
            <div className="flex flex-wrap items-center gap-3">
              <Badge className="border-white/12 bg-white/10 text-[#FFF9F0]">Client detail</Badge>
              <ClientStatusBadge status={client.status} />
            </div>
            <h1 className="display-text mt-4 font-semibold text-[clamp(1.75rem,1.25rem+1.25vw,3rem)]">{client.name}</h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-[#E9E0D5]">
              {client.company || "Independent client"} • {client.email || "No email yet"} • {client.phone || "No phone yet"}
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button asChild variant="accent">
                <Link href={`/app/quotations/new?clientId=${client.id}` as Route}>
                  New quotation
                  <FileText className="size-4" />
                </Link>
              </Button>
              <Button asChild variant="secondary">
                <Link href={`/app/invoices/new?clientId=${client.id}` as Route}>
                  New invoice
                  <ReceiptText className="size-4" />
                </Link>
              </Button>
              <ClientEditButton client={client} />
            </div>
          </div>
        </Card>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
          <MetricCard label="Invoices" value={String(invoices.length)} detail={formatCurrency(billedTotal)} />
          <MetricCard label="Quotations" value={String(quotations.length)} detail={formatCurrency(quotedTotal)} />
        </div>
      </section>

      <Card>
        <CardHeader>
          <Badge variant="default">Recent invoices</Badge>
          <CardTitle className="mt-3">Invoices tied to this client.</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3">
          {invoices.length === 0 ? (
            <EmptyDocumentState
              href={`/app/invoices/new?clientId=${client.id}` as Route}
              label="Create the first invoice"
              body="This client is ready for billing. Use the invoice builder to generate the first live document."
            />
          ) : (
            invoices.map((invoice) => (
              <DocumentSummaryRow
                key={invoice.id}
                href={`/app/invoices/${invoice.slug}`}
                documentNumber={invoice.invoiceNumber}
                subtitle={`Due ${invoice.dueDate} \u00b7 ${formatCurrency(invoice.total, invoice.currency)}`}
                status={invoice.status}
              />
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <Badge variant="default">Recent quotations</Badge>
          <CardTitle className="mt-3">Quotations tied to this client.</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3">
          {quotations.length === 0 ? (
            <EmptyDocumentState
              href={`/app/quotations/new?clientId=${client.id}` as Route}
              label="Create the first quotation"
              body="Start the sales side of the relationship here, then convert accepted work into invoices later."
            />
          ) : (
            quotations.map((quotation) => (
              <DocumentSummaryRow
                key={quotation.id}
                href={`/app/quotations/${quotation.slug}`}
                documentNumber={quotation.quotationNumber}
                subtitle={`Expires ${quotation.expiryDate} \u00b7 ${formatCurrency(quotation.total, quotation.currency)}`}
                status={quotation.status}
              />
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function MetricCard({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardDescription>{label}</CardDescription>
        <CardTitle className="text-3xl">{value}</CardTitle>
      </CardHeader>
      <CardContent className="text-sm leading-7 text-muted-strong">{detail}</CardContent>
    </Card>
  );
}

function EmptyDocumentState({
  href,
  label,
  body,
}: {
  href: Route;
  label: string;
  body: string;
}) {
  return (
    <div className="rounded-[var(--radius-inner)] border border-dashed border-black/10 bg-[#FFF8EE] px-4 py-5">
      <p className="text-sm leading-7 text-muted-strong">{body}</p>
      <Button asChild variant="secondary" className="mt-4">
        <Link href={href}>{label}</Link>
      </Button>
    </div>
  );
}
