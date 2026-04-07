import Link from "next/link";
import type { Route } from "next";
import { notFound } from "next/navigation";
import { MoveLeft, SquarePen } from "lucide-react";
import { DocumentStatusActions } from "@/components/documents/document-status-actions";
import { DocumentStatusBadge } from "@/components/documents/document-status-badge";
import { InvoicePreview } from "@/components/invoice/invoice-preview";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getInvoiceById } from "@/lib/billing-data";
import { getAppContext } from "@/lib/data";
import { buildInvoicePreviewFromRecord } from "@/lib/document-preview-data";
import { formatCurrency } from "@/lib/utils";
import { ExportButton } from "./export-button";

export default async function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [context, invoice] = await Promise.all([getAppContext(), getInvoiceById(id)]);

  if (!invoice) {
    notFound();
  }

  const preview = buildInvoicePreviewFromRecord(context, invoice);

  return (
    <div className="grid gap-6">
      <Button asChild variant="ghost" className="w-fit">
        <Link href={"/app/invoices" as Route}>
          <MoveLeft className="size-4" />
          Back to invoices
        </Link>
      </Button>

      <section className="grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
        <Card>
          <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <Badge variant="accent">Invoice detail</Badge>
                <DocumentStatusBadge status={invoice.status} />
              </div>
              <CardTitle className="mt-3">{invoice.invoiceNumber}</CardTitle>
              <CardDescription className="mt-2">
                {invoice.client.name}
                {invoice.client.company ? ` • ${invoice.client.company}` : ""}
              </CardDescription>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button asChild variant="secondary" size="sm">
                <Link href={`/app/invoices/${invoice.id}/edit` as Route}>
                  <SquarePen className="size-4" />
                  Edit
                </Link>
              </Button>
              <ExportButton invoiceId={invoice.id} invoiceNumber={invoice.invoiceNumber} />
            </div>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <InfoCard label="Issue date" value={invoice.issueDate} />
              <InfoCard label="Due date" value={invoice.dueDate} />
              <InfoCard label="Type" value={invoice.invoiceType === "tax_invoice" ? "Tax invoice" : "Invoice"} />
              <InfoCard label="Currency" value={invoice.currency} />
              <InfoCard label="Client" value={invoice.client.name} />
              <InfoCard label="Total" value={formatCurrency(invoice.total, invoice.currency)} />
            </div>

            <DocumentStatusActions kind="invoice" id={invoice.id} status={invoice.status} />
          </CardContent>
        </Card>

        <InvoicePreview preview={preview} mode="page" />
      </section>
    </div>
  );
}

function InfoCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[1rem] border border-black/7 bg-[#FFF8EE] px-4 py-4">
      <p className="text-xs uppercase tracking-[0.18em] text-muted">{label}</p>
      <p className="mt-2 text-sm font-medium text-foreground">{value}</p>
    </div>
  );
}
