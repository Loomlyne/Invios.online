import { describe, it, expect } from "vitest";
import {
  computePaymentReliability,
  computeClientLTV,
  computeClientHealth,
  type ReliabilityInput,
  type LTVInput,
  type HealthInput,
} from "./client-intelligence";

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

describe("computeClientLTV", () => {
  it("sums total of all paid invoices", () => {
    const result = computeClientLTV({
      paidInvoices: [{ total: 1000 }, { total: 2500 }],
    } satisfies LTVInput);
    expect(result).toBe(3500);
  });

  it("returns 0 when no paid invoices", () => {
    expect(computeClientLTV({ paidInvoices: [] })).toBe(0);
  });
});

describe("computeClientHealth", () => {
  it("returns 'healthy' when LTV high and pays fast", () => {
    const result = computeClientHealth({
      ltv: 50000,
      reliability: { avgDaysToPay: 5, tier: "fast" },
      outstandingCount: 0,
      totalInvoices: 10,
    } satisfies HealthInput);
    expect(result.score).toBeGreaterThanOrEqual(80);
    expect(result.label).toBe("healthy");
  });

  it("returns 'at-risk' when slow payer with outstanding invoices", () => {
    const result = computeClientHealth({
      ltv: 5000,
      reliability: { avgDaysToPay: 40, tier: "slow" },
      outstandingCount: 3,
      totalInvoices: 8,
    } satisfies HealthInput);
    expect(result.label).toBe("at-risk");
  });

  it("returns 'critical' when late payer with high outstanding ratio", () => {
    const result = computeClientHealth({
      ltv: 2000,
      reliability: { avgDaysToPay: 60, tier: "late" },
      outstandingCount: 5,
      totalInvoices: 6,
    } satisfies HealthInput);
    expect(result.label).toBe("critical");
  });

  it("returns 'new' when fewer than 2 invoices", () => {
    const result = computeClientHealth({
      ltv: 0,
      reliability: null,
      outstandingCount: 1,
      totalInvoices: 1,
    } satisfies HealthInput);
    expect(result.label).toBe("new");
  });
});
