import Link from "next/link";
import type { Route } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { MoveLeft, SquarePen } from "lucide-react";
import { DocumentStatusActions } from "@/components/documents/document-status-actions";
import { DocumentStatusBadge } from "@/components/documents/document-status-badge";
import { InvoicePreview } from "@/components/invoice/invoice-preview";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  getQuotationById,
  getQuotationBySlug,
  getSlugAliasRedirect,
} from "@/lib/billing-data";
import { isUuid } from "@/lib/billing-utils";
import { getAppContext } from "@/lib/data";
import { buildQuotationPreviewFromRecord } from "@/lib/document-preview-data";
import { env } from "@/lib/env";
import { formatCurrency } from "@/lib/utils";
import { ShareButton } from "@/components/documents/share-button";
import { EmailPdfButton } from "@/components/documents/email-pdf-button";
import { ExportButton } from "./export-button";

export default async function QuotationDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  // UUID fallback redirect (D-12): old /app/quotations/[uuid] links → slug URL
  if (isUuid(slug)) {
    const quotation = await getQuotationById(slug);
    if (!quotation) notFound();
    permanentRedirect(`/app/quotations/${quotation.slug}` as Route);
  }

  // Primary slug lookup
  let quotation = await getQuotationBySlug(slug);

  // Alias redirect (D-13): renamed slugs redirect to current slug
  if (!quotation) {
    const currentSlug = await getSlugAliasRedirect(slug, "quotation");
    if (currentSlug) permanentRedirect(`/app/quotations/${currentSlug}` as Route);
    notFound();
  }

  const [context] = await Promise.all([getAppContext()]);

  const preview = buildQuotationPreviewFromRecord(
    {
      userState: context.userState,
      logoUrl: context.previewData.logoUrl,
      signatureUrl: context.previewData.signatureUrl,
    },
    quotation,
  );
  const isLocked = quotation.convertedToInvoiceId !== null;

  return (
    <div className="grid gap-[var(--space-section)]">
      <Button asChild variant="ghost" className="w-fit">
        <Link href={"/app/quotations" as Route}>
          <MoveLeft className="size-4" />
          Back to quotations
        </Link>
      </Button>

      <section className="flex flex-col gap-[var(--space-grid)]">
        <Card>
          <CardHeader className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <CardTitle>{quotation.quotationNumber}</CardTitle>
              <Badge variant="accent">Quotation detail</Badge>
              <DocumentStatusBadge status={quotation.status} />
              {isLocked ? <Badge variant="default">Converted</Badge> : null}
            </div>
            <CardDescription>
              {quotation.client.name}
              {quotation.client.company ? ` • ${quotation.client.company}` : ""}
            </CardDescription>
            <div className="flex flex-wrap items-center gap-2">
              {isLocked ? (
                <Button
                  variant="secondary"
                  size="sm"
                  disabled
                  className="opacity-50 cursor-not-allowed"
                  title="This quotation has been converted into an invoice and can no longer be edited."
                >
                  <SquarePen className="size-4" />
                  Edit
                </Button>
              ) : (
                <Button asChild variant="secondary" size="sm">
                  <Link href={`/app/quotations/${quotation.slug}/edit` as Route}>
                    <SquarePen className="size-4" />
                    Edit
                  </Link>
                </Button>
              )}
              <ShareButton
                publicUrl={`${env.siteUrl}/quotations/public/${quotation.shareToken}`}
                documentNumber={quotation.quotationNumber}
                amountLabel={formatCurrency(quotation.total, quotation.currency)}
                documentKind="quotation"
              />
              <ExportButton quotationId={quotation.id} quotationNumber={quotation.quotationNumber} />
              <EmailPdfButton endpoint={`/api/quotations/${quotation.id}/email-pdf`} />
            </div>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <InfoCard label="Quotation date" value={quotation.quotationDate} />
              <InfoCard label="Expiry date" value={quotation.expiryDate} />
              <InfoCard label="Validity" value={`${quotation.validityDays} days`} />
              <InfoCard label="Currency" value={quotation.currency} />
              <InfoCard label="Client" value={quotation.client.name} />
              <InfoCard label="Total" value={formatCurrency(quotation.total, quotation.currency)} />
            </div>

            <DocumentStatusActions
              kind="quotation"
              id={quotation.id}
              status={quotation.status}
              convertedToInvoiceId={quotation.convertedToInvoiceId}
            />
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
    <div className="rounded-[var(--radius-inner)] border border-black/7 bg-[#FFF8EE] px-4 py-4">
      <p className="text-xs uppercase tracking-[0.18em] text-muted">{label}</p>
      <p className="mt-2 text-sm font-medium text-foreground">{value}</p>
    </div>
  );
}
