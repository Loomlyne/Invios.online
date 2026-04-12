import { describe, it, expect } from "vitest";
import { clientFormSchema, clientStatuses } from "@/lib/billing";

// ---------------------------------------------------------------------------
// clientFormSchema
// ---------------------------------------------------------------------------

describe("clientFormSchema", () => {
  it("accepts valid client with all fields", () => {
    const result = clientFormSchema.safeParse({
      name: "Acme Corp",
      company: "Acme LLC",
      email: "info@acme.com",
      phone: "+971501234567",
      address: "Dubai, UAE",
      status: "lead",
      trn: "100123456789012",
      taxCode: "",
      logoPath: null,
    });

    expect(result.success).toBe(true);
  });

  it("rejects client without name -- error contains 'name'", () => {
    const result = clientFormSchema.safeParse({
      name: "",
      company: "Acme LLC",
      email: "info@acme.com",
      phone: "+971501234567",
      address: "Dubai, UAE",
      status: "lead",
      trn: "",
      taxCode: "",
      logoPath: null,
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      const nameError = result.error.issues.find((issue) =>
        issue.path.includes("name"),
      );
      expect(nameError?.message).toBeTruthy();
    }
  });

  it("accepts client with minimal fields", () => {
    const result = clientFormSchema.safeParse({
      name: "Test",
      company: "",
      email: "",
      phone: "",
      address: "",
      status: "lead",
      trn: "",
      taxCode: "",
      logoPath: null,
    });

    expect(result.success).toBe(true);
  });

  it("rejects invalid status value", () => {
    const result = clientFormSchema.safeParse({
      name: "Test Client",
      company: "",
      email: "",
      phone: "",
      address: "",
      status: "invalid_status",
      trn: "",
      taxCode: "",
      logoPath: null,
    });

    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// clientStatuses
// ---------------------------------------------------------------------------

describe("clientStatuses", () => {
  it("contains all six expected statuses", () => {
    expect(clientStatuses).toEqual([
      "lead",
      "in_review",
      "approved",
      "active",
      "rejected",
      "canceled",
    ]);
  });
});
