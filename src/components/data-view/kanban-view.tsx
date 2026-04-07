"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import type { Route } from "next";
import type { ReactNode } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import { Badge } from "@/components/ui/badge";
import { DraggableCard } from "./draggable-card";
import { DroppableColumn } from "./droppable-column";
import type { DataViewConfig } from "./types";

export function KanbanView<TItem, TStatus extends string>({
  items: initialItems,
  config,
  emptyState,
  onStatusChange,
}: {
  items: TItem[];
  config: DataViewConfig<TItem, TStatus>;
  emptyState: ReactNode;
  onStatusChange?: (id: string, newStatus: TStatus) => Promise<void>;
}) {
  const [items, setItems] = useState(initialItems);
  const [activeItem, setActiveItem] = useState<TItem | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  );

  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      const item = items.find((i) => config.getId(i) === event.active.id);
      if (item) setActiveItem(item);
    },
    [items, config],
  );

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      setActiveItem(null);
      const { active, over } = event;
      if (!over) return;

      const itemId = active.id as string;
      const newStatus = over.id as TStatus;
      const item = items.find((i) => config.getId(i) === itemId);
      if (!item || config.getStatus(item) === newStatus) return;

      // Optimistic update
      setItems((prev) =>
        prev.map((i) => {
          if (config.getId(i) !== itemId) return i;
          // Shallow clone with new status
          return { ...i, status: newStatus };
        }),
      );

      if (onStatusChange) {
        try {
          await onStatusChange(itemId, newStatus);
        } catch {
          // Revert on failure
          setItems(initialItems);
        }
      }
    },
    [items, config, onStatusChange, initialItems],
  );

  if (items.length === 0) {
    return <div className="py-4">{emptyState}</div>;
  }

  const grouped = new Map<TStatus, TItem[]>();
  for (const col of config.kanbanColumns) {
    grouped.set(col.status, []);
  }
  for (const item of items) {
    const status = config.getStatus(item);
    const bucket = grouped.get(status);
    if (bucket) bucket.push(item);
  }

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="overflow-x-auto pb-2">
        <div className="inline-flex gap-3 snap-x snap-mandatory">
          {config.kanbanColumns.map((col) => {
            const colItems = grouped.get(col.status) ?? [];
            return (
              <DroppableColumn key={col.status} id={col.status}>
                <div className="w-[260px] shrink-0 snap-start flex flex-col gap-2">
                  {/* Column header */}
                  <div className="flex items-center justify-between px-1 py-1.5">
                    <div className="flex items-center gap-2">
                      <span
                        className="size-2.5 rounded-full shrink-0"
                        style={{ background: col.color ?? "#d4c5a9" }}
                      />
                      <span className="text-xs font-semibold uppercase tracking-wider text-muted-strong">
                        {col.label}
                      </span>
                    </div>
                    <span className="text-xs font-medium text-muted tabular-nums">
                      {colItems.length}
                    </span>
                  </div>

                  {/* Cards container */}
                  <div className="min-h-[120px] rounded-[1.25rem] border border-black/5 bg-black/[0.02] p-2 flex flex-col gap-2">
                    {colItems.length === 0 ? (
                      <div className="flex flex-1 items-center justify-center">
                        <p className="text-xs text-muted/60">No items</p>
                      </div>
                    ) : (
                      colItems.map((item) => (
                        <DraggableCard key={config.getId(item)} id={config.getId(item)}>
                          <Link
                            href={config.getHref(item) as Route}
                            className="block cursor-pointer rounded-[1rem] border border-black/7 bg-white px-4 py-3 shadow-[0_1px_3px_rgba(0,0,0,0.04)] transition hover:border-[#D7C4A7] hover:shadow-[0_2px_8px_rgba(0,0,0,0.06)]"
                            onClick={(e) => {
                              // Prevent navigation when dragging
                              if (activeItem) e.preventDefault();
                            }}
                          >
                            {config.renderKanbanCard(item)}
                          </Link>
                        </DraggableCard>
                      ))
                    )}
                  </div>
                </div>
              </DroppableColumn>
            );
          })}
        </div>
      </div>

      {/* Drag overlay */}
      <DragOverlay dropAnimation={null}>
        {activeItem ? (
          <div className="rounded-[1rem] border border-[#D7C4A7] bg-white px-4 py-3 shadow-[0_8px_24px_rgba(0,0,0,0.12)] opacity-90 rotate-[2deg] w-[240px]">
            {config.renderKanbanCard(activeItem)}
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
