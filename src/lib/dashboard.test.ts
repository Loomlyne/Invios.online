import { describe, expect, it } from "vitest";
import type { ExpenseRecord, InvoiceRecord, PaymentRecord, QuotationRecord } from "@/lib/billing";
import {
  buildAgingBuckets,
  buildDashboardInsights,
  buildDashboardInvoiceRows,
  buildDashboardMetrics,
  buildMomDeltas,
  buildRevenueTrend,
  selectDashboardDrilldownRows,
} from "@/lib/dashboard";
import type { DashboardInvoiceRow } from "@/lib/dashboard";

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

  it("summarises the pending quotation pipeline without being limited by the visible queue", () => {
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

    expect(insights.quotationPipeline).toEqual({
      count: 1,
      total: 1260,
      expiresSoonCount: 1,
    });
  });

  it("does not count expired quotations as expiring soon", () => {
    const rows = buildDashboardInvoiceRows({
      invoices,
      payments,
      expenses,
      range: "30d",
      today: "2026-04-08",
    });
    const expiredQuotation: QuotationRecord = {
      ...quotations[0]!,
      id: "quotation-expired",
      quotationNumber: "QUO-EXPIRED",
      slug: "quo-expired",
      expiryDate: "2026-04-01",
    };

    const insights = buildDashboardInsights({
      rows,
      quotations: [...quotations, expiredQuotation],
      payments,
      expenses,
      range: "30d",
      today: "2026-04-08",
    });

    expect(insights.quotationPipeline).toEqual({
      count: 2,
      total: 2520,
      expiresSoonCount: 1,
    });
  });
});

// ---------------------------------------------------------------------------
// Helper: minimal DashboardInvoiceRow fixture
// ---------------------------------------------------------------------------
function makeRow(overrides: Partial<DashboardInvoiceRow>): DashboardInvoiceRow {
  const base: DashboardInvoiceRow = {
    id: "row-default",
    userId: "user-1",
    clientId: "client-1",
    invoiceNumber: "INV-T001",
    slug: "inv-t001",
    status: "sent",
    invoiceType: "invoice",
    issueDate: "2026-04-01",
    dueDate: "2026-04-30",
    currency: "AED",
    documentCurrency: "AED",
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
    shareToken: "tok",
    pdfUrl: null,
    createdAt: "2026-04-01T10:00:00.000Z",
    updatedAt: "2026-04-01T10:00:00.000Z",
    client: {
      id: "client-1",
      name: "Test Client",
      company: "",
      email: "test@example.com",
      phone: "",
      address: "",
      slug: "test-client",
      trn: "",
    },
    collectedAmount: 0,
    outstandingAmount: 1050,
    expenseAmount: 0,
    profitAmount: 1050,
    lastActivityAt: "2026-04-01",
    issuedInRange: true,
    dueInRange: true,
    hasPaymentInRange: false,
    collectedInRangeAmount: 0,
    expenseInRangeAmount: 0,
  };
  return { ...base, ...overrides };
}

// ---------------------------------------------------------------------------
// buildRevenueTrend
// ---------------------------------------------------------------------------
describe("buildRevenueTrend", () => {
  const TODAY = "2026-04-16";

  it("returns exactly 12 entries when given empty rows and payments", () => {
    const result = buildRevenueTrend([], [], TODAY);
    expect(result).toHaveLength(12);
  });

  it("all entries have billed: 0 and collected: 0 when no data matches", () => {
    const result = buildRevenueTrend([], [], TODAY);
    for (const entry of result) {
      expect(entry.billed).toBe(0);
      expect(entry.collected).toBe(0);
    }
  });

  it("correctly sums billed by issueDate month", () => {
    const row = makeRow({ issueDate: "2026-04-01", total: 500 });
    const result = buildRevenueTrend([row], [], TODAY);
    const aprilEntry = result.find((e) => e.monthKey === "2026-04");
    expect(aprilEntry).toBeDefined();
    expect(aprilEntry?.billed).toBe(500);
    expect(aprilEntry?.collected).toBe(0);
  });

  it("sums collected by payment.datePaid month, NOT invoice issueDate month", () => {
    // Invoice issued in January, payment made in March
    const row = makeRow({ issueDate: "2026-01-15", total: 1000 });
    const payment: PaymentRecord = {
      id: "p-test",
      invoiceId: "row-default",
      userId: "user-1",
      amount: 800,
      datePaid: "2026-03-10",
      method: "cash",
      description: "",
      createdAt: "2026-03-10T12:00:00.000Z",
    };
    const result = buildRevenueTrend([row], [payment], TODAY);
    const janEntry = result.find((e) => e.monthKey === "2026-01");
    const marEntry = result.find((e) => e.monthKey === "2026-03");
    expect(janEntry?.billed).toBe(1000);
    expect(janEntry?.collected).toBe(0);
    expect(marEntry?.collected).toBe(800);
    expect(marEntry?.billed).toBe(0);
  });

  it("months are in chronological order from 11 months ago to current month", () => {
    const result = buildRevenueTrend([], [], TODAY);
    expect(result[0]?.monthKey).toBe("2025-05");
    expect(result[11]?.monthKey).toBe("2026-04");
    for (let i = 1; i < result.length; i++) {
      expect(result[i]!.monthKey > result[i - 1]!.monthKey).toBe(true);
    }
  });

  it("month display labels are 3-letter abbreviations", () => {
    const result = buildRevenueTrend([], [], TODAY);
    const validLabels = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    for (const entry of result) {
      expect(validLabels).toContain(entry.month);
    }
    // April is the last month for today=2026-04-16
    expect(result[11]?.month).toBe("Apr");
  });
});

// ---------------------------------------------------------------------------
// buildAgingBuckets
// ---------------------------------------------------------------------------
describe("buildAgingBuckets", () => {
  const TODAY = "2026-04-16";

  it("returns exactly 4 buckets with correct labels", () => {
    const result = buildAgingBuckets([], TODAY);
    expect(result).toHaveLength(4);
    expect(result.map((b) => b.label)).toEqual(["0-30d", "31-60d", "61-90d", "90+d"]);
  });

  it("fully paid invoices (outstandingAmount = 0) are excluded", () => {
    const paid = makeRow({ outstandingAmount: 0, dueDate: "2026-03-01" });
    const result = buildAgingBuckets([paid], TODAY);
    const total = result.reduce((sum, b) => sum + b.count, 0);
    expect(total).toBe(0);
  });

  it("invoice due today lands in 0-30d bucket (daysOverdue = 0)", () => {
    const row = makeRow({ dueDate: TODAY, outstandingAmount: 500 });
    const result = buildAgingBuckets([row], TODAY);
    expect(result[0]?.label).toBe("0-30d");
    expect(result[0]?.count).toBe(1);
    expect(result[0]?.amount).toBe(500);
  });

  it("invoice due 45 days ago lands in 31-60d bucket", () => {
    // TODAY = 2026-04-16, 45 days back = 2026-03-02
    const row = makeRow({ dueDate: "2026-03-02", outstandingAmount: 750 });
    const result = buildAgingBuckets([row], TODAY);
    expect(result[1]?.label).toBe("31-60d");
    expect(result[1]?.count).toBe(1);
    expect(result[1]?.amount).toBe(750);
  });

  it("invoice due 100 days ago lands in 90+d bucket", () => {
    // TODAY = 2026-04-16, 100 days back = 2026-01-06
    const row = makeRow({ dueDate: "2026-01-06", outstandingAmount: 1200 });
    const result = buildAgingBuckets([row], TODAY);
    expect(result[3]?.label).toBe("90+d");
    expect(result[3]?.count).toBe(1);
    expect(result[3]?.amount).toBe(1200);
  });

  it("uses outstandingAmount not total (partial payment accounted for)", () => {
    const row = makeRow({ total: 1000, outstandingAmount: 600, dueDate: "2026-04-10" });
    const result = buildAgingBuckets([row], TODAY);
    expect(result[0]?.amount).toBe(600);
  });

  it("invoice not yet due (future dueDate) lands in 0-30d bucket", () => {
    const row = makeRow({ dueDate: "2026-05-01", outstandingAmount: 900 });
    const result = buildAgingBuckets([row], TODAY);
    expect(result[0]?.label).toBe("0-30d");
    expect(result[0]?.count).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// buildMomDeltas
// ---------------------------------------------------------------------------
describe("buildMomDeltas", () => {
  const TODAY = "2026-04-16";

  it("returns all null when range is 'all'", () => {
    const rows = buildDashboardInvoiceRows({ invoices, payments, expenses, range: "all", today: TODAY });
    const result = buildMomDeltas(rows, "all", TODAY);
    expect(result).toEqual({
      totalBilled: null,
      totalCollected: null,
      outstanding: null,
      collectionRate: null,
    });
  });

  it("returns null for a metric when prior period value is zero", () => {
    // Only rows in current 30d period — prior period has zero billed
    const currentRow = makeRow({
      id: "curr-1",
      issueDate: "2026-04-10",
      total: 1000,
      outstandingAmount: 1000,
      collectedAmount: 0,
    });
    const result = buildMomDeltas([currentRow], "30d", TODAY);
    // Prior period (2026-03-17 to 2026-04-16 shifted back 30d = 2026-02-15 to 2026-03-16) has no rows
    expect(result.totalBilled).toBeNull();
  });

  it("positive delta: current 200, prior 100 → delta = 100.0", () => {
    // prior period = 2026-02-15 to 2026-03-16 for range=30d relative to TODAY
    // current period = 2026-03-18 to 2026-04-16
    const priorRow = makeRow({
      id: "prior-1",
      issueDate: "2026-03-01",
      total: 100,
      outstandingAmount: 100,
      collectedAmount: 0,
    });
    const currentRow = makeRow({
      id: "curr-1",
      issueDate: "2026-04-10",
      total: 200,
      outstandingAmount: 200,
      collectedAmount: 0,
    });
    const result = buildMomDeltas([priorRow, currentRow], "30d", TODAY);
    expect(result.totalBilled).toBe(100.0);
  });

  it("negative delta: current 50, prior 100 → delta = -50.0", () => {
    const priorRow = makeRow({
      id: "prior-2",
      issueDate: "2026-03-01",
      total: 100,
      outstandingAmount: 100,
      collectedAmount: 0,
    });
    const currentRow = makeRow({
      id: "curr-2",
      issueDate: "2026-04-10",
      total: 50,
      outstandingAmount: 50,
      collectedAmount: 0,
    });
    const result = buildMomDeltas([priorRow, currentRow], "30d", TODAY);
    expect(result.totalBilled).toBe(-50.0);
  });

  it("collectionRate delta is percentage-point difference", () => {
    // current: billed 100, collected 80 → rate 80%
    // prior: billed 100, collected 75 → rate 75%
    // delta = 80 - 75 = 5.0pp
    const priorRow = makeRow({
      id: "prior-rate",
      issueDate: "2026-03-01",
      total: 100,
      outstandingAmount: 25,
      collectedAmount: 75,
    });
    const currentRow = makeRow({
      id: "curr-rate",
      issueDate: "2026-04-10",
      total: 100,
      outstandingAmount: 20,
      collectedAmount: 80,
    });
    const result = buildMomDeltas([priorRow, currentRow], "30d", TODAY);
    expect(result.collectionRate).toBe(5.0);
  });
});
