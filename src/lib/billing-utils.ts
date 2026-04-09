import type {
  DocumentKind,
  DocumentLineItem,
  DocumentTotals,
  InvoiceFormInput,
  InvoiceStatus,
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

// ---------------------------------------------------------------------------
// Phase 3: Payment status, profit, and collection rate computation
// ---------------------------------------------------------------------------

/**
 * Compute the payment status for a single invoice.
 * Called after every payment mutation AND on data load.
 *
 * Rules:
 * - paid: collected >= total (and total > 0)
 * - partial_paid: 0 < collected < total, not past due
 * - overdue: (unpaid or partial_paid) AND due_date < today
 * - Drafts never become overdue
 * - Paid invoices are never overdue
 */
export function computePaymentStatus(params: {
  currentStatus: InvoiceStatus;
  total: number;
  collected: number;
  dueDate: string; // "YYYY-MM-DD"
  today: string;   // "YYYY-MM-DD" — injected for testability
}): InvoiceStatus {
  const { currentStatus, total, collected, dueDate, today } = params;

  // Fully or over-paid invoices are never overdue
  if (collected > total && total > 0) {
    return "overpaid";
  }
  if (collected === total && total > 0) {
    return "paid";
  }

  // Drafts never transition automatically
  if (currentStatus === "draft") {
    return "draft";
  }

  const isPastDue = dueDate < today;

  if (collected > 0) {
    return isPastDue ? "overdue" : "partial_paid";
  }

  // No payments yet
  return isPastDue ? "overdue" : currentStatus;
}

/**
 * Compute profit and margin for a single invoice.
 * Profit = invoice total - sum of direct expenses (NOT payments).
 * Margin = (profit / total) * 100, rounded to nearest integer.
 */
export function computeProfit(params: {
  total: number;
  expensesTotal: number;
}): { profit: number; margin: number } {
  const { total, expensesTotal } = params;
  const profit = total - expensesTotal;
  const margin = total > 0 ? Math.round((profit / total) * 100) : 0;
  return { profit, margin };
}

/**
 * Compute collection rate across all invoices.
 * Returns integer percentage or null when totalBilled is 0 (display as "—").
 */
export function computeCollectionRate(params: {
  totalBilled: number;
  totalCollected: number;
}): number | null {
  const { totalBilled, totalCollected } = params;
  if (totalBilled === 0) return null;
  return Math.round((totalCollected / totalBilled) * 100);
}
