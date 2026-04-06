import Link from "next/link";
import type { Route } from "next";
import { notFound } from "next/navigation";
import { MoveLeft } from "lucide-react";
import { DocumentBuilder } from "@/components/documents/document-builder";
import { Button } from "@/components/ui/button";
import { getInvoiceById, listClients } from "@/lib/billing-data";
import { getAppContext } from "@/lib/data";

export default async function EditInvoicePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [context, clients, invoice] = await Promise.all([
    getAppContext(),
    listClients({ status: "all" }),
    getInvoiceById(id),
  ]);

  if (!invoice) {
    notFound();
  }

  return (
    <div className="grid gap-4">
      <Button asChild variant="ghost" className="w-fit">
        <Link href={`/app/invoices/${invoice.id}` as Route}>
          <MoveLeft className="size-4" />
          Back to invoice
        </Link>
      </Button>

      <DocumentBuilder
        kind="invoice"
        context={context}
        clients={clients}
        submitLabel="Update invoice"
        numberValue={invoice.invoiceNumber}
        initialValue={{
          id: invoice.id,
          clientId: invoice.clientId,
          issueDate: invoice.issueDate,
          dueDate: invoice.dueDate,
          currency: invoice.currency,
          taxRate: invoice.taxRate,
          discount: invoice.discount,
          language: invoice.language,
          notes: invoice.notes,
          terms: invoice.terms,
          trn: invoice.trn,
          lineItems: invoice.lineItems,
          status: invoice.status,
          invoiceType: invoice.invoiceType,
        }}
      />
    </div>
  );
}
