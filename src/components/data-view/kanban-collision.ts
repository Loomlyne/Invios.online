import { closestCenter, pointerWithin, type CollisionDetection } from "@dnd-kit/core";

export const pointerFirstKanbanCollision: CollisionDetection = (args) => {
  if (args.pointerCoordinates) {
    return pointerWithin(args);
  }

  return closestCenter(args);
};
