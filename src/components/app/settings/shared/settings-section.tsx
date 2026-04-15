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
        "rounded-[var(--radius-md)] border bg-white p-6 space-y-4",
        danger ? "border-danger/20 bg-[#FFF5F3]" : "border-border"
      )}
    >
      <div>
        <h3 className={cn("font-semibold text-sm", danger && "text-danger")}>
          {title}
        </h3>
        {description && (
          <p className="text-muted text-sm mt-1">{description}</p>
        )}
      </div>
      {children}
    </div>
  );
}

export function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
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
