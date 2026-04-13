"use client";

import { useState, useCallback, useRef, useEffect } from "react";
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
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";
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
  const [activeColIndex, setActiveColIndex] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const columnRefs = useRef<(HTMLDivElement | null)[]>([]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  );

  // Track active column via IntersectionObserver for dot indicators
  useEffect(() => {
    const cols = columnRefs.current.filter(Boolean) as HTMLDivElement[];
    if (cols.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const idx = cols.indexOf(entry.target as HTMLDivElement);
            if (idx !== -1) setActiveColIndex(idx);
          }
        }
      },
      {
        root: scrollRef.current,
        threshold: 0.6,
      },
    );

    for (const col of cols) observer.observe(col);
    return () => observer.disconnect();
  }, [items, config.kanbanColumns]);

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

      setItems((prev) =>
        prev.map((i) => {
          if (config.getId(i) !== itemId) return i;
          return { ...i, status: newStatus };
        }),
      );

      if (onStatusChange) {
        try {
          await onStatusChange(itemId, newStatus);
        } catch {
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
      <div
        ref={scrollRef}
        className="overflow-x-auto pb-2 overscroll-x-contain"
      >
        <div className="inline-flex gap-3 snap-x snap-mandatory">
          {config.kanbanColumns.map((col, colIdx) => {
            const colItems = grouped.get(col.status) ?? [];
            return (
              <DroppableColumn key={col.status} id={col.status}>
                <div
                  ref={(el) => { columnRefs.current[colIdx] = el; }}
                  className="w-[min(280px,85vw)] shrink-0 snap-start flex flex-col gap-2"
                >
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
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-medium text-muted tabular-nums">
                        {colItems.length}
                      </span>
                      {config.getAddUrl ? (
                        <Link
                          href={config.getAddUrl(col.status) as Route}
                          className="flex size-5 items-center justify-center rounded-md text-muted/60 transition-colors hover:bg-black/5 hover:text-foreground"
                        >
                          <Plus className="size-3.5" />
                        </Link>
                      ) : null}
                    </div>
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

      {/* Dot indicators — mobile only */}
      {config.kanbanColumns.length > 1 && (
        <div
          role="tablist"
          aria-label="Kanban columns"
          className="mt-3 flex justify-center gap-1.5 lg:hidden"
        >
          {config.kanbanColumns.map((col, idx) => (
            <button
              key={col.status}
              role="tab"
              aria-selected={idx === activeColIndex}
              aria-label={col.label}
              onClick={() => {
                columnRefs.current[idx]?.scrollIntoView({
                  behavior: "smooth",
                  inline: "start",
                  block: "nearest",
                });
              }}
              className={cn(
                "h-1.5 rounded-full transition-all duration-200",
                idx === activeColIndex
                  ? "w-4 bg-accent"
                  : "w-1.5 bg-foreground/15 hover:bg-foreground/30",
              )}
            />
          ))}
        </div>
      )}

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
