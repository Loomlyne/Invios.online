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
