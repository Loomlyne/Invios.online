import Link from "next/link";
import type { Route } from "next";
import { notFound } from "next/navigation";
import { MoveLeft, Send, Share2, SquarePen, Trash2 } from "lucide-react";
import {
  convertQuotationToInvoiceAction,
  deleteQuotationAction,
  setQuotationStatusAction,
} from "@/actions/quotations";
import { DocumentStatusBadge } from "@/components/documents/document-status-badge";
import { InvoicePreview } from "@/components/invoice/invoice-preview";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getQuotationById } from "@/lib/billing-data";
import { getAppContext } from "@/lib/data";
import { buildQuotationPreviewFromRecord } from "@/lib/document-preview-data";
import { formatCurrency } from "@/lib/utils";

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
              </div>
              <CardTitle className="mt-3">{quotation.quotationNumber}</CardTitle>
              <CardDescription className="mt-2">
                {quotation.client.name}
                {quotation.client.company ? ` • ${quotation.client.company}` : ""}
              </CardDescription>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button asChild variant="secondary" size="sm">
                <Link href={`/app/quotations/${quotation.id}/edit` as Route}>
                  <SquarePen className="size-4" />
                  Edit
                </Link>
              </Button>
              <Button asChild variant="secondary" size="sm">
                <Link href={`/api/quotations/${quotation.id}/pdf` as Route} target="_blank">
                  PDF
                </Link>
              </Button>
              <Button asChild variant="secondary" size="sm">
                <Link href={`/quotations/public/${quotation.shareToken}` as Route} target="_blank">
                  <Share2 className="size-4" />
                  Share
                </Link>
              </Button>
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

            <div className="grid gap-3 sm:grid-cols-2">
              <form
                action={async () => {
                  "use server";
                  await setQuotationStatusAction(quotation.id, "sent");
                }}
              >
                <Button type="submit" variant="accent" className="w-full">
                  <Send className="size-4" />
                  Mark as sent
                </Button>
              </form>

              <form
                action={async () => {
                  "use server";
                  await setQuotationStatusAction(quotation.id, "accepted");
                }}
              >
                <Button type="submit" variant="secondary" className="w-full">
                  Mark as accepted
                </Button>
              </form>

              <form
                action={async () => {
                  "use server";
                  await convertQuotationToInvoiceAction(quotation.id);
                }}
              >
                <Button
                  type="submit"
                  variant="secondary"
                  className="w-full"
                  disabled={quotation.status !== "accepted"}
                >
                  Convert to invoice
                </Button>
              </form>

              <form
                action={async () => {
                  "use server";
                  await deleteQuotationAction(quotation.id);
                }}
              >
                <Button type="submit" variant="danger" className="w-full">
                  <Trash2 className="size-4" />
                  Delete quotation
                </Button>
              </form>
            </div>
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
