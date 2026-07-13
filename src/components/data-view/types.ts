import type { ReactNode } from "react";

export type ViewMode = "list" | "kanban" | "table";

export interface KanbanColumn<TStatus extends string> {
  status: TStatus;
  label: string;
  color?: string;
}

export interface TableColumn<TItem> {
  key: string;
  label: string;
  render: (item: TItem) => ReactNode;
  className?: string;
  sortable?: boolean;
  compare?: (a: TItem, b: TItem) => number;
}

export interface StatusOption {
  value: string;
  label: string;
}

export interface DataViewConfig<TItem, TStatus extends string> {
  getId: (item: TItem) => string;
  getHref: (item: TItem) => string;
  getStatus: (item: TItem) => TStatus;
  canChangeStatus?: (item: TItem, status: TStatus) => boolean;
  kanbanColumns: KanbanColumn<TStatus>[];
  tableColumns: TableColumn<TItem>[];
  statusOptions: StatusOption[];
  searchPlaceholder: string;
  renderListCard: (item: TItem) => ReactNode;
  renderKanbanCard: (item: TItem) => ReactNode;
  getAddUrl?: (status: TStatus) => string;
}
