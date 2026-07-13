import Link from "next/link";
import type { Route } from "next";
import { notFound } from "next/navigation";
import { FileText, Mail, MapPin, Phone, ReceiptText } from "lucide-react";
import { DocumentSummaryRow } from "@/components/documents/document-summary-row";
import { ClientDeleteButton, ClientEditButton } from "@/components/clients/client-edit-sheet";
import { ClientStatusBadge } from "@/components/clients/client-status-badge";
import { PaymentReliabilityBadge } from "@/components/clients/payment-reliability-badge";
import { ClientIntelligenceCard } from "@/components/clients/client-intelligence-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getClientBySlug, listInvoicesForClient, listQuotationsForClient } from "@/lib/billing-data";
import { getClientIntelligence } from "@/lib/client-intelligence";
import { formatCurrency, formatDateDisplay } from "@/lib/utils";

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

  const [invoices, quotations, intelligence] = await Promise.all([
    listInvoicesForClient(client.id),
    listQuotationsForClient(client.id),
    getClientIntelligence(client.id),
  ]);

  const reliability = intelligence?.reliability ?? null;

  const billedTotal = invoices.reduce((sum, invoice) => sum + invoice.total, 0);
  const quotedTotal = quotations.reduce((sum, quotation) => sum + quotation.total, 0);
  const openInvoiceCount = invoices.filter((invoice) =>
    ["sent", "overdue", "partial_paid"].includes(invoice.status),
  ).length;

  return (
    <div className="grid gap-[var(--space-section)]">
      <section className="grid gap-[var(--space-grid)] xl:grid-cols-[1.2fr_0.8fr] xl:items-start">
        <Card className="overflow-hidden border-black/10 bg-[#17120F] p-0 text-[#FFF9F0]">
          <div className="bg-[radial-gradient(circle_at_top_left,rgba(202,138,4,0.28),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(255,255,255,0.08),transparent_30%)] px-6 py-7 sm:px-8 lg:px-10 lg:py-9">
            <div className="flex flex-wrap items-center gap-3">
              <Badge className="border-white/12 bg-white/10 text-[#FFF9F0]">Client workspace</Badge>
              <ClientStatusBadge status={client.status} />
              {reliability && <PaymentReliabilityBadge reliability={reliability} />}
            </div>

            <div className="mt-8 grid gap-6 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#D7C4A7]">Client overview</p>
                <h1 className="display-text mt-3 font-semibold text-[clamp(2.25rem,1.5rem+2vw,4rem)] leading-none">{client.name}</h1>
                <p className="mt-4 text-base text-[#E9E0D5]">{client.company || "Independent client"}</p>
              </div>

              <div className="grid gap-3 rounded-[var(--radius-inner)] border border-white/12 bg-white/[0.08] p-4 text-sm text-[#E9E0D5]">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#D7C4A7]">Billing contact</p>
                <div className="flex min-w-0 items-center gap-2">
                  <Mail className="size-4 shrink-0 text-[#D7C4A7]" />
                  <span className="truncate">{client.email || "No email yet"}</span>
                </div>
                <div className="flex min-w-0 items-center gap-2">
                  <Phone className="size-4 shrink-0 text-[#D7C4A7]" />
                  <span className="truncate">{client.phone || "No phone yet"}</span>
                </div>
              </div>
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
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
              <ClientDeleteButton clientId={client.id} clientName={client.name} />
            </div>
          </div>
        </Card>

        <div className="grid gap-4">
          {intelligence ? (
            <ClientIntelligenceCard
              ltv={intelligence.ltv}
              reliability={intelligence.reliability}
              health={intelligence.health}
            />
          ) : (
            <Card>
              <CardHeader>
                <Badge variant="accent">Relationship health</Badge>
                <CardTitle className="mt-3">No payment history yet</CardTitle>
                <CardDescription>Issue an invoice or quotation to start building this client&apos;s billing profile.</CardDescription>
              </CardHeader>
            </Card>
          )}
          <div className="grid grid-cols-3 gap-3">
            <MetricCard label="Invoices" value={String(invoices.length)} detail={formatCurrency(billedTotal)} />
            <MetricCard label="Open" value={String(openInvoiceCount)} detail="Awaiting payment" />
            <MetricCard label="Quotes" value={String(quotations.length)} detail={formatCurrency(quotedTotal)} />
          </div>
        </div>
      </section>

      <Card>
        <CardHeader className="gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <Badge variant="default">Client profile</Badge>
            <CardTitle className="mt-3">Contact and billing details</CardTitle>
          </div>
          <CardDescription>Client since {formatDateDisplay(client.createdAt)}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-3">
          <div className="rounded-[var(--radius-inner)] border border-black/7 bg-[#FFF8EE] p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">Company</p>
            <p className="mt-2 text-sm font-semibold text-foreground">{client.company || "Independent client"}</p>
          </div>
          <div className="rounded-[var(--radius-inner)] border border-black/7 bg-[#FFF8EE] p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">Primary contact</p>
            <div className="mt-2 grid gap-1.5 text-sm text-muted-strong">
              <span className="flex min-w-0 items-center gap-2"><Mail className="size-4 shrink-0" />{client.email || "No email yet"}</span>
              <span className="flex min-w-0 items-center gap-2"><Phone className="size-4 shrink-0" />{client.phone || "No phone yet"}</span>
            </div>
          </div>
          <div className="rounded-[var(--radius-inner)] border border-black/7 bg-[#FFF8EE] p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">Billing address</p>
            <p className="mt-2 flex items-start gap-2 text-sm text-muted-strong"><MapPin className="mt-0.5 size-4 shrink-0" />{client.address || "No billing address recorded"}</p>
          </div>
        </CardContent>
      </Card>

      <section className="grid gap-[var(--space-grid)] xl:grid-cols-2">
        <Card>
          <CardHeader>
            <Badge variant="default">Invoices</Badge>
            <CardTitle className="mt-3">Billing history</CardTitle>
            <CardDescription>Every invoice issued to this client.</CardDescription>
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
            <Badge variant="default">Quotations</Badge>
            <CardTitle className="mt-3">Sales history</CardTitle>
            <CardDescription>Quotes and their current decision state.</CardDescription>
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
      </section>
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
    <Card className="overflow-hidden">
      <CardHeader className="gap-1 p-4">
        <CardDescription>{label}</CardDescription>
        <CardTitle className="truncate text-xl">{value}</CardTitle>
      </CardHeader>
      <CardContent className="truncate px-4 pb-4 pt-0 text-xs text-muted-strong" title={detail}>{detail}</CardContent>
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
