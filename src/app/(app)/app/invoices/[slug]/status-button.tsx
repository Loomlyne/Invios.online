"use client";

import { useState, useTransition, useOptimistic } from "react";
import { useRouter } from "next/navigation";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { ChevronDown, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { setInvoiceStatusAction } from "@/actions/invoices";
import { isManualInvoiceStatusTransitionAllowed, type InvoiceStatus } from "@/lib/billing";

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
  const [optimisticStatus, setOptimisticStatus] = useOptimistic(currentStatus);
  const router = useRouter();

  const options = ALL_STATUSES.filter((status) =>
    isManualInvoiceStatusTransitionAllowed(currentStatus, status),
  );

  const handleSelect = (status: InvoiceStatus) => {
    if (status === currentStatus) return;
    startTransition(async () => {
      setOptimisticStatus(status);
      try {
        await setInvoiceStatusAction(invoiceId, status);
        router.refresh();
      } catch {
        // useOptimistic reverts to currentStatus automatically on error
      }
    });
  };

  return (
    <DropdownMenu.Root open={open} onOpenChange={setOpen}>
      <DropdownMenu.Trigger asChild>
        <Button variant="secondary" size="sm" disabled={isPending}>
          {STATUS_LABELS[optimisticStatus]}
          <ChevronDown className={`size-3.5 transition ${open ? "rotate-180" : ""}`} />
        </Button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={6}
          className="z-50 w-44 rounded-[1rem] border border-border bg-white p-1.5 shadow-[0_16px_48px_rgba(19,15,11,0.12)]"
        >
          {options.map((status) => (
            <DropdownMenu.Item
              key={status}
              onSelect={() => handleSelect(status)}
              className="flex w-full cursor-pointer items-center gap-2.5 rounded-[0.6rem] px-3 py-2.5 text-sm text-foreground outline-none transition hover:bg-[#FFF7EA] focus:bg-[#FFF7EA] data-[highlighted]:bg-[#FFF7EA]"
            >
              <Check
                className={`size-3.5 shrink-0 ${status === optimisticStatus ? "opacity-100" : "opacity-0"}`}
              />
              {STATUS_LABELS[status]}
            </DropdownMenu.Item>
          ))}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
