import { getDocumentTemplate } from "@/lib/document-templates";
import { getInvoiceTotals } from "@/lib/preview";
import type { InvoicePreviewData } from "@/lib/types";
import { formatCurrency, formatDateDisplay, parseBankDetails } from "@/lib/utils";
import { formatTrnDisplay, getArabicDescription } from "@/lib/billing-utils";
import { cn } from "@/lib/utils";

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

  // Language-aware rendering
  const isArabicOnly = preview.language === "ar";
  const isBilingual = preview.language === "bilingual";
  const isRtl = isArabicOnly;

  function bilingualLabel(en: string, ar: string): string {
    if (isBilingual) return `${en} / ${ar}`;
    if (isArabicOnly) return ar;
    return en;
  }

  const isPrint = mode === "print";

  return (
    <div
      className={cn(
        "overflow-hidden bg-white",
        !isPrint && "rounded-[var(--radius-card)] border border-black/8",
        isBilingual && "max-w-[1100px]"
      )}
      dir={isRtl ? "rtl" : undefined}
      lang={isArabicOnly ? "ar" : "en"}
      style={
        isRtl || isBilingual
          ? { fontFamily: "var(--font-arabic, var(--font-sans)), var(--font-sans), sans-serif" }
          : undefined
      }
      data-document-kind={preview.kind ?? "invoice"}
      data-document-mode={mode}
      data-document-template={template.id}
    >
      {/* Header */}
      <div className="px-6 pb-5 pt-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1">
            {preview.logoUrl && (
              <img
                src={preview.logoUrl}
                alt={preview.businessName}
                className="mb-3 h-10 max-w-[180px] object-contain object-left"
              />
            )}
            <p className="text-xl font-semibold text-foreground">{preview.businessName}</p>
            <p className="text-sm leading-6 text-[#78716C]">{preview.address}</p>
            <p className="text-sm text-[#78716C]">{preview.businessEmail}</p>
            <p className="text-sm text-[#78716C]">{preview.phone}</p>
            {formatTrnDisplay(preview.trn) && (
              <p className="text-sm text-[#78716C]">{formatTrnDisplay(preview.trn)}</p>
            )}
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
            <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-[#A8A29E]">{bilingualLabel("Billed to", "الفاتورة إلى")}</p>
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
            {preview.recipientTrn && formatTrnDisplay(preview.recipientTrn) && (
              <p className="text-sm text-[#78716C]">{formatTrnDisplay(preview.recipientTrn)}</p>
            )}
          </div>

          <div className="space-y-3">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-[#A8A29E]">
                {preview.issueDateLabel || bilingualLabel("Invoice date", "تاريخ الفاتورة")}
              </p>
              <p className="mt-1 text-sm font-medium tabular-nums text-foreground">
                {formatDateDisplay(preview.issueDate)}
              </p>
            </div>
            <div>
              <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-[#A8A29E]">
                {preview.dueDateLabel || bilingualLabel("Due date", "تاريخ الاستحقاق")}
              </p>
              <p className="mt-1 text-sm font-medium tabular-nums text-foreground">
                {formatDateDisplay(preview.dueDate)}
              </p>
            </div>
          </div>

          <div className="text-right sm:min-w-[140px]">
            <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-[#A8A29E]">{bilingualLabel("Amount due", "المبلغ المستحق")}</p>
            <p className="mt-2 text-lg font-semibold" style={{ color: preview.accentColor }} dir="ltr">
              {totals.totalLabel}
            </p>
          </div>
        </div>
      </div>

      {/* Line items */}
      {isBilingual ? (
        <div className="px-6">
          {/* Bilingual header */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 border-b border-t border-black/8 py-3">
            <div className="text-[11px] font-medium uppercase tracking-[0.16em] text-[#A8A29E]">
              Description
            </div>
            <div dir="rtl" className="text-[11px] font-medium uppercase tracking-[0.16em] text-[#A8A29E] hidden md:block">
              الوصف
            </div>
          </div>
          {/* Bilingual line items */}
          {preview.lineItems.map((item, i) => (
            <div key={item.id} className="grid grid-cols-1 md:grid-cols-2 gap-x-8 border-b border-black/5 py-4">
              {/* English column */}
              <div>
                <div className="flex items-baseline gap-2">
                  <span className="text-sm tabular-nums text-[#A8A29E]">{i + 1}.</span>
                  <span className="whitespace-pre-wrap text-sm font-medium text-foreground">{item.description}</span>
                </div>
                <div className="mt-1 flex gap-4 text-sm tabular-nums text-[#78716C]">
                  <span>Qty: {item.quantity}</span>
                  <span dir="ltr">{formatCurrency(item.unitPrice, preview.currency)}</span>
                  <span className="font-medium text-foreground" dir="ltr">{formatCurrency(item.unitPrice * item.quantity, preview.currency)}</span>
                </div>
              </div>
              {/* Arabic column */}
              <div dir="rtl" lang="ar" className="mt-2 md:mt-0">
                <span className="text-sm font-medium text-foreground">{getArabicDescription(item)}</span>
                {item.notes ? <span className="mt-0.5 block whitespace-pre-wrap text-xs text-[#A8A29E]">{item.notes}</span> : null}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="px-6">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-t border-black/8 text-[11px] font-medium uppercase tracking-[0.16em] text-[#A8A29E]">
                <th className="w-10 py-3 pr-2 font-medium">#</th>
                <th className="py-3 pr-4 font-medium">{isArabicOnly ? "الوصف" : "Title / Description"}</th>
                <th className="py-3 pr-4 text-right font-medium">{isArabicOnly ? "الكمية" : "Qty"}</th>
                <th className="py-3 pr-4 text-right font-medium">{isArabicOnly ? "سعر الوحدة" : "Unit price"}</th>
                <th className="py-3 text-right font-medium">{isArabicOnly ? "المجموع" : "Subtotal"}</th>
              </tr>
            </thead>
            <tbody>
              {preview.lineItems.map((item, i) => (
                <tr key={item.id} className="border-b border-black/5">
                  <td className="py-4 pr-2 text-sm tabular-nums text-[#A8A29E]">{i + 1}</td>
                  <td className="py-4 pr-4 text-sm text-foreground">
                    <span className="whitespace-pre-wrap font-medium">{isArabicOnly ? getArabicDescription(item) : item.description}</span>
                    {item.notes ? <span className="mt-0.5 block whitespace-pre-wrap text-xs text-[#A8A29E]">{item.notes}</span> : null}
                  </td>
                  <td className="py-4 pr-4 text-right text-sm tabular-nums text-[#78716C]">{item.quantity}</td>
                  <td className="py-4 pr-4 text-right text-sm tabular-nums text-[#78716C]" dir="ltr">
                    {formatCurrency(item.unitPrice, preview.currency)}
                  </td>
                  <td className="py-4 text-right text-sm tabular-nums font-medium text-foreground" dir="ltr">
                    {formatCurrency(item.unitPrice * item.quantity, preview.currency)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Totals */}
      <div className={cn("flex px-6 py-5", isRtl || isBilingual ? "justify-start" : "justify-end")}>
        <div className="w-full max-w-[260px] space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-[#78716C]">{bilingualLabel("Subtotal", "المجموع الفرعي")}</span>
            <span className="tabular-nums text-foreground" dir="ltr">{totals.subtotalLabel}</span>
          </div>
          {(preview.discount ?? 0) > 0 ? (
            <div className="flex justify-between">
              <span className="text-[#78716C]">{bilingualLabel(`Discount (${preview.discount}%)`, `خصم (${preview.discount}%)`)}</span>
              <span className="tabular-nums text-foreground" dir="ltr">-{totals.discountLabel}</span>
            </div>
          ) : null}
          {preview.taxEnabled ? (
            <div className="flex justify-between">
              <span className="text-[#78716C]">{bilingualLabel(`Tax (${preview.taxRate}%)`, `ضريبة (${preview.taxRate}%)`)}</span>
              <span className="tabular-nums text-foreground" dir="ltr">{totals.taxLabel}</span>
            </div>
          ) : null}
          <div className="flex justify-between border-t border-black/8 pt-3 text-base font-semibold">
            <span className="text-foreground">{bilingualLabel("Total", "الإجمالي")}</span>
            <span className="tabular-nums text-foreground" dir="ltr">{totals.totalLabel}</span>
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
              <p className="mt-2 text-[11px] font-medium uppercase tracking-[0.18em] text-[#A8A29E]">{bilingualLabel("Date signed", "التاريخ")}</p>
              <p className="mt-1 text-sm tabular-nums text-foreground">{formatDateDisplay(preview.issueDate)}</p>
            </div>
          ) : (
            <div>
              <img
                alt="Signature"
                src={preview.signatureUrl!}
                className="ml-auto h-14 object-contain"
              />
              <p className="mt-2 text-[11px] font-medium uppercase tracking-[0.18em] text-[#A8A29E]">{bilingualLabel("Date signed", "التاريخ")}</p>
              <p className="mt-1 text-sm tabular-nums text-foreground">{formatDateDisplay(preview.issueDate)}</p>
            </div>
          )}
        </div>
      ) : null}

      {/* Payment info */}
      {bankFields.length > 0 ? (
        <div className="border-t border-black/5 px-6 py-5">
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-[#A8A29E]">{bilingualLabel("Payment info", "معلومات الدفع")}</p>
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
                <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-[#A8A29E]">{bilingualLabel("Terms", "الشروط والأحكام")}</p>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-[#78716C]">{preview.terms}</p>
              </div>
            ) : null}
            {preview.notes ? (
              <div>
                <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-[#A8A29E]">{bilingualLabel("Notes", "ملاحظات")}</p>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-[#78716C]">{preview.notes}</p>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

    </div>
  );
}
