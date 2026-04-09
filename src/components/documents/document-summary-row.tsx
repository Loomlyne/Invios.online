import Link from "next/link";
import type { Route } from "next";
import { DocumentStatusBadge } from "@/components/documents/document-status-badge";

interface DocumentSummaryRowProps {
  href: string;
  documentNumber: string;
  subtitle: string;
  status: string;
  amount?: string;
}

export function DocumentSummaryRow({
  href,
  documentNumber,
  subtitle,
  status,
  amount,
}: DocumentSummaryRowProps) {
  return (
    <Link
      href={href as Route}
      className="rounded-[1rem] border border-black/7 bg-[#FFF8EE] px-4 py-4 transition hover:border-[#D7C4A7] hover:bg-[#FFF4E3]"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-foreground">{documentNumber}</p>
          <p className="mt-1 text-sm text-muted-strong">{subtitle}</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {amount ? (
            <span className="text-sm font-semibold text-foreground">{amount}</span>
          ) : null}
          <DocumentStatusBadge status={status} />
        </div>
      </div>
    </Link>
  );
}
