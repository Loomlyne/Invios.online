import { describe, expect, it } from "vitest";
import {
  CURRENCIES,
  formatCurrencyLabel,
  getCurrency,
  isValidCurrencyCode,
  searchCurrencies,
} from "./currencies";

describe("currencies", () => {
  it("includes AED first for UAE default", () => {
    expect(CURRENCIES[0].code).toBe("AED");
  });

  it("looks up by case-insensitive code", () => {
    expect(getCurrency("usd")?.name).toBe("US Dollar");
  });

  it("formats brand labels", () => {
    const aed = getCurrency("AED")!;
    expect(formatCurrencyLabel(aed)).toContain("AED");
    expect(formatCurrencyLabel(aed)).toContain("د.إ");
  });

  it("searches by code, name, and symbol", () => {
    expect(searchCurrencies("dirham").some((c) => c.code === "AED")).toBe(true);
    expect(searchCurrencies("usd").some((c) => c.code === "USD")).toBe(true);
    expect(searchCurrencies("€").some((c) => c.code === "EUR")).toBe(true);
  });

  it("validates currency codes", () => {
    expect(isValidCurrencyCode("AED")).toBe(true);
    expect(isValidCurrencyCode("u")).toBe(false);
    expect(isValidCurrencyCode("US")).toBe(false);
    expect(isValidCurrencyCode("")).toBe(false);
  });
});
