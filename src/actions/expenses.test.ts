import { describe, it, expect } from "vitest";
import { expenseFormSchema } from "@/lib/billing";

// ---------------------------------------------------------------------------
// expenseFormSchema
// ---------------------------------------------------------------------------

describe("expenseFormSchema", () => {
  it("accepts valid expense data", () => {
    const result = expenseFormSchema.safeParse({
      invoiceId: "550e8400-e29b-41d4-a716-446655440000",
      date: "2026-04-08",
      amount: 350,
      description: "Photography equipment rental",
      vendor: "Gulf Rentals LLC",
    });
    expect(result.success).toBe(true);
  });

  it("rejects non-UUID invoiceId", () => {
    const result = expenseFormSchema.safeParse({
      invoiceId: "not-a-uuid",
      date: "2026-04-08",
      amount: 350,
      description: "Photography equipment rental",
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty date", () => {
    const result = expenseFormSchema.safeParse({
      invoiceId: "550e8400-e29b-41d4-a716-446655440000",
      date: "",
      amount: 350,
      description: "Photography equipment rental",
    });
    expect(result.success).toBe(false);
  });

  it("rejects zero amount", () => {
    const result = expenseFormSchema.safeParse({
      invoiceId: "550e8400-e29b-41d4-a716-446655440000",
      date: "2026-04-08",
      amount: 0,
      description: "Photography equipment rental",
    });
    expect(result.success).toBe(false);
  });

  it("rejects negative amount", () => {
    const result = expenseFormSchema.safeParse({
      invoiceId: "550e8400-e29b-41d4-a716-446655440000",
      date: "2026-04-08",
      amount: -50,
      description: "Photography equipment rental",
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty description", () => {
    const result = expenseFormSchema.safeParse({
      invoiceId: "550e8400-e29b-41d4-a716-446655440000",
      date: "2026-04-08",
      amount: 350,
      description: "",
    });
    expect(result.success).toBe(false);
  });

  it("defaults vendor to empty string when omitted", () => {
    const result = expenseFormSchema.safeParse({
      invoiceId: "550e8400-e29b-41d4-a716-446655440000",
      date: "2026-04-08",
      amount: 350,
      description: "Photography equipment rental",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.vendor).toBe("");
    }
  });

  it("coerces string amount to number", () => {
    const result = expenseFormSchema.safeParse({
      invoiceId: "550e8400-e29b-41d4-a716-446655440000",
      date: "2026-04-08",
      amount: "1200",
      description: "Studio hire",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.amount).toBe(1200);
    }
  });

  it("accepts expense without vendor (optional field)", () => {
    const result = expenseFormSchema.safeParse({
      invoiceId: "550e8400-e29b-41d4-a716-446655440000",
      date: "2026-04-08",
      amount: 100,
      description: "Miscellaneous supplies",
      vendor: "",
    });
    expect(result.success).toBe(true);
  });
});
