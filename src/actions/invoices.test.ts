import { describe, it, expect } from "vitest";
import {
  invoiceFormSchema,
  invoiceStatuses,
  documentLineItemSchema,
} from "@/lib/billing";

// ---------------------------------------------------------------------------
// invoiceFormSchema
// ---------------------------------------------------------------------------

describe("invoiceFormSchema", () => {
  it("accepts valid invoice with line items", () => {
    const result = invoiceFormSchema.safeParse({
      clientId: "550e8400-e29b-41d4-a716-446655440000",
      issueDate: "2026-04-06",
      dueDate: "2026-04-20",
      currency: "AED",
      taxRate: "5",
      discount: "0",
      notes: "",
      terms: "",
      language: "en",
      trn: "",
      status: "draft",
      invoiceType: "invoice",
      lineItems: [
        {
          id: "line-item-1",
          description: "Consulting",
          quantity: 10,
          unitPrice: 500,
          total: 5000,
          notes: "",
          arabicDescription: "",
        },
      ],
    });

    expect(result.success).toBe(true);
  });

  it("rejects invoice without clientId", () => {
    const result = invoiceFormSchema.safeParse({
      issueDate: "2026-04-06",
      dueDate: "2026-04-20",
      currency: "AED",
      taxRate: 5,
      discount: 0,
      notes: "",
      terms: "",
      language: "en",
      trn: "",
      status: "draft",
      invoiceType: "invoice",
      lineItems: [
        {
          id: "line-item-1",
          description: "Consulting",
          quantity: 10,
          unitPrice: 500,
          total: 5000,
          notes: "",
          arabicDescription: "",
        },
      ],
    });

    expect(result.success).toBe(false);
  });

  it("rejects invalid status value -- accepted is quotation-only", () => {
    const result = invoiceFormSchema.safeParse({
      clientId: "550e8400-e29b-41d4-a716-446655440000",
      issueDate: "2026-04-06",
      dueDate: "2026-04-20",
      currency: "AED",
      taxRate: 5,
      discount: 0,
      notes: "",
      terms: "",
      language: "en",
      trn: "",
      status: "accepted",
      invoiceType: "invoice",
      lineItems: [
        {
          id: "line-item-1",
          description: "Consulting",
          quantity: 10,
          unitPrice: 500,
          total: 5000,
          notes: "",
          arabicDescription: "",
        },
      ],
    });

    expect(result.success).toBe(false);
  });

  it("accepts both invoice types", () => {
    const baseInput = {
      clientId: "550e8400-e29b-41d4-a716-446655440000",
      issueDate: "2026-04-06",
      dueDate: "2026-04-20",
      currency: "AED",
      taxRate: 5,
      discount: 0,
      notes: "",
      terms: "",
      language: "en",
      trn: "",
      status: "draft",
      lineItems: [
        {
          id: "line-item-1",
          description: "Consulting",
          quantity: 10,
          unitPrice: 500,
          total: 5000,
          notes: "",
          arabicDescription: "",
        },
      ],
    };

    const invoiceResult = invoiceFormSchema.safeParse({
      ...baseInput,
      invoiceType: "invoice",
    });
    expect(invoiceResult.success).toBe(true);

    const taxInvoiceResult = invoiceFormSchema.safeParse({
      ...baseInput,
      invoiceType: "tax_invoice",
    });
    expect(taxInvoiceResult.success).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// invoiceStatuses
// ---------------------------------------------------------------------------

describe("invoiceStatuses", () => {
  it("contains the five expected statuses", () => {
    expect(invoiceStatuses).toEqual([
      "draft",
      "sent",
      "partial_paid",
      "paid",
      "overdue",
    ]);
  });

  it("does not contain quotation-only statuses", () => {
    expect(invoiceStatuses).not.toContain("accepted");
    expect(invoiceStatuses).not.toContain("rejected");
  });
});
