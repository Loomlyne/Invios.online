import { describe, it, expect } from "vitest";
import { formatCurrency, formatDateDisplay, parseBankDetails, toSlug, hasValue } from "./utils";

describe("formatCurrency", () => {
  it("formats AED by default", () => {
    expect(formatCurrency(1000)).toContain("1,000");
  });

  it("respects currency param", () => {
    expect(formatCurrency(50, "USD")).toContain("50");
  });

  it("handles zero", () => {
    expect(formatCurrency(0)).toContain("0");
  });

  it("formats large values with thousands separators", () => {
    expect(formatCurrency(1234567.89)).toContain("1,234,567.89");
  });

  it("includes fractional cents", () => {
    expect(formatCurrency(12.5)).toContain("12.5");
  });

  it("does not throw on partial or invalid currency codes", () => {
    expect(() => formatCurrency(100, "U")).not.toThrow();
    expect(() => formatCurrency(100, "US")).not.toThrow();
    expect(() => formatCurrency(100, "XXX")).not.toThrow();
    expect(() => formatCurrency(100, "")).not.toThrow();
    expect(formatCurrency(100, "U")).toContain("100");
  });
});

describe("formatDateDisplay", () => {
  it("formats ISO date to DD.MM.YYYY", () => {
    expect(formatDateDisplay("2026-07-14")).toBe("14.07.2026");
  });

  it("returns empty string for empty input", () => {
    expect(formatDateDisplay("")).toBe("");
  });

  it("handles full ISO datetime by extracting date part", () => {
    expect(formatDateDisplay("2026-01-05T10:30:00Z")).toBe("05.01.2026");
  });

  it("falls back to input string for non-date garbage", () => {
    expect(formatDateDisplay("not-a-date")).toBe("not-a-date");
  });
});

describe("toSlug", () => {
  it("lowercases and hyphenates", () => {
    expect(toSlug("Acme Corp LLC")).toBe("acme-corp-llc");
  });

  it("removes special chars", () => {
    expect(toSlug("Foo & Bar!")).toBe("foo-bar");
  });

  it("collapses consecutive separators", () => {
    expect(toSlug("Hello   ---   World")).toBe("hello-world");
  });

  it("trims leading/trailing hyphens", () => {
    expect(toSlug("  hello  ")).toBe("hello");
  });
});

describe("hasValue", () => {
  it("returns false for null/undefined/empty/whitespace", () => {
    expect(hasValue(null)).toBe(false);
    expect(hasValue(undefined)).toBe(false);
    expect(hasValue("")).toBe(false);
    expect(hasValue("   ")).toBe(false);
  });

  it("returns true for non-empty", () => {
    expect(hasValue("hello")).toBe(true);
  });

  it("returns true for a single non-whitespace char", () => {
    expect(hasValue("x")).toBe(true);
  });
});

describe("parseBankDetails", () => {
  it("parses pipe-separated label:value", () => {
    const result = parseBankDetails("Bank: Emirates NBD | IBAN: AE960260001015011977756");
    expect(result).toHaveLength(2);
    expect(result[0].label).toBe("Bank");
    expect(result[1].label).toBe("IBAN");
  });

  it("detects IBAN by pattern", () => {
    const result = parseBankDetails("AE96 0260 0010 1501 1977 756");
    expect(result[0].label).toBe("IBAN");
  });

  it("returns empty array for empty input", () => {
    expect(parseBankDetails("")).toEqual([]);
  });

  it("returns empty array for whitespace-only input", () => {
    expect(parseBankDetails("   ")).toEqual([]);
  });

  it("detects account number by numeric pattern", () => {
    const result = parseBankDetails("Account Name: Acme\n123456789");
    expect(result[1].label).toBe("Account Number");
  });

  it("labels first unrecognised part as Bank", () => {
    const result = parseBankDetails("Some Bank Name");
    expect(result[0].label).toBe("Bank");
    expect(result[0].value).toBe("Some Bank Name");
  });
});
