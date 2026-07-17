"use client";

import { useEffect, useState, useTransition } from "react";
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
  const [isConfirming, setIsConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isConfirming) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsConfirming(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isConfirming]);

  const handleDelete = () => {
    startTransition(async () => {
      const result = await deleteInvoiceAction(invoiceId);
      if (result.status === "success" && result.redirectTo) {
        router.push(result.redirectTo as Route);
      } else if (result.status === "error") {
        setError(result.message ?? "Could not delete invoice.");
        setIsConfirming(false);
      }
    });
  };

  if (isConfirming) {
    return (
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-foreground">Confirm delete?</span>
          <Button onClick={handleDelete} disabled={isPending} variant="danger" size="sm">
            <Trash2 className="size-4" />
            {isPending ? "Deleting..." : "Confirm"}
          </Button>
          <Button
            onClick={() => setIsConfirming(false)}
            disabled={isPending}
            variant="secondary"
            size="sm"
          >
            Cancel
          </Button>
        </div>
        {error ? <p className="text-sm text-danger">{error}</p> : null}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      <Button
        onClick={() => {
          setError(null);
          setIsConfirming(true);
        }}
        disabled={isPending}
        variant="danger"
        size="sm"
      >
        <Trash2 className="size-4" />
        Delete invoice
      </Button>
      {error ? <p className="text-sm text-danger">{error}</p> : null}
    </div>
  );
}
