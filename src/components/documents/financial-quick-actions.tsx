"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { addExpenseAction } from "@/actions/expenses";
import { addPaymentAction } from "@/actions/payments";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import { Input } from "@/components/ui/input";
import { MobileSheet, MobileSheetContent, MobileSheetHeader } from "@/components/ui/mobile-sheet";
import { Select } from "@/components/ui/select";
import {
  paymentMethodLabels,
  paymentMethods,
  type PaymentMethod,
} from "@/lib/billing";
import type { ActionState } from "@/lib/types";

const initialState: ActionState = { status: "idle" };

export function FinancialQuickActions({
  invoiceId,
}: {
  invoiceId: string;
}) {
  return (
    <div className="flex flex-nowrap gap-2">
      <AddPaymentSheet invoiceId={invoiceId} />
      <AddExpenseSheet invoiceId={invoiceId} />
    </div>
  );
}

function AddPaymentSheet({ invoiceId }: { invoiceId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(
    addPaymentAction,
    initialState,
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
    if (state.status !== "success") return;
    formRef.current?.reset();
    setDatePaid("");
    setMethod("other");
    setOpen(false);
    router.refresh();
  }, [router, state.status]);

  return (
    <>
      <Button variant="secondary" size="sm" onClick={() => setOpen(true)}>
        <Plus className="size-4" />
        Add income
      </Button>

      <MobileSheet open={open} onOpenChange={setOpen}>
        <MobileSheetContent title="Add income" className="sm:max-w-xl">
          <MobileSheetHeader
            title="Add income"
            description="Record a payment against this invoice. It will update the financial summary and payment list below."
          />

          <form ref={formRef} action={formAction} className="grid gap-4">
            <input type="hidden" name="invoiceId" value={invoiceId} />

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Date paid">
                <DatePicker value={datePaid} onChange={setDatePaid} name="datePaid" />
              </Field>
              <Field label="Amount">
                <Input
                  name="amount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="0.00"
                  required
                />
              </Field>
            </div>

            <Field label="Payment method">
              <Select
                name="method"
                value={method}
                onChange={(value) => setMethod(value as PaymentMethod)}
                options={paymentMethodOptions}
                placeholder="Select method"
              />
            </Field>

            <Field label="Description / note">
              <Input
                name="description"
                type="text"
                placeholder={descriptionPlaceholder}
              />
            </Field>

            {state.status === "error" ? (
              <p className="text-sm text-danger">
                {state.message || "Payment could not be saved. Check the fields and try again."}
              </p>
            ) : null}

            <div className="flex flex-wrap justify-end gap-2 pt-2">
              <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="accent" size="sm" disabled={isPending}>
                {isPending ? "Saving..." : "Save income"}
              </Button>
            </div>
          </form>
        </MobileSheetContent>
      </MobileSheet>
    </>
  );
}

function AddExpenseSheet({ invoiceId }: { invoiceId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(
    addExpenseAction,
    initialState,
  );
  const formRef = useRef<HTMLFormElement>(null);
  const [date, setDate] = useState("");

  useEffect(() => {
    if (state.status !== "success") return;
    formRef.current?.reset();
    setDate("");
    setOpen(false);
    router.refresh();
  }, [router, state.status]);

  return (
    <>
      <Button variant="secondary" size="sm" onClick={() => setOpen(true)}>
        <Plus className="size-4" />
        Add expense
      </Button>

      <MobileSheet open={open} onOpenChange={setOpen}>
        <MobileSheetContent title="Add expense" className="sm:max-w-2xl">
          <MobileSheetHeader
            title="Add expense"
            description="Capture a cost tied to this invoice. It will update the expense list and profit breakdown immediately."
          />

          <form ref={formRef} action={formAction} className="grid gap-4">
            <input type="hidden" name="invoiceId" value={invoiceId} />

            <div className="grid gap-4 sm:grid-cols-[180px_140px_minmax(0,1fr)]">
              <Field label="Date">
                <DatePicker value={date} onChange={setDate} name="date" />
              </Field>
              <Field label="Amount">
                <Input
                  name="amount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="0.00"
                  required
                />
              </Field>
              <Field label="Description">
                <Input
                  name="description"
                  type="text"
                  placeholder="What was this for?"
                  required
                />
              </Field>
            </div>

            <Field label="Vendor">
              <Input name="vendor" type="text" placeholder="Supplier name" />
            </Field>

            {state.status === "error" ? (
              <p className="text-sm text-danger">
                {state.message || "Expense could not be saved. Check the fields and try again."}
              </p>
            ) : null}

            <div className="flex flex-wrap justify-end gap-2 pt-2">
              <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="accent" size="sm" disabled={isPending}>
                {isPending ? "Saving..." : "Save expense"}
              </Button>
            </div>
          </form>
        </MobileSheetContent>
      </MobileSheet>
    </>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="grid gap-2">
      <span className="text-xs font-medium uppercase tracking-[0.18em] text-muted">{label}</span>
      {children}
    </label>
  );
}
