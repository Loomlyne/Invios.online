import { describe, expect, it } from "vitest";
import { ClientStatusBadge } from "@/components/clients/client-status-badge";
import { DocumentStatusBadge } from "@/components/documents/document-status-badge";

describe("status badge wrappers", () => {
  it("passes className through the client status badge", () => {
    const element = ClientStatusBadge({
      status: "in_review",
      className: "shrink-0 whitespace-nowrap",
    });

    expect(element.props.className).toContain("shrink-0");
    expect(element.props.className).toContain("whitespace-nowrap");
    expect(element.props.children).toBe("In Review");
  });

  it("passes className through the document status badge", () => {
    const element = DocumentStatusBadge({
      status: "partial_paid",
      className: "shrink-0 whitespace-nowrap",
    });

    expect(element.props.className).toContain("shrink-0");
    expect(element.props.className).toContain("whitespace-nowrap");
    expect(element.props.children).toBe("Partial Paid");
  });
});
