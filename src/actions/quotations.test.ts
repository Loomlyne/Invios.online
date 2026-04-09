import { describe, it, expect } from "vitest";
import {
  quotationFormSchema,
  quotationStatuses,
  documentLineItemSchema,
} from "@/lib/billing";

// ---------------------------------------------------------------------------
// quotationFormSchema
// ---------------------------------------------------------------------------

describe("quotationFormSchema", () => {
  it("accepts valid quotation with line items", () => {
    const result = quotationFormSchema.safeParse({
      clientId: "550e8400-e29b-41d4-a716-446655440000",
      quotationDate: "2026-04-06",
      expiryDate: "2026-05-06",
      validityDays: 30,
      currency: "AED",
      taxRate: "5",
      discount: "0",
      notes: "",
      terms: "",
      language: "en",
      trn: "",
      status: "draft",
      lineItems: [
        {
          id: "line-item-1",
          description: "Web design",
          quantity: 1,
          unitPrice: 5000,
          total: 5000,
          notes: "",
          arabicDescription: "",
        },
      ],
    });

    expect(result.success).toBe(true);
  });

  it("rejects quotation without clientId", () => {
    const result = quotationFormSchema.safeParse({
      quotationDate: "2026-04-06",
      expiryDate: "2026-05-06",
      validityDays: 30,
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
          description: "Web design",
          quantity: 1,
          unitPrice: 5000,
          total: 5000,
          notes: "",
          arabicDescription: "",
        },
      ],
    });

    expect(result.success).toBe(false);
  });

  it("rejects invalid status value", () => {
    const result = quotationFormSchema.safeParse({
      clientId: "550e8400-e29b-41d4-a716-446655440000",
      quotationDate: "2026-04-06",
      expiryDate: "2026-05-06",
      validityDays: 30,
      currency: "AED",
      taxRate: 5,
      discount: 0,
      notes: "",
      terms: "",
      language: "en",
      trn: "",
      status: "completed",
      lineItems: [
        {
          id: "line-item-1",
          description: "Web design",
          quantity: 1,
          unitPrice: 5000,
          total: 5000,
          notes: "",
          arabicDescription: "",
        },
      ],
    });

    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// quotationStatuses
// ---------------------------------------------------------------------------

describe("quotationStatuses", () => {
  it("contains the five expected statuses", () => {
    expect(quotationStatuses).toEqual([
      "draft",
      "sent",
      "accepted",
      "rejected",
      "expired",
    ]);
  });

  it("D-07: accepted status exists for conversion flow", () => {
    expect(quotationStatuses).toContain("accepted");
  });
});

// ---------------------------------------------------------------------------
// documentLineItemSchema (shared, tested via quotations)
// ---------------------------------------------------------------------------

describe("documentLineItemSchema", () => {
  it("accepts valid line item", () => {
    const result = documentLineItemSchema.safeParse({
      id: "line-item-1",
      description: "Consulting services",
      quantity: 5,
      unitPrice: 1000,
      total: 5000,
      notes: "Per day rate",
      arabicDescription: "",
    });

    expect(result.success).toBe(true);
  });

  it("rejects line item without description", () => {
    const result = documentLineItemSchema.safeParse({
      id: "line-item-1",
      description: "",
      quantity: 5,
      unitPrice: 1000,
      total: 5000,
      notes: "",
      arabicDescription: "",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      const descError = result.error.issues.find((issue) =>
        issue.path.includes("description"),
      );
      expect(descError?.message).toBeTruthy();
    }
  });
});
