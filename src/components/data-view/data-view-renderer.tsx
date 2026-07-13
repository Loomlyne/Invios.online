"use client";

import { useCallback } from "react";
import type { ReactNode } from "react";
import { ListView } from "./list-view";
import { KanbanView } from "./kanban-view";
import { TableView } from "./table-view";
import { invoiceConfig } from "./configs/invoice-config";
import { clientConfig } from "./configs/client-config";
import { quotationConfig } from "./configs/quotation-config";
import { updateDocumentStatusAction } from "@/actions/status";
import type { ViewMode } from "./types";

export type ConfigKey = "invoice" | "client" | "quotation";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const configs: Record<ConfigKey, any> = {
  invoice: invoiceConfig,
  client: clientConfig,
  quotation: quotationConfig,
};

const tableMap: Record<ConfigKey, "invoices" | "quotations" | "clients"> = {
  invoice: "invoices",
  client: "clients",
  quotation: "quotations",
};

export function DataViewRenderer({
  items,
  configKey,
  view,
  emptyState,
}: {
  items: Array<{ id: string; status: string }>;
  configKey: ConfigKey;
  view: ViewMode;
  emptyState: ReactNode;
}) {
  const config = configs[configKey];

  const handleStatusChange = useCallback(
    async (id: string, newStatus: string) => {
      const result = await updateDocumentStatusAction(
        tableMap[configKey],
        id,
        newStatus,
      );
      if (!result.ok) {
        throw new Error(result.error);
      }
    },
    [configKey],
  );

  if (view === "kanban") {
    return (
      <KanbanView
        items={items}
        config={config}
        emptyState={emptyState}
        onStatusChange={handleStatusChange}
      />
    );
  }
  if (view === "table") {
    return <TableView items={items} config={config} emptyState={emptyState} />;
  }
  return <ListView items={items} config={config} emptyState={emptyState} />;
}
