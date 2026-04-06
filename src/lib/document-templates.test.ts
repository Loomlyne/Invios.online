import { describe, expect, it } from "vitest";
import { getDocumentTemplate } from "./document-templates";
import { buildInvoicePreviewData, createDefaultUserState, getInvoiceTotals } from "./preview";

describe("document templates", () => {
  it("resolves the requested template and falls back to classic", () => {
    expect(getDocumentTemplate("executive").name).toBe("Executive");
    expect(getDocumentTemplate("unknown").id).toBe("classic");
  });

  it("carries the selected template into preview payloads", () => {
    const state = createDefaultUserState("template@test.local");
    state.settings.documentTemplate = "minimal";

    const preview = buildInvoicePreviewData(state);

    expect(preview.templateId).toBe("minimal");
  });

  it("keeps totals stable across all built-in templates", () => {
    const lineItems = [
      {
        id: "1",
        description: "Strategy sprint",
        quantity: 2,
        unitPrice: 150,
      },
    ];

    for (const templateId of ["classic", "executive", "minimal"] as const) {
      const state = createDefaultUserState(`${templateId}@test.local`);
      state.settings.documentTemplate = templateId;

      const preview = buildInvoicePreviewData(state, {
        discount: 10,
        taxRate: 5,
        lineItems,
      });

      expect(getInvoiceTotals(preview).total).toBe(283.5);
    }
  });
});
