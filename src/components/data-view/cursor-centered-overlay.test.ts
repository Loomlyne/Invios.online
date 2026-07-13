import { describe, expect, it } from "vitest";
import { centerDragOverlayOnCursor } from "@/components/data-view/cursor-centered-overlay";

describe("centerDragOverlayOnCursor", () => {
  it("moves the drag overlay so its center stays under the activation cursor", () => {
    const transform = centerDragOverlayOnCursor({
      activatorEvent: { clientX: 140, clientY: 125 } as PointerEvent,
      draggingNodeRect: { left: 100, top: 100, width: 240, height: 100 },
      transform: { x: 30, y: 40, scaleX: 1, scaleY: 1 },
    });

    expect(transform).toEqual({ x: -50, y: 15, scaleX: 1, scaleY: 1 });
  });

  it("leaves the transform unchanged without pointer coordinates or a drag rect", () => {
    const transform = { x: 30, y: 40, scaleX: 1, scaleY: 1 };

    expect(centerDragOverlayOnCursor({ activatorEvent: null, draggingNodeRect: null, transform })).toBe(transform);
  });
});
