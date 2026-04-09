import { describe, it, expect } from "vitest";
import {
  normalizePaymentMethodInput,
  paymentFormSchema,
  paymentMethods,
} from "@/lib/billing";

// ---------------------------------------------------------------------------
// paymentFormSchema
// ---------------------------------------------------------------------------

describe("paymentFormSchema", () => {
  it("accepts valid payment data", () => {
    const result = paymentFormSchema.safeParse({
      invoiceId: "550e8400-e29b-41d4-a716-446655440000",
      datePaid: "2026-04-08",
      amount: 1500,
      method: "bank_transfer",
      description: "Mashreq Bank transfer",
    });
    expect(result.success).toBe(true);
  });

  it("rejects non-UUID invoiceId", () => {
    const result = paymentFormSchema.safeParse({
      invoiceId: "not-a-uuid",
      datePaid: "2026-04-08",
      amount: 1500,
      method: "cash",
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty datePaid", () => {
    const result = paymentFormSchema.safeParse({
      invoiceId: "550e8400-e29b-41d4-a716-446655440000",
      datePaid: "",
      amount: 1500,
      method: "cash",
    });
    expect(result.success).toBe(false);
  });

  it("rejects zero amount", () => {
    const result = paymentFormSchema.safeParse({
      invoiceId: "550e8400-e29b-41d4-a716-446655440000",
      datePaid: "2026-04-08",
      amount: 0,
      method: "cash",
    });
    expect(result.success).toBe(false);
  });

  it("rejects negative amount", () => {
    const result = paymentFormSchema.safeParse({
      invoiceId: "550e8400-e29b-41d4-a716-446655440000",
      datePaid: "2026-04-08",
      amount: -100,
      method: "cash",
    });
    expect(result.success).toBe(false);
  });

  it("defaults method to 'other' when omitted", () => {
    const result = paymentFormSchema.safeParse({
      invoiceId: "550e8400-e29b-41d4-a716-446655440000",
      datePaid: "2026-04-08",
      amount: 1500,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.method).toBe("other");
      expect(result.data.description).toBe("");
    }
  });

  it("trims payment descriptions", () => {
    const result = paymentFormSchema.safeParse({
      invoiceId: "550e8400-e29b-41d4-a716-446655440000",
      datePaid: "2026-04-08",
      amount: 1500,
      method: "other",
      description: "  Sent from personal account  ",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.description).toBe("Sent from personal account");
    }
  });

  it("accepts all valid payment methods", () => {
    for (const method of paymentMethods) {
      const result = paymentFormSchema.safeParse({
        invoiceId: "550e8400-e29b-41d4-a716-446655440000",
        datePaid: "2026-04-08",
        amount: 1500,
        method,
      });
      expect(result.success).toBe(true);
    }
  });

  it("rejects invalid payment method", () => {
    const result = paymentFormSchema.safeParse({
      invoiceId: "550e8400-e29b-41d4-a716-446655440000",
      datePaid: "2026-04-08",
      amount: 1500,
      method: "credit_card",
    });
    expect(result.success).toBe(false);
  });

  it("coerces string amount to number", () => {
    const result = paymentFormSchema.safeParse({
      invoiceId: "550e8400-e29b-41d4-a716-446655440000",
      datePaid: "2026-04-08",
      amount: "2500",
      method: "cash",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.amount).toBe(2500);
    }
  });

  it("normalizes display labels and stale free-text values", () => {
    expect(normalizePaymentMethodInput("Bank transfer")).toBe("bank_transfer");
    expect(normalizePaymentMethodInput("cash")).toBe("cash");
    expect(normalizePaymentMethodInput("Cheque")).toBe("cheque");
    expect(normalizePaymentMethodInput("Cash, transfer, cheque...")).toBe("cash");
    expect(normalizePaymentMethodInput("")).toBe("other");
  });
});
