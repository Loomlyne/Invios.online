"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { ChevronDown, Clipboard, ClipboardCheck, FileImage, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { exportCurrentDocumentAsPdf, preloadFastPdfExporter } from "@/lib/client-pdf";

type CopyState = "idle" | "loading" | "done" | "error";
type PdfState = "idle" | "loading" | "done" | "fallback";

export function ExportButton({ quotationId, quotationNumber }: { quotationId: string; quotationNumber: string }) {
  const [open, setOpen] = useState(false);
  const [copyState, setCopyState] = useState<CopyState>("idle");
  const [pdfState, setPdfState] = useState<PdfState>("idle");
  const [pdfElapsedMs, setPdfElapsedMs] = useState<number | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pdfResetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleClickOutside = useCallback((e: MouseEvent) => {
    if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
  }, []);

  useEffect(() => {
    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open, handleClickOutside]);

  useEffect(() => {
    const preloadTimer = setTimeout(preloadFastPdfExporter, 250);

    return () => {
      clearTimeout(preloadTimer);
      if (resetTimer.current) clearTimeout(resetTimer.current);
      if (pdfResetTimer.current) clearTimeout(pdfResetTimer.current);
    };
  }, []);

  function downloadServerPdf() {
    const link = document.createElement("a");
    link.href = `/api/quotations/${quotationId}/pdf`;
    link.download = `${quotationNumber}.pdf`;
    document.body.appendChild(link);
    link.click();
    link.remove();
  }

  async function handleExportPdf() {
    if (pdfState === "loading") return;
    setOpen(false);
    setPdfState("loading");

    try {
      const elapsedMs = await exportCurrentDocumentAsPdf(`${quotationNumber}.pdf`);
      setPdfElapsedMs(elapsedMs);
      setPdfState("done");
    } catch {
      setPdfElapsedMs(null);
      setPdfState("fallback");
      downloadServerPdf();
    }

    pdfResetTimer.current = setTimeout(() => {
      setPdfState("idle");
      setPdfElapsedMs(null);
    }, 3_000);
  }

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

  const pdfLabel = pdfState === "loading"
    ? "Preparing PDF…"
    : pdfState === "done"
    ? `Saved in ${((pdfElapsedMs ?? 0) / 1_000).toFixed(1)}s`
    : pdfState === "fallback"
    ? "Using server PDF…"
    : "Export as PDF";

  return (
    <div ref={ref} className="relative">
      <Button variant="secondary" size="sm" onClick={() => setOpen(!open)}>
        Export
        <ChevronDown className={`size-3.5 transition ${open ? "rotate-180" : ""}`} />
      </Button>
      {open ? (
        <div className="absolute right-0 top-[calc(100%+6px)] z-50 w-48 rounded-[1rem] border border-border bg-white p-1.5 shadow-[0_16px_48px_rgba(19,15,11,0.12)]">
          <button
            type="button"
            disabled={pdfState === "loading"}
            onClick={() => void handleExportPdf()}
            className="flex w-full items-center gap-2.5 rounded-[0.6rem] px-3 py-2.5 text-left text-sm text-foreground transition hover:bg-[#FFF7EA] disabled:opacity-60"
          >
            <FileText className="size-4 text-muted" />
            {pdfLabel}
          </button>
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
