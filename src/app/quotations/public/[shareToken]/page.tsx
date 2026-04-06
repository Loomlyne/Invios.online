import { notFound } from "next/navigation";
import { InvoicePreview } from "@/components/invoice/invoice-preview";
import { getPublicQuotationByToken } from "@/lib/billing-data";
import { buildQuotationPreviewFromRecord } from "@/lib/document-preview-data";
import { getOwnerUserState } from "@/lib/public-documents";

export default async function PublicQuotationPage({
  params,
  searchParams,
}: {
  params: Promise<{ shareToken: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { shareToken } = await params;
  const query = (await searchParams) ?? {};
  const printMode = query.print === "1";
  const quotation = await getPublicQuotationByToken(shareToken);

  if (!quotation) {
    notFound();
  }

  const ownerState = await getOwnerUserState(quotation.userId);
  const preview = buildQuotationPreviewFromRecord({ userState: ownerState }, quotation);

  return (
    <main className={printMode ? "mx-auto max-w-5xl px-0 py-0" : "mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8"}>
      <InvoicePreview preview={preview} mode={printMode ? "print" : "public"} />
    </main>
  );
}
