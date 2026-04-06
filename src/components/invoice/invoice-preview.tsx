import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { getDocumentTemplate } from "@/lib/document-templates";
import { getInvoiceTotals } from "@/lib/preview";
import type { InvoicePreviewData } from "@/lib/types";
import { cn, formatCurrency } from "@/lib/utils";

export function InvoicePreview({
  preview,
  mode = "panel",
}: {
  preview: InvoicePreviewData;
  mode?: "panel" | "hero" | "page" | "public" | "print";
}) {
  const totals = getInvoiceTotals(preview);
  const documentTitle = preview.title || (preview.kind === "quotation" ? "Quotation" : "Invoice");
  const recipientName = preview.recipientCompany || preview.recipientName || "Client";
  const template = getDocumentTemplate(preview.templateId);
  const isDarkHeader = template.id === "executive";
  const flatMode = mode === "page" || mode === "public" || mode === "print";

  return (
    <Card
      className={cn(
        "overflow-hidden p-0",
        template.canvasClassName,
        flatMode && "shadow-none",
      )}
      data-document-kind={preview.kind ?? "invoice"}
      data-document-mode={mode}
      data-document-template={template.id}
    >
      <div className={cn("px-5 py-4", template.headerClassName)}>
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="accent">
                {mode === "public" ? `Shared ${documentTitle.toLowerCase()}` : `Live ${documentTitle.toLowerCase()} preview`}
              </Badge>
              {preview.statusLabel ? <Badge variant="default">{preview.statusLabel}</Badge> : null}
              <div
                className={cn(
                  "inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em]",
                  isDarkHeader
                    ? "border-white/12 bg-white/8 text-[#FFF9F0]"
                    : "border-black/10 bg-black/5 text-muted-strong",
                )}
              >
                {template.name}
              </div>
            </div>
            <div>
              <p
                className={cn(
                  "display-text text-3xl font-semibold",
                  isDarkHeader ? "text-[#FFF9F0]" : "text-foreground",
                )}
              >
                {preview.businessName}
              </p>
              <p
                className={cn(
                  "max-w-xs text-sm leading-6",
                  isDarkHeader ? "text-[#E9E0D5]" : "text-muted",
                )}
              >
                {preview.address}
              </p>
            </div>
          </div>

          <div className="text-right">
            <p
              className={cn(
                "text-xs uppercase tracking-[0.24em]",
                isDarkHeader ? "text-[#CFC2B2]" : "text-muted",
              )}
            >
              {preview.numberLabel || `${documentTitle} no.`}
            </p>
            <p className={cn(template.numberClassName)} style={{ color: preview.accentColor }}>
              {preview.invoiceNumber}
            </p>
            <p
              className={cn(
                "mt-2 text-xs uppercase tracking-[0.24em]",
                isDarkHeader ? "text-[#CFC2B2]" : "text-muted",
              )}
            >
              {preview.dueDateLabel || "Due date"}
              {" "}
              {preview.dueDate}
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-5 px-5 py-5">
        <div className={cn("grid gap-4 p-4 sm:grid-cols-[1.2fr_0.8fr]", template.headerSurfaceClassName)}>
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.22em] text-muted">
              From
            </p>
            <p className="text-sm font-medium text-foreground">
              {preview.businessEmail}
            </p>
            <p className="text-sm text-muted">{preview.phone}</p>
            <p className="text-sm text-muted">{preview.website}</p>
          </div>
          <div className={cn("space-y-2 p-4", template.metaSurfaceClassName)}>
            <p className="text-xs uppercase tracking-[0.22em] text-muted">
              {documentTitle} details
            </p>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-muted">{preview.issueDateLabel || "Issue date"}</p>
                <p className="font-medium text-foreground">{preview.issueDate}</p>
              </div>
              <div>
                <p className="text-muted">{preview.dueDateLabel || "Due date"}</p>
                <p className="font-medium text-foreground">{preview.dueDate}</p>
              </div>
              <div>
                <p className="text-muted">Currency</p>
                <p className="font-medium text-foreground">{preview.currency}</p>
              </div>
              <div>
                <p className="text-muted">Language</p>
                <p className="font-medium capitalize text-foreground">{preview.language}</p>
              </div>
              <div>
                <p className="text-muted">Tax</p>
                <p className="font-medium text-foreground">
                  {preview.taxEnabled ? `${preview.taxRate}%` : "Disabled"}
                </p>
              </div>
              <div>
                <p className="text-muted">TRN</p>
                <p className="font-medium text-foreground">{preview.trn || "Pending"}</p>
              </div>
            </div>
          </div>
        </div>

        <div className={cn("grid gap-4 border p-4 sm:grid-cols-[1.1fr_0.9fr]", template.headerSurfaceClassName)}>
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.22em] text-muted">Bill to</p>
            <p className="text-base font-semibold text-foreground">{recipientName}</p>
            <p className="text-sm text-muted">{preview.recipientName}</p>
            <p className="text-sm text-muted">{preview.recipientEmail}</p>
            <p className="text-sm text-muted">{preview.recipientPhone}</p>
          </div>
          <div className={cn("p-4", template.recipientSurfaceClassName)}>
            <p className="text-xs uppercase tracking-[0.22em] text-muted">Recipient address</p>
            <p className="mt-3 text-sm leading-7 text-muted-strong">
              {preview.recipientAddress || "Recipient address pending"}
            </p>
          </div>
        </div>

        <div className="overflow-hidden rounded-[1.25rem] border border-black/5">
          <table className="w-full text-left">
            <thead className={cn("text-xs uppercase tracking-[0.18em]", template.tableHeadClassName)}>
              <tr>
                <th className="px-4 py-3 font-medium">Description</th>
                <th className="px-4 py-3 font-medium">Qty</th>
                <th className="px-4 py-3 font-medium">Rate</th>
                <th className="px-4 py-3 text-right font-medium">Amount</th>
              </tr>
            </thead>
            <tbody className="bg-white">
              {preview.lineItems.map((item) => (
                <tr key={item.id} className="border-t border-black/5">
                  <td className="px-4 py-4 text-sm text-foreground">
                    <div className="space-y-1">
                      <p>{item.description}</p>
                      {item.notes ? <p className="text-xs text-muted">{item.notes}</p> : null}
                    </div>
                  </td>
                  <td className="px-4 py-4 text-sm text-muted">{item.quantity}</td>
                  <td className="px-4 py-4 text-sm text-muted">
                    {formatCurrency(item.unitPrice, preview.currency)}
                  </td>
                  <td className="px-4 py-4 text-right text-sm font-medium text-foreground">
                    {formatCurrency(item.unitPrice * item.quantity, preview.currency)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="grid gap-4 sm:grid-cols-[1fr_0.78fr]">
          <div className={cn("p-4", template.notesSurfaceClassName)}>
            <p className="text-xs uppercase tracking-[0.22em] text-muted">Notes</p>
            <p className="mt-3 text-sm leading-7 text-muted-strong">
              {preview.notes}
            </p>
            <p className="mt-5 text-xs uppercase tracking-[0.22em] text-muted">
              Terms
            </p>
            <p className="mt-3 text-sm leading-7 text-muted-strong">
              {preview.terms}
            </p>
          </div>

          <div className={cn("p-5", template.totalsSurfaceClassName)}>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className={cn(template.totalsMutedClassName)}>Subtotal</span>
                <span>{totals.subtotalLabel}</span>
              </div>
              {(preview.discount ?? 0) > 0 ? (
                <div className="flex items-center justify-between">
                  <span className={cn(template.totalsMutedClassName)}>Discount ({preview.discount}%)</span>
                  <span>-{totals.discountLabel}</span>
                </div>
              ) : null}
              <div className="flex items-center justify-between">
                <span className={cn(template.totalsMutedClassName)}>Tax</span>
                <span>{totals.taxLabel}</span>
              </div>
              <div className="flex items-center justify-between border-t border-white/10 pt-3 text-base font-semibold">
                <span>Total</span>
                <span style={{ color: preview.accentColor }}>{totals.totalLabel}</span>
              </div>
            </div>

            <div className={cn("mt-8 p-4", template.signatureSurfaceClassName)}>
              <p className={cn("text-xs uppercase tracking-[0.2em]", template.totalsMutedClassName)}>
                Signature
              </p>
              {preview.signatureMode === "typed" && preview.signatureText ? (
                <p
                  className="mt-3 text-3xl"
                  style={{ fontFamily: preview.signatureFont || "serif" }}
                >
                  {preview.signatureText}
                </p>
              ) : preview.signatureUrl ? (
                <img
                  alt="Signature preview"
                  src={preview.signatureUrl}
                  className="mt-3 h-14 object-contain"
                />
              ) : (
                <p className={cn("mt-3 text-sm", template.totalsMutedClassName)}>
                  Signature will appear here once configured.
                </p>
              )}
            </div>
          </div>
        </div>

        <div className={cn("px-4 py-4 text-sm leading-7 text-muted-strong", template.footerSurfaceClassName)}>
          {preview.footerText}
        </div>
      </div>
    </Card>
  );
}
