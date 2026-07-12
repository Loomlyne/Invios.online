"use client";

import { useState, useRef, useEffect } from "react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { ChevronDown, Clipboard, ClipboardCheck, FileImage, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";

type CopyState = "idle" | "loading" | "done" | "error";

const ITEM_CLASS =
  "flex w-full cursor-pointer items-center gap-2.5 rounded-[0.6rem] px-3 py-2.5 text-sm text-foreground outline-none transition hover:bg-[#FFF7EA] focus:bg-[#FFF7EA] data-[highlighted]:bg-[#FFF7EA] data-[disabled]:opacity-60 data-[disabled]:pointer-events-none";

export function ExportButton({ invoiceId, invoiceNumber }: { invoiceId: string; invoiceNumber: string }) {
  const [open, setOpen] = useState(false);
  const [copyState, setCopyState] = useState<CopyState>("idle");
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Clean up reset timer on unmount
  useEffect(() => () => { if (resetTimer.current) clearTimeout(resetTimer.current); }, []);

  async function handleCopyAsImage() {
    if (copyState === "loading") return;
    setCopyState("loading");
    try {
      const res = await fetch(`/api/invoices/${invoiceId}/png`);
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
    <DropdownMenu.Root open={open} onOpenChange={setOpen}>
      <DropdownMenu.Trigger asChild>
        <Button variant="secondary" size="sm">
          Export
          <ChevronDown className={`size-3.5 transition ${open ? "rotate-180" : ""}`} />
        </Button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={6}
          className="z-50 w-48 rounded-[1rem] border border-border bg-white p-1.5 shadow-[0_16px_48px_rgba(19,15,11,0.12)]"
        >
          <DropdownMenu.Item asChild className={ITEM_CLASS}>
            <a
              href={`/api/invoices/${invoiceId}/pdf`}
              download={`${invoiceNumber}.pdf`}
            >
              <FileText className="size-4 text-muted" />
              Export as PDF
            </a>
          </DropdownMenu.Item>
          <DropdownMenu.Item asChild className={ITEM_CLASS}>
            <a
              href={`/api/invoices/${invoiceId}/png`}
              download={`${invoiceNumber}.png`}
            >
              <FileImage className="size-4 text-muted" />
              Export as PNG
            </a>
          </DropdownMenu.Item>
          <DropdownMenu.Item
            disabled={copyState === "loading"}
            onSelect={() => handleCopyAsImage()}
            className={ITEM_CLASS}
          >
            {copyIcon}
            {copyLabel}
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
