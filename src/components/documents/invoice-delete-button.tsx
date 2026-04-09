"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Route } from "next";
import { Trash2 } from "lucide-react";
import { deleteInvoiceAction } from "@/actions/invoices";
import { Button } from "@/components/ui/button";

export function InvoiceDeleteButton({
  invoiceId,
}: {
  invoiceId: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      onClick={() => {
        startTransition(async () => {
          const result = await deleteInvoiceAction(invoiceId);
          if (result.status === "success" && result.redirectTo) {
            router.push(result.redirectTo as Route);
          } else if (result.status === "error") {
            alert(`Error: ${result.message}`);
          }
        });
      }}
      disabled={isPending}
      variant="danger"
      size="sm"
    >
      <Trash2 className="size-4" />
      {isPending ? "Deleting..." : "Delete invoice"}
    </Button>
  );
}
