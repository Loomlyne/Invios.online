import { notFound } from "next/navigation";
import { InvoicePreview } from "@/components/invoice/invoice-preview";
import { getPublicInvoiceByToken } from "@/lib/billing-data";
import { buildInvoicePreviewFromRecord } from "@/lib/document-preview-data";
import { getOwnerUserState } from "@/lib/public-documents";

export default async function PublicInvoicePage({
  params,
  searchParams,
}: {
  params: Promise<{ shareToken: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { shareToken } = await params;
  const query = (await searchParams) ?? {};
  const printMode = query.print === "1";
  const invoice = await getPublicInvoiceByToken(shareToken);

  if (!invoice) {
    notFound();
  }

  const ownerState = await getOwnerUserState(invoice.userId);
  const preview = buildInvoicePreviewFromRecord({ userState: ownerState }, invoice);

  return (
    <main className={printMode ? "mx-auto max-w-5xl px-0 py-0" : "mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8"}>
      <InvoicePreview preview={preview} mode={printMode ? "print" : "public"} />
    </main>
  );
}
