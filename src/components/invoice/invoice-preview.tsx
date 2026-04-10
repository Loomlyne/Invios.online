import { getDocumentTemplate } from "@/lib/document-templates";
import { getInvoiceTotals } from "@/lib/preview";
import type { InvoicePreviewData } from "@/lib/types";
import { formatCurrency, formatDateDisplay, parseBankDetails } from "@/lib/utils";

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
  const bankFields = parseBankDetails(preview.bankDetails);

  return (
    <div
      className="overflow-hidden rounded-[var(--radius-card)] border border-black/8 bg-white"
      data-document-kind={preview.kind ?? "invoice"}
      data-document-mode={mode}
      data-document-template={template.id}
    >
      {/* Header */}
      <div className="px-6 pb-5 pt-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1">
            <p className="text-xl font-semibold text-foreground">{preview.businessName}</p>
            <p className="text-sm leading-6 text-[#78716C]">{preview.address}</p>
            <p className="text-sm text-[#78716C]">{preview.businessEmail}</p>
            <p className="text-sm text-[#78716C]">{preview.phone}</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-semibold tracking-tight" style={{ color: preview.accentColor }}>
              {documentTitle}
            </p>
            <p className="mt-1 text-sm font-medium text-foreground">
              #{preview.invoiceNumber}
            </p>
          </div>
        </div>
      </div>

      {/* Meta row: Billed to | Dates | Amount due */}
      <div className="border-t border-black/6 px-6 py-5">
        <div className="grid gap-6 sm:grid-cols-[1fr_auto_auto]">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-[#A8A29E]">Billed to</p>
            <p className="mt-2 text-sm font-semibold text-foreground">{recipientName}</p>
            {preview.recipientCompany && preview.recipientName !== preview.recipientCompany ? (
              <p className="text-sm text-[#78716C]">{preview.recipientName}</p>
            ) : null}
            {preview.recipientAddress ? (
              <p className="text-sm text-[#78716C]">{preview.recipientAddress}</p>
            ) : null}
            {preview.recipientPhone ? (
              <p className="text-sm text-[#78716C]">{preview.recipientPhone}</p>
            ) : null}
          </div>

          <div className="space-y-3">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-[#A8A29E]">
                {preview.issueDateLabel || "Invoice date"}
              </p>
              <p className="mt-1 text-sm font-medium tabular-nums text-foreground">
                {formatDateDisplay(preview.issueDate)}
              </p>
            </div>
            <div>
              <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-[#A8A29E]">
                {preview.dueDateLabel || "Due date"}
              </p>
              <p className="mt-1 text-sm font-medium tabular-nums text-foreground">
                {formatDateDisplay(preview.dueDate)}
              </p>
            </div>
          </div>

          <div className="text-right sm:min-w-[140px]">
            <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-[#A8A29E]">Amount due</p>
            <p className="mt-2 text-lg font-semibold" style={{ color: preview.accentColor }}>
              {totals.totalLabel}
            </p>
          </div>
        </div>
      </div>

      {/* Line items table */}
      <div className="px-6">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-t border-black/8 text-[11px] font-medium uppercase tracking-[0.16em] text-[#A8A29E]">
              <th className="w-10 py-3 pr-2 font-medium">#</th>
              <th className="py-3 pr-4 font-medium">Title / Description</th>
              <th className="py-3 pr-4 text-right font-medium">Qty</th>
              <th className="py-3 pr-4 text-right font-medium">Unit price</th>
              <th className="py-3 text-right font-medium">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {preview.lineItems.map((item, i) => (
              <tr key={item.id} className="border-b border-black/5">
                <td className="py-4 pr-2 text-sm tabular-nums text-[#A8A29E]">{i + 1}</td>
                <td className="py-4 pr-4 text-sm text-foreground">
                  <span className="font-medium">{item.description}</span>
                  {item.notes ? <span className="mt-0.5 block text-xs text-[#A8A29E]">{item.notes}</span> : null}
                </td>
                <td className="py-4 pr-4 text-right text-sm tabular-nums text-[#78716C]">{item.quantity}</td>
                <td className="py-4 pr-4 text-right text-sm tabular-nums text-[#78716C]">
                  {formatCurrency(item.unitPrice, preview.currency)}
                </td>
                <td className="py-4 text-right text-sm tabular-nums font-medium text-foreground">
                  {formatCurrency(item.unitPrice * item.quantity, preview.currency)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Totals */}
      <div className="flex justify-end px-6 py-5">
        <div className="w-full max-w-[260px] space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-[#78716C]">Subtotal</span>
            <span className="tabular-nums text-foreground">{totals.subtotalLabel}</span>
          </div>
          {(preview.discount ?? 0) > 0 ? (
            <div className="flex justify-between">
              <span className="text-[#78716C]">Discount ({preview.discount}%)</span>
              <span className="tabular-nums text-foreground">-{totals.discountLabel}</span>
            </div>
          ) : null}
          {preview.taxEnabled ? (
            <div className="flex justify-between">
              <span className="text-[#78716C]">Tax ({preview.taxRate}%)</span>
              <span className="tabular-nums text-foreground">{totals.taxLabel}</span>
            </div>
          ) : null}
          <div className="flex justify-between border-t border-black/8 pt-3 text-base font-semibold">
            <span className="text-foreground">Total</span>
            <span className="tabular-nums text-foreground">{totals.totalLabel}</span>
          </div>
        </div>
      </div>

      {/* Signature */}
      {(preview.signatureMode === "typed" && preview.signatureText) || preview.signatureUrl ? (
        <div className="border-t border-black/5 px-6 py-5 sm:text-right">
          {preview.signatureMode === "typed" && preview.signatureText ? (
            <div>
              <p
                className="text-3xl text-foreground"
                style={{ fontFamily: preview.signatureFont || "serif" }}
              >
                {preview.signatureText}
              </p>
              <p className="mt-2 text-[11px] font-medium uppercase tracking-[0.18em] text-[#A8A29E]">Date signed</p>
              <p className="mt-1 text-sm tabular-nums text-foreground">{formatDateDisplay(preview.issueDate)}</p>
            </div>
          ) : (
            <div>
              <img
                alt="Signature"
                src={preview.signatureUrl!}
                className="ml-auto h-14 object-contain"
              />
              <p className="mt-2 text-[11px] font-medium uppercase tracking-[0.18em] text-[#A8A29E]">Date signed</p>
              <p className="mt-1 text-sm tabular-nums text-foreground">{formatDateDisplay(preview.issueDate)}</p>
            </div>
          )}
        </div>
      ) : null}

      {/* Payment info */}
      {bankFields.length > 0 ? (
        <div className="border-t border-black/5 px-6 py-5">
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-[#A8A29E]">Payment info</p>
          <div className="mt-3 flex gap-x-6 gap-y-4">
            {bankFields.map((f, i) => (
              <div key={i}>
                <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-[#A8A29E]">{f.label}</p>
                <p className="mt-1 text-sm font-medium text-foreground">{f.value}</p>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {/* Terms + Notes side by side */}
      {(preview.terms || preview.notes) ? (
        <div className="border-t border-black/5 px-6 py-5">
          <div className="grid gap-6 sm:grid-cols-2">
            {preview.terms ? (
              <div>
                <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-[#A8A29E]">Terms</p>
                <p className="mt-2 text-sm leading-7 text-[#78716C]">{preview.terms}</p>
              </div>
            ) : null}
            {preview.notes ? (
              <div>
                <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-[#A8A29E]">Notes</p>
                <p className="mt-2 text-sm leading-7 text-[#78716C]">{preview.notes}</p>
              </div>
            ) : null}
          </div>
          {preview.trn ? (
            <p className="mt-4 text-xs text-[#A8A29E]">TRN: {preview.trn}</p>
          ) : null}
        </div>
      ) : preview.trn ? (
        <div className="border-t border-black/5 px-6 py-5">
          <p className="text-xs text-[#A8A29E]">TRN: {preview.trn}</p>
        </div>
      ) : null}

    </div>
  );
}
