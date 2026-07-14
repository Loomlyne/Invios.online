import { describe, expect, it } from "vitest";
import type { CollisionDetection } from "@dnd-kit/core";
import { pointerFirstKanbanCollision } from "@/components/data-view/kanban-collision";

type CollisionArgs = Parameters<CollisionDetection>[0];

function rect(left: number, top: number, width: number, height: number) {
  return { left, top, width, height, right: left + width, bottom: top + height };
}

function createArgs(pointerCoordinates: { x: number; y: number } | null): CollisionArgs {
  return {
    active: {} as CollisionArgs["active"],
    collisionRect: rect(0, 0, 100, 100),
    droppableRects: new Map([
      ["left", rect(0, 0, 100, 200)],
      ["right", rect(200, 0, 100, 200)],
    ]),
    droppableContainers: [{ id: "left" }, { id: "right" }] as CollisionArgs["droppableContainers"],
    pointerCoordinates,
  };
}

describe("pointerFirstKanbanCollision", () => {
  it("selects the column directly under the pointer before the dragged card's nearest center", () => {
    expect(pointerFirstKanbanCollision(createArgs({ x: 210, y: 80 })).map(({ id }) => id)).toEqual(["right"]);
  });

  it("does not choose a nearby column when the pointer is in the gutter", () => {
    expect(pointerFirstKanbanCollision(createArgs({ x: 150, y: 80 }))).toEqual([]);
  });

  it("falls back to nearest-center detection when no pointer coordinates exist", () => {
    expect(pointerFirstKanbanCollision(createArgs(null))[0]?.id).toBe("left");
  });
});
