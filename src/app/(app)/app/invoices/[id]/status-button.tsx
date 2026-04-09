"use client";

import { useState, useRef, useEffect, useCallback, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { setInvoiceStatusAction } from "@/actions/invoices";
import type { InvoiceStatus } from "@/lib/billing";

const STATUS_LABELS: Record<InvoiceStatus, string> = {
  draft: "Draft",
  sent: "Sent",
  partial_paid: "Partial Paid",
  paid: "Paid",
  overpaid: "Overpaid",
  overdue: "Overdue",
};

const ALL_STATUSES: InvoiceStatus[] = ["draft", "sent", "partial_paid", "paid", "overpaid", "overdue"];

export function StatusButton({
  invoiceId,
  currentStatus,
}: {
  invoiceId: string;
  currentStatus: InvoiceStatus;
}) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const handleClickOutside = useCallback((e: MouseEvent) => {
    if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
  }, []);

  useEffect(() => {
    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open, handleClickOutside]);

  const handleSelect = (status: InvoiceStatus) => {
    setOpen(false);
    if (status === currentStatus) return;
    startTransition(async () => {
      try {
        await setInvoiceStatusAction(invoiceId, status);
        router.refresh();
      } catch {
        // no-op — action throws on error
      }
    });
  };

  return (
    <div ref={ref} className="relative">
      <Button
        variant="secondary"
        size="sm"
        onClick={() => setOpen(!open)}
        disabled={isPending}
      >
        {STATUS_LABELS[currentStatus]}
        <ChevronDown className={`size-3.5 transition ${open ? "rotate-180" : ""}`} />
      </Button>
      {open ? (
        <div className="absolute right-0 top-[calc(100%+6px)] z-50 w-44 rounded-[1rem] border border-border bg-white p-1.5 shadow-[0_16px_48px_rgba(19,15,11,0.12)]">
          {ALL_STATUSES.map((status) => (
            <button
              key={status}
              onClick={() => handleSelect(status)}
              className="flex w-full items-center gap-2.5 rounded-[0.6rem] px-3 py-2.5 text-sm text-foreground transition hover:bg-[#FFF7EA]"
            >
              <Check
                className={`size-3.5 shrink-0 ${status === currentStatus ? "opacity-100" : "opacity-0"}`}
              />
              {STATUS_LABELS[status]}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
