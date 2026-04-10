import { DocumentStatusBadge } from "@/components/documents/document-status-badge";

interface PortalDocumentRowProps {
  href: string;
  documentNumber: string;
  status: string;
  date: string;
  total: string;
}

export function PortalDocumentRow({
  href,
  documentNumber,
  status,
  date,
  total,
}: PortalDocumentRowProps) {
  return (
    <a
      href={href}
      className="flex items-center justify-between border-b border-border py-4 px-0 transition-colors hover:bg-surface/50"
    >
      <div className="flex items-center gap-3">
        <span className="text-base font-semibold text-foreground">{documentNumber}</span>
        <DocumentStatusBadge status={status} />
      </div>
      <div className="flex items-center gap-4">
        <span className="text-sm text-muted">{date}</span>
        <span className="text-sm font-semibold text-foreground">{total}</span>
      </div>
    </a>
  );
}
