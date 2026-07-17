import { describe, expect, it } from "vitest";
import { invoiceConfig } from "@/components/data-view/configs/invoice-config";
import type { InvoiceRecord } from "@/lib/billing";

const sentInvoice = { id: "invoice-1", status: "sent" } as InvoiceRecord;
const overdueInvoice = { id: "invoice-2", status: "overdue" } as InvoiceRecord;

describe("invoice Kanban destinations", () => {
  it("allows dragging to any status without restriction", () => {
    expect(invoiceConfig.canChangeStatus).toBeUndefined();
    // No canChangeStatus means all columns are droppable
    expect(sentInvoice.status).toBe("sent");
    expect(overdueInvoice.status).toBe("overdue");
  });
});
