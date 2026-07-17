import { describe, it, expect } from "vitest";
import { rowsToCsv } from "@/lib/export-csv";

describe("rowsToCsv — formula injection (D-5)", () => {
  it("prefixes a single quote to string cells starting with = + - or @", () => {
    const csv = rowsToCsv([
      ["=1+1", "+cmd", "-cmd", "@SUM(A1)"],
    ]);
    // "=1+1" contains no comma/quote/newline, so no wrapping — just the quote guard.
    // The others are wrapped because the leading quote does not add specials, but
    // none contain separators either, so they stay bare with a leading quote.
    expect(csv).toBe("'=1+1,'+cmd,'-cmd,'@SUM(A1)");
  });

  it("still quote-escapes a neutralized cell that also contains a comma", () => {
    const csv = rowsToCsv([["=HYPERLINK(\"x\"),evil"]]);
    // Leading '=' is neutralized to '= ... then the whole cell is wrapped because
    // it contains a comma and a double quote.
    expect(csv).toBe('"\'=HYPERLINK(""x""),evil"');
  });

  it("does not mangle legitimate negative or signed numeric strings", () => {
    const csv = rowsToCsv([["-12.00", "+5.50", "0.00"]]);
    expect(csv).toBe("-12.00,+5.50,0.00");
  });

  it("does not touch numeric (non-string) cells", () => {
    const csv = rowsToCsv([[-42, 7, 0]]);
    expect(csv).toBe("-42,7,0");
  });

  it("leaves ordinary strings unchanged", () => {
    const csv = rowsToCsv([["Acme Corp", "hello world"]]);
    expect(csv).toBe("Acme Corp,hello world");
  });
});
