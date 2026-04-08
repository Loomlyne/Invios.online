"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Trash2 } from "lucide-react";
import { addPaymentAction, deletePaymentAction } from "@/actions/payments";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import { Input } from "@/components/ui/input";
import type { PaymentRecord } from "@/lib/billing";
import type { ActionState } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";

interface PaymentsTableProps {
  invoiceId: string;
  invoiceTotal: number;
  currency: string;
  payments: PaymentRecord[];
}

export function PaymentsTable({
  invoiceId,
  invoiceTotal: _invoiceTotal,
  currency,
  payments,
}: PaymentsTableProps) {
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(
    addPaymentAction,
    { status: "idle" },
  );
  const formRef = useRef<HTMLFormElement>(null);
  const [datePaid, setDatePaid] = useState("");

  useEffect(() => {
    if (state.status === "success") {
      formRef.current?.reset();
      setDatePaid("");
    }
  }, [state]);

  return (
    <div>
      <h3 className="text-xs uppercase tracking-[0.24em] text-muted font-medium mb-2">
        Payments
      </h3>
      <div className="rounded-[1rem] border border-border bg-surface overflow-hidden">
        {/* Header row */}
        <div className="px-4 py-2 bg-surface-strong border-b border-border hidden md:flex items-center gap-3">
          <span className="text-xs text-muted uppercase tracking-[0.18em] w-24 shrink-0">
            Date paid
          </span>
          <span className="text-xs text-muted uppercase tracking-[0.18em] w-[100px] text-right">
            Amount
          </span>
          <span className="text-xs text-muted uppercase tracking-[0.18em] flex-1">
            Method
          </span>
          <span className="w-8" />
        </div>

        {/* Empty state */}
        {payments.length === 0 && (
          <p className="px-4 py-5 text-sm text-muted text-center">
            No payments recorded yet.
          </p>
        )}

        {/* Data rows */}
        {payments.map((p) => (
          <div
            key={p.id}
            className="px-4 py-3 border-b border-border last:border-b-0 flex items-center gap-3"
          >
            <span className="text-sm text-muted w-24 shrink-0 hidden md:block">
              {p.datePaid}
            </span>
            <span className="text-sm font-semibold text-foreground w-[100px] text-right">
              {formatCurrency(p.amount, currency)}
            </span>
            <span className="text-sm text-muted flex-1">
              {p.method.replace("_", " ")}
            </span>
            <form
              action={async () => {
                await deletePaymentAction(p.id, invoiceId);
              }}
            >
              <button
                type="submit"
                className="size-8 p-1 rounded-full text-muted hover:text-danger hover:bg-danger/8 inline-flex items-center justify-center"
                aria-label="Delete payment"
              >
                <Trash2 className="size-4" />
              </button>
            </form>
          </div>
        ))}

        {/* Add row */}
        <form
          ref={formRef}
          action={formAction}
          className="px-4 py-3 bg-[#FFFCF7] border-t border-dashed border-border/60 flex flex-wrap items-end gap-3"
        >
          <input type="hidden" name="invoiceId" value={invoiceId} />
          <div className="w-[120px] shrink-0">
            <DatePicker
              value={datePaid}
              onChange={setDatePaid}
              name="datePaid"
              compact
            />
          </div>
          <Input
            name="amount"
            type="number"
            step="0.01"
            min="0.01"
            placeholder="0.00"
            className="h-9 w-[100px]"
            required
          />
          <Input
            name="method"
            type="text"
            placeholder="Cash, transfer, cheque..."
            className="h-9 flex-1 min-w-[120px]"
          />
          <Button type="submit" variant="ghost" size="sm" disabled={isPending}>
            {isPending ? "Saving..." : "Add payment"}
          </Button>
        </form>

        {/* Error state */}
        {state.status === "error" && (
          <p className="px-4 py-2 text-xs text-danger">
            {state.message ||
              "Payment could not be saved. Check the amount and try again."}
          </p>
        )}
      </div>
    </div>
  );
}
