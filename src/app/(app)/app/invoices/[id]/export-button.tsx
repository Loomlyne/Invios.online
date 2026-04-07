"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { ChevronDown, FileImage, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ExportButton({ invoiceId, invoiceNumber }: { invoiceId: string; invoiceNumber: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const handleClickOutside = useCallback((e: MouseEvent) => {
    if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
  }, []);

  useEffect(() => {
    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open, handleClickOutside]);

  return (
    <div ref={ref} className="relative">
      <Button variant="secondary" size="sm" onClick={() => setOpen(!open)}>
        Export
        <ChevronDown className={`size-3.5 transition ${open ? "rotate-180" : ""}`} />
      </Button>
      {open ? (
        <div className="absolute right-0 top-[calc(100%+6px)] z-50 w-44 rounded-[1rem] border border-border bg-white p-1.5 shadow-[0_16px_48px_rgba(19,15,11,0.12)]">
          <a
            href={`/api/invoices/${invoiceId}/pdf`}
            download={`${invoiceNumber}.pdf`}
            onClick={() => setOpen(false)}
            className="flex w-full items-center gap-2.5 rounded-[0.6rem] px-3 py-2.5 text-sm text-foreground transition hover:bg-[#FFF7EA]"
          >
            <FileText className="size-4 text-muted" />
            Export as PDF
          </a>
          <a
            href={`/api/invoices/${invoiceId}/png`}
            download={`${invoiceNumber}.png`}
            onClick={() => setOpen(false)}
            className="flex w-full items-center gap-2.5 rounded-[0.6rem] px-3 py-2.5 text-sm text-foreground transition hover:bg-[#FFF7EA]"
          >
            <FileImage className="size-4 text-muted" />
            Export as PNG
          </a>
        </div>
      ) : null}
    </div>
  );
}
