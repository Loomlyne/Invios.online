import { notFound } from "next/navigation";
import { InvoicePreview } from "@/components/invoice/invoice-preview";
import { DocumentStatusBadge } from "@/components/documents/document-status-badge";
import { PublicPageShell } from "@/components/public/public-page-shell";
import { PublicDocumentActions } from "@/components/public/public-document-actions";
import { AcceptRejectForm } from "@/components/public/accept-reject-form";
import { getPublicQuotationByToken } from "@/lib/billing-data";
import { buildQuotationPreviewFromRecord } from "@/lib/document-preview-data";
import { getOwnerUserState, getPublicLogoUrl } from "@/lib/public-documents";

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

  // Print mode: bare document for PDF generation — no chrome
  if (printMode) {
    return (
      <main className="mx-auto max-w-5xl px-0 py-0">
        <InvoicePreview preview={preview} mode="print" />
      </main>
    );
  }

  const logoUrl = await getPublicLogoUrl(ownerState.branding.logoPath);

  return (
    <PublicPageShell
      businessName={ownerState.profile.businessName}
      logoUrl={logoUrl}
      primaryColor={ownerState.branding.primaryColor || "var(--accent)"}
    >
      <div className="mb-4">
        <DocumentStatusBadge status={quotation.status} />
      </div>
      <InvoicePreview preview={preview} mode="public" />
      <div className="mt-8">
        <AcceptRejectForm shareToken={shareToken} currentStatus={quotation.status} />
      </div>
      <PublicDocumentActions
        shareToken={shareToken}
        documentKind="quotation"
        invoiceId={quotation.id}
        invoiceNumber={quotation.quotationNumber}
      />
    </PublicPageShell>
  );
}
