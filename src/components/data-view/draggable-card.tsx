"use client";

import type { ReactNode } from "react";
import { useDraggable } from "@dnd-kit/core";
import { cn } from "@/lib/utils";

export function DraggableCard({
  id,
  children,
}: {
  id: string;
  children: ReactNode;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id,
  });

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={cn(
        "touch-none",
        isDragging && "opacity-30",
      )}
    >
      {children}
    </div>
  );
}
