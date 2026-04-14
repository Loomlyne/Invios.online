import { describe, it, expect } from "vitest";
import {
  invoiceFormSchema,
  invoiceStatuses,
  documentLineItemSchema,
} from "@/lib/billing";

// ---------------------------------------------------------------------------
// invoiceFormSchema
// ---------------------------------------------------------------------------

describe("invoiceFormSchema", () => {
  it("accepts valid invoice with line items", () => {
    const result = invoiceFormSchema.safeParse({
      clientId: "550e8400-e29b-41d4-a716-446655440000",
      issueDate: "2026-04-06",
      dueDate: "2026-04-20",
      currency: "AED",
      taxRate: "5",
      discount: "0",
      notes: "",
      terms: "",
      language: "en",
      trn: "",
      status: "draft",
      invoiceType: "invoice",
      lineItems: [
        {
          id: "line-item-1",
          description: "Consulting",
          quantity: 10,
          unitPrice: 500,
          total: 5000,
          notes: "",
          arabicDescription: "",
        },
      ],
    });

    expect(result.success).toBe(true);
  });

  it("rejects invoice without clientId", () => {
    const result = invoiceFormSchema.safeParse({
      issueDate: "2026-04-06",
      dueDate: "2026-04-20",
      currency: "AED",
      taxRate: 5,
      discount: 0,
      notes: "",
      terms: "",
      language: "en",
      trn: "",
      status: "draft",
      invoiceType: "invoice",
      lineItems: [
        {
          id: "line-item-1",
          description: "Consulting",
          quantity: 10,
          unitPrice: 500,
          total: 5000,
          notes: "",
          arabicDescription: "",
        },
      ],
    });

    expect(result.success).toBe(false);
  });

  it("rejects invalid status value -- accepted is quotation-only", () => {
    const result = invoiceFormSchema.safeParse({
      clientId: "550e8400-e29b-41d4-a716-446655440000",
      issueDate: "2026-04-06",
      dueDate: "2026-04-20",
      currency: "AED",
      taxRate: 5,
      discount: 0,
      notes: "",
      terms: "",
      language: "en",
      trn: "",
      status: "accepted",
      invoiceType: "invoice",
      lineItems: [
        {
          id: "line-item-1",
          description: "Consulting",
          quantity: 10,
          unitPrice: 500,
          total: 5000,
          notes: "",
          arabicDescription: "",
        },
      ],
    });

    expect(result.success).toBe(false);
  });

  it("accepts both invoice types", () => {
    const baseInput = {
      clientId: "550e8400-e29b-41d4-a716-446655440000",
      issueDate: "2026-04-06",
      dueDate: "2026-04-20",
      currency: "AED",
      taxRate: 5,
      discount: 0,
      notes: "",
      terms: "",
      language: "en",
      trn: "",
      status: "draft",
      lineItems: [
        {
          id: "line-item-1",
          description: "Consulting",
          quantity: 10,
          unitPrice: 500,
          total: 5000,
          notes: "",
          arabicDescription: "",
        },
      ],
    };

    const invoiceResult = invoiceFormSchema.safeParse({
      ...baseInput,
      invoiceType: "invoice",
    });
    expect(invoiceResult.success).toBe(true);

    const taxInvoiceResult = invoiceFormSchema.safeParse({
      ...baseInput,
      invoiceType: "tax_invoice",
    });
    expect(taxInvoiceResult.success).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// invoiceStatuses
// ---------------------------------------------------------------------------

describe("invoiceStatuses", () => {
  it("contains the six expected statuses including overpaid", () => {
    expect(invoiceStatuses).toEqual([
      "draft",
      "sent",
      "partial_paid",
      "paid",
      "overpaid",
      "overdue",
    ]);
  });

  it("does not contain quotation-only statuses", () => {
    expect(invoiceStatuses).not.toContain("accepted");
    expect(invoiceStatuses).not.toContain("rejected");
  });
});

// ---------------------------------------------------------------------------
// snapshotInvoiceVersion (AUTO-01)
// RED stubs — @/actions/versions does not exist yet
// ---------------------------------------------------------------------------

describe("snapshotInvoiceVersion", () => {
  it.todo(
    "creates a version snapshot with correct JSONB shape — calls supabase.from('invoice_versions').insert with invoice_id, user_id, and snapshot fields"
  );

  it.todo(
    "enforces rolling 10-cap by deleting oldest versions — when 11 versions exist, deletes the 11th row's id"
  );

  it.todo(
    "does not delete when under 10 versions — when 5 versions exist, delete is NOT called"
  );
});

// ---------------------------------------------------------------------------
// restoreInvoiceVersionAction (AUTO-02)
// RED stubs — @/actions/versions does not exist yet
// ---------------------------------------------------------------------------

describe("restoreInvoiceVersionAction", () => {
  it.todo(
    "applies snapshot fields to invoice and recomputes status — calls supabase.from('invoices').update() with snapshot fields and calls computeAndWriteInvoiceStatus"
  );

  it.todo(
    "returns error when version not found — when supabase select returns null, ActionState has status: 'error'"
  );
});
