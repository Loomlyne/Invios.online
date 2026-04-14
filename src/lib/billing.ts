import { z } from "zod";

export const clientStatuses = ["lead", "in_review", "approved", "active", "rejected", "canceled"] as const;
export const invoiceStatuses = [
  "draft",
  "sent",
  "partial_paid",
  "paid",
  "overpaid",
  "overdue",
] as const;
export const quotationStatuses = [
  "draft",
  "sent",
  "accepted",
  "rejected",
  "expired",
] as const;
export const documentLanguages = ["en", "ar", "bilingual"] as const;
export const invoiceTypes = ["invoice", "tax_invoice"] as const;
export const documentKinds = ["invoice", "quotation"] as const;
export const dashboardMetricKeys = [
  "total-billed",
  "collected",
  "outstanding",
  "collection-rate",
] as const;
export const dashboardRangeKeys = ["all", "30d", "90d", "12m"] as const;

export const documentLineItemSchema = z.object({
  id: z.string().min(1),
  description: z.string().min(1, "Add a line item description."),
  notes: z.string().default(""),
  arabicDescription: z.string().default(""),
  quantity: z.coerce.number().positive("Quantity must be greater than zero."),
  unitPrice: z.coerce.number().min(0, "Unit price cannot be negative."),
  total: z.coerce.number().min(0, "Line item total cannot be negative."),
  durationValue: z.coerce.number().positive().optional(),
  durationUnit: z.enum(["hours", "days", "weeks", "months"]).optional(),
});

export const clientFormSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(2, "Client name is required."),
  company: z.string().default(""),
  email: z.union([z.literal(""), z.string().email("Enter a valid client email.")]).default(""),
  phone: z.string().default(""),
  address: z.string().default(""),
  status: z.enum(clientStatuses),
  trn: z.string().default(""),
  taxCode: z.string().default(""),
  logoPath: z.string().nullable().optional(),
});

const documentBaseFormSchema = z.object({
  id: z.string().uuid().optional(),
  clientId: z.string().uuid("Choose a client."),
  currency: z.string().min(3).default("AED"),
  taxRate: z.coerce.number().min(0).max(100).default(0),
  discount: z.coerce.number().min(0).max(100).default(0),
  notes: z.string().default(""),
  terms: z.string().default(""),
  language: z.enum(documentLanguages).default("en"),
  trn: z.string().default(""),
  lineItems: z.array(documentLineItemSchema).min(1, "Add at least one line item."),
});

export const invoiceFormSchema = documentBaseFormSchema.extend({
  issueDate: z.string().min(1, "Issue date is required."),
  dueDate: z.string().min(1, "Due date is required."),
  status: z.enum(invoiceStatuses).default("draft"),
  invoiceType: z.enum(invoiceTypes).default("invoice"),
});

export const quotationFormSchema = documentBaseFormSchema.extend({
  quotationDate: z.string().min(1, "Quotation date is required."),
  expiryDate: z.string().min(1, "Expiry date is required."),
  status: z.enum(quotationStatuses).default("draft"),
  validityDays: z.coerce.number().int().positive().default(30),
});

export type ClientStatus = (typeof clientStatuses)[number];
export type InvoiceStatus = (typeof invoiceStatuses)[number];
export type QuotationStatus = (typeof quotationStatuses)[number];
export type DocumentLanguage = (typeof documentLanguages)[number];
export type InvoiceType = (typeof invoiceTypes)[number];
export type DocumentKind = (typeof documentKinds)[number];
export type DashboardMetricKey = (typeof dashboardMetricKeys)[number];
export type DashboardRangeKey = (typeof dashboardRangeKeys)[number];

export type DocumentLineItem = z.infer<typeof documentLineItemSchema>;
export type ClientFormInput = z.infer<typeof clientFormSchema>;
export type InvoiceFormInput = z.infer<typeof invoiceFormSchema>;
export type QuotationFormInput = z.infer<typeof quotationFormSchema>;

export interface ClientRecord {
  id: string;
  userId: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  address: string;
  status: ClientStatus;
  slug: string;
  trn: string;
  taxCode: string;
  portalToken: string;
  logoPath: string | null;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DocumentTotals {
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  total: number;
}

export interface DocumentRecordBase extends DocumentTotals {
  id: string;
  userId: string;
  clientId: string;
  client: Pick<ClientRecord, "id" | "name" | "company" | "email" | "phone" | "address" | "slug" | "trn">;
  slug: string;
  currency: string;
  taxRate: number;
  discount: number;
  notes: string;
  terms: string;
  language: DocumentLanguage;
  lineItems: DocumentLineItem[];
  shareToken: string;
  createdAt: string;
  updatedAt: string;
}

export interface InvoiceRecord extends DocumentRecordBase {
  invoiceNumber: string;
  status: InvoiceStatus;
  invoiceType: InvoiceType;
  issueDate: string;
  dueDate: string;
  trn: string;
  pdfUrl: string | null;
}

export interface QuotationRecord extends DocumentRecordBase {
  quotationNumber: string;
  status: QuotationStatus;
  quotationDate: string;
  expiryDate: string;
  validityDays: number;
  convertedToInvoiceId: string | null;
  conversionDate: string | null;
  sentDate: string | null;
  acceptedDate: string | null;
  rejectedDate: string | null;
  rejectionReason: string;
}

// --- Phase 3: Payments & Expenses ---

export const paymentMethods = ["cash", "bank_transfer", "cheque", "other"] as const;
export type PaymentMethod = (typeof paymentMethods)[number];

export const paymentMethodLabels = {
  cash: "Cash",
  bank_transfer: "Bank transfer",
  cheque: "Cheque",
  other: "Other",
};

export function formatPaymentMethod(method: PaymentMethod): string {
  return paymentMethodLabels[method];
}

export function normalizePaymentMethodInput(value: unknown): PaymentMethod {
  if (typeof value !== "string") return "other";

  const normalized = value.trim().toLowerCase().replace(/[\s-]+/g, "_");
  if (!normalized) return "other";
  if (normalized in paymentMethodLabels) return normalized as PaymentMethod;
  if (normalized.includes("cash")) return "cash";
  if (normalized.includes("transfer")) return "bank_transfer";
  if (normalized.includes("cheque") || normalized.includes("check")) return "cheque";
  if (normalized.includes("other")) return "other";

  return "other";
}

export const paymentFormSchema = z.object({
  invoiceId: z.string().uuid(),
  datePaid: z.string().min(1, "Enter a date."),
  amount: z.coerce.number().positive("Enter a valid amount."),
  method: z.enum(paymentMethods).default("other"),
  description: z.string().max(160, "Keep the description under 160 characters.").trim().default(""),
});

export const expenseFormSchema = z.object({
  invoiceId: z.string().uuid(),
  date: z.string().min(1, "Enter a date."),
  amount: z.coerce.number().positive("Enter a valid amount."),
  description: z.string().min(1, "Enter a description."),
  vendor: z.string().default(""),
});

export type PaymentFormInput = z.infer<typeof paymentFormSchema>;
export type ExpenseFormInput = z.infer<typeof expenseFormSchema>;

// --- Phase 5: Automation & Recovery ---

/** Max version snapshots kept per invoice. Rolling cap enforced in snapshotInvoiceVersion. */
export const MAX_VERSIONS = 10;

/** Snapshot shape stored in invoice_versions.snapshot JSONB. */
export interface InvoiceSnapshot {
  invoice_number: string;
  client_id: string;
  client_name: string;
  issue_date: string;
  due_date: string;
  currency: string;
  tax_rate: number;
  discount: number;
  subtotal: number;
  discount_amount: number;
  tax_amount: number;
  total: number;
  line_items: unknown[];
  notes: string;
  terms: string;
  language: string;
  trn: string;
  invoice_type: string;
}

export interface PaymentRecord {
  id: string;
  invoiceId: string;
  userId: string;
  amount: number;
  datePaid: string;
  method: PaymentMethod;
  description: string;
  createdAt: string;
}

export interface ExpenseRecord {
  id: string;
  invoiceId: string;
  userId: string;
  amount: number;
  date: string;
  description: string;
  vendor: string;
  createdAt: string;
}
