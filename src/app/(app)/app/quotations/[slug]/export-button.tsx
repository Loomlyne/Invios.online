"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { ChevronDown, Clipboard, ClipboardCheck, FileImage, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";

type CopyState = "idle" | "loading" | "done" | "error";

export function ExportButton({ quotationId, quotationNumber }: { quotationId: string; quotationNumber: string }) {
  const [open, setOpen] = useState(false);
  const [copyState, setCopyState] = useState<CopyState>("idle");
  const ref = useRef<HTMLDivElement>(null);
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleClickOutside = useCallback((e: MouseEvent) => {
    if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
  }, []);

  useEffect(() => {
    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open, handleClickOutside]);

  useEffect(() => () => { if (resetTimer.current) clearTimeout(resetTimer.current); }, []);

  async function handleCopyAsImage() {
    if (copyState === "loading") return;
    setCopyState("loading");
    setOpen(false);
    try {
      const res = await fetch(`/api/quotations/${quotationId}/png`);
      if (!res.ok) throw new Error("PNG render failed");
      const blob = await res.blob();
      await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
      setCopyState("done");
    } catch {
      setCopyState("error");
    }
    resetTimer.current = setTimeout(() => setCopyState("idle"), 2000);
  }

  const copyIcon = copyState === "done"
    ? <ClipboardCheck className="size-4 text-green-600" />
    : <Clipboard className={`size-4 ${copyState === "error" ? "text-red-500" : "text-muted"}`} />;

  const copyLabel = copyState === "loading"
    ? "Copying…"
    : copyState === "done"
    ? "Copied!"
    : copyState === "error"
    ? "Copy failed"
    : "Copy as image";

  return (
    <div ref={ref} className="relative">
      <Button variant="secondary" size="sm" onClick={() => setOpen(!open)}>
        Export
        <ChevronDown className={`size-3.5 transition ${open ? "rotate-180" : ""}`} />
      </Button>
      {open ? (
        <div className="absolute right-0 top-[calc(100%+6px)] z-50 w-48 rounded-[1rem] border border-border bg-white p-1.5 shadow-[0_16px_48px_rgba(19,15,11,0.12)]">
          <a
            href={`/api/quotations/${quotationId}/pdf`}
            download={`${quotationNumber}.pdf`}
            onClick={() => setOpen(false)}
            className="flex w-full items-center gap-2.5 rounded-[0.6rem] px-3 py-2.5 text-sm text-foreground transition hover:bg-[#FFF7EA]"
          >
            <FileText className="size-4 text-muted" />
            Export as PDF
          </a>
          <a
            href={`/api/quotations/${quotationId}/png`}
            download={`${quotationNumber}.png`}
            onClick={() => setOpen(false)}
            className="flex w-full items-center gap-2.5 rounded-[0.6rem] px-3 py-2.5 text-sm text-foreground transition hover:bg-[#FFF7EA]"
          >
            <FileImage className="size-4 text-muted" />
            Export as PNG
          </a>
          <button
            onClick={handleCopyAsImage}
            disabled={copyState === "loading"}
            className="flex w-full items-center gap-2.5 rounded-[0.6rem] px-3 py-2.5 text-sm text-foreground transition hover:bg-[#FFF7EA] disabled:opacity-60"
          >
            {copyIcon}
            {copyLabel}
          </button>
        </div>
      ) : null}
    </div>
  );
}
