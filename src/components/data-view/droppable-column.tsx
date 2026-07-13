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
        "flex min-h-[120px] flex-col gap-2 rounded-[1.25rem] border border-black/5 bg-black/[0.02] p-2 transition-colors duration-150",
        isOver && "border-border-brand bg-surface-subtle/70 ring-2 ring-accent/20",
      )}
    >
      {children}
    </div>
  );
}
