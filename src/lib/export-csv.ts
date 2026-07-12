import { NextResponse } from "next/server";
import type {
  ClientRecord,
  ExpenseRecord,
  InvoiceRecord,
  PaymentRecord,
  QuotationRecord,
} from "@/lib/billing";
import type {
  DashboardActivityItem,
  DashboardAnalytics,
  DashboardClientInsight,
  DashboardInvoiceRow,
  DashboardMetrics,
  DashboardQuotationRow,
} from "@/lib/dashboard";

export type CsvCell = string | number | null | undefined;
export type CsvRow = CsvCell[];

function escapeCell(value: CsvCell): string {
  if (value === null || value === undefined) return "";
  let str = String(value);
  // D-5: Neutralize CSV/spreadsheet formula injection. A cell whose first char
  // is = + - or @ is interpreted as a formula by Excel/Sheets, so prefix a single
  // quote BEFORE quote-escaping. Only string inputs are user-controlled; numeric
  // columns arrive as `number` (or numeric strings from `.toFixed()`), so a
  // legitimate negative amount like "-12.00" is excluded and left intact.
  if (
    typeof value === "string" &&
    /^[=+\-@]/.test(str) &&
    !/^[+-]?\d/.test(str)
  ) {
    str = `'${str}`;
  }
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function rowsToCsv(rows: CsvRow[]): string {
  return rows.map((row) => row.map(escapeCell).join(",")).join("\r\n");
}

export function csvResponse(csv: string, filename: string): NextResponse {
  // Prepend UTF-8 BOM so Excel detects the encoding correctly.
  const body = `﻿${csv}`;
  return new NextResponse(body, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}

export function timestampSuffix(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}`;
}

function lineItemSummary(items: { description: string; quantity: number; unitPrice: number; total: number }[]): string {
  return items
    .map((it) => `${it.description} (qty ${it.quantity} @ ${it.unitPrice} = ${it.total})`)
    .join(" | ");
}

// ---------------------------------------------------------------------------
// Clients export
// ---------------------------------------------------------------------------

export interface ClientExportRow {
  client: ClientRecord;
  invoiceCount: number;
  billedTotal: number;
  collectedTotal: number;
  outstandingTotal: number;
  quotationCount: number;
  acceptedQuotations: number;
}

export function buildClientsCsv(rows: ClientExportRow[]): string {
  const header: CsvRow = [
    "Name",
    "Company",
    "Email",
    "Phone",
    "Address",
    "Status",
    "TRN",
    "Tax code",
    "Invoices",
    "Billed total",
    "Collected total",
    "Outstanding total",
    "Quotations",
    "Accepted quotations",
    "Created at",
    "Updated at",
  ];

  const body: CsvRow[] = rows.map(({ client, invoiceCount, billedTotal, collectedTotal, outstandingTotal, quotationCount, acceptedQuotations }) => [
    client.name,
    client.company,
    client.email,
    client.phone,
    client.address.replace(/\r?\n/g, ", "),
    client.status,
    client.trn,
    client.taxCode,
    invoiceCount,
    billedTotal.toFixed(2),
    collectedTotal.toFixed(2),
    outstandingTotal.toFixed(2),
    quotationCount,
    acceptedQuotations,
    client.createdAt,
    client.updatedAt,
  ]);

  return rowsToCsv([header, ...body]);
}

// ---------------------------------------------------------------------------
// Invoices export
// ---------------------------------------------------------------------------

export interface InvoiceExportRow {
  invoice: InvoiceRecord;
  collectedAmount: number;
  outstandingAmount: number;
  expenseAmount: number;
  profitAmount: number;
}

export function buildInvoicesCsv(rows: InvoiceExportRow[]): string {
  const header: CsvRow = [
    "Invoice number",
    "Status",
    "Type",
    "Issue date",
    "Due date",
    "Client name",
    "Client company",
    "Client email",
    "Client phone",
    "Client TRN",
    "Currency",
    "Subtotal",
    "Discount %",
    "Discount amount",
    "Tax rate %",
    "Tax amount",
    "Total",
    "Collected",
    "Outstanding",
    "Expenses",
    "Profit",
    "Line items",
    "Notes",
    "Terms",
    "Language",
    "Created at",
    "Updated at",
  ];

  const body: CsvRow[] = rows.map(({ invoice, collectedAmount, outstandingAmount, expenseAmount, profitAmount }) => [
    invoice.invoiceNumber,
    invoice.status,
    invoice.invoiceType,
    invoice.issueDate,
    invoice.dueDate,
    invoice.client.name,
    invoice.client.company,
    invoice.client.email,
    invoice.client.phone,
    invoice.client.trn,
    invoice.currency,
    invoice.subtotal.toFixed(2),
    invoice.discount,
    invoice.discountAmount.toFixed(2),
    invoice.taxRate,
    invoice.taxAmount.toFixed(2),
    invoice.total.toFixed(2),
    collectedAmount.toFixed(2),
    outstandingAmount.toFixed(2),
    expenseAmount.toFixed(2),
    profitAmount.toFixed(2),
    lineItemSummary(invoice.lineItems),
    invoice.notes.replace(/\r?\n/g, " "),
    invoice.terms.replace(/\r?\n/g, " "),
    invoice.language,
    invoice.createdAt,
    invoice.updatedAt,
  ]);

  return rowsToCsv([header, ...body]);
}

// ---------------------------------------------------------------------------
// Quotations export
// ---------------------------------------------------------------------------

export function buildQuotationsCsv(quotations: QuotationRecord[]): string {
  const header: CsvRow = [
    "Quotation number",
    "Status",
    "Quotation date",
    "Expiry date",
    "Validity days",
    "Client name",
    "Client company",
    "Client email",
    "Client phone",
    "Client TRN",
    "Currency",
    "Subtotal",
    "Discount %",
    "Discount amount",
    "Tax rate %",
    "Tax amount",
    "Total",
    "Line items",
    "Notes",
    "Terms",
    "Language",
    "Sent date",
    "Accepted date",
    "Rejected date",
    "Rejection reason",
    "Converted to invoice ID",
    "Conversion date",
    "Created at",
    "Updated at",
  ];

  const body: CsvRow[] = quotations.map((q) => [
    q.quotationNumber,
    q.status,
    q.quotationDate,
    q.expiryDate,
    q.validityDays,
    q.client.name,
    q.client.company,
    q.client.email,
    q.client.phone,
    q.client.trn,
    q.currency,
    q.subtotal.toFixed(2),
    q.discount,
    q.discountAmount.toFixed(2),
    q.taxRate,
    q.taxAmount.toFixed(2),
    q.total.toFixed(2),
    lineItemSummary(q.lineItems),
    q.notes.replace(/\r?\n/g, " "),
    q.terms.replace(/\r?\n/g, " "),
    q.language,
    q.sentDate ?? "",
    q.acceptedDate ?? "",
    q.rejectedDate ?? "",
    q.rejectionReason,
    q.convertedToInvoiceId ?? "",
    q.conversionDate ?? "",
    q.createdAt,
    q.updatedAt,
  ]);

  return rowsToCsv([header, ...body]);
}

// ---------------------------------------------------------------------------
// Dashboard export
// ---------------------------------------------------------------------------

export interface DashboardExportPayload {
  rangeLabel: string;
  currency: string;
  metrics: DashboardMetrics;
  analytics: DashboardAnalytics;
  invoiceRows: DashboardInvoiceRow[];
  topClients: DashboardClientInsight[];
  followUpQueue: DashboardInvoiceRow[];
  pendingQuotations: DashboardQuotationRow[];
  recentActivity: DashboardActivityItem[];
  payments: PaymentRecord[];
  expenses: ExpenseRecord[];
}

function sectionTitle(title: string): CsvRow[] {
  return [[], [title]];
}

export function buildDashboardCsv(payload: DashboardExportPayload): string {
  const rows: CsvRow[] = [];

  rows.push(["Invios — Dashboard report"]);
  rows.push(["Generated", new Date().toISOString()]);
  rows.push(["Range", payload.rangeLabel]);
  rows.push(["Currency", payload.currency]);

  // KPI metrics
  rows.push(...sectionTitle("Key metrics"));
  rows.push(["Metric", "Value"]);
  rows.push(["Total billed", payload.metrics.totalBilled.toFixed(2)]);
  rows.push(["Total collected", payload.metrics.totalCollected.toFixed(2)]);
  rows.push(["Outstanding", payload.metrics.outstanding.toFixed(2)]);
  rows.push(["Collection rate %", payload.metrics.collectionRate ?? ""]);
  rows.push(["Total expenses", payload.analytics.totalExpenses.toFixed(2)]);
  rows.push(["Net profit", payload.analytics.netProfit.toFixed(2)]);
  rows.push(["Average invoice", payload.analytics.averageInvoice.toFixed(2)]);

  // Top clients
  rows.push(...sectionTitle("Top clients"));
  rows.push(["Client", "Company", "Invoices", "Billed", "Collected", "Outstanding"]);
  for (const c of payload.topClients) {
    rows.push([
      c.clientName,
      c.company,
      c.invoiceCount,
      c.billedTotal.toFixed(2),
      c.collectedTotal.toFixed(2),
      c.outstandingTotal.toFixed(2),
    ]);
  }

  // Invoices breakdown
  rows.push(...sectionTitle("Invoices"));
  rows.push([
    "Invoice",
    "Client",
    "Status",
    "Issued",
    "Due",
    "Currency",
    "Billed",
    "Collected",
    "Outstanding",
    "Expenses",
    "Profit",
  ]);
  for (const r of payload.invoiceRows) {
    rows.push([
      r.invoiceNumber,
      r.client.name,
      r.status,
      r.issueDate,
      r.dueDate,
      r.currency,
      r.total.toFixed(2),
      r.collectedAmount.toFixed(2),
      r.outstandingAmount.toFixed(2),
      r.expenseAmount.toFixed(2),
      r.profitAmount.toFixed(2),
    ]);
  }

  // Follow-up queue
  rows.push(...sectionTitle("Follow-up queue (open invoices)"));
  rows.push(["Invoice", "Client", "Status", "Due", "Outstanding"]);
  for (const r of payload.followUpQueue) {
    rows.push([
      r.invoiceNumber,
      r.client.name,
      r.status,
      r.dueDate,
      r.outstandingAmount.toFixed(2),
    ]);
  }

  // Pending quotations
  rows.push(...sectionTitle("Pending quotations"));
  rows.push(["Quotation", "Client", "Status", "Expires", "Total"]);
  for (const q of payload.pendingQuotations) {
    rows.push([
      q.quotationNumber,
      q.client.name,
      q.status,
      q.expiryDate,
      q.total.toFixed(2),
    ]);
  }

  // Payments
  rows.push(...sectionTitle("Payments"));
  rows.push(["Date", "Invoice ID", "Method", "Amount", "Description"]);
  for (const p of payload.payments) {
    rows.push([
      p.datePaid,
      p.invoiceId,
      p.method,
      p.amount.toFixed(2),
      p.description.replace(/\r?\n/g, " "),
    ]);
  }

  // Expenses
  rows.push(...sectionTitle("Expenses"));
  rows.push(["Date", "Invoice ID", "Vendor", "Amount", "Description"]);
  for (const e of payload.expenses) {
    rows.push([
      e.date,
      e.invoiceId,
      e.vendor,
      e.amount.toFixed(2),
      e.description.replace(/\r?\n/g, " "),
    ]);
  }

  // Recent activity
  rows.push(...sectionTitle("Recent activity"));
  rows.push(["Kind", "Date", "Title", "Subtitle", "Amount", "Currency"]);
  for (const a of payload.recentActivity) {
    rows.push([
      a.kind,
      a.date,
      a.title,
      a.subtitle,
      a.amount !== undefined ? a.amount.toFixed(2) : "",
      a.currency ?? "",
    ]);
  }

  return rowsToCsv(rows);
}
