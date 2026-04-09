"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Trash2 } from "lucide-react";
import { addPaymentAction, deletePaymentAction } from "@/actions/payments";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  formatPaymentMethod,
  paymentMethodLabels,
  paymentMethods,
  type PaymentMethod,
  type PaymentRecord,
} from "@/lib/billing";
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
  const [method, setMethod] = useState<PaymentMethod>("other");

  const paymentMethodOptions = paymentMethods.map((value) => ({
    value,
    label: paymentMethodLabels[value],
  }));
  const descriptionPlaceholder =
    method === "bank_transfer"
      ? "Bank, reference, or note"
      : method === "other"
        ? "Add context or bank name"
        : "Optional note";

  useEffect(() => {
    if (state.status === "success") {
      formRef.current?.reset();
      setDatePaid("");
      setMethod("other");
    }
  }, [state]);

  return (
    <div>
      <h3 className="text-xs uppercase tracking-[0.24em] text-muted font-medium mb-2">
        Payments
      </h3>
      <div className="rounded-[1rem] border border-border bg-surface overflow-visible">
        {/* Header row */}
        <div className="px-4 py-2 bg-surface-strong border-b border-border hidden md:flex items-center gap-3 rounded-t-[1rem]">
          <span className="text-xs text-muted uppercase tracking-[0.18em] w-24 shrink-0">
            Date paid
          </span>
          <span className="text-xs text-muted uppercase tracking-[0.18em] w-[100px] text-right">
            Amount
          </span>
          <span className="text-xs text-muted uppercase tracking-[0.18em] flex-1">
            Method / note
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
          <div key={p.id} className="border-b border-border last:border-b-0">
            {/* Mobile card */}
            <div className="flex items-center gap-3 px-4 py-3 md:hidden">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">
                  {formatPaymentMethod(p.method)}
                </p>
                <p className="mt-0.5 text-xs text-muted">
                  {p.datePaid}
                  {p.description ? ` · ${p.description}` : ""}
                </p>
              </div>
              <span className="shrink-0 text-sm font-semibold text-foreground">
                {formatCurrency(p.amount, currency)}
              </span>
              <form
                action={async () => {
                  await deletePaymentAction(p.id, invoiceId);
                }}
              >
                <button
                  type="submit"
                  className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full text-muted hover:bg-danger/8 hover:text-danger"
                  aria-label="Delete payment"
                >
                  <Trash2 className="size-4" />
                </button>
              </form>
            </div>

            {/* Desktop table row */}
            <div className="hidden items-center gap-3 px-4 py-3 md:flex">
              <span className="w-24 shrink-0 text-sm text-muted">{p.datePaid}</span>
              <span className="w-[100px] text-right text-sm font-semibold text-foreground">
                {formatCurrency(p.amount, currency)}
              </span>
              <div className="flex-1">
                <p className="text-sm text-muted">{formatPaymentMethod(p.method)}</p>
                {p.description ? (
                  <p className="mt-1 text-xs text-muted-strong">{p.description}</p>
                ) : null}
              </div>
              <form
                action={async () => {
                  await deletePaymentAction(p.id, invoiceId);
                }}
              >
                <button
                  type="submit"
                  className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full text-muted hover:bg-danger/8 hover:text-danger"
                  aria-label="Delete payment"
                >
                  <Trash2 className="size-4" />
                </button>
              </form>
            </div>
          </div>
        ))}

        {/* Add row */}
        <form
          ref={formRef}
          action={formAction}
          className="flex flex-wrap items-end gap-3 rounded-b-[1rem] border-t border-dashed border-border/60 bg-[#FFFCF7] px-4 py-3"
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
          <Select
            name="method"
            value={method}
            onChange={(value) => setMethod(value as PaymentMethod)}
            options={paymentMethodOptions}
            placeholder="Select method"
            className="h-9 flex-1 min-w-[120px]"
          />
          <Input
            name="description"
            type="text"
            placeholder={descriptionPlaceholder}
            className="h-9 min-w-[180px] flex-[1.2]"
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
