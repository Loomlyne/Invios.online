import Link from "next/link";
import type { Route } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { MoveLeft } from "lucide-react";
import { DocumentBuilder } from "@/components/documents/document-builder";
import { Button } from "@/components/ui/button";
import { getInvoiceById, getInvoiceBySlug, getSlugAliasRedirect, listClients } from "@/lib/billing-data";
import { isUuid } from "@/lib/billing-utils";
import { getAppContext } from "@/lib/data";

export default async function EditInvoicePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  // UUID fallback redirect (D-12)
  if (isUuid(slug)) {
    const invoice = await getInvoiceById(slug);
    if (!invoice) notFound();
    permanentRedirect(`/app/invoices/${invoice.slug}/edit` as Route);
  }

  // Primary slug lookup
  let invoice = await getInvoiceBySlug(slug);

  // Alias redirect (D-13)
  if (!invoice) {
    const currentSlug = await getSlugAliasRedirect(slug, "invoice");
    if (currentSlug) permanentRedirect(`/app/invoices/${currentSlug}/edit` as Route);
    notFound();
  }

  const [context, clients] = await Promise.all([
    getAppContext(),
    listClients({ status: "all" }),
  ]);

  return (
    <div className="grid gap-4">
      <Button asChild variant="ghost" className="w-fit">
        <Link href={`/app/invoices/${invoice.slug}` as Route}>
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
