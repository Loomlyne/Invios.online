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
        isOver && "[&>div>div:last-child]:border-[#D7C4A7] [&>div>div:last-child]:bg-[#FFF8EE]/50",
      )}
    >
      {children}
    </div>
  );
}
