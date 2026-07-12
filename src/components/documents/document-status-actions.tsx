"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Route } from "next";
import { ArrowRight, Send, Trash2 } from "lucide-react";
import { deleteInvoiceAction, setInvoiceStatusAction } from "@/actions/invoices";
import {
  convertQuotationToInvoiceAction,
  deleteQuotationAction,
  setQuotationStatusAction,
} from "@/actions/quotations";
import { Button } from "@/components/ui/button";

interface DocumentStatusActionsProps {
  kind: "invoice" | "quotation";
  id: string;
  status: string;
  convertedToInvoiceId?: string | null;
  hideDelete?: boolean;
}

export function DocumentStatusActions({
  kind,
  id,
  status,
  convertedToInvoiceId,
  hideDelete = false,
}: DocumentStatusActionsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    if (!isConfirmingDelete) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsConfirmingDelete(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isConfirmingDelete]);

  const handleDeleteInvoice = () => {
    startTransition(async () => {
      const result = await deleteInvoiceAction(id);
      if (result.status === "success" && result.redirectTo) {
        router.push(result.redirectTo as Route);
      } else if (result.status === "error") {
        alert(`Error: ${result.message}`);
      }
    });
  };

  const handleDeleteQuotation = () => {
    startTransition(async () => {
      const result = await deleteQuotationAction(id);
      if (result.status === "success" && result.redirectTo) {
        router.push(result.redirectTo as Route);
      } else if (result.status === "error") {
        setDeleteError(result.message ?? "Could not delete quotation.");
        setIsConfirmingDelete(false);
      }
    });
  };

  const handleSetInvoiceStatus = (newStatus: string) => {
    startTransition(async () => {
      try {
        await setInvoiceStatusAction(id, newStatus as any);
        router.refresh();
      } catch (error) {
        alert(`Error: ${error instanceof Error ? error.message : "Failed to update status"}`);
      }
    });
  };

  const handleSetQuotationStatus = (newStatus: string) => {
    startTransition(async () => {
      try {
        await setQuotationStatusAction(id, newStatus as any);
        router.refresh();
      } catch (error) {
        alert(`Error: ${error instanceof Error ? error.message : "Failed to update status"}`);
      }
    });
  };

  const handleConvertQuotation = () => {
    startTransition(async () => {
      try {
        await convertQuotationToInvoiceAction(id);
      } catch (error) {
        alert(`Error: ${error instanceof Error ? error.message : "Failed to convert quotation"}`);
      }
    });
  };

  if (kind === "invoice") {
    if (status !== "draft" && hideDelete) {
      return null;
    }

    return (
      <div className={hideDelete ? "grid gap-3" : "grid gap-3 sm:grid-cols-2"}>
        {status === "draft" && (
          <Button
            onClick={() => handleSetInvoiceStatus("sent")}
            disabled={isPending}
            variant="accent"
            className="w-full"
          >
            <Send className="size-4" />
            {isPending ? "Sending..." : "Mark as sent"}
          </Button>
        )}

        {!hideDelete ? (
          <Button
            onClick={handleDeleteInvoice}
            disabled={isPending}
            variant="danger"
            className="w-full"
          >
            <Trash2 className="size-4" />
            {isPending ? "Deleting..." : "Delete invoice"}
          </Button>
        ) : null}
      </div>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {status === "draft" && (
        <Button
          onClick={() => handleSetQuotationStatus("sent")}
          disabled={isPending}
          variant="accent"
          className="w-full"
        >
          <Send className="size-4" />
          {isPending ? "Sending..." : "Mark as sent"}
        </Button>
      )}

      {status === "sent" && (
        <Button
          onClick={() => handleSetQuotationStatus("accepted")}
          disabled={isPending}
          variant="secondary"
          className="w-full"
        >
          {isPending ? "Processing..." : "Mark as accepted"}
        </Button>
      )}

      {status === "sent" && (
        <Button
          onClick={() => handleSetQuotationStatus("rejected")}
          disabled={isPending}
          variant="secondary"
          className="w-full"
        >
          {isPending ? "Processing..." : "Mark as rejected"}
        </Button>
      )}

      {status === "accepted" && convertedToInvoiceId === null && (
        <Button
          onClick={handleConvertQuotation}
          disabled={isPending}
          variant="accent"
          className="w-full"
        >
          <ArrowRight className="size-4" />
          {isPending ? "Converting..." : "Convert to invoice"}
        </Button>
      )}

      <div className="grid gap-2 sm:col-span-2">
        {isConfirmingDelete ? (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium text-foreground">Confirm delete?</span>
            <Button onClick={handleDeleteQuotation} disabled={isPending} variant="danger" size="sm">
              <Trash2 className="size-4" />
              {isPending ? "Deleting..." : "Confirm"}
            </Button>
            <Button
              onClick={() => setIsConfirmingDelete(false)}
              disabled={isPending}
              variant="secondary"
              size="sm"
            >
              Cancel
            </Button>
          </div>
        ) : (
          <Button
            onClick={() => {
              setDeleteError(null);
              setIsConfirmingDelete(true);
            }}
            disabled={isPending}
            variant="danger"
            className="w-full"
          >
            <Trash2 className="size-4" />
            Delete quotation
          </Button>
        )}
        {deleteError ? <p className="text-sm text-danger">{deleteError}</p> : null}
      </div>
    </div>
  );
}
