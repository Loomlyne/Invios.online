import { ArrowRight } from "lucide-react";
import { DocumentStatusBadge } from "@/components/documents/document-status-badge";
import { formatCurrency } from "@/lib/utils";
import type { QuotationRecord, QuotationStatus } from "@/lib/billing";
import type { DataViewConfig } from "../types";

export const quotationConfig: DataViewConfig<QuotationRecord, QuotationStatus> = {
  getId: (q) => q.id,
  getHref: (q) => `/app/quotations/${q.slug}`,
  getStatus: (q) => q.status,
  canChangeStatus: (q, status) =>
    q.convertedToInvoiceId === null || status === q.status,

  statusOptions: [
    { value: "all", label: "All statuses" },
    { value: "draft", label: "Draft" },
    { value: "sent", label: "Sent" },
    { value: "accepted", label: "Accepted" },
    { value: "rejected", label: "Rejected" },
    { value: "expired", label: "Expired" },
  ],

  searchPlaceholder: "Search quotation or client",

  kanbanColumns: [
    { status: "draft", label: "Draft", color: "#9ca3af" },
    { status: "sent", label: "Sent", color: "#2563eb" },
    { status: "accepted", label: "Accepted", color: "#d7c4a7" },
    { status: "rejected", label: "Rejected", color: "#dc2626" },
    { status: "expired", label: "Expired", color: "#6b7280" },
  ],

  getAddUrl: () => `/app/quotations/new`,

  tableColumns: [
    {
      key: "quotationNumber",
      label: "Quotation #",
      render: (q) => (
        <span className="font-semibold text-foreground">{q.quotationNumber}</span>
      ),
      sortable: true,
      compare: (a, b) => a.quotationNumber.localeCompare(b.quotationNumber),
    },
    {
      key: "client",
      label: "Client",
      render: (q) => (
        <div>
          <p className="font-medium text-foreground">{q.client.name}</p>
          {q.client.company && (
            <p className="text-xs text-muted">{q.client.company}</p>
          )}
        </div>
      ),
      className: "min-w-[160px]",
    },
    {
      key: "status",
      label: "Status",
      render: (q) => <DocumentStatusBadge status={q.status} />,
    },
    {
      key: "quotationDate",
      label: "Scoped",
      render: (q) => <span className="text-muted">{q.quotationDate}</span>,
      sortable: true,
      compare: (a, b) => a.quotationDate.localeCompare(b.quotationDate),
    },
    {
      key: "expiryDate",
      label: "Expires",
      render: (q) => <span className="text-muted">{q.expiryDate}</span>,
      sortable: true,
      compare: (a, b) => a.expiryDate.localeCompare(b.expiryDate),
    },
    {
      key: "total",
      label: "Total",
      render: (q) => (
        <span className="font-semibold text-foreground">
          {formatCurrency(q.total, q.currency)}
        </span>
      ),
      sortable: true,
      compare: (a, b) => a.total - b.total,
      className: "text-right",
    },
  ],

  renderListCard: (q) => (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
      <div>
        <div className="flex flex-wrap items-center gap-3">
          <p className="text-lg font-semibold text-foreground">{q.quotationNumber}</p>
          <DocumentStatusBadge status={q.status} />
        </div>
        <p className="mt-2 text-sm leading-7 text-muted-strong">
          {q.client.name}
          {q.client.company ? ` · ${q.client.company}` : ""}
        </p>
        <p className="text-sm text-muted">
          Scoped {q.quotationDate} · Expires {q.expiryDate}
        </p>
      </div>
      <div className="flex items-center gap-4">
        <div className="text-right">
          <p className="text-sm text-muted">Total</p>
          <p className="text-base font-semibold text-foreground">
            {formatCurrency(q.total, q.currency)}
          </p>
        </div>
        <ArrowRight className="size-4 text-muted" />
      </div>
    </div>
  ),

  renderKanbanCard: (q) => (
    <div className="flex flex-col gap-2">
      <div className="flex items-start justify-between gap-2">
        <p className="min-w-0 text-sm font-semibold text-foreground leading-tight">
          {q.quotationNumber}
        </p>
        <DocumentStatusBadge status={q.status} className="shrink-0 whitespace-nowrap" />
      </div>
      <p className="text-xs text-muted-strong truncate">{q.client.name}</p>
      <p className="text-sm font-medium text-foreground">
        {formatCurrency(q.total, q.currency)}
      </p>
      <p className="text-xs text-muted">Expires {q.expiryDate}</p>
    </div>
  ),
};
