import { describe, expect, it } from "vitest";
import {
  REPORTING_CURRENCY,
  formatReportingCurrency,
  getAedRate,
  sumInReportingCurrency,
  toReportingAmount,
} from "./fx";

describe("fx reporting currency", () => {
  it("keeps AED identity", () => {
    expect(REPORTING_CURRENCY).toBe("AED");
    expect(toReportingAmount(100, "AED")).toBe(100);
    expect(getAedRate("aed")).toBe(1);
  });

  it("converts common currencies to AED", () => {
    expect(toReportingAmount(100, "USD")).toBe(367.25);
    expect(toReportingAmount(50, "EUR")).toBe(200);
  });

  it("formats internal amounts in AED", () => {
    const label = formatReportingCurrency(100, "USD");
    expect(label).toContain("367.25");
    expect(label.toUpperCase()).toMatch(/AED|د\.إ|DH/);
  });

  it("sums mixed currencies into AED", () => {
    const total = sumInReportingCurrency([
      { amount: 100, currency: "AED" },
      { amount: 100, currency: "USD" },
    ]);
    expect(total).toBe(467.25);
  });

  it("falls back unknown codes as 1:1", () => {
    expect(toReportingAmount(10, "XYZ")).toBe(10);
  });
});
