"use client";

import type { ReactNode } from "react";
import { useDroppable } from "@dnd-kit/core";
import { cn } from "@/lib/utils";

export function DroppableColumn({
  id,
  header,
  children,
  disabled = false,
  className,
}: {
  id: string;
  header?: ReactNode;
  children: ReactNode;
  disabled?: boolean;
  className?: string;
}) {
  const { setNodeRef, isOver } = useDroppable({ id, disabled });

  return (
    <div
      ref={setNodeRef}
      data-kanban-drop-target={id}
      aria-disabled={disabled || undefined}
      className={cn("flex self-stretch flex-col gap-2", className, disabled && "opacity-45")}
    >
      {header}
      <div
        className={cn(
          "flex min-h-[120px] flex-1 flex-col gap-2 rounded-[1.25rem] border border-black/5 bg-black/[0.02] p-2 transition-colors duration-150",
          isOver && "border-border-brand bg-surface-subtle/70 ring-2 ring-accent/20",
        )}
      >
        {children}
      </div>
    </div>
  );
}
