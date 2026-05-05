"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Trash2 } from "lucide-react";
import { addExpenseAction, deleteExpenseAction } from "@/actions/expenses";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import { Input } from "@/components/ui/input";
import type { ExpenseRecord } from "@/lib/billing";
import type { ActionState } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";

interface ExpensesTableProps {
  invoiceId: string;
  currency: string;
  expenses: ExpenseRecord[];
}

export function ExpensesTable({ invoiceId, currency, expenses }: ExpensesTableProps) {
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(
    addExpenseAction,
    { status: "idle" },
  );
  const formRef = useRef<HTMLFormElement>(null);
  const [expenseDate, setExpenseDate] = useState("");

  useEffect(() => {
    if (state.status === "success") {
      formRef.current?.reset();
      setExpenseDate("");
    }
  }, [state]);

  return (
    <div>
      <h3 className="text-xs uppercase tracking-[0.24em] text-muted font-medium mb-2">
        Expenses
      </h3>
      <div className="rounded-[var(--radius-inner)] border border-border bg-surface overflow-visible">
        {/* Header row */}
        <div className="px-4 py-2 bg-surface-strong border-b border-border hidden md:flex items-center gap-3 rounded-t-[var(--radius-inner)]">
          <span className="text-xs text-muted uppercase tracking-[0.18em] w-24 shrink-0">
            Date
          </span>
          <span className="text-xs text-muted uppercase tracking-[0.18em] w-24 shrink-0 text-right">
            Amount
          </span>
          <span className="text-xs text-muted uppercase tracking-[0.18em] flex-1">
            Description
          </span>
          <span className="text-xs text-muted uppercase tracking-[0.18em] w-28 shrink-0">
            Vendor
          </span>
          <span className="w-8" />
        </div>

        {/* Empty state */}
        {expenses.length === 0 && (
          <p className="px-4 py-5 text-sm text-muted text-center">
            No expenses recorded yet.
          </p>
        )}

        {/* Data rows */}
        {expenses.map((e) => (
          <div key={e.id} className="border-b border-border last:border-b-0">
            {/* Mobile card */}
            <div className="flex items-center gap-3 px-4 py-3 md:hidden">
              <div className="flex-1 min-w-0">
                <p className="truncate text-sm font-medium text-foreground">{e.description}</p>
                <p className="mt-0.5 text-xs text-muted">
                  {e.date}
                  {e.vendor ? ` · ${e.vendor}` : ""}
                </p>
              </div>
              <span className="shrink-0 text-sm font-semibold text-foreground">
                {formatCurrency(e.amount, currency)}
              </span>
              <form
                action={async () => {
                  await deleteExpenseAction(e.id, invoiceId);
                }}
              >
                <button
                  type="submit"
                  className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full text-muted hover:bg-danger/8 hover:text-danger"
                  aria-label="Delete expense"
                >
                  <Trash2 className="size-4" />
                </button>
              </form>
            </div>

            {/* Desktop table row */}
            <div className="hidden items-center gap-3 px-4 py-3 md:flex">
              <span className="w-24 shrink-0 text-sm text-muted">{e.date}</span>
              <span className="w-24 text-right text-sm font-semibold text-foreground">
                {formatCurrency(e.amount, currency)}
              </span>
              <span className="flex-1 text-sm text-foreground">{e.description}</span>
              <span className="w-28 text-sm text-muted">{e.vendor}</span>
              <form
                action={async () => {
                  await deleteExpenseAction(e.id, invoiceId);
                }}
              >
                <button
                  type="submit"
                  className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full text-muted hover:bg-danger/8 hover:text-danger"
                  aria-label="Delete expense"
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
          className="px-4 py-3 bg-[#FFFCF7] border-t border-dashed border-border/60 flex flex-wrap items-end gap-3 rounded-b-[var(--radius-inner)]"
        >
          <input type="hidden" name="invoiceId" value={invoiceId} />
          <div className="w-28 shrink-0">
            <DatePicker
              value={expenseDate}
              onChange={setExpenseDate}
              name="date"
              compact
            />
          </div>
          <Input
            name="amount"
            type="number"
            step="0.01"
            min="0.01"
            placeholder="0.00"
            className="h-9 w-24"
            required
          />
          <Input
            name="description"
            type="text"
            placeholder="What was this for?"
            className="h-9 flex-1 min-w-28"
            required
          />
          <Input
            name="vendor"
            type="text"
            placeholder="Supplier name"
            className="h-9 w-28"
          />
          <Button type="submit" variant="ghost" size="sm" disabled={isPending}>
            {isPending ? "Saving..." : "Add expense"}
          </Button>
        </form>

        {/* Error state */}
        {state.status === "error" && (
          <p className="px-4 py-2 text-xs text-danger">
            {state.message ||
              "Expense could not be saved. Check the fields and try again."}
          </p>
        )}
      </div>
    </div>
  );
}
