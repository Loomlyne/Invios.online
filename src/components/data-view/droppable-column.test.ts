import * as React from "react";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("@dnd-kit/core", () => ({
  useDroppable: () => ({ isOver: false, setNodeRef: () => undefined }),
}));

vi.stubGlobal("React", React);

import { DroppableColumn } from "@/components/data-view/droppable-column";

describe("DroppableColumn", () => {
  it("makes the category header part of the droppable target", () => {
    const markup = renderToStaticMarkup(
      createElement(
        DroppableColumn,
        {
          id: "sent",
          header: createElement("span", null, "Sent"),
          children: createElement("span", null, "Card"),
        },
      ),
    );

    expect(markup).toContain('data-kanban-drop-target="sent"');
    expect(markup).toContain("Sent");
    expect(markup).toContain("Card");
  });
});
