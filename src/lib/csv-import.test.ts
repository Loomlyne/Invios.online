import { describe, it, expect } from "vitest";
import { csvRowSchema, autoMapHeaders, MAX_IMPORT_ROWS, CSV_FIELDS } from "@/lib/csv-import";

// ---------------------------------------------------------------------------
// csvRowSchema
// ---------------------------------------------------------------------------

describe("csvRowSchema", () => {
  it("accepts valid row with all fields populated", () => {
    const result = csvRowSchema.safeParse({
      name: "Acme Corp",
      company: "Acme LLC",
      email: "info@acme.com",
      phone: "+971501234567",
      address: "Dubai, UAE",
      trn: "100123456789012",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe("Acme Corp");
      expect(result.data.email).toBe("info@acme.com");
    }
  });

  it("accepts minimal row — name only, others default to empty string", () => {
    const result = csvRowSchema.safeParse({ name: "Acme Corp" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.company).toBe("");
      expect(result.data.email).toBe("");
      expect(result.data.phone).toBe("");
      expect(result.data.address).toBe("");
      expect(result.data.trn).toBe("");
    }
  });

  it("rejects row with empty name (too short)", () => {
    const result = csvRowSchema.safeParse({ name: "" });
    expect(result.success).toBe(false);
    if (!result.success) {
      const nameError = result.error.issues.find((issue) =>
        issue.path.includes("name"),
      );
      expect(nameError).toBeTruthy();
    }
  });

  it("rejects row with name of length 1 (min 2)", () => {
    const result = csvRowSchema.safeParse({ name: "A" });
    expect(result.success).toBe(false);
    if (!result.success) {
      const nameError = result.error.issues.find((issue) =>
        issue.path.includes("name"),
      );
      expect(nameError).toBeTruthy();
    }
  });

  it("rejects invalid email format", () => {
    const result = csvRowSchema.safeParse({ name: "Acme Corp", email: "not-an-email" });
    expect(result.success).toBe(false);
    if (!result.success) {
      const emailError = result.error.issues.find((issue) =>
        issue.path.includes("email"),
      );
      expect(emailError).toBeTruthy();
    }
  });

  it("accepts empty string email (optional field)", () => {
    const result = csvRowSchema.safeParse({ name: "Acme Corp", email: "" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBe("");
    }
  });
});

// ---------------------------------------------------------------------------
// autoMapHeaders
// ---------------------------------------------------------------------------

describe("autoMapHeaders", () => {
  it("maps exact match headers", () => {
    const mapping = autoMapHeaders(["email", "name", "phone", "company", "address", "trn"]);
    expect(mapping.email).toBe("email");
    expect(mapping.name).toBe("name");
    expect(mapping.phone).toBe("phone");
    expect(mapping.company).toBe("company");
    expect(mapping.address).toBe("address");
    expect(mapping.trn).toBe("trn");
  });

  it("maps fuzzy case-insensitive variants — E-mail -> email", () => {
    const mapping = autoMapHeaders(["E-mail"]);
    expect(mapping.email).toBe("E-mail");
  });

  it("maps fuzzy variant — Full Name -> name", () => {
    const mapping = autoMapHeaders(["Full Name"]);
    expect(mapping.name).toBe("Full Name");
  });

  it("maps fuzzy variant — Phone Number -> phone", () => {
    const mapping = autoMapHeaders(["Phone Number"]);
    expect(mapping.phone).toBe("Phone Number");
  });

  it("maps fuzzy variant — Company Name -> company", () => {
    const mapping = autoMapHeaders(["Company Name"]);
    expect(mapping.company).toBe("Company Name");
  });

  it("maps fuzzy variant — VAT Number -> trn", () => {
    const mapping = autoMapHeaders(["VAT Number"]);
    expect(mapping.trn).toBe("VAT Number");
  });

  it("ignores unrecognized header — Favorite Color", () => {
    const mapping = autoMapHeaders(["Favorite Color"]);
    // No known field should be mapped
    expect(Object.values(mapping)).not.toContain("Favorite Color");
  });

  it("first match wins when two headers map to same field", () => {
    // "Email" and "E-mail Address" both map to email — first should win
    const mapping = autoMapHeaders(["Email", "E-mail Address"]);
    expect(mapping.email).toBe("Email");
  });
});

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

describe("constants", () => {
  it("MAX_IMPORT_ROWS is 200", () => {
    expect(MAX_IMPORT_ROWS).toBe(200);
  });

  it("CSV_FIELDS contains all 6 field names", () => {
    expect(CSV_FIELDS).toHaveLength(6);
    expect(CSV_FIELDS).toContain("name");
    expect(CSV_FIELDS).toContain("company");
    expect(CSV_FIELDS).toContain("email");
    expect(CSV_FIELDS).toContain("phone");
    expect(CSV_FIELDS).toContain("address");
    expect(CSV_FIELDS).toContain("trn");
  });
});
