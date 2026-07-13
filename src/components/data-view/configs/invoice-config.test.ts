import { describe, expect, it } from "vitest";
import { invoiceConfig } from "@/components/data-view/configs/invoice-config";
import type { InvoiceRecord } from "@/lib/billing";

const sentInvoice = { id: "invoice-1", status: "sent" } as InvoiceRecord;
const overdueInvoice = { id: "invoice-2", status: "overdue" } as InvoiceRecord;

describe("invoice Kanban destinations", () => {
  it("only exposes destinations accepted by the invoice status rules", () => {
    expect(invoiceConfig.canChangeStatus).toBeTypeOf("function");
    expect(invoiceConfig.canChangeStatus?.(sentInvoice, "paid")).toBe(true);
    expect(invoiceConfig.canChangeStatus?.(sentInvoice, "partial_paid")).toBe(false);
    expect(invoiceConfig.canChangeStatus?.(overdueInvoice, "paid")).toBe(true);
    expect(invoiceConfig.canChangeStatus?.(overdueInvoice, "sent")).toBe(false);
  });
});
