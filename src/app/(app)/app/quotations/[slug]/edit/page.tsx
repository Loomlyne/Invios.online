import Link from "next/link";
import type { Route } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { MoveLeft } from "lucide-react";
import { DocumentBuilder } from "@/components/documents/document-builder";
import { Button } from "@/components/ui/button";
import { getQuotationById, getQuotationBySlug, getSlugAliasRedirect, listClients } from "@/lib/billing-data";
import { isUuid } from "@/lib/billing-utils";
import { getAppContext } from "@/lib/data";

export default async function EditQuotationPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  // UUID fallback redirect (D-12)
  if (isUuid(slug)) {
    const quotation = await getQuotationById(slug);
    if (!quotation) notFound();
    permanentRedirect(`/app/quotations/${quotation.slug}/edit` as Route);
  }

  // Primary slug lookup
  let quotation = await getQuotationBySlug(slug);

  // Alias redirect (D-13)
  if (!quotation) {
    const currentSlug = await getSlugAliasRedirect(slug, "quotation");
    if (currentSlug) permanentRedirect(`/app/quotations/${currentSlug}/edit` as Route);
    notFound();
  }

  const [context, clients] = await Promise.all([
    getAppContext(),
    listClients({ status: "all" }),
  ]);

  return (
    <div className="grid gap-4">
      <Button asChild variant="ghost" className="w-fit">
        <Link href={`/app/quotations/${quotation.slug}` as Route}>
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
