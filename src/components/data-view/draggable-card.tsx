"use client";

import type { ReactNode } from "react";
import { useDraggable } from "@dnd-kit/core";
import { GripVertical } from "lucide-react";
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
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    isDragging,
  } = useDraggable({
    id,
    disabled,
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "select-none rounded-[1rem] border border-black/7 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)] transition hover:border-border-brand hover:shadow-[0_2px_8px_rgba(0,0,0,0.06)]",
        isDragging && "opacity-30",
        disabled && "opacity-60",
      )}
    >
      <div className="flex items-stretch gap-1">
        <button
          type="button"
          ref={setActivatorNodeRef}
          {...listeners}
          {...attributes}
          aria-label="Drag card to another column"
          disabled={disabled}
          className={cn(
            "flex w-8 shrink-0 items-center justify-center rounded-l-[1rem] text-muted/50 transition-colors",
            "hover:bg-black/[0.03] hover:text-muted-strong",
            "cursor-grab active:cursor-grabbing touch-manipulation",
            disabled && "cursor-wait",
          )}
        >
          <GripVertical className="size-4" aria-hidden />
        </button>
        <div className="min-w-0 flex-1 py-3 pr-4">{children}</div>
      </div>
    </div>
  );
}