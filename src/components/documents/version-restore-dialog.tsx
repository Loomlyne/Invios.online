"use client";

import { useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { MoveRight } from "lucide-react";
import { restoreInvoiceVersionAction } from "@/actions/versions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatCurrency } from "@/lib/utils";

interface VersionRestoreDialogProps {
  versionId: string;
  invoiceId: string;
  currentTotal: number;
  snapshotTotal: number;
  currency: string;
  hasPayments: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function VersionRestoreDialog({
  versionId,
  invoiceId,
  currentTotal,
  snapshotTotal,
  currency,
  hasPayments,
  open,
  onOpenChange,
}: VersionRestoreDialogProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const totalsAreDifferent = currentTotal !== snapshotTotal;

  function handleRestore() {
    setError(null);
    startTransition(async () => {
      const result = await restoreInvoiceVersionAction(versionId, invoiceId);
      if (result.status === "success") {
        onOpenChange(false);
        router.refresh();
      } else {
        setError(
          result.message ||
            "Restore failed. The version may no longer be available. Refresh the page and try again, or contact support if the issue persists.",
        );
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-[20px] font-semibold">
            Restore this version?
          </DialogTitle>
          <DialogDescription className="text-sm text-muted leading-relaxed">
            This will update the invoice line items, amounts, and dates to match
            the saved version. Existing payments and expenses are preserved.
          </DialogDescription>
        </DialogHeader>

        {/* Total comparison block */}
        <div className="flex items-center gap-3 rounded-[var(--radius-inner)] border border-border bg-surface px-4 py-3">
          <div className="flex flex-col gap-0.5">
            <span className="text-[11px] uppercase tracking-[0.18em] text-muted">
              Current total
            </span>
            <span className="text-base font-semibold text-foreground">
              {formatCurrency(currentTotal, currency)}
            </span>
          </div>

          <MoveRight className="size-4 shrink-0 text-muted" />

          <div className="flex flex-col gap-0.5">
            <span className="text-[11px] uppercase tracking-[0.18em] text-muted">
              Restored total
            </span>
            <span
              className={`text-base font-semibold ${totalsAreDifferent ? "text-accent-strong" : "text-foreground"}`}
            >
              {formatCurrency(snapshotTotal, currency)}
            </span>
          </div>
        </div>

        {/* Conditional warning for invoices with payments */}
        {hasPayments && (
          <p className="text-sm italic text-muted">
            Payment status will recalculate based on the restored total.
          </p>
        )}

        <DialogFooter className="flex-col gap-2 sm:flex-row">
          <Button
            type="button"
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="danger"
            onClick={handleRestore}
            disabled={isPending}
            className="min-h-[44px]"
          >
            {isPending ? "Restoring..." : "Restore Version"}
          </Button>
        </DialogFooter>

        {/* Inline error message */}
        {error && (
          <p className="text-xs text-danger">
            {error}
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}
