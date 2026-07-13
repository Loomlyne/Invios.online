import { describe, expect, it } from "vitest";
import { applyKanbanStatusChange, createKanbanUndo } from "@/components/data-view/kanban-state";

type Item = { id: string; status: "lead" | "active" | "approved" };

const items: Item[] = [
  { id: "client-1", status: "lead" },
  { id: "client-2", status: "active" },
];

describe("kanban status state", () => {
  it("records the previous status so a successful drag can be undone", () => {
    expect(createKanbanUndo(items, "client-1", "approved")).toEqual({
      id: "client-1",
      from: "lead",
      to: "approved",
    });
  });

  it("does not create an undo operation when the card stays in its current column", () => {
    expect(createKanbanUndo(items, "client-2", "active")).toBeNull();
  });

  it("updates only the dragged card when applying a status change", () => {
    expect(applyKanbanStatusChange(items, "client-1", "approved")).toEqual([
      { id: "client-1", status: "approved" },
      { id: "client-2", status: "active" },
    ]);
  });
});
