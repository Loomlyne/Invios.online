import { describe, expect, it } from "vitest";
import {
  buildUniqueSlug,
  computeDocumentTotals,
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
