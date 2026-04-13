import type { InvoiceRecord, QuotationRecord } from "@/lib/billing";
import { buildInvoicePreviewData } from "@/lib/preview";
import type { AppUserState, InvoicePreviewData } from "@/lib/types";

export function buildInvoicePreviewFromRecord(
  context: { userState: AppUserState; logoUrl?: string | null; signatureUrl?: string | null },
  invoice: InvoiceRecord,
): InvoicePreviewData {
  return buildInvoicePreviewData(context.userState, {
    kind: "invoice",
    title: "Invoice",
    invoiceNumber: invoice.invoiceNumber,
    numberLabel: "Invoice no.",
    statusLabel: labelStatus(invoice.status),
    issueDate: invoice.issueDate,
    dueDate: invoice.dueDate,
    issueDateLabel: "Issue date",
    dueDateLabel: "Due date",
    recipientName: invoice.client.name,
    recipientCompany: invoice.client.company,
    recipientEmail: invoice.client.email,
    recipientPhone: invoice.client.phone,
    recipientAddress: invoice.client.address,
    currency: invoice.currency,
    language: invoice.language,
    taxRate: invoice.taxRate,
    discount: invoice.discount,
    notes: invoice.notes,
    terms: invoice.terms,
    trn: invoice.trn,
    lineItems: invoice.lineItems,
    logoUrl: context.logoUrl ?? null,
    signatureUrl: context.signatureUrl ?? null,
  });
}

export function buildQuotationPreviewFromRecord(
  context: { userState: AppUserState; logoUrl?: string | null; signatureUrl?: string | null },
  quotation: QuotationRecord,
): InvoicePreviewData {
  return buildInvoicePreviewData(context.userState, {
    kind: "quotation",
    title: "Quotation",
    invoiceNumber: quotation.quotationNumber,
    numberLabel: "Quotation no.",
    statusLabel: labelStatus(quotation.status),
    issueDate: quotation.quotationDate,
    dueDate: quotation.expiryDate,
    issueDateLabel: "Quotation date",
    dueDateLabel: "Expiry date",
    recipientName: quotation.client.name,
    recipientCompany: quotation.client.company,
    recipientEmail: quotation.client.email,
    recipientPhone: quotation.client.phone,
    recipientAddress: quotation.client.address,
    currency: quotation.currency,
    language: quotation.language,
    taxRate: quotation.taxRate,
    discount: quotation.discount,
    notes: quotation.notes,
    terms: quotation.terms,
    lineItems: quotation.lineItems,
    logoUrl: context.logoUrl ?? null,
    signatureUrl: context.signatureUrl ?? null,
  });
}

function labelStatus(status: string) {
  return status
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
