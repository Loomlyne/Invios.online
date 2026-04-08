"use client";

import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { ClientFormInput } from "@/lib/billing";
import type { ActionState } from "@/lib/types";

const initialState: ActionState = {
  status: "idle",
};

export function ClientForm({
  action,
  submitLabel,
  initialValue,
}: {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  submitLabel: string;
  initialValue?: Partial<ClientFormInput>;
}) {
  const [state, formAction, isPending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="grid gap-4">
      {initialValue?.id ? <input type="hidden" name="id" value={initialValue.id} /> : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Client name" htmlFor="name">
          <Input id="name" name="name" defaultValue={initialValue?.name ?? ""} required />
        </Field>
        <Field label="Company" htmlFor="company">
          <Input id="company" name="company" defaultValue={initialValue?.company ?? ""} />
        </Field>
        <Field label="Email" htmlFor="email">
          <Input id="email" name="email" type="email" defaultValue={initialValue?.email ?? ""} />
        </Field>
        <Field label="Phone" htmlFor="phone">
          <Input id="phone" name="phone" defaultValue={initialValue?.phone ?? ""} />
        </Field>
        <Field label="Status" htmlFor="status">
          <Select
            id="status"
            name="status"
            defaultValue={initialValue?.status ?? "lead"}
            options={[
              { value: "lead", label: "Lead" },
              { value: "active", label: "Active" },
            ]}
          />
        </Field>
        <Field label="TRN" htmlFor="trn">
          <Input id="trn" name="trn" defaultValue={initialValue?.trn ?? ""} />
        </Field>
      </div>

      <Field label="Tax code" htmlFor="taxCode">
        <Input id="taxCode" name="taxCode" defaultValue={initialValue?.taxCode ?? ""} />
      </Field>

      <Field label="Address" htmlFor="address">
        <Textarea id="address" name="address" defaultValue={initialValue?.address ?? ""} />
      </Field>

      {state.message ? (
        <div
          className={`rounded-[1rem] border px-4 py-3 text-sm ${
            state.status === "error"
              ? "border-[#E7B1A8] bg-[#FFF3F1] text-[#8D3D2E]"
              : "border-emerald-900/10 bg-emerald-50 text-success"
          }`}
        >
          {state.message}
        </div>
      ) : null}

      <Button type="submit" variant="accent" className="w-full sm:w-fit">
        {isPending ? <Loader2 className="size-4 animate-spin" /> : null}
        {submitLabel}
      </Button>
    </form>
  );
}

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
    </div>
  );
}
