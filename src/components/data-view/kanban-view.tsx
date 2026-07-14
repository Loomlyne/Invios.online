"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Route } from "next";
import type { ReactNode } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragCancelEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import { AlertCircle, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { DraggableCard } from "./draggable-card";
import { DroppableColumn } from "./droppable-column";
import { pointerFirstKanbanCollision } from "./kanban-collision";
import { centerDragOverlayOnCursorModifier } from "./cursor-centered-overlay";
import {
  applyKanbanStatusChange,
  createKanbanUndo,
  isKanbanUndoEditingTarget,
  reconcileKanbanUndo,
  type KanbanUndo,
} from "./kanban-state";
import type { DataViewConfig } from "./types";

export function KanbanView<TItem extends { id: string; status: TStatus }, TStatus extends string>({
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
  const router = useRouter();
  const [items, setItems] = useState(initialItems);
  const [activeItem, setActiveItem] = useState<TItem | null>(null);
  const [lastUndo, setLastUndo] = useState<KanbanUndo<TStatus> | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [activeColIndex, setActiveColIndex] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const columnRefs = useRef<(HTMLDivElement | null)[]>([]);
  const confirmedItemsRef = useRef(initialItems);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  );

  useEffect(() => {
    confirmedItemsRef.current = initialItems;
    setItems(initialItems);
    setLastUndo((currentUndo) => reconcileKanbanUndo(initialItems, currentUndo));
  }, [initialItems]);

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

  const persistStatusChange = useCallback(
    async (change: KanbanUndo<TStatus>, direction: "forward" | "undo") => {
      const nextStatus = direction === "forward" ? change.to : change.from;
      const previousItems = confirmedItemsRef.current;

      setUpdateError(null);
      setIsUpdating(true);
      setItems((current) => applyKanbanStatusChange(current, change.id, nextStatus));

      try {
        await onStatusChange?.(change.id, nextStatus);
        confirmedItemsRef.current = applyKanbanStatusChange(previousItems, change.id, nextStatus);
        const reversible = !config.isReversible || config.isReversible(change.from, change.to);
        setLastUndo(direction === "forward" && reversible ? change : null);
      } catch {
        setItems(previousItems);
        setUpdateError("This move was not saved. Your board has been restored.");
        router.refresh();
      } finally {
        setIsUpdating(false);
      }
    },
    [onStatusChange, router],
  );

  const handleUndo = useCallback(() => {
    if (!lastUndo || isUpdating) return;
    void persistStatusChange(lastUndo, "undo");
  }, [isUpdating, lastUndo, persistStatusChange]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const isUndoShortcut = (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "z";
      const target = event.target as HTMLElement | null;
      const isEditing = isKanbanUndoEditingTarget(target);

      if (!isUndoShortcut || event.shiftKey || isEditing || !lastUndo || isUpdating) return;

      event.preventDefault();
      handleUndo();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleUndo, isUpdating, lastUndo]);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      setActiveItem(null);
      if (isUpdating) return;

      const { active, over } = event;
      const itemId = active.id as string;
      const newStatus = config.kanbanColumns.find((column) => column.status === over?.id)?.status;
      if (!newStatus) return;

      const item = items.find((candidate) => config.getId(candidate) === itemId);
      if (!item || (config.canChangeStatus && !config.canChangeStatus(item, newStatus))) {
        return;
      }

      const change = createKanbanUndo(items, itemId, newStatus);
      if (!change) return;

      void persistStatusChange(change, "forward");
    },
    [config.kanbanColumns, isUpdating, items, persistStatusChange],
  );

  const handleDragCancel = useCallback((_event: DragCancelEvent) => {
    setActiveItem(null);
  }, []);

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
      collisionDetection={pointerFirstKanbanCollision}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div
        ref={scrollRef}
        className="overflow-x-auto pb-2 overscroll-x-contain"
      >
        <div className="inline-flex gap-3 snap-x snap-mandatory">
          {config.kanbanColumns.map((col, colIdx) => {
            const colItems = grouped.get(col.status) ?? [];
            const canDropHere = !activeItem || !config.canChangeStatus || config.canChangeStatus(activeItem, col.status);

            return (
              <div
                key={col.status}
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
                        aria-label={`Add new item to ${col.label}`}
                        className="flex size-5 items-center justify-center rounded-md text-muted/60 transition-colors hover:bg-black/5 hover:text-foreground"
                      >
                        <Plus className="size-3.5" />
                      </Link>
                    ) : null}
                  </div>
                </div>

                <DroppableColumn id={col.status} disabled={!canDropHere}>
                    {colItems.length === 0 ? (
                      <div className="flex flex-1 items-center justify-center">
                        <p className="text-xs text-muted">No items</p>
                      </div>
                    ) : (
                      colItems.map((item) => (
                        <DraggableCard
                          key={config.getId(item)}
                          id={config.getId(item)}
                          disabled={isUpdating}
                        >
                          <Link
                            href={config.getHref(item) as Route}
                            className="block cursor-pointer rounded-[1rem] border border-black/7 bg-white px-4 py-3 shadow-[0_1px_3px_rgba(0,0,0,0.04)] transition hover:border-border-brand hover:shadow-[0_2px_8px_rgba(0,0,0,0.06)]"
                            onClick={(e) => {
                              if (activeItem) e.preventDefault();
                            }}
                          >
                            {config.renderKanbanCard(item)}
                          </Link>
                        </DraggableCard>
                      ))
                    )}
                </DroppableColumn>
              </div>
            );
          })}
        </div>
      </div>

      {updateError ? (
        <div role="alert" className="mt-3 flex items-start gap-2 rounded-[var(--radius-inner)] border border-danger/25 bg-red-50 px-4 py-3 text-sm text-danger">
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          <p>{updateError}</p>
        </div>
      ) : null}

      {lastUndo ? (
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius-inner)] border border-border-brand bg-surface-subtle px-4 py-3">
          <p className="text-sm text-muted-strong">
            Moved card to {config.kanbanColumns.find((column) => column.status === lastUndo.to)?.label ?? "a new column"}.
            <span className="ml-2 font-medium text-foreground">Press ⌘/Ctrl + Z to undo.</span>
          </p>
          <Button type="button" size="sm" variant="secondary" onClick={handleUndo} disabled={isUpdating}>
            Undo move
          </Button>
        </div>
      ) : null}

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
      <DragOverlay
        adjustScale={false}
        dropAnimation={null}
        modifiers={[centerDragOverlayOnCursorModifier]}
      >
        {activeItem ? (
          <div className="pointer-events-none w-[min(280px,85vw)] rounded-[1rem] border border-[#D7C4A7] bg-white px-4 py-3 shadow-[0_14px_32px_rgba(0,0,0,0.16)] opacity-95 -rotate-1">
            {config.renderKanbanCard(activeItem)}
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
