import { describe, expect, it } from "vitest";
import type { ExpenseRecord, InvoiceRecord, PaymentRecord, QuotationRecord } from "@/lib/billing";
import {
  buildDashboardInsights,
  buildDashboardInvoiceRows,
  buildDashboardMetrics,
  selectDashboardDrilldownRows,
} from "@/lib/dashboard";

const invoices: InvoiceRecord[] = [
  {
    id: "invoice-1",
    userId: "user-1",
    clientId: "client-1",
    invoiceNumber: "INV-0001",
    slug: "inv-0001",
    status: "sent",
    invoiceType: "invoice",
    issueDate: "2026-04-04",
    dueDate: "2026-04-20",
    currency: "AED",
    taxRate: 5,
    discount: 0,
    subtotal: 1000,
    discountAmount: 0,
    taxAmount: 50,
    total: 1050,
    lineItems: [],
    notes: "",
    terms: "",
    language: "en",
    trn: "",
    shareToken: "share-1",
    pdfUrl: null,
    createdAt: "2026-04-04T10:00:00.000Z",
    updatedAt: "2026-04-04T10:00:00.000Z",
    client: {
      id: "client-1",
      name: "Acme",
      company: "Acme LLC",
      email: "hello@acme.com",
      phone: "",
      address: "",
      slug: "acme",
      trn: "",
    },
  },
  {
    id: "invoice-2",
    userId: "user-1",
    clientId: "client-2",
    invoiceNumber: "INV-0002",
    slug: "inv-0002",
    status: "partial_paid",
    invoiceType: "invoice",
    issueDate: "2026-03-18",
    dueDate: "2026-04-10",
    currency: "AED",
    taxRate: 5,
    discount: 0,
    subtotal: 2000,
    discountAmount: 0,
    taxAmount: 100,
    total: 2100,
    lineItems: [],
    notes: "",
    terms: "",
    language: "en",
    trn: "",
    shareToken: "share-2",
    pdfUrl: null,
    createdAt: "2026-03-18T10:00:00.000Z",
    updatedAt: "2026-03-18T10:00:00.000Z",
    client: {
      id: "client-2",
      name: "Bravo",
      company: "",
      email: "ops@bravo.com",
      phone: "",
      address: "",
      slug: "bravo",
      trn: "",
    },
  },
  {
    id: "invoice-3",
    userId: "user-1",
    clientId: "client-1",
    invoiceNumber: "INV-0003",
    slug: "inv-0003",
    status: "paid",
    invoiceType: "invoice",
    issueDate: "2026-02-10",
    dueDate: "2026-02-17",
    currency: "AED",
    taxRate: 5,
    discount: 0,
    subtotal: 500,
    discountAmount: 0,
    taxAmount: 25,
    total: 525,
    lineItems: [],
    notes: "",
    terms: "",
    language: "en",
    trn: "",
    shareToken: "share-3",
    pdfUrl: null,
    createdAt: "2026-02-10T10:00:00.000Z",
    updatedAt: "2026-02-10T10:00:00.000Z",
    client: {
      id: "client-1",
      name: "Acme",
      company: "Acme LLC",
      email: "hello@acme.com",
      phone: "",
      address: "",
      slug: "acme",
      trn: "",
    },
  },
];

const payments: PaymentRecord[] = [
  {
    id: "payment-1",
    invoiceId: "invoice-1",
    userId: "user-1",
    amount: 300,
    datePaid: "2026-04-07",
    method: "cash",
    description: "",
    createdAt: "2026-04-07T12:00:00.000Z",
  },
  {
    id: "payment-2",
    invoiceId: "invoice-2",
    userId: "user-1",
    amount: 1000,
    datePaid: "2026-04-02",
    method: "bank_transfer",
    description: "",
    createdAt: "2026-04-02T12:00:00.000Z",
  },
  {
    id: "payment-3",
    invoiceId: "invoice-3",
    userId: "user-1",
    amount: 525,
    datePaid: "2026-02-15",
    method: "cash",
    description: "",
    createdAt: "2026-02-15T12:00:00.000Z",
  },
];

const expenses: ExpenseRecord[] = [
  {
    id: "expense-1",
    invoiceId: "invoice-1",
    userId: "user-1",
    amount: 150,
    date: "2026-04-05",
    description: "Vendor cost",
    vendor: "Vendor A",
    createdAt: "2026-04-05T09:00:00.000Z",
  },
  {
    id: "expense-2",
    invoiceId: "invoice-2",
    userId: "user-1",
    amount: 700,
    date: "2026-03-20",
    description: "Freelancer",
    vendor: "Vendor B",
    createdAt: "2026-03-20T09:00:00.000Z",
  },
];

const quotations: QuotationRecord[] = [
  {
    id: "quotation-1",
    userId: "user-1",
    clientId: "client-1",
    quotationNumber: "QUO-0001",
    slug: "quo-0001",
    status: "sent",
    quotationDate: "2026-04-06",
    expiryDate: "2026-04-12",
    validityDays: 7,
    currency: "AED",
    taxRate: 5,
    discount: 0,
    subtotal: 1200,
    discountAmount: 0,
    taxAmount: 60,
    total: 1260,
    lineItems: [],
    notes: "",
    terms: "",
    language: "en",
    shareToken: "quotation-share-1",
    convertedToInvoiceId: null,
    conversionDate: null,
    sentDate: "2026-04-06",
    acceptedDate: null,
    rejectedDate: null,
    rejectionReason: "",
    createdAt: "2026-04-06T10:00:00.000Z",
    updatedAt: "2026-04-06T10:00:00.000Z",
    client: {
      id: "client-1",
      name: "Acme",
      company: "Acme LLC",
      email: "hello@acme.com",
      phone: "",
      address: "",
      slug: "acme",
      trn: "",
    },
  },
];

describe("dashboard selectors", () => {
  it("builds enriched invoice rows with payment and expense aggregates", () => {
    const rows = buildDashboardInvoiceRows({
      invoices,
      payments,
      expenses,
      range: "30d",
      today: "2026-04-08",
    });

    const firstInvoice = rows.find((row) => row.id === "invoice-1");
    expect(firstInvoice).toMatchObject({
      collectedAmount: 300,
      outstandingAmount: 750,
      expenseAmount: 150,
      profitAmount: 900,
      issuedInRange: true,
      hasPaymentInRange: true,
      collectedInRangeAmount: 300,
    });
  });

  it("computes dashboard metrics for the selected range", () => {
    const rows = buildDashboardInvoiceRows({
      invoices,
      payments,
      expenses,
      range: "30d",
      today: "2026-04-08",
    });

    expect(buildDashboardMetrics(rows)).toEqual({
      totalBilled: 3150,
      totalCollected: 1300,
      outstanding: 1850,
      collectionRate: 41,
    });
  });

  it("returns the correct drilldown rows for collected and outstanding metrics", () => {
    const rows = buildDashboardInvoiceRows({
      invoices,
      payments,
      expenses,
      range: "30d",
      today: "2026-04-08",
    });

    const collectedRows = selectDashboardDrilldownRows(rows, "collected");
    const outstandingRows = selectDashboardDrilldownRows(rows, "outstanding");

    expect(collectedRows.map((row) => row.id)).toEqual(["invoice-2", "invoice-1"]);
    expect(outstandingRows.map((row) => row.id)).toEqual(["invoice-2", "invoice-1"]);
  });

  it("returns drilldown rows for total-billed and collection-rate metrics", () => {
    const rows = buildDashboardInvoiceRows({
      invoices,
      payments,
      expenses,
      range: "30d",
      today: "2026-04-08",
    });

    const billedRows = selectDashboardDrilldownRows(rows, "total-billed");
    expect(billedRows.map((row) => row.id)).toEqual(["invoice-1", "invoice-2"]);

    const rateRows = selectDashboardDrilldownRows(rows, "collection-rate");
    expect(rateRows.map((row) => row.id)).toEqual(["invoice-2", "invoice-1"]);
  });

  it("builds insights with range=all including all invoices", () => {
    const rows = buildDashboardInvoiceRows({
      invoices,
      payments,
      expenses,
      range: "all",
      today: "2026-04-08",
    });

    const insights = buildDashboardInsights({
      rows,
      quotations,
      payments,
      expenses,
      range: "all",
      today: "2026-04-08",
    });

    expect(insights.analytics).toEqual({
      totalBilled: 3675,
      totalCollected: 1825,
      totalExpenses: 850,
      netProfit: 975,
      averageInvoice: 1225,
    });
    expect(insights.followUpQueue).toHaveLength(2);
    expect(insights.topClients).toHaveLength(2);
    expect(insights.topClients[0]?.clientId).toBe("client-2");
    expect(insights.recentActivity.length).toBeGreaterThanOrEqual(7);
  });

  it("builds follow-up, quotation, client, and activity insights", () => {
    const rows = buildDashboardInvoiceRows({
      invoices,
      payments,
      expenses,
      range: "30d",
      today: "2026-04-08",
    });

    const insights = buildDashboardInsights({
      rows,
      quotations,
      payments,
      expenses,
      range: "30d",
      today: "2026-04-08",
    });

    expect(insights.analytics).toEqual({
      totalBilled: 3150,
      totalCollected: 1300,
      totalExpenses: 850,
      netProfit: 450,
      averageInvoice: 1575,
    });
    expect(insights.followUpQueue[0]?.id).toBe("invoice-2");
    expect(insights.pendingQuotations[0]?.expiresSoon).toBe(true);
    expect(insights.topClients[0]?.clientId).toBe("client-2");
    expect(insights.recentActivity[0]?.kind).toBe("payment");
  });
});
