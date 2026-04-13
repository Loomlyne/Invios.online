"use client";

import type { ReactNode } from "react";
import { useDroppable } from "@dnd-kit/core";
import { cn } from "@/lib/utils";

export function DroppableColumn({
  id,
  children,
}: {
  id: string;
  children: ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "transition-colors duration-150",
        isOver && "[&>div>div:last-child]:border-border-brand [&>div>div:last-child]:bg-surface-subtle/50",
      )}
    >
      {children}
    </div>
  );
}
