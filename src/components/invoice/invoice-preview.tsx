import { memo } from "react";
import { getDocumentTemplate } from "@/lib/document-templates";
import { getInvoiceTotals } from "@/lib/preview";
import type { InvoicePreviewData } from "@/lib/types";
import { formatCurrency, formatDateDisplay, parseBankDetails } from "@/lib/utils";
import { formatTrnDisplay, getArabicDescription } from "@/lib/billing-utils";
import { cn } from "@/lib/utils";

export const InvoicePreview = memo(function InvoicePreview({
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
  const showDurationColumn =
    preview.kind === "quotation" &&
    preview.lineItems.some((item) => (item.durationValue ?? 0) > 0);

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

  // Spacing — drives px/py throughout the document
  const spacing = preview.spacing ?? "normal";
  const px = spacing === "compact" ? "px-4" : spacing === "spacious" ? "px-8" : "px-6";
  const py = spacing === "compact" ? "py-3" : spacing === "spacious" ? "py-7" : "py-5";

  // Header layout
  const layout = preview.headerLayout ?? "left";
  const headerInnerClass =
    layout === "centered"
      ? "flex flex-col items-center text-center gap-4"
      : layout === "split"
      ? "flex flex-wrap items-start justify-between gap-4 border-b border-black/6 pb-5"
      : "flex flex-wrap items-start justify-between gap-4";

  // Line items style
  const useCards = (preview.lineItemsStyle ?? "table") === "cards" && !isBilingual;

  return (
    <div
      className={cn(
        "overflow-hidden",
        template.canvasClassName,
        !isPrint && "rounded-[var(--radius-card)] border",
        isBilingual && "max-w-[1100px]"
      )}
      dir={isRtl ? "rtl" : undefined}
      lang={isArabicOnly ? "ar" : "en"}
      style={
        preview.bodyFont
          ? { fontFamily: `${preview.bodyFont}, var(--font-sans), sans-serif` }
          : isRtl || isBilingual
          ? { fontFamily: "var(--font-arabic, var(--font-sans)), var(--font-sans), sans-serif" }
          : undefined
      }
      data-document-kind={preview.kind ?? "invoice"}
      data-document-mode={mode}
      data-document-template={template.id}
    >
      {/* Header */}
      <div className={cn(px, `pb-5 pt-5`, template.headerClassName)}>
        <div className={headerInnerClass}>
          <div className={cn("space-y-1", layout === "centered" && "items-center")}>
            {preview.logoUrl && (
              <img
                src={preview.logoUrl}
                alt={preview.businessName}
                className={cn(
                  "mb-3 h-10 max-w-[180px] object-contain",
                  layout === "centered" ? "object-center mx-auto" : "object-left"
                )}
              />
            )}
            <p
              className="text-xl font-semibold text-foreground"
              style={preview.headingFont ? { fontFamily: `${preview.headingFont}, serif` } : undefined}
            >
              {preview.businessName}
            </p>
            <p className="text-sm leading-6 text-[#78716C]">{preview.address}</p>
            <p className="text-sm text-[#78716C]">{preview.businessEmail}</p>
            <p className="text-sm text-[#78716C]">{preview.phone}</p>
            {formatTrnDisplay(preview.trn) && (
              <p className="text-sm text-[#78716C]">{formatTrnDisplay(preview.trn)}</p>
            )}
          </div>
          <div className={layout === "centered" ? "text-center" : "text-right"}>
            <p
              className={cn(template.numberClassName)}
              style={{ color: preview.accentColor }}
            >
              {documentTitle}
            </p>
            <p className="mt-1 text-sm font-medium text-foreground">
              #{preview.invoiceNumber}
            </p>
          </div>
        </div>
      </div>

      {/* Meta row: Billed to | Dates | Amount due */}
      <div className="border-t border-black/6">
        <div className={cn(px, py, template.metaSurfaceClassName)}>
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
      </div>

      {/* Line items */}
      {isBilingual ? (
        <div className={px}>
          {/* Bilingual header */}
          <div className={cn("grid grid-cols-1 md:grid-cols-2 gap-x-8 border-b border-t border-black/8 py-3", template.tableHeadClassName)}>
            <div className="text-[11px] font-medium uppercase tracking-[0.16em]">
              Description
            </div>
            <div dir="rtl" className="text-[11px] font-medium uppercase tracking-[0.16em] hidden md:block">
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
                {item.durationValue && item.durationUnit && (
                  <span className="mt-0.5 block text-xs text-[#A8A29E]">
                    {formatDuration(item.durationValue, item.durationUnit)}
                  </span>
                )}
              </div>
              {/* Arabic column */}
              <div dir="rtl" lang="ar" className="mt-2 md:mt-0">
                <span className="text-sm font-medium text-foreground">{getArabicDescription(item)}</span>
                {item.notes ? <span className="mt-0.5 block whitespace-pre-wrap text-xs text-[#A8A29E]">{item.notes}</span> : null}
              </div>
            </div>
          ))}
        </div>
      ) : useCards ? (
        /* Cards layout */
        <div className={cn(px, "py-4 space-y-2")}>
          {preview.lineItems.map((item, i) => (
            <div key={item.id} className="rounded-[0.8rem] border border-black/7 px-4 py-3">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline gap-2">
                    <span className="text-xs tabular-nums text-[#A8A29E]">{i + 1}.</span>
                    <span className="whitespace-pre-wrap text-sm font-medium text-foreground">
                      {isArabicOnly ? getArabicDescription(item) : item.description}
                    </span>
                  </div>
                  {item.notes ? <p className="mt-1 text-xs text-[#A8A29E] whitespace-pre-wrap">{item.notes}</p> : null}
                </div>
                <div className="shrink-0 text-right text-sm tabular-nums">
                  <p className="font-medium text-foreground" dir="ltr">{formatCurrency(item.unitPrice * item.quantity, preview.currency)}</p>
                  <p className="text-xs text-[#78716C]" dir="ltr">
                    {item.quantity} × {formatCurrency(item.unitPrice, preview.currency)}
                  </p>
                  {item.durationValue && item.durationUnit && (
                    <p className="text-xs text-[#A8A29E]">{formatDuration(item.durationValue, item.durationUnit)}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Table layout (default) */
        <div className={px}>
          <table className="w-full text-left">
            <thead>
              <tr className={cn("border-b border-t text-[11px] font-medium uppercase tracking-[0.16em]", template.tableHeadClassName)}>
                <th className="w-10 py-3 pr-2 font-medium">#</th>
                <th className="py-3 pr-4 font-medium">{isArabicOnly ? "الوصف" : "Title / Description"}</th>
                <th className="py-3 pr-4 text-right font-medium">{isArabicOnly ? "الكمية" : "Qty"}</th>
                {showDurationColumn && (
                  <th className="py-3 pr-4 text-right font-medium">{isArabicOnly ? "المدة" : "Duration"}</th>
                )}
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
                  {showDurationColumn && (
                    <td className="py-4 pr-4 text-right text-sm tabular-nums text-[#78716C]">
                      {item.durationValue && item.durationUnit
                        ? formatDuration(item.durationValue, item.durationUnit)
                        : "—"}
                    </td>
                  )}
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
      <div className={cn("flex", isRtl || isBilingual ? "justify-start" : "justify-end")}>
        <div className={cn("w-full max-w-[260px]", px, py, template.totalsSurfaceClassName)}>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className={template.totalsMutedClassName || "text-[#78716C]"}>{bilingualLabel("Subtotal", "المجموع الفرعي")}</span>
              <span className="tabular-nums" dir="ltr">{totals.subtotalLabel}</span>
            </div>
            {(preview.discount ?? 0) > 0 ? (
              <div className="flex justify-between">
                <span className={template.totalsMutedClassName || "text-[#78716C]"}>{bilingualLabel(`Discount (${preview.discount}%)`, `خصم (${preview.discount}%)`)}</span>
                <span className="tabular-nums" dir="ltr">-{totals.discountLabel}</span>
              </div>
            ) : null}
            {preview.taxEnabled ? (
              <div className="flex justify-between">
                <span className={template.totalsMutedClassName || "text-[#78716C]"}>{bilingualLabel(`Tax (${preview.taxRate}%)`, `ضريبة (${preview.taxRate}%)`)}</span>
                <span className="tabular-nums" dir="ltr">{totals.taxLabel}</span>
              </div>
            ) : null}
            <div className="flex justify-between border-t border-white/10 pt-3 text-base font-semibold">
              <span>{bilingualLabel("Total", "الإجمالي")}</span>
              <span className="tabular-nums" dir="ltr">{totals.totalLabel}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Signature */}
      {(preview.signatureMode === "typed" && preview.signatureText) || preview.signatureUrl ? (
        <div className={cn("border-t border-black/5 sm:text-right", px, py, template.signatureSurfaceClassName)}>
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
        <div className={cn("border-t border-black/5", px, py)}>
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-[#A8A29E]">{bilingualLabel("Payment info", "معلومات الدفع")}</p>
          <div className="mt-3 flex flex-wrap gap-x-6 gap-y-4">
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
        <div className={cn("border-t border-black/5", px, py, template.footerSurfaceClassName)}>
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
});

function formatDuration(value: number, unit: string): string {
  const label = unit.charAt(0).toUpperCase() + unit.slice(1);
  const singular = label.endsWith("s") ? label.slice(0, -1) : label;
  return `${value} ${value === 1 ? singular : label}`;
}
