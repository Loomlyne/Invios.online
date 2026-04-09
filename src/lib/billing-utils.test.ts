import { describe, expect, it } from "vitest";
import {
  buildUniqueSlug,
  computeCollectionRate,
  computeDocumentTotals,
  computePaymentStatus,
  computeProfit,
  formatDocumentNumber,
  mapQuotationToInvoiceInput,
  normalizeLineItems,
} from "./billing-utils";

describe("billing-utils", () => {
  it("computes subtotal, discount, tax, and total", () => {
    const totals = computeDocumentTotals(
      normalizeLineItems([
        {
          id: "1",
          description: "Discovery",
          notes: "",
          arabicDescription: "",
          quantity: 2,
          unitPrice: 100,
          total: 200,
        },
        {
          id: "2",
          description: "Delivery",
          notes: "",
          arabicDescription: "",
          quantity: 1,
          unitPrice: 50,
          total: 50,
        },
      ]),
      5,
      10,
    );

    expect(totals).toEqual({
      subtotal: 250,
      discountAmount: 25,
      taxAmount: 11.25,
      total: 236.25,
    });
  });

  it("builds a unique slug with numeric suffixes", () => {
    expect(buildUniqueSlug("Acme Studio", ["acme-studio", "acme-studio-2"])).toBe("acme-studio-3");
  });

  it("formats document numbers with a padded counter", () => {
    expect(formatDocumentNumber("inv", 7)).toBe("INV-0007");
  });

  it("maps quotation input into invoice input", () => {
    const invoiceInput = mapQuotationToInvoiceInput({
      clientId: "client-1",
      quotationDate: "2026-04-06",
      expiryDate: "2026-04-20",
      validityDays: 14,
      currency: "AED",
      taxRate: 5,
      discount: 0,
      notes: "Quotation note",
      terms: "Quotation terms",
      language: "en",
      trn: "123",
      status: "accepted",
      lineItems: [
        {
          id: "1",
          description: "Scope",
          notes: "",
          arabicDescription: "",
          quantity: 1,
          unitPrice: 500,
          total: 500,
        },
      ],
    });

    expect(invoiceInput).toMatchObject({
      clientId: "client-1",
      issueDate: "2026-04-06",
      dueDate: "2026-04-20",
      currency: "AED",
      taxRate: 5,
      status: "draft",
      invoiceType: "invoice",
    });
    expect(invoiceInput.lineItems[0]?.total).toBe(500);
  });
});

// ---------------------------------------------------------------------------
// computePaymentStatus
// ---------------------------------------------------------------------------

describe("computePaymentStatus", () => {
  it("returns 'paid' when collected >= total", () => {
    const result = computePaymentStatus({
      currentStatus: "sent",
      total: 5000,
      collected: 5000,
      dueDate: "2026-05-01",
      today: "2026-04-08",
    });
    expect(result).toBe("paid");
  });

  it("returns 'overpaid' when collected exceeds total", () => {
    const result = computePaymentStatus({
      currentStatus: "sent",
      total: 5000,
      collected: 5500,
      dueDate: "2026-03-01",
      today: "2026-04-08",
    });
    expect(result).toBe("overpaid");
  });

  it("returns 'overpaid' even when past due (overpaid is never overdue)", () => {
    const result = computePaymentStatus({
      currentStatus: "overpaid",
      total: 5000,
      collected: 5500,
      dueDate: "2026-01-01",
      today: "2026-04-08",
    });
    expect(result).toBe("overpaid");
  });

  it("returns 'partial_paid' when 0 < collected < total and not past due", () => {
    const result = computePaymentStatus({
      currentStatus: "sent",
      total: 5000,
      collected: 2000,
      dueDate: "2026-05-01",
      today: "2026-04-08",
    });
    expect(result).toBe("partial_paid");
  });

  it("returns 'overdue' when 0 < collected < total and past due", () => {
    const result = computePaymentStatus({
      currentStatus: "partial_paid",
      total: 5000,
      collected: 2000,
      dueDate: "2026-03-01",
      today: "2026-04-08",
    });
    expect(result).toBe("overdue");
  });

  it("returns 'sent' (unchanged) when collected === 0, not past due, status is 'sent'", () => {
    const result = computePaymentStatus({
      currentStatus: "sent",
      total: 5000,
      collected: 0,
      dueDate: "2026-05-01",
      today: "2026-04-08",
    });
    expect(result).toBe("sent");
  });

  it("returns 'overdue' when collected === 0, past due, status is 'sent'", () => {
    const result = computePaymentStatus({
      currentStatus: "sent",
      total: 5000,
      collected: 0,
      dueDate: "2026-03-01",
      today: "2026-04-08",
    });
    expect(result).toBe("overdue");
  });

  it("returns 'draft' (never overdue) when status is 'draft' even if past due", () => {
    const result = computePaymentStatus({
      currentStatus: "draft",
      total: 5000,
      collected: 0,
      dueDate: "2026-01-01",
      today: "2026-04-08",
    });
    expect(result).toBe("draft");
  });

  it("paid invoices are never overdue regardless of due date", () => {
    const result = computePaymentStatus({
      currentStatus: "paid",
      total: 5000,
      collected: 5000,
      dueDate: "2026-01-01",
      today: "2026-04-08",
    });
    expect(result).toBe("paid");
  });
});

// ---------------------------------------------------------------------------
// computeProfit
// ---------------------------------------------------------------------------

describe("computeProfit", () => {
  it("returns correct profit and margin when expenses are less than total", () => {
    const result = computeProfit({ total: 5000, expensesTotal: 2000 });
    expect(result.profit).toBe(3000);
    expect(result.margin).toBe(60);
  });

  it("returns 100% margin when there are no expenses", () => {
    const result = computeProfit({ total: 5000, expensesTotal: 0 });
    expect(result.profit).toBe(5000);
    expect(result.margin).toBe(100);
  });

  it("returns negative profit and margin when expenses exceed total", () => {
    const result = computeProfit({ total: 5000, expensesTotal: 6000 });
    expect(result.profit).toBe(-1000);
    expect(result.margin).toBe(-20);
  });

  it("returns zero profit and zero margin when total is 0 (no division by zero)", () => {
    const result = computeProfit({ total: 0, expensesTotal: 0 });
    expect(result.profit).toBe(0);
    expect(result.margin).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// computeCollectionRate
// ---------------------------------------------------------------------------

describe("computeCollectionRate", () => {
  it("returns correct collection rate as integer percentage", () => {
    const result = computeCollectionRate({ totalBilled: 10000, totalCollected: 8400 });
    expect(result).toBe(84);
  });

  it("returns 100 when fully collected", () => {
    const result = computeCollectionRate({ totalBilled: 10000, totalCollected: 10000 });
    expect(result).toBe(100);
  });

  it("returns null when totalBilled is 0 (zero-state)", () => {
    const result = computeCollectionRate({ totalBilled: 0, totalCollected: 0 });
    expect(result).toBeNull();
  });

  it("returns 0 when nothing has been collected", () => {
    const result = computeCollectionRate({ totalBilled: 10000, totalCollected: 0 });
    expect(result).toBe(0);
  });
});
