import Link from "next/link";
import type { Route } from "next";
import { notFound } from "next/navigation";
import { ArrowRight, FileText, PencilLine, ReceiptText, Trash2 } from "lucide-react";
import { archiveClientAction, updateClientAction } from "@/actions/clients";
import { ClientForm } from "@/components/clients/client-form";
import { ClientStatusBadge } from "@/components/clients/client-status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getClientBySlug, listInvoicesForClient, listQuotationsForClient } from "@/lib/billing-data";
import { formatCurrency } from "@/lib/utils";

export default async function ClientDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { slug } = await params;
  const query = (await searchParams) ?? {};
  const editMode = query.edit === "1";
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
    <div className="grid gap-6">
      <section className="grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
        <Card className="overflow-hidden border-black/10 bg-[#17120F] p-0 text-[#FFF9F0]">
          <div className="bg-[radial-gradient(circle_at_top_left,rgba(202,138,4,0.24),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(255,255,255,0.08),transparent_26%)] px-6 py-7 sm:px-8">
            <div className="flex flex-wrap items-center gap-3">
              <Badge className="border-white/12 bg-white/10 text-[#FFF9F0]">Client detail</Badge>
              <ClientStatusBadge status={client.status} />
            </div>
            <h1 className="display-text mt-4 text-4xl font-semibold sm:text-5xl">{client.name}</h1>
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
              <Button asChild variant="inverse">
                <Link
                  href={
                    (editMode
                      ? `/app/clients/${client.slug}`
                      : `/app/clients/${client.slug}?edit=1`) as Route
                  }
                >
                  <PencilLine className="size-4" />
                  {editMode ? "Close edit" : "Edit client"}
                </Link>
              </Button>
            </div>
          </div>
        </Card>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
          <MetricCard label="Invoices" value={String(invoices.length)} detail={formatCurrency(billedTotal)} />
          <MetricCard label="Quotations" value={String(quotations.length)} detail={formatCurrency(quotedTotal)} />
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="grid gap-5">
          <Card>
            <CardHeader>
              <Badge variant="default">Client profile</Badge>
              <CardTitle className="mt-3">Contact, tax, and billing summary.</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2">
              <InfoCard label="Company" value={client.company || "Independent client"} />
              <InfoCard label="Email" value={client.email || "Not set"} />
              <InfoCard label="Phone" value={client.phone || "Not set"} />
              <InfoCard label="TRN" value={client.trn || "Not set"} />
              <InfoCard label="Tax code" value={client.taxCode || "Not set"} />
              <InfoCard label="Portal token" value={client.portalToken} mono />
              <div className="sm:col-span-2">
                <InfoCard label="Address" value={client.address || "Not set"} />
              </div>
            </CardContent>
          </Card>

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
                  <Link
                    key={invoice.id}
                  href={`/app/invoices/${invoice.id}` as Route}
                    className="rounded-[1rem] border border-black/7 bg-[#FFF8EE] px-4 py-4 transition hover:border-[#D7C4A7] hover:bg-[#FFF4E3]"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-foreground">{invoice.invoiceNumber}</p>
                        <p className="mt-1 text-sm text-muted-strong">
                          Due {invoice.dueDate} • {formatCurrency(invoice.total, invoice.currency)}
                        </p>
                      </div>
                      <ArrowRight className="size-4 text-muted" />
                    </div>
                  </Link>
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
                  <Link
                    key={quotation.id}
                    href={`/app/quotations/${quotation.id}` as Route}
                    className="rounded-[1rem] border border-black/7 bg-[#FFF8EE] px-4 py-4 transition hover:border-[#D7C4A7] hover:bg-[#FFF4E3]"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-foreground">{quotation.quotationNumber}</p>
                        <p className="mt-1 text-sm text-muted-strong">
                          Expires {quotation.expiryDate} • {formatCurrency(quotation.total, quotation.currency)}
                        </p>
                      </div>
                      <ArrowRight className="size-4 text-muted" />
                    </div>
                  </Link>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <Badge variant="accent">{editMode ? "Edit client" : "Client actions"}</Badge>
              <CardTitle className="mt-3">
                {editMode ? "Update client details without leaving the workspace." : "Promote this client into live billing work."}
              </CardTitle>
              <CardDescription className="mt-2">
                {editMode
                  ? "Changes here update the shared client record that invoices and quotations point at."
                  : "Start a quotation or invoice from this exact client profile, or archive the record if it is no longer active."}
              </CardDescription>
            </div>

            {!editMode ? null : (
              <form
                action={async () => {
                  "use server";
                  await archiveClientAction(client.id);
                }}
              >
                <Button type="submit" variant="danger" size="sm">
                  <Trash2 className="size-4" />
                  Archive
                </Button>
              </form>
            )}
          </CardHeader>
          <CardContent>
            {editMode ? (
              <ClientForm action={updateClientAction} submitLabel="Update client" initialValue={client} />
            ) : (
              <div className="grid gap-4">
                <ActionLink
                  href={`/app/quotations/new?clientId=${client.id}` as Route}
                  title="Start quotation"
                  body="Open the quotation builder prefilled with this client and your saved business defaults."
                />
                <ActionLink
                  href={`/app/invoices/new?clientId=${client.id}` as Route}
                  title="Start invoice"
                  body="Open the invoice builder with this client attached, ready for billing."
                />
                <ActionLink
                  href={`/app/clients/${client.slug}?edit=1` as Route}
                  title="Edit client profile"
                  body="Update contact details, tax fields, and lifecycle status in place."
                />
              </div>
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
    <Card>
      <CardHeader>
        <CardDescription>{label}</CardDescription>
        <CardTitle className="text-3xl">{value}</CardTitle>
      </CardHeader>
      <CardContent className="text-sm leading-7 text-muted-strong">{detail}</CardContent>
    </Card>
  );
}

function InfoCard({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="rounded-[1rem] border border-black/7 bg-[#FFF8EE] px-4 py-4">
      <p className="text-xs uppercase tracking-[0.18em] text-muted">{label}</p>
      <p className={`mt-2 text-sm text-foreground ${mono ? "font-mono text-xs break-all" : "leading-7"}`}>
        {value}
      </p>
    </div>
  );
}

function ActionLink({
  href,
  title,
  body,
}: {
  href: Route;
  title: string;
  body: string;
}) {
  return (
    <Link
      href={href}
      className="rounded-[1rem] border border-black/7 bg-[#FFF8EE] px-4 py-4 transition hover:border-[#D7C4A7] hover:bg-[#FFF4E3]"
    >
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-foreground">{title}</p>
        <ArrowRight className="size-4 text-muted" />
      </div>
      <p className="mt-2 text-sm leading-7 text-muted-strong">{body}</p>
    </Link>
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
    <div className="rounded-[1rem] border border-dashed border-black/10 bg-[#FFF8EE] px-4 py-5">
      <p className="text-sm leading-7 text-muted-strong">{body}</p>
      <Button asChild variant="secondary" className="mt-4">
        <Link href={href}>{label}</Link>
      </Button>
    </div>
  );
}
