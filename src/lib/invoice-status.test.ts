import { describe, expect, it } from "vitest";
import { isManualInvoiceStatusTransitionAllowed } from "@/lib/billing";

describe("manual invoice status transitions", () => {
  it("allows only statuses that can be set outside payment and due-date automation", () => {
    expect(isManualInvoiceStatusTransitionAllowed("draft", "sent")).toBe(true);
    expect(isManualInvoiceStatusTransitionAllowed("sent", "draft")).toBe(true);
    expect(isManualInvoiceStatusTransitionAllowed("sent", "paid")).toBe(true);
    expect(isManualInvoiceStatusTransitionAllowed("partial_paid", "paid")).toBe(true);

    expect(isManualInvoiceStatusTransitionAllowed("draft", "overdue")).toBe(false);
    expect(isManualInvoiceStatusTransitionAllowed("sent", "partial_paid")).toBe(false);
    expect(isManualInvoiceStatusTransitionAllowed("paid", "sent")).toBe(false);
  });
});
