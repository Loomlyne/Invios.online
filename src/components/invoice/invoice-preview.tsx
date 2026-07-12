import { memo } from "react";
import { getDocumentTemplate } from "@/lib/document-templates";
import type { DocumentTemplateConfig } from "@/lib/document-templates";
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

  const isArabicOnly = preview.language === "ar";
  const isBilingual = preview.language === "bilingual";
  const isRtl = isArabicOnly;

  function bilingualLabel(en: string, ar: string): string {
    if (isBilingual) return `${en} / ${ar}`;
    if (isArabicOnly) return ar;
    return en;
  }

  const isPrint = mode === "print";

  const spacing = preview.spacing ?? "normal";
  const px = spacing === "compact" ? "px-4" : spacing === "spacious" ? "px-8" : "px-6";
  const py = spacing === "compact" ? "py-3" : spacing === "spacious" ? "py-7" : "py-5";

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
      style={{
        ...(preview.bodyFont
          ? { fontFamily: `${preview.bodyFont}, var(--font-sans), sans-serif` }
          : isRtl || isBilingual
            ? { fontFamily: "var(--font-arabic, var(--font-sans)), var(--font-sans), sans-serif" }
            : {}),
        ...(preview.pageBackground ? { backgroundColor: preview.pageBackground } : {}),
      }}
      data-document-kind={preview.kind ?? "invoice"}
      data-document-mode={mode}
      data-document-template={template.id}
    >
      {/* ── Header ── */}
      {template.headerVariant === "editorial" ? (
        <EditorialHeader
          preview={preview}
          template={template}
          documentTitle={documentTitle}
          px={px}
        />
      ) : template.headerVariant === "two-row" ? (
        <TwoRowHeader
          preview={preview}
          template={template}
          documentTitle={documentTitle}
          px={px}
        />
      ) : (
        <StandardHeader
          preview={preview}
          template={template}
          documentTitle={documentTitle}
          px={px}
        />
      )}

      {/* ── Meta ── */}
      {template.metaVariant === "contact-grid" ? (
        <ContactGridMeta
          preview={preview}
          template={template}
          recipientName={recipientName}
          totals={totals}
          px={px}
          py={py}
          bilingualLabel={bilingualLabel}
        />
      ) : template.metaVariant === "recipient-block" ? (
        <RecipientBlockMeta
          preview={preview}
          template={template}
          recipientName={recipientName}
          totals={totals}
          px={px}
          py={py}
          bilingualLabel={bilingualLabel}
        />
      ) : (
        <GridMeta
          preview={preview}
          template={template}
          recipientName={recipientName}
          totals={totals}
          px={px}
          py={py}
          bilingualLabel={bilingualLabel}
        />
      )}

      {/* ── Section divider before line items ── */}
      {template.sectionDivider === "line" && (
        <hr className={cn("mx-0 border-t", template.hrClassName)} />
      )}

      {/* ── Line items ── */}
      {isBilingual ? (
        <BilingualLineItems
          preview={preview}
          template={template}
          px={px}
        />
      ) : useCards ? (
        <CardLineItems
          preview={preview}
          template={template}
          isArabicOnly={isArabicOnly}
          px={px}
        />
      ) : (
        <TableLineItems
          preview={preview}
          template={template}
          isArabicOnly={isArabicOnly}
          showDurationColumn={showDurationColumn}
          px={px}
          bilingualLabel={bilingualLabel}
        />
      )}

      {/* ── Totals ── */}
      <RowTotals
        preview={preview}
        template={template}
        totals={totals}
        isRtl={isRtl}
        isBilingual={isBilingual}
        px={px}
        py={py}
        bilingualLabel={bilingualLabel}
      />

      {/* ── Signature + Footer grouped to avoid orphaned last page ── */}
      {(preview.signatureMode === "typed" && preview.signatureText) || preview.signatureUrl ? (
        <div className={cn("border-t border-black/5 sm:text-right break-inside-avoid", px, py, template.signatureSurfaceClassName)}>
          {preview.signatureMode === "typed" && preview.signatureText ? (
            <div>
              <p
                className="text-3xl text-foreground"
                style={{ fontFamily: preview.signatureFont || "serif" }}
              >
                {preview.signatureText}
              </p>
              <p className="mt-2 text-[11px] font-medium uppercase tracking-[0.18em] text-[#6b6359]">{bilingualLabel("Date signed", "التاريخ")}</p>
              <p className="mt-1 text-sm tabular-nums text-foreground">{formatDateDisplay(preview.issueDate)}</p>
            </div>
          ) : (
            <div>
              <img
                alt="Signature"
                src={preview.signatureUrl!}
                className="ml-auto h-14 object-contain"
              />
              <p className="mt-2 text-[11px] font-medium uppercase tracking-[0.18em] text-[#6b6359]">{bilingualLabel("Date signed", "التاريخ")}</p>
              <p className="mt-1 text-sm tabular-nums text-foreground">{formatDateDisplay(preview.issueDate)}</p>
            </div>
          )}
        </div>
      ) : null}

      {/* ── Payment info ── */}
      {template.footerLayout === "side-by-side" ? null : (
        bankFields.length > 0 ? (
          <div className={cn("border-t border-black/5 break-inside-avoid", px, py)}>
            <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-[#6b6359]">{bilingualLabel("Payment info", "معلومات الدفع")}</p>
            <div className="mt-3 flex flex-wrap gap-x-6 gap-y-4">
              {bankFields.map((f, i) => (
                <div key={i}>
                  <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-[#6b6359]">{f.label}</p>
                  <p className="mt-1 text-sm font-medium text-foreground">{f.value}</p>
                </div>
              ))}
            </div>
          </div>
        ) : null
      )}

      {/* ── Footer ── */}
      {template.footerLayout === "side-by-side" ? (
        <SideBySideFooter
          preview={preview}
          template={template}
          bankFields={bankFields}
          px={px}
          py={py}
          bilingualLabel={bilingualLabel}
        />
      ) : (
        <StackedFooter
          preview={preview}
          template={template}
          px={px}
          py={py}
          bilingualLabel={bilingualLabel}
        />
      )}
    </div>
  );
});

/* ═══════════════════════════ Header Variants ═══════════════════════════ */

/** Classic — Logo+name left, serif title+number right */
function StandardHeader({
  preview,
  template,
  documentTitle,
  px,
}: {
  preview: InvoicePreviewData;
  template: DocumentTemplateConfig;
  documentTitle: string;
  px: string;
}) {
  const layout = preview.headerLayout ?? "left";
  return (
    <div className={cn(px, "pb-5 pt-5", template.headerClassName)}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          {preview.logoUrl && (
            <img
              src={preview.logoUrl}
              alt={preview.businessName}
              className="mb-3 h-10 max-w-[180px] object-contain object-left"
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
            style={{ color: accentTextColor(preview.accentColor) }}
          >
            {documentTitle}
          </p>
          <p className="mt-1 text-sm text-[#78716C]">
            <span className="font-medium text-foreground">#{preview.invoiceNumber}</span>
          </p>
          <p className="mt-1 text-sm text-[#78716C]">
            {formatDateDisplay(preview.issueDate)}
          </p>
        </div>
      </div>
    </div>
  );
}

/** Minimal / Editorial — Bold name left, "INVOICE" uppercase + #number right */
function EditorialHeader({
  preview,
  template,
  documentTitle,
  px,
}: {
  preview: InvoicePreviewData;
  template: DocumentTemplateConfig;
  documentTitle: string;
  px: string;
}) {
  return (
    <div className={cn(px, "pb-6 pt-6", template.headerClassName)}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          {preview.logoUrl && (
            <img
              src={preview.logoUrl}
              alt={preview.businessName}
              className="mb-3 h-10 max-w-[180px] object-contain object-left"
            />
          )}
          <p
            className="text-xl font-bold text-foreground"
            style={preview.headingFont ? { fontFamily: `${preview.headingFont}, serif` } : undefined}
          >
            {preview.businessName}
          </p>
        </div>
        <div className="text-right">
          <p className={cn(template.numberClassName)} style={{ color: accentTextColor(preview.accentColor) }}>
            {documentTitle.toUpperCase()}
          </p>
          <p className="mt-1 text-sm font-medium text-foreground">#{preview.invoiceNumber}</p>
        </div>
      </div>

      {/* Two-column sender / recipient contact grid */}
      <div className="mt-6 grid gap-6 sm:grid-cols-2 text-sm text-[#78716C]">
        <div className="space-y-1">
          <p>{preview.businessEmail}</p>
          <p>{preview.phone}</p>
          <p>{preview.address}</p>
        </div>
        <div className="space-y-1">
          {preview.recipientCompany && <p className="font-medium text-foreground">{preview.recipientCompany}</p>}
          <p>{preview.recipientAddress}</p>
        </div>
      </div>
    </div>
  );
}

/** Executive / Two-row — Row 1: logo+contact. <hr>. Row 2: RECIPIENT + INVOICE */
function TwoRowHeader({
  preview,
  template,
  documentTitle,
  px,
}: {
  preview: InvoicePreviewData;
  template: DocumentTemplateConfig;
  documentTitle: string;
  px: string;
}) {
  return (
    <div className={cn(px, "pb-0 pt-5", template.headerClassName)}>
      {/* Row 1 — Logo left, contact right */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          {preview.logoUrl && (
            <img
              src={preview.logoUrl}
              alt={preview.businessName}
              className="h-10 max-w-[180px] object-contain object-left"
            />
          )}
          {!preview.logoUrl && (
            <p
              className="text-lg font-bold text-foreground"
              style={preview.headingFont ? { fontFamily: `${preview.headingFont}, serif` } : undefined}
            >
              {preview.businessName}
            </p>
          )}
        </div>
        <div className="text-right text-sm text-[#78716C] space-y-0.5">
          <p className="font-semibold text-foreground">{preview.businessName}</p>
          {preview.website && <p>{preview.website}</p>}
          <p>{preview.businessEmail}</p>
          <p>{preview.phone}</p>
        </div>
      </div>

      {/* Divider */}
      <hr className={cn("mt-5 border-t", template.hrClassName)} />

      {/* Row 2 — RECIPIENT left, INVOICE + number right */}
      <div className="flex flex-wrap items-start justify-between gap-4 py-5">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-[#6b6359]">Recipient</p>
        </div>
        <div className="text-right">
          <p className={cn(template.numberClassName)} style={{ color: accentTextColor(preview.accentColor) }}>
            {documentTitle.toUpperCase()}
          </p>
          <p className="mt-1 text-[11px] font-medium uppercase tracking-[0.18em] text-[#6b6359]">
            Invoice Number
          </p>
          <p className="mt-0.5 text-sm font-medium text-foreground">{preview.invoiceNumber}</p>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════ Meta Variants ═══════════════════════════ */

type MetaProps = {
  preview: InvoicePreviewData;
  template: DocumentTemplateConfig;
  recipientName: string;
  totals: ReturnType<typeof getInvoiceTotals>;
  px: string;
  py: string;
  bilingualLabel: (en: string, ar: string) => string;
};

/** Classic — 3-column: Bill To | Dates | Amount Due */
function GridMeta({ preview, template, recipientName, totals, px, py, bilingualLabel }: MetaProps) {
  return (
    <div className="border-t border-black/6">
      <div className={cn(px, py, template.metaSurfaceClassName)}>
        <div className="grid gap-6 sm:grid-cols-[1fr_auto_auto]">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-[#6b6359]">{bilingualLabel("Billed to", "الفاتورة إلى")}</p>
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
              <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-[#6b6359]">
                {preview.issueDateLabel || bilingualLabel("Invoice date", "تاريخ الفاتورة")}
              </p>
              <p className="mt-1 text-sm font-medium tabular-nums text-foreground">
                {formatDateDisplay(preview.issueDate)}
              </p>
            </div>
            <div>
              <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-[#6b6359]">
                {preview.dueDateLabel || bilingualLabel("Due date", "تاريخ الاستحقاق")}
              </p>
              <p className="mt-1 text-sm font-medium tabular-nums text-foreground">
                {formatDateDisplay(preview.dueDate)}
              </p>
            </div>
          </div>

          <div className="text-right sm:min-w-[140px]">
            <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-[#6b6359]">{bilingualLabel("Amount due", "المبلغ المستحق")}</p>
            <p className="mt-2 text-lg font-semibold" style={{ color: accentTextColor(preview.accentColor) }} dir="ltr">
              {totals.totalLabel}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Minimal — Dates + amount row, then "Description" heading */
function ContactGridMeta({ preview, template, recipientName, totals, px, py, bilingualLabel }: MetaProps) {
  return (
    <div className={cn(px, py)}>
      {/* Client details row */}
      <div className="grid gap-6 sm:grid-cols-[1fr_auto_auto] text-sm">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-[#6b6359]">{bilingualLabel("Billed to", "الفاتورة إلى")}</p>
          <p className="mt-2 font-semibold text-foreground">{recipientName}</p>
          {preview.recipientAddress ? <p className="text-[#78716C]">{preview.recipientAddress}</p> : null}
          {preview.recipientPhone ? <p className="text-[#78716C]">{preview.recipientPhone}</p> : null}
        </div>
        <div className="space-y-3">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-[#6b6359]">
              {preview.issueDateLabel || bilingualLabel("Invoice date", "تاريخ الفاتورة")}
            </p>
            <p className="mt-1 font-medium tabular-nums text-foreground">{formatDateDisplay(preview.issueDate)}</p>
          </div>
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-[#6b6359]">
              {preview.dueDateLabel || bilingualLabel("Due date", "تاريخ الاستحقاق")}
            </p>
            <p className="mt-1 font-medium tabular-nums text-foreground">{formatDateDisplay(preview.dueDate)}</p>
          </div>
        </div>
        <div className="text-right sm:min-w-[120px]">
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-[#6b6359]">{bilingualLabel("Amount due", "المبلغ المستحق")}</p>
          <p className="mt-2 text-lg font-semibold" style={{ color: accentTextColor(preview.accentColor) }} dir="ltr">
            {totals.totalLabel}
          </p>
        </div>
      </div>

      {/* Description heading */}
      <p
        className="mt-6 text-lg font-semibold text-foreground"
        style={preview.headingFont ? { fontFamily: `${preview.headingFont}, serif` } : undefined}
      >
        {bilingualLabel("Description", "الوصف")}
      </p>
    </div>
  );
}

/** Executive — Recipient block with client details + dates */
function RecipientBlockMeta({ preview, template, recipientName, totals, px, py, bilingualLabel }: MetaProps) {
  return (
    <div className={cn(px, "pb-4")}>
      {/* Client info */}
      <div className="space-y-1 text-sm">
        <p className="font-semibold text-foreground">{recipientName}</p>
        {preview.recipientCompany && preview.recipientName !== preview.recipientCompany ? (
          <p className="text-[#78716C]">{preview.recipientName}</p>
        ) : null}
        {preview.recipientAddress && <p className="text-[#78716C]">{preview.recipientAddress}</p>}
        {preview.recipientEmail && <p className="text-[#78716C]">{preview.recipientEmail}</p>}
        {preview.recipientPhone && <p className="text-[#78716C]">{preview.recipientPhone}</p>}
        {preview.recipientTrn && formatTrnDisplay(preview.recipientTrn) && (
          <p className="text-[#78716C]">{formatTrnDisplay(preview.recipientTrn)}</p>
        )}
      </div>

      {/* Dates row */}
      <div className="mt-4 flex flex-wrap gap-6 text-sm">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-[#6b6359]">
            {preview.issueDateLabel || bilingualLabel("Invoice date", "تاريخ الفاتورة")}
          </p>
          <p className="mt-1 font-medium tabular-nums text-foreground">{formatDateDisplay(preview.issueDate)}</p>
        </div>
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-[#6b6359]">
            {preview.dueDateLabel || bilingualLabel("Due date", "تاريخ الاستحقاق")}
          </p>
          <p className="mt-1 font-medium tabular-nums text-foreground">{formatDateDisplay(preview.dueDate)}</p>
        </div>
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-[#6b6359]">
            {bilingualLabel("Amount due", "المبلغ المستحق")}
          </p>
          <p className="mt-1 font-semibold tabular-nums" style={{ color: accentTextColor(preview.accentColor) }} dir="ltr">
            {totals.totalLabel}
          </p>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════ Line Item Variants ═══════════════════════════ */

/** Bilingual two-column line items (unchanged) */
function BilingualLineItems({
  preview,
  template,
  px,
}: {
  preview: InvoicePreviewData;
  template: DocumentTemplateConfig;
  px: string;
}) {
  return (
    <div className={px}>
      <div className={cn("grid grid-cols-1 md:grid-cols-2 gap-x-8 border-b border-t border-black/8 py-3", template.tableHeadClassName)}>
        <div className="text-[11px] font-medium uppercase tracking-[0.16em]">Description</div>
        <div dir="rtl" className="text-[11px] font-medium uppercase tracking-[0.16em] hidden md:block">الوصف</div>
      </div>
      {preview.lineItems.map((item, i) => (
        <div key={item.id} className="grid grid-cols-1 md:grid-cols-2 gap-x-8 border-b border-black/5 py-4">
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-sm tabular-nums text-[#6b6359]">{i + 1}.</span>
              <span className="whitespace-pre-wrap text-sm font-medium text-foreground">{item.description}</span>
            </div>
            <div className="mt-1 flex gap-4 text-sm tabular-nums text-[#78716C]">
              <span>Qty: {item.quantity}</span>
              <span dir="ltr">{formatCurrency(item.unitPrice, preview.currency)}</span>
              <span className="font-medium text-foreground" dir="ltr">{formatCurrency(item.unitPrice * item.quantity, preview.currency)}</span>
            </div>
            {item.durationValue && item.durationUnit && (
              <span className="mt-0.5 block text-xs text-[#6b6359]">
                {formatDuration(item.durationValue, item.durationUnit)}
              </span>
            )}
          </div>
          <div dir="rtl" lang="ar" className="mt-2 md:mt-0">
            <span className="text-sm font-medium text-foreground">{getArabicDescription(item)}</span>
            {item.notes ? <span className="mt-0.5 block whitespace-pre-wrap text-xs text-[#6b6359]">{item.notes}</span> : null}
          </div>
        </div>
      ))}
    </div>
  );
}

/** Card-style line items */
function CardLineItems({
  preview,
  template,
  isArabicOnly,
  px,
}: {
  preview: InvoicePreviewData;
  template: DocumentTemplateConfig;
  isArabicOnly: boolean;
  px: string;
}) {
  return (
    <div className={cn(px, "py-4 space-y-2")}>
      {preview.lineItems.map((item, i) => (
        <div key={item.id} className="rounded-[0.8rem] border border-black/7 px-4 py-3">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline gap-2">
                <span className="text-xs tabular-nums text-[#6b6359]">{i + 1}.</span>
                <span className="whitespace-pre-wrap text-sm font-medium text-foreground">
                  {isArabicOnly ? getArabicDescription(item) : item.description}
                </span>
              </div>
              {item.notes ? <p className="mt-1 text-xs text-[#6b6359] whitespace-pre-wrap">{item.notes}</p> : null}
            </div>
            <div className="shrink-0 text-right text-sm tabular-nums">
              <p className="font-medium text-foreground" dir="ltr">{formatCurrency(item.unitPrice * item.quantity, preview.currency)}</p>
              <p className="text-xs text-[#78716C]" dir="ltr">
                {item.quantity} × {formatCurrency(item.unitPrice, preview.currency)}
              </p>
              {item.durationValue && item.durationUnit && (
                <p className="text-xs text-[#6b6359]">{formatDuration(item.durationValue, item.durationUnit)}</p>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/** Table-style line items (default) */
function TableLineItems({
  preview,
  template,
  isArabicOnly,
  showDurationColumn,
  px,
  bilingualLabel,
}: {
  preview: InvoicePreviewData;
  template: DocumentTemplateConfig;
  isArabicOnly: boolean;
  showDurationColumn: boolean;
  px: string;
  bilingualLabel: (en: string, ar: string) => string;
}) {
  return (
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
              <td className="py-4 pr-2 text-sm tabular-nums text-[#6b6359]">{i + 1}</td>
              <td className="py-4 pr-4 text-sm text-foreground">
                <span className="whitespace-pre-wrap font-medium">{isArabicOnly ? getArabicDescription(item) : item.description}</span>
                {item.notes ? <span className="mt-0.5 block whitespace-pre-wrap text-xs text-[#6b6359]">{item.notes}</span> : null}
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
  );
}

/* ═══════════════════════════ Totals ═══════════════════════════ */

function RowTotals({
  preview,
  template,
  totals,
  isRtl,
  isBilingual,
  px,
  py,
  bilingualLabel,
}: {
  preview: InvoicePreviewData;
  template: DocumentTemplateConfig;
  totals: ReturnType<typeof getInvoiceTotals>;
  isRtl: boolean;
  isBilingual: boolean;
  px: string;
  py: string;
  bilingualLabel: (en: string, ar: string) => string;
}) {
  return (
    <div className={cn("flex", isRtl || isBilingual ? "justify-start" : "justify-end")}>
      <div className={cn("w-full max-w-[280px]", px, py, template.totalsSurfaceClassName)}>
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
          <div className={cn("flex justify-between border-t pt-3 text-base font-semibold", template.totalsDividerClassName)}>
            <span>{bilingualLabel("Total", "الإجمالي")}</span>
            <span className="tabular-nums" dir="ltr" style={{ color: accentTextColor(preview.accentColor) }}>{totals.totalLabel}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════ Footer Variants ═══════════════════════════ */

/** Stacked footer — terms, then notes */
function StackedFooter({
  preview,
  template,
  px,
  py,
  bilingualLabel,
}: {
  preview: InvoicePreviewData;
  template: DocumentTemplateConfig;
  px: string;
  py: string;
  bilingualLabel: (en: string, ar: string) => string;
}) {
  if (!preview.terms && !preview.notes) return null;
  return (
    <div className={cn("border-t border-black/5", px, py, template.footerSurfaceClassName)}>
      <div className="grid gap-6 sm:grid-cols-2">
        {preview.terms ? (
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-[#6b6359]">{bilingualLabel("Terms", "الشروط والأحكام")}</p>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-[#78716C]">{preview.terms}</p>
          </div>
        ) : null}
        {preview.notes ? (
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-[#6b6359]">{bilingualLabel("Notes", "ملاحظات")}</p>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-[#78716C]">{preview.notes}</p>
          </div>
        ) : null}
      </div>
    </div>
  );
}

/** Side-by-side footer — Bank details left | Terms right (Minimal) */
function SideBySideFooter({
  preview,
  template,
  bankFields,
  px,
  py,
  bilingualLabel,
}: {
  preview: InvoicePreviewData;
  template: DocumentTemplateConfig;
  bankFields: { label: string; value: string }[];
  px: string;
  py: string;
  bilingualLabel: (en: string, ar: string) => string;
}) {
  const hasBankDetails = bankFields.length > 0;
  const hasTerms = Boolean(preview.terms);
  const hasNotes = Boolean(preview.notes);
  if (!hasBankDetails && !hasTerms && !hasNotes) return null;

  return (
    <div className={cn("border-t border-black/5", px, py, template.footerSurfaceClassName)}>
      {/* Bank details — horizontal row */}
      {hasBankDetails ? (
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-[#6b6359]">{bilingualLabel("Bank Details", "تفاصيل البنك")}</p>
          <div className="mt-3 flex flex-wrap gap-x-6 gap-y-3">
            {bankFields.map((f, i) => (
              <div key={i}>
                <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-[#6b6359]">{f.label}</p>
                <p className="mt-0.5 text-sm font-medium text-foreground">{f.value}</p>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {/* Terms & Notes — side by side */}
      {hasTerms || hasNotes ? (
        <div className={cn("grid gap-6 sm:grid-cols-2", hasBankDetails && "mt-6")}>
          {hasTerms ? (
            <div>
              <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-[#6b6359]">{bilingualLabel("Terms", "الشروط والأحكام")}</p>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-[#78716C]">{preview.terms}</p>
            </div>
          ) : null}
          {hasNotes ? (
            <div>
              <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-[#6b6359]">{bilingualLabel("Notes", "ملاحظات")}</p>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-[#78716C]">{preview.notes}</p>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

/* ═══════════════════════════ Helpers ═══════════════════════════ */

/**
 * Guard a user accent color for use as TEXT on the white/near-white document
 * background. Light accents (yellow, lime, pale pastels) fall below WCAG
 * contrast and become unreadable — especially once flattened into a customer
 * PDF. Compute the sRGB relative luminance; if the color is too light, mix it
 * toward black so text stays legible. Decorative fills/lines should keep the
 * raw accent and NOT use this. Dependency-free.
 */
function accentTextColor(hex?: string): string | undefined {
  if (!hex) return undefined;
  const m = /^#?([0-9a-fA-F]{6})$/.exec(hex.trim());
  if (!m) return hex; // non-6-digit-hex (rgb(), var(), named) — leave untouched
  const int = parseInt(m[1], 16);
  const r = (int >> 16) & 255;
  const g = (int >> 8) & 255;
  const b = int & 255;
  const lin = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  const lum = 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
  if (lum <= 0.65) return hex; // dark enough for white bg — use as-is
  // Too light: darken by mixing toward black (55%) to recover contrast.
  const mix = 0.55;
  const dr = Math.round(r * (1 - mix));
  const dg = Math.round(g * (1 - mix));
  const db = Math.round(b * (1 - mix));
  return `#${((1 << 24) | (dr << 16) | (dg << 8) | db).toString(16).slice(1)}`;
}

function formatDuration(value: number, unit: string): string {
  const label = unit.charAt(0).toUpperCase() + unit.slice(1);
  const singular = label.endsWith("s") ? label.slice(0, -1) : label;
  return `${value} ${value === 1 ? singular : label}`;
}
