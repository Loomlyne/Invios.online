import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";

export function PageHeader({
  badge,
  title,
  description,
  actions,
  children,
}: {
  badge?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <section className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        {badge ? (
          <Badge variant="default" className="mb-3">
            {badge}
          </Badge>
        ) : null}
        <h1 className="display-text text-3xl font-semibold tracking-tight sm:text-4xl">
          {title}
        </h1>
        {description ? (
          <p className="mt-2 max-w-2xl text-sm leading-7 text-muted">
            {description}
          </p>
        ) : null}
        {children}
      </div>
      {actions ? (
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {actions}
        </div>
      ) : null}
    </section>
  );
}
