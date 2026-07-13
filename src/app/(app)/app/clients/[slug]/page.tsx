import Link from "next/link";
import type { Route } from "next";
import { notFound } from "next/navigation";
import { FileText, Mail, MapPin, MoveLeft, Phone, ReceiptText } from "lucide-react";
import { DocumentSummaryRow } from "@/components/documents/document-summary-row";
import { ClientDeleteButton, ClientEditButton } from "@/components/clients/client-edit-sheet";
import { ClientStatusBadge } from "@/components/clients/client-status-badge";
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

  const billedTotal = invoices.reduce((sum, invoice) => sum + invoice.total, 0);
  const quotedTotal = quotations.reduce((sum, quotation) => sum + quotation.total, 0);
  const openInvoiceCount = invoices.filter((invoice) =>
    ["sent", "overdue", "partial_paid"].includes(invoice.status),
  ).length;

  return (
    <div className="grid gap-[var(--space-section)]">
      <Button asChild variant="ghost" className="w-fit">
        <Link href={"/app/clients" as Route}>
          <MoveLeft className="size-4" />
          Back to clients
        </Link>
      </Button>

      <section className="grid gap-[var(--space-grid)] 2xl:grid-cols-[minmax(0,1.3fr)_minmax(22rem,0.7fr)] 2xl:items-start">
        <Card className="overflow-hidden border-border bg-foreground p-0 text-on-dark">
          <div className="bg-[radial-gradient(circle_at_top_left,rgba(202,138,4,0.28),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(255,255,255,0.08),transparent_30%)] px-6 py-7 sm:px-8 lg:px-10 lg:py-9">
            <div className="flex items-center gap-3">
              <ClientStatusBadge status={client.status} />
            </div>

            <div className="mt-6 grid gap-8 2xl:grid-cols-[minmax(0,1.2fr)_minmax(17rem,0.8fr)] 2xl:items-end">
              <div>
                <h1 className="display-text font-semibold text-[clamp(2.25rem,1.5rem+2vw,4rem)] leading-none">{client.name}</h1>
                <p className="mt-4 max-w-xl text-base text-on-dark/80">{client.company || "Independent client"}</p>
              </div>

              <div className="grid gap-3 rounded-[var(--radius-inner)] border border-white/12 bg-black/15 p-5 text-sm text-on-dark/85">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-on-dark/65">Billing contact</p>
                <div className="flex min-w-0 items-center gap-2">
                  <Mail className="size-4 shrink-0 text-on-dark/65" />
                  {client.email ? (
                    <a href={`mailto:${client.email}`} className="truncate hover:text-accent">
                      {client.email}
                    </a>
                  ) : (
                    <span>No email yet</span>
                  )}
                </div>
                <div className="flex min-w-0 items-center gap-2">
                  <Phone className="size-4 shrink-0 text-on-dark/65" />
                  {client.phone ? (
                    <a href={`tel:${client.phone}`} className="truncate hover:text-accent">
                      {client.phone}
                    </a>
                  ) : (
                    <span>No phone yet</span>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-10 border-t border-white/12 pt-5">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-on-dark/65">Quick actions</p>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <Button asChild variant="accent" className="w-full justify-between sm:justify-center">
                  <Link href={`/app/quotations/new?clientId=${client.id}` as Route}>
                    New quotation
                    <FileText className="size-4" />
                  </Link>
                </Button>
                <Button asChild variant="inverse" className="w-full justify-between shadow-none sm:justify-center">
                  <Link href={`/app/invoices/new?clientId=${client.id}` as Route}>
                    New invoice
                    <ReceiptText className="size-4" />
                  </Link>
                </Button>
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-white/12 pt-4">
                <p className="mr-auto text-xs font-semibold uppercase tracking-[0.18em] text-on-dark/65">Manage record</p>
                <ClientEditButton client={client} />
                <ClientDeleteButton clientId={client.id} clientName={client.name} />
              </div>
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
          <div className="overflow-hidden rounded-[var(--radius-card)] border border-border bg-white/84 subtle-shadow">
            <div className="grid divide-y divide-border sm:grid-cols-3 sm:divide-x sm:divide-y-0">
              <MetricCard label="Invoices" value={String(invoices.length)} detail={formatCurrency(billedTotal)} />
              <MetricCard label="Open invoices" value={String(openInvoiceCount)} detail="Awaiting payment" />
              <MetricCard label="Quotations" value={String(quotations.length)} detail={formatCurrency(quotedTotal)} />
            </div>
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
          <div className="rounded-[var(--radius-inner)] border border-border bg-surface-subtle p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">Company</p>
            <p className="mt-2 break-words text-sm font-semibold text-foreground">{client.company || "Independent client"}</p>
          </div>
          <div className="rounded-[var(--radius-inner)] border border-border bg-surface-subtle p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">Primary contact</p>
            <div className="mt-2 grid gap-1.5 text-sm text-muted-strong">
              {client.email ? (
                <a href={`mailto:${client.email}`} className="flex min-w-0 items-center gap-2 break-words hover:text-accent-strong">
                  <Mail className="size-4 shrink-0" />
                  <span className="min-w-0 break-words">{client.email}</span>
                </a>
              ) : (
                <span className="flex min-w-0 items-center gap-2"><Mail className="size-4 shrink-0" />No email yet</span>
              )}
              {client.phone ? (
                <a href={`tel:${client.phone}`} className="flex min-w-0 items-center gap-2 break-words hover:text-accent-strong">
                  <Phone className="size-4 shrink-0" />
                  <span className="min-w-0 break-words">{client.phone}</span>
                </a>
              ) : (
                <span className="flex min-w-0 items-center gap-2"><Phone className="size-4 shrink-0" />No phone yet</span>
              )}
            </div>
          </div>
          <div className="rounded-[var(--radius-inner)] border border-border bg-surface-subtle p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">Billing address</p>
            <p className="mt-2 flex min-w-0 items-start gap-2 text-sm text-muted-strong">
              <MapPin className="mt-0.5 size-4 shrink-0" />
              <span className="min-w-0 break-words">{client.address || "No billing address recorded"}</span>
            </p>
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
    <div className="min-w-0 p-4">
      <p className="text-sm text-muted">{label}</p>
      <p className="mt-1 text-xl font-semibold tracking-tight text-foreground">{value}</p>
      <p className="mt-2 break-words text-sm text-muted-strong">{detail}</p>
    </div>
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
    <div className="rounded-[var(--radius-inner)] border border-dashed border-border bg-surface-subtle px-4 py-5">
      <p className="text-sm leading-7 text-muted-strong">{body}</p>
      <Button asChild variant="secondary" className="mt-4">
        <Link href={href}>{label}</Link>
      </Button>
    </div>
  );
}
