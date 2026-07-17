import type { ClientRect, Modifier } from "@dnd-kit/core";

type Transform = Parameters<Modifier>[0]["transform"];

type CursorCenteredOverlayArgs = {
  activatorEvent: Event | null;
  draggingNodeRect: Pick<ClientRect, "left" | "top" | "width" | "height"> | null;
  transform: Transform;
};

function getPointerCoordinates(event: Event | null) {
  if (!event || !("clientX" in event) || !("clientY" in event)) return null;

  const { clientX, clientY } = event as PointerEvent;
  return typeof clientX === "number" && typeof clientY === "number" ? { clientX, clientY } : null;
}

export function centerDragOverlayOnCursor({
  activatorEvent,
  draggingNodeRect,
  transform,
}: CursorCenteredOverlayArgs): Transform {
  const pointer = getPointerCoordinates(activatorEvent);

  if (!pointer || !draggingNodeRect) return transform;

  return {
    ...transform,
    x: transform.x + pointer.clientX - draggingNodeRect.left - draggingNodeRect.width / 2,
    y: transform.y + pointer.clientY - draggingNodeRect.top - draggingNodeRect.height / 2,
  };
}

export const centerDragOverlayOnCursorModifier: Modifier = (args) => centerDragOverlayOnCursor(args);
