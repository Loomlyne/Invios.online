"use client";

import { MessageCircle } from "lucide-react";

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

  // We are already on the public page, so build the share URL from the current location.
  const currentUrl = typeof window !== "undefined" ? window.location.href : "";
  const whatsappHref = `https://wa.me/?text=${encodeURIComponent(`Document: ${currentUrl}`)}`;

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

      {/* Desktop block buttons */}
      <div className="mt-6 hidden flex-wrap gap-3 lg:flex">
        <a
          href={href}
          download={filename}
          className="inline-flex h-12 items-center justify-center rounded-full bg-accent px-6 text-sm font-medium text-[#1C1917] shadow-[0_18px_45px_rgba(202,138,4,0.24)] transition-transform hover:-translate-y-0.5 hover:bg-[#DEA325]"
        >
          Download PDF
        </a>
        <a
          href={whatsappHref}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-black/10 bg-white px-6 text-sm font-medium text-foreground transition-transform hover:-translate-y-0.5 hover:bg-black/3"
        >
          <MessageCircle className="size-4" />
          Forward on WhatsApp
        </a>
      </div>
    </>
  );
}
