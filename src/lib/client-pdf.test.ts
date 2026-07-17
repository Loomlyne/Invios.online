import { describe, expect, it } from "vitest";
import { getPdfPagePlan } from "./client-pdf";

describe("getPdfPagePlan", () => {
  it("keeps a single A4-height canvas on one PDF page", () => {
    expect(getPdfPagePlan({
      canvasHeight: 1123,
      canvasWidth: 794,
      pageHeightMm: 297,
      pageWidthMm: 210,
    })).toEqual({
      imageHeightMm: 297.015,
      positionsMm: [0],
    });
  });

  it("splits a tall document across pages without scaling its width", () => {
    expect(getPdfPagePlan({
      canvasHeight: 2382,
      canvasWidth: 794,
      pageHeightMm: 297,
      pageWidthMm: 210,
    })).toEqual({
      imageHeightMm: 630,
      positionsMm: [0, -297, -594],
    });
  });
});
