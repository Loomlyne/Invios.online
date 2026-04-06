import type {
  DocumentKind,
  DocumentLineItem,
  DocumentTotals,
  InvoiceFormInput,
  QuotationFormInput,
} from "@/lib/billing";
import { toSlug } from "@/lib/utils";

export function createLineItem(partial?: Partial<DocumentLineItem>): DocumentLineItem {
  const quantity = partial?.quantity ?? 1;
  const unitPrice = partial?.unitPrice ?? 0;

  return {
    id: partial?.id ?? globalThis.crypto.randomUUID(),
    description: partial?.description ?? "",
    notes: partial?.notes ?? "",
    arabicDescription: partial?.arabicDescription ?? "",
    quantity,
    unitPrice,
    total: partial?.total ?? roundCurrency(quantity * unitPrice),
  };
}

export function computeDocumentTotals(
  lineItems: DocumentLineItem[],
  taxRate: number,
  discount: number,
): DocumentTotals {
  const subtotal = roundCurrency(
    lineItems.reduce((sum, item) => sum + roundCurrency(item.quantity * item.unitPrice), 0),
  );
  const discountAmount = roundCurrency(subtotal * (discount / 100));
  const taxableBase = Math.max(subtotal - discountAmount, 0);
  const taxAmount = roundCurrency(taxableBase * (taxRate / 100));
  const total = roundCurrency(taxableBase + taxAmount);

  return {
    subtotal,
    discountAmount,
    taxAmount,
    total,
  };
}

export function normalizeLineItems(lineItems: DocumentLineItem[]) {
  return lineItems.map((item) => ({
    ...item,
    total: roundCurrency(item.quantity * item.unitPrice),
  }));
}

export function createShareToken() {
  const bytes = new Uint8Array(18);
  globalThis.crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export function buildUniqueSlug(baseValue: string, takenSlugs: string[]) {
  const baseSlug = toSlug(baseValue) || "document";
  const lookup = new Set(takenSlugs.filter(Boolean));

  if (!lookup.has(baseSlug)) {
    return baseSlug;
  }

  let suffix = 2;
  while (lookup.has(`${baseSlug}-${suffix}`)) {
    suffix += 1;
  }

  return `${baseSlug}-${suffix}`;
}

export function formatDocumentNumber(prefix: string, value: number) {
  const safePrefix = prefix.trim().replace(/-+$/g, "").toUpperCase() || "DOC";
  return `${safePrefix}-${String(value).padStart(4, "0")}`;
}

export function mapQuotationToInvoiceInput(
  quotation: QuotationFormInput,
): InvoiceFormInput {
  return {
    clientId: quotation.clientId,
    issueDate: quotation.quotationDate,
    dueDate: quotation.expiryDate,
    currency: quotation.currency,
    taxRate: quotation.taxRate,
    discount: quotation.discount,
    notes: quotation.notes,
    terms: quotation.terms,
    language: quotation.language,
    trn: quotation.trn,
    lineItems: normalizeLineItems(quotation.lineItems),
    status: "draft",
    invoiceType: "invoice",
  };
}

export function getDocumentLabel(kind: DocumentKind) {
  return kind === "invoice" ? "Invoice" : "Quotation";
}

export function roundCurrency(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}
