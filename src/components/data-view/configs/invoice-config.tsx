import { ArrowRight } from "lucide-react";
import { DocumentStatusBadge } from "@/components/documents/document-status-badge";
import { formatCurrency } from "@/lib/utils";
import type { InvoiceRecord, InvoiceStatus } from "@/lib/billing";
import type { DataViewConfig } from "../types";

export const invoiceConfig: DataViewConfig<InvoiceRecord, InvoiceStatus> = {
  getId: (inv) => inv.id,
  getHref: (inv) => `/app/invoices/${inv.id}`,
  getStatus: (inv) => inv.status,

  statusOptions: [
    { value: "all", label: "All statuses" },
    { value: "draft", label: "Draft" },
    { value: "sent", label: "Sent" },
    { value: "partial_paid", label: "Partial paid" },
    { value: "paid", label: "Paid" },
    { value: "overdue", label: "Overdue" },
  ],

  searchPlaceholder: "Search invoice or client",

  kanbanColumns: [
    { status: "draft", label: "Draft" },
    { status: "sent", label: "Sent" },
    { status: "partial_paid", label: "Partial Paid" },
    { status: "paid", label: "Paid", color: "#059669" },
    { status: "overdue", label: "Overdue", color: "#b45309" },
  ],

  tableColumns: [
    {
      key: "invoiceNumber",
      label: "Invoice #",
      render: (inv) => (
        <span className="font-semibold text-foreground">{inv.invoiceNumber}</span>
      ),
      sortable: true,
      compare: (a, b) => a.invoiceNumber.localeCompare(b.invoiceNumber),
    },
    {
      key: "client",
      label: "Client",
      render: (inv) => (
        <div>
          <p className="font-medium text-foreground">{inv.client.name}</p>
          {inv.client.company && (
            <p className="text-xs text-muted">{inv.client.company}</p>
          )}
        </div>
      ),
      className: "min-w-[160px]",
    },
    {
      key: "status",
      label: "Status",
      render: (inv) => <DocumentStatusBadge status={inv.status} />,
    },
    {
      key: "issueDate",
      label: "Issued",
      render: (inv) => <span className="text-muted">{inv.issueDate}</span>,
      sortable: true,
      compare: (a, b) => a.issueDate.localeCompare(b.issueDate),
    },
    {
      key: "dueDate",
      label: "Due",
      render: (inv) => <span className="text-muted">{inv.dueDate}</span>,
      sortable: true,
      compare: (a, b) => a.dueDate.localeCompare(b.dueDate),
    },
    {
      key: "total",
      label: "Total",
      render: (inv) => (
        <span className="font-semibold text-foreground">
          {formatCurrency(inv.total, inv.currency)}
        </span>
      ),
      sortable: true,
      compare: (a, b) => a.total - b.total,
      className: "text-right",
    },
  ],

  renderListCard: (inv) => (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
      <div>
        <div className="flex flex-wrap items-center gap-3">
          <p className="text-lg font-semibold text-foreground">{inv.invoiceNumber}</p>
          <DocumentStatusBadge status={inv.status} />
        </div>
        <p className="mt-2 text-sm leading-7 text-muted-strong">
          {inv.client.name}
          {inv.client.company ? ` · ${inv.client.company}` : ""}
        </p>
        <p className="text-sm text-muted">
          Issued {inv.issueDate} · Due {inv.dueDate}
        </p>
      </div>
      <div className="flex items-center gap-4">
        <div className="text-right">
          <p className="text-sm text-muted">Total</p>
          <p className="text-base font-semibold text-foreground">
            {formatCurrency(inv.total, inv.currency)}
          </p>
        </div>
        <ArrowRight className="size-4 text-muted" />
      </div>
    </div>
  ),

  renderKanbanCard: (inv) => (
    <div className="flex flex-col gap-2">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-semibold text-foreground leading-tight">
          {inv.invoiceNumber}
        </p>
        <DocumentStatusBadge status={inv.status} />
      </div>
      <p className="text-xs text-muted-strong truncate">{inv.client.name}</p>
      <p className="text-sm font-medium text-foreground">
        {formatCurrency(inv.total, inv.currency)}
      </p>
      <p className="text-xs text-muted">Due {inv.dueDate}</p>
    </div>
  ),
};
