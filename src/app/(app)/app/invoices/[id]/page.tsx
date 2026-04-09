import Link from "next/link";
import type { Route } from "next";
import { notFound } from "next/navigation";
import { MoveLeft, SquarePen } from "lucide-react";
import { DocumentStatusBadge } from "@/components/documents/document-status-badge";
import { InvoicePreview } from "@/components/invoice/invoice-preview";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getInvoiceById, listExpensesForInvoice, listPaymentsForInvoice } from "@/lib/billing-data";
import { getAppContext } from "@/lib/data";
import { ExpensesTable } from "@/components/documents/expenses-table";
import { PaymentsTable } from "@/components/documents/payments-table";
import { ProfitSummary } from "@/components/documents/profit-summary";
import { FinancialQuickActions } from "@/components/documents/financial-quick-actions";
import { InvoiceDeleteButton } from "@/components/documents/invoice-delete-button";
import { buildInvoicePreviewFromRecord } from "@/lib/document-preview-data";
import { formatCurrency } from "@/lib/utils";
import { ExportButton } from "./export-button";
import { StatusButton } from "./status-button";

export default async function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [context, invoice, payments, expenses] = await Promise.all([
    getAppContext(),
    getInvoiceById(id),
    listPaymentsForInvoice(id),
    listExpensesForInvoice(id),
  ]);

  if (!invoice) {
    notFound();
  }
  const expensesTotal = expenses.reduce((sum, e) => sum + e.amount, 0);

  const preview = buildInvoicePreviewFromRecord(context, invoice);

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button asChild variant="ghost" className="w-fit">
          <Link href={"/app/invoices" as Route}>
            <MoveLeft className="size-4" />
            Back to invoices
          </Link>
        </Button>
        <FinancialQuickActions invoiceId={invoice.id} />
      </div>

      <section className="flex flex-col gap-5">
        <Card>
          <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex gap-[21px]">
              <div className="flex flex-col items-start gap-0">
                <CardTitle className="mt-3 text-center" style={{ height: 26 }}>
                  {invoice.invoiceNumber}
                </CardTitle>
                <CardDescription className="mt-2">
                  {invoice.client.name}
                  {invoice.client.company ? ` • ${invoice.client.company}` : ""}
                </CardDescription>
              </div>

              <div className="flex flex-nowrap items-center justify-start gap-3 text-center">
                <Badge variant="accent">Invoice detail</Badge>
                <DocumentStatusBadge status={invoice.status} />
              </div>
            </div>

            <div className="flex flex-nowrap gap-2">
              <InvoiceDeleteButton invoiceId={invoice.id} />
              <Button asChild variant="secondary" size="sm">
                <Link href={`/app/invoices/${invoice.id}/edit` as Route}>
                  <SquarePen className="size-4" />
                  Edit
                </Link>
              </Button>
              <StatusButton invoiceId={invoice.id} currentStatus={invoice.status} />
              <ExportButton invoiceId={invoice.id} invoiceNumber={invoice.invoiceNumber} />
            </div>
          </CardHeader>
          <CardContent className="grid gap-4">
            <ProfitSummary
              total={invoice.total}
              expensesTotal={expensesTotal}
              currency={invoice.currency}
            />

            <div className="flex border-t border-black/7 pt-4">
              <div className="flex w-full flex-row gap-0">
                <InvoiceMeta label="Issue date" value={invoice.issueDate} />
                <InvoiceMeta label="Due date" value={invoice.dueDate} />
                <InvoiceMeta
                  label="Type"
                  value={invoice.invoiceType === "tax_invoice" ? "Tax invoice" : "Invoice"}
                />
                <InvoiceMeta label="Currency" value={invoice.currency} />
                <InvoiceMeta label="Client" value={invoice.client.name} />
                <InvoiceMeta
                  label="Total"
                  value={formatCurrency(invoice.total, invoice.currency)}
                  emphasize
                />
              </div>
            </div>

          </CardContent>
        </Card>

        <InvoicePreview preview={preview} mode="page" />
      </section>

      {/* Financial details — per D-01, D-04 from CONTEXT.md */}
      <section className="grid gap-6">
        <PaymentsTable
          invoiceId={invoice.id}
          invoiceTotal={invoice.total}
          currency={invoice.currency}
          payments={payments}
        />

        <ExpensesTable
          invoiceId={invoice.id}
          currency={invoice.currency}
          expenses={expenses}
        />
      </section>
    </div>
  );
}

function InvoiceMeta({
  label,
  value,
  emphasize = false,
}: {
  label: string;
  value: string;
  emphasize?: boolean;
}) {
  return (
    <div className="w-full border-b border-dashed border-black/8 pb-3 sm:pb-4">
      <p className="text-[11px] uppercase tracking-[0.18em] text-muted">{label}</p>
      <p
        className={`mt-2 text-sm ${emphasize ? "font-semibold text-[#92700C]" : "font-medium text-foreground"}`}
      >
        {value}
      </p>
    </div>
  );
}
