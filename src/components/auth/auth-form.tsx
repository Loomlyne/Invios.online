"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import type { Route } from "next";
import { Eye, EyeOff, Loader2 } from "lucide-react";
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
  forgotPasswordHref,
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
  forgotPasswordHref?: Route;
}) {
  const [state, formAction, isPending] = useActionState(action, initialState);
  const [visibleFields, setVisibleFields] = useState<Record<string, boolean>>({});

  function toggleVisibility(name: string) {
    setVisibleFields((prev) => ({ ...prev, [name]: !prev[name] }));
  }

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
        {fields.map((field) => {
          const isPassword = field.type === "password";
          const isVisible = visibleFields[field.name];
          const resolvedType = isPassword ? (isVisible ? "text" : "password") : (field.type ?? "text");

          return (
            <div key={field.name} className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor={field.name}>{field.label}</Label>
                {isPassword && forgotPasswordHref ? (
                  <Link
                    href={forgotPasswordHref}
                    className="text-xs text-muted underline-offset-4 hover:underline"
                  >
                    Forgot password?
                  </Link>
                ) : null}
              </div>
              <div className="relative">
                <Input
                  id={field.name}
                  name={field.name}
                  type={resolvedType}
                  placeholder={field.placeholder}
                  autoComplete={field.autoComplete}
                  className={isPassword ? "pr-10" : undefined}
                  required
                />
                {isPassword ? (
                  <button
                    type="button"
                    onClick={() => toggleVisibility(field.name)}
                    className="absolute inset-y-0 right-3 flex items-center text-muted hover:text-foreground"
                    aria-label={isVisible ? "Hide password" : "Show password"}
                  >
                    {isVisible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                ) : null}
              </div>
            </div>
          );
        })}

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
