import { describe, expect, it } from "vitest";
import {
  buildUniqueSlug,
  computeCollectionRate,
  computeDocumentTotals,
  computePaymentStatus,
  computeProfit,
  formatDocumentNumber,
  formatTrnDisplay,
  getArabicDescription,
  isUuid,
  mapQuotationToInvoiceInput,
  normalizeLineItems,
} from "./billing-utils";
import { buildInvoicePreviewData, createDefaultUserState, getInvoiceTotals } from "./preview";

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
// computeDocumentTotals — rounding boundaries (D-2 / D-6)
// ---------------------------------------------------------------------------

describe("computeDocumentTotals rounding boundaries", () => {
  it("rounds each line item before summing (3-decimal unit prices)", () => {
    // 0.335 rounds up to 0.34 per line; summing raw (0.67) would round to 0.67,
    // but per-line rounding yields 0.68.
    const totals = computeDocumentTotals(
      normalizeLineItems([
        { id: "1", description: "A", notes: "", arabicDescription: "", quantity: 1, unitPrice: 0.335, total: 0 },
        { id: "2", description: "B", notes: "", arabicDescription: "", quantity: 1, unitPrice: 0.335, total: 0 },
      ]),
      0,
      0,
    );

    expect(totals).toEqual({ subtotal: 0.68, discountAmount: 0, taxAmount: 0, total: 0.68 });
  });

  it("rounds a discount that lands on a .005 half-cent boundary", () => {
    // 5 * 2.5% = 0.125 -> rounds up to 0.13.
    const totals = computeDocumentTotals(
      normalizeLineItems([
        { id: "1", description: "A", notes: "", arabicDescription: "", quantity: 1, unitPrice: 5, total: 0 },
      ]),
      0,
      2.5,
    );

    expect(totals).toEqual({ subtotal: 5, discountAmount: 0.13, taxAmount: 0, total: 4.87 });
  });

  it("rounds tax on a .005 half-cent boundary", () => {
    // 10.10 * 5% = 0.505 -> rounds up to 0.51.
    const totals = computeDocumentTotals(
      normalizeLineItems([
        { id: "1", description: "A", notes: "", arabicDescription: "", quantity: 1, unitPrice: 10.1, total: 0 },
      ]),
      5,
      0,
    );

    expect(totals).toEqual({ subtotal: 10.1, discountAmount: 0, taxAmount: 0.51, total: 10.61 });
  });

  it("rounds discount and tax independently in a combined case", () => {
    // subtotal 100.10; discount 3% -> 3.003 -> 3.00; taxable 97.10;
    // tax 5% -> 4.855 -> 4.86; total 101.96 (unrounded tax would give 101.955).
    const totals = computeDocumentTotals(
      normalizeLineItems([
        { id: "1", description: "A", notes: "", arabicDescription: "", quantity: 1, unitPrice: 100.1, total: 0 },
      ]),
      5,
      3,
    );

    expect(totals).toEqual({ subtotal: 100.1, discountAmount: 3, taxAmount: 4.86, total: 101.96 });
  });
});

// ---------------------------------------------------------------------------
// getInvoiceTotals matches computeDocumentTotals (D-2 / D-6)
// ---------------------------------------------------------------------------

describe("getInvoiceTotals matches computeDocumentTotals", () => {
  const fixtures = [
    {
      name: "3-decimal unit prices",
      lineItems: [
        { id: "1", description: "A", notes: "", arabicDescription: "", quantity: 1, unitPrice: 0.335, total: 0 },
        { id: "2", description: "B", notes: "", arabicDescription: "", quantity: 1, unitPrice: 0.335, total: 0 },
      ],
      taxRate: 0,
      discount: 0,
    },
    {
      name: "discount half-cent boundary",
      lineItems: [
        { id: "1", description: "A", notes: "", arabicDescription: "", quantity: 1, unitPrice: 5, total: 0 },
      ],
      taxRate: 0,
      discount: 2.5,
    },
    {
      name: "combined discount + tax boundary",
      lineItems: [
        { id: "1", description: "A", notes: "", arabicDescription: "", quantity: 1, unitPrice: 100.1, total: 0 },
      ],
      taxRate: 5,
      discount: 3,
    },
  ];

  for (const fixture of fixtures) {
    it(`produces identical subtotal/discount/tax/total for ${fixture.name}`, () => {
      const authoritative = computeDocumentTotals(
        normalizeLineItems(fixture.lineItems),
        fixture.taxRate,
        fixture.discount,
      );

      const preview = buildInvoicePreviewData(createDefaultUserState("rounding@test.local"), {
        lineItems: fixture.lineItems,
        taxRate: fixture.taxRate,
        taxEnabled: true,
        discount: fixture.discount,
      });
      const previewTotals = getInvoiceTotals(preview);

      expect(previewTotals.subtotal).toBe(authoritative.subtotal);
      expect(previewTotals.discountAmount).toBe(authoritative.discountAmount);
      expect(previewTotals.tax).toBe(authoritative.taxAmount);
      expect(previewTotals.total).toBe(authoritative.total);
    });
  }
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

// ---------------------------------------------------------------------------
// isUuid — Phase 4 Wave 0 (RED: function not yet implemented)
// ---------------------------------------------------------------------------

describe("isUuid", () => {
  it("returns true for valid UUID v4", () => {
    expect(isUuid("a1b2c3d4-e5f6-7890-abcd-ef1234567890")).toBe(true);
  });

  it("returns false for slug string", () => {
    expect(isUuid("acme-corp-inv-001")).toBe(false);
  });

  it("returns false for empty string", () => {
    expect(isUuid("")).toBe(false);
  });

  it("returns false for partial UUID", () => {
    expect(isUuid("a1b2c3d4-e5f6")).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// formatTrnDisplay — Phase 4 Wave 0 (RED: function not yet implemented)
// ---------------------------------------------------------------------------

describe("formatTrnDisplay", () => {
  it("formats 15-digit TRN with label", () => {
    expect(formatTrnDisplay("100123456789012")).toBe("TRN: 100123456789012");
  });

  it("returns empty string for empty TRN", () => {
    expect(formatTrnDisplay("")).toBe("");
  });

  it("returns empty string for null TRN", () => {
    expect(formatTrnDisplay(null)).toBe("");
  });
});

// ---------------------------------------------------------------------------
// getArabicDescription — Phase 4 Wave 0 (RED: function not yet implemented)
// ---------------------------------------------------------------------------

describe("getArabicDescription", () => {
  it("returns arabicDescription when present", () => {
    expect(
      getArabicDescription({ description: "Web Design", arabicDescription: "تصميم الويب" }),
    ).toBe("تصميم الويب");
  });

  it("falls back to description when arabicDescription is empty", () => {
    expect(
      getArabicDescription({ description: "Web Design", arabicDescription: "" }),
    ).toBe("Web Design");
  });

  it("falls back to description when arabicDescription is undefined", () => {
    expect(
      getArabicDescription({ description: "Web Design" }),
    ).toBe("Web Design");
  });
});
