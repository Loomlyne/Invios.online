import Link from "next/link";
import type { Route } from "next";
import { notFound } from "next/navigation";
import { MoveLeft, SquarePen } from "lucide-react";
import { DocumentStatusActions } from "@/components/documents/document-status-actions";
import { DocumentStatusBadge } from "@/components/documents/document-status-badge";
import { InvoicePreview } from "@/components/invoice/invoice-preview";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getQuotationById } from "@/lib/billing-data";
import { getAppContext } from "@/lib/data";
import { buildQuotationPreviewFromRecord } from "@/lib/document-preview-data";
import { formatCurrency } from "@/lib/utils";
import { ShareButton } from "./share-button";

export default async function QuotationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [context, quotation] = await Promise.all([getAppContext(), getQuotationById(id)]);

  if (!quotation) {
    notFound();
  }

  const preview = buildQuotationPreviewFromRecord(context, quotation);
  const isLocked = quotation.convertedToInvoiceId !== null;

  return (
    <div className="grid gap-6">
      <Button asChild variant="ghost" className="w-fit">
        <Link href={"/app/quotations" as Route}>
          <MoveLeft className="size-4" />
          Back to quotations
        </Link>
      </Button>

      <section className="grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
        <Card>
          <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <Badge variant="accent">Quotation detail</Badge>
                <DocumentStatusBadge status={quotation.status} />
                {isLocked ? <Badge variant="default">Converted</Badge> : null}
              </div>
              <CardTitle className="mt-3">{quotation.quotationNumber}</CardTitle>
              <CardDescription className="mt-2">
                {quotation.client.name}
                {quotation.client.company ? ` • ${quotation.client.company}` : ""}
              </CardDescription>
            </div>

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
                  <Link href={`/app/quotations/${quotation.id}/edit` as Route}>
                    <SquarePen className="size-4" />
                    Edit
                  </Link>
                </Button>
              )}
              <Button asChild variant="secondary" size="sm">
                <a href={`/api/quotations/${quotation.id}/pdf`} download={`${quotation.quotationNumber}.pdf`}>
                  PDF
                </a>
              </Button>
              <ShareButton publicPath={`/quotations/public/${quotation.shareToken}`} />
            </div>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-3 sm:grid-cols-2">
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
    <div className="rounded-[1rem] border border-black/7 bg-[#FFF8EE] px-4 py-4">
      <p className="text-xs uppercase tracking-[0.18em] text-muted">{label}</p>
      <p className="mt-2 text-sm font-medium text-foreground">{value}</p>
    </div>
  );
}
