import Link from "next/link";
import type { Route } from "next";
import { notFound } from "next/navigation";
import { MoveLeft } from "lucide-react";
import { DocumentBuilder } from "@/components/documents/document-builder";
import { Button } from "@/components/ui/button";
import { getQuotationById, listClients } from "@/lib/billing-data";
import { getAppContext } from "@/lib/data";

export default async function EditQuotationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [context, clients, quotation] = await Promise.all([
    getAppContext(),
    listClients({ status: "all" }),
    getQuotationById(id),
  ]);

  if (!quotation) {
    notFound();
  }

  return (
    <div className="grid gap-4">
      <Button asChild variant="ghost" className="w-fit">
        <Link href={`/app/quotations/${quotation.id}` as Route}>
          <MoveLeft className="size-4" />
          Back to quotation
        </Link>
      </Button>

      <DocumentBuilder
        kind="quotation"
        context={context}
        clients={clients}
        submitLabel="Update quotation"
        numberValue={quotation.quotationNumber}
        initialValue={{
          id: quotation.id,
          clientId: quotation.clientId,
          quotationDate: quotation.quotationDate,
          expiryDate: quotation.expiryDate,
          validityDays: quotation.validityDays,
          currency: quotation.currency,
          taxRate: quotation.taxRate,
          discount: quotation.discount,
          language: quotation.language,
          notes: quotation.notes,
          terms: quotation.terms,
          trn: context.userState.profile.trn,
          lineItems: quotation.lineItems,
          status: quotation.status,
        }}
      />
    </div>
  );
}
