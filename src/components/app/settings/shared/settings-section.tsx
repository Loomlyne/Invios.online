"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";

export function Section({
  title,
  description,
  danger,
  children,
}: {
  title: string;
  description?: string;
  danger?: boolean;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        "rounded-[var(--radius-md)] border bg-surface p-6 space-y-5 shadow-[0_1px_2px_rgba(23,18,15,0.04)] transition-shadow focus-within:shadow-[0_4px_16px_rgba(23,18,15,0.06)]",
        danger ? "border-danger/20 bg-[#FFF5F3]" : "border-border"
      )}
    >
      <div className="border-b border-border/60 pb-4 -mx-6 px-6 -mt-6 pt-6">
        <h3 className={cn("font-semibold text-[0.95rem] tracking-[-0.01em]", danger ? "text-danger" : "text-foreground")}>
          {title}
        </h3>
        {description && (
          <p className="text-muted text-sm mt-1 leading-relaxed">{description}</p>
        )}
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

export function Field({
  label,
  htmlFor,
  children,
}: {
  label: ReactNode;
  htmlFor?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
    </div>
  );
}
