import { describe, it, expect } from "vitest";
import { computePaymentReliability, type ReliabilityInput } from "./client-intelligence";

const baseInput = (over: Partial<ReliabilityInput>): ReliabilityInput => ({
  paidInvoices: [],
  ...over,
});

describe("computePaymentReliability", () => {
  it("returns null when no paid invoices", () => {
    const result = computePaymentReliability(baseInput({ paidInvoices: [] }));
    expect(result).toBeNull();
  });

  it("classifies as 'fast' when avg <= 7 days", () => {
    const result = computePaymentReliability(
      baseInput({
        paidInvoices: [{ dueDate: "2026-01-01", paidAt: "2026-01-05" }], // 4 days
      }),
    );
    expect(result?.tier).toBe("fast");
    expect(result?.avgDaysToPay).toBe(4);
  });

  it("classifies as 'standard' when avg 8-21 days", () => {
    const result = computePaymentReliability(
      baseInput({
        paidInvoices: [{ dueDate: "2026-01-01", paidAt: "2026-01-15" }], // 14 days
      }),
    );
    expect(result?.tier).toBe("standard");
  });

  it("classifies as 'slow' when avg 22-45 days", () => {
    const result = computePaymentReliability(
      baseInput({
        paidInvoices: [{ dueDate: "2026-01-01", paidAt: "2026-02-01" }], // 31 days
      }),
    );
    expect(result?.tier).toBe("slow");
  });

  it("classifies as 'late' when avg > 45 days", () => {
    const result = computePaymentReliability(
      baseInput({
        paidInvoices: [{ dueDate: "2026-01-01", paidAt: "2026-04-01" }], // 90 days
      }),
    );
    expect(result?.tier).toBe("late");
  });

  it("averages across multiple paid invoices", () => {
    const result = computePaymentReliability(
      baseInput({
        paidInvoices: [
          { dueDate: "2026-01-01", paidAt: "2026-01-05" }, // 4
          { dueDate: "2026-02-01", paidAt: "2026-02-20" }, // 19
        ],
      }),
    );
    expect(result?.avgDaysToPay).toBe(11.5); // (4 + 19) / 2
    expect(result?.tier).toBe("standard");
  });

  it("ignores invoices with no payment date", () => {
    const result = computePaymentReliability(
      baseInput({
        paidInvoices: [{ dueDate: "2026-01-01", paidAt: null }],
      }),
    );
    expect(result).toBeNull();
  });
});
