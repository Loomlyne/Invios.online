import { closestCenter, pointerWithin, type CollisionDetection } from "@dnd-kit/core";

export const pointerFirstKanbanCollision: CollisionDetection = (args) => {
  const pointerCollisions = pointerWithin(args);

  return pointerCollisions.length > 0 ? pointerCollisions : closestCenter(args);
};
