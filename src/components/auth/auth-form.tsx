"use client";

import { useActionState } from "react";
import Link from "next/link";
import type { Route } from "next";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ActionState } from "@/lib/types";

const initialState: ActionState = {
  status: "idle",
};

export function AuthForm({
  title,
  description,
  action,
  fields,
  footer,
  submitLabel,
}: {
  title: string;
  description: string;
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  fields: {
    name: string;
    label: string;
    type?: string;
    autoComplete?: string;
    placeholder: string;
  }[];
  footer: {
    prompt: string;
    label: string;
    href: Route;
  };
  submitLabel: string;
}) {
  const [state, formAction, isPending] = useActionState(action, initialState);

  return (
    <div>
      <div className="space-y-3">
        <p className="text-xs uppercase tracking-[0.28em] text-muted">Auth</p>
        <h2 className="display-text text-4xl font-semibold text-foreground">
          {title}
        </h2>
        <p className="max-w-lg text-sm leading-7 text-muted">{description}</p>
      </div>

      <form action={formAction} className="mt-8 space-y-5">
        {fields.map((field) => (
          <div key={field.name} className="space-y-2">
            <Label htmlFor={field.name}>{field.label}</Label>
            <Input
              id={field.name}
              name={field.name}
              type={field.type ?? "text"}
              placeholder={field.placeholder}
              autoComplete={field.autoComplete}
              required
            />
          </div>
        ))}

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

        <Button type="submit" variant="accent" size="lg" className="w-full">
          {isPending ? <Loader2 className="size-4 animate-spin" /> : null}
          {submitLabel}
        </Button>
      </form>

      <div className="mt-6 flex items-center justify-between gap-4 text-sm text-muted">
        <span>{footer.prompt}</span>
        <Link href={footer.href} className="font-medium text-foreground underline-offset-4 hover:underline">
          {footer.label}
        </Link>
      </div>
    </div>
  );
}
