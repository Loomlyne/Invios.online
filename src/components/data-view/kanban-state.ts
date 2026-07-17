export interface KanbanItem<TStatus extends string = string> {
  id: string;
  status: TStatus;
}

export interface KanbanUndo<TStatus extends string> {
  id: string;
  from: TStatus;
  to: TStatus;
}

export function createKanbanUndo<TItem extends KanbanItem>(
  items: TItem[],
  id: string,
  to: TItem["status"],
): KanbanUndo<TItem["status"]> | null {
  const item = items.find((candidate) => candidate.id === id);

  if (!item || item.status === to) return null;

  return { id, from: item.status, to };
}

export function applyKanbanStatusChange<TItem extends KanbanItem>(
  items: TItem[],
  id: string,
  status: TItem["status"],
): TItem[] {
  return items.map((item) => (item.id === id ? { ...item, status } : item));
}

export function reconcileKanbanUndo<TStatus extends string>(
  items: KanbanItem<TStatus>[],
  undo: KanbanUndo<TStatus> | null,
): KanbanUndo<TStatus> | null {
  if (!undo) return null;

  const refreshedItem = items.find((item) => item.id === undo.id);
  return refreshedItem?.status === undo.to ? undo : null;
}

export function isKanbanUndoEditingTarget(
  target: Pick<HTMLElement, "tagName" | "isContentEditable"> | null,
) {
  return Boolean(
    target?.isContentEditable ||
      target?.tagName === "INPUT" ||
      target?.tagName === "TEXTAREA" ||
      target?.tagName === "SELECT",
  );
}
