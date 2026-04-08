import { ArrowRight } from "lucide-react";
import { ClientStatusBadge } from "@/components/clients/client-status-badge";
import type { ClientRecord, ClientStatus } from "@/lib/billing";
import type { DataViewConfig } from "../types";

export const clientConfig: DataViewConfig<ClientRecord, ClientStatus> = {
  getId: (client) => client.id,
  getHref: (client) => `/app/clients/${client.slug}`,
  getStatus: (client) => client.status,

  statusOptions: [
    { value: "all", label: "All statuses" },
    { value: "lead", label: "Lead" },
    { value: "in_review", label: "In Review" },
    { value: "approved", label: "Approved" },
    { value: "active", label: "Active" },
    { value: "rejected", label: "Rejected" },
    { value: "canceled", label: "Canceled" },
  ],

  searchPlaceholder: "Search name or company",

  kanbanColumns: [
    { status: "lead", label: "Lead", color: "#ca8a04" },
    { status: "in_review", label: "In Review", color: "#2563eb" },
    { status: "active", label: "Active", color: "#059669" },
    { status: "approved", label: "Approved", color: "#059669" },
    { status: "rejected", label: "Rejected", color: "#dc2626" },
    { status: "canceled", label: "Canceled", color: "#9ca3af" },
  ],

  getAddUrl: (status) => `?create=1&status=${status}&view=kanban`,

  tableColumns: [
    {
      key: "name",
      label: "Name",
      render: (client) => (
        <div className="flex items-center gap-2">
          <span className="font-semibold text-foreground">{client.name}</span>
          <ClientStatusBadge status={client.status} />
        </div>
      ),
      sortable: true,
      compare: (a, b) => a.name.localeCompare(b.name),
      className: "min-w-[180px]",
    },
    {
      key: "company",
      label: "Company",
      render: (client) => (
        <span className="text-muted">
          {client.company || "Independent client"}
        </span>
      ),
      className: "min-w-[140px]",
    },
    {
      key: "email",
      label: "Email",
      render: (client) => (
        <span className="text-muted">{client.email || "—"}</span>
      ),
      className: "min-w-[160px]",
    },
    {
      key: "phone",
      label: "Phone",
      render: (client) => (
        <span className="text-muted">{client.phone || "—"}</span>
      ),
    },
  ],

  renderListCard: (client) => (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <div className="flex flex-wrap items-center gap-3">
          <p className="text-lg font-semibold text-foreground">{client.name}</p>
          <ClientStatusBadge status={client.status} />
        </div>
        <p className="mt-2 text-sm text-muted-strong">
          {client.company || "Independent client"}
        </p>
        <p className="mt-3 text-sm leading-7 text-muted">
          {[client.email, client.phone].filter(Boolean).join(" · ") ||
            "No contact details yet"}
        </p>
      </div>
      <div className="flex items-center gap-2 text-sm font-medium text-foreground">
        Open detail
        <ArrowRight className="size-4" />
      </div>
    </div>
  ),

  renderKanbanCard: (client) => (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-semibold text-foreground leading-tight">
          {client.name}
        </p>
        <ClientStatusBadge status={client.status} />
      </div>
      <p className="text-xs text-muted-strong truncate">
        {client.company || "Independent client"}
      </p>
      {(client.email || client.phone) && (
        <p className="text-xs text-muted truncate">
          {[client.email, client.phone].filter(Boolean).join(" · ")}
        </p>
      )}
    </div>
  ),
};
