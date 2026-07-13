"use client";

import type { ReactNode } from "react";
import { useDraggable } from "@dnd-kit/core";
import { cn } from "@/lib/utils";

export function DraggableCard({
  id,
  children,
  disabled = false,
}: {
  id: string;
  children: ReactNode;
  disabled?: boolean;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id,
    disabled,
  });

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={cn(
        "touch-none select-none cursor-grab active:cursor-grabbing",
        isDragging && "opacity-30",
        disabled && "cursor-wait",
      )}
    >
      {children}
    </div>
  );
}
