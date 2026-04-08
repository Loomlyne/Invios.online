"use client";

import { useActionState, useEffect, useRef } from "react";
import { Trash2 } from "lucide-react";
import { addExpenseAction, deleteExpenseAction } from "@/actions/expenses";
import { Button } from "@/components/ui/button";
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

  useEffect(() => {
    if (state.status === "success") {
      formRef.current?.reset();
    }
  }, [state]);

  return (
    <div>
      <h3 className="text-xs uppercase tracking-[0.24em] text-muted font-medium mb-2">
        Expenses
      </h3>
      <div className="rounded-[1rem] border border-border bg-surface overflow-hidden">
        {/* Header row */}
        <div className="px-4 py-2 bg-surface-strong border-b border-border hidden md:flex items-center gap-3">
          <span className="text-xs text-muted uppercase tracking-[0.18em] w-24 shrink-0">
            Date
          </span>
          <span className="text-xs text-muted uppercase tracking-[0.18em] w-[100px] text-right">
            Amount
          </span>
          <span className="text-xs text-muted uppercase tracking-[0.18em] flex-1">
            Description
          </span>
          <span className="text-xs text-muted uppercase tracking-[0.18em] w-[120px]">
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
          <div
            key={e.id}
            className="px-4 py-3 border-b border-border last:border-b-0 flex items-center gap-3"
          >
            <span className="text-sm text-muted w-24 shrink-0 hidden md:block">
              {e.date}
            </span>
            <span className="text-sm font-semibold text-foreground w-[100px] text-right">
              {formatCurrency(e.amount, currency)}
            </span>
            <span className="text-sm text-foreground flex-1">{e.description}</span>
            <span className="text-sm text-muted w-[120px]">{e.vendor}</span>
            <form
              action={async () => {
                await deleteExpenseAction(e.id, invoiceId);
              }}
            >
              <button
                type="submit"
                className="size-8 p-1 rounded-full text-muted hover:text-danger hover:bg-danger/8 inline-flex items-center justify-center"
                aria-label="Delete expense"
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
          <Input
            name="date"
            type="date"
            placeholder="YYYY-MM-DD"
            className="h-9 w-24 shrink-0"
            required
          />
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
            name="description"
            type="text"
            placeholder="What was this for?"
            className="h-9 flex-1 min-w-[120px]"
            required
          />
          <Input
            name="vendor"
            type="text"
            placeholder="Supplier name"
            className="h-9 w-[120px]"
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
