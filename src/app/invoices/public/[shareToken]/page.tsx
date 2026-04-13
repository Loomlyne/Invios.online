import { notFound } from "next/navigation";
import { InvoicePreview } from "@/components/invoice/invoice-preview";
import { DocumentStatusBadge } from "@/components/documents/document-status-badge";
import { PublicPageShell } from "@/components/public/public-page-shell";
import { PublicDocumentActions } from "@/components/public/public-document-actions";
import { getPublicInvoiceByToken } from "@/lib/billing-data";
import { buildInvoicePreviewFromRecord } from "@/lib/document-preview-data";
import { getOwnerUserState, getPublicLogoUrl } from "@/lib/public-documents";

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

  const [logoUrl, signatureUrl] = await Promise.all([
    getPublicLogoUrl(ownerState.branding.logoPath),
    getPublicLogoUrl(ownerState.branding.signaturePath),
  ]);

  const preview = buildInvoicePreviewFromRecord(
    { userState: ownerState, logoUrl, signatureUrl },
    invoice,
  );

  // Print mode: bare document for PDF generation — no chrome
  if (printMode) {
    return (
      <main className="w-full">
        <InvoicePreview preview={preview} mode="print" />
      </main>
    );
  }

  return (
    <PublicPageShell
      businessName={ownerState.profile.businessName}
      logoUrl={logoUrl}
      primaryColor={ownerState.branding.primaryColor || "var(--accent)"}
    >
      <div className="mb-4">
        <DocumentStatusBadge status={invoice.status} />
      </div>
      <InvoicePreview preview={preview} mode="public" />
      <PublicDocumentActions
        shareToken={shareToken}
        documentKind="invoice"
        invoiceId={invoice.id}
        invoiceNumber={invoice.invoiceNumber}
      />
    </PublicPageShell>
  );
}
