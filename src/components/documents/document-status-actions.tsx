"use client";

import { useTransition } from "react";
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
}

export function DocumentStatusActions({
  kind,
  id,
  status,
  convertedToInvoiceId,
}: DocumentStatusActionsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

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
        alert(`Error: ${result.message}`);
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
    return (
      <div className="grid gap-3 sm:grid-cols-2">
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

        <Button
          onClick={handleDeleteInvoice}
          disabled={isPending}
          variant="danger"
          className="w-full"
        >
          <Trash2 className="size-4" />
          {isPending ? "Deleting..." : "Delete invoice"}
        </Button>
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

      <Button
        onClick={handleDeleteQuotation}
        disabled={isPending}
        variant="danger"
        className="w-full"
      >
        <Trash2 className="size-4" />
        {isPending ? "Deleting..." : "Delete quotation"}
      </Button>
    </div>
  );
}
