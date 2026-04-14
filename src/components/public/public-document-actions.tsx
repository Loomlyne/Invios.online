interface PublicDocumentActionsProps {
  shareToken: string;
  documentKind: "invoice" | "quotation";
  invoiceId?: string;
  invoiceNumber?: string;
}

export function PublicDocumentActions({
  documentKind,
  invoiceId,
  invoiceNumber,
}: PublicDocumentActionsProps) {
  const href =
    documentKind === "invoice" && invoiceId
      ? `/api/invoices/${invoiceId}/pdf`
      : null;

  const filename = invoiceNumber ? `${invoiceNumber}.pdf` : "document.pdf";

  if (!href) return null;

  return (
    <>
      {/* Mobile sticky button */}
      <div className="fixed bottom-4 left-4 right-4 z-50 lg:hidden">
        <a
          href={href}
          download={filename}
          className="flex h-14 w-full items-center justify-center rounded-full bg-accent text-sm font-medium text-[#1C1917] shadow-[0_18px_45px_rgba(202,138,4,0.24)] transition-transform hover:-translate-y-0.5 hover:bg-[#DEA325]"
        >
          Download PDF
        </a>
      </div>

      {/* Desktop block button */}
      <div className="mt-6 hidden lg:block">
        <a
          href={href}
          download={filename}
          className="inline-flex h-12 items-center justify-center rounded-full bg-accent px-6 text-sm font-medium text-[#1C1917] shadow-[0_18px_45px_rgba(202,138,4,0.24)] transition-transform hover:-translate-y-0.5 hover:bg-[#DEA325]"
        >
          Download PDF
        </a>
      </div>
    </>
  );
}
