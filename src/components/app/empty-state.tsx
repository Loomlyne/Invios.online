import type { ReactNode } from "react";
import { Inbox } from "lucide-react";

export function EmptyState({
  title,
  description,
  icon,
  actions,
}: {
  title: string;
  description?: string;
  icon?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="rounded-[1.25rem] border border-border bg-surface px-6 py-10 text-center">
      <div className="mx-auto mb-4 flex size-10 items-center justify-center rounded-full bg-surface-strong text-muted">
        {icon ?? <Inbox className="size-5" />}
      </div>
      <p className="text-base font-semibold text-foreground">{title}</p>
      {description ? (
        <p className="mx-auto mt-2 max-w-md text-sm leading-7 text-muted">
          {description}
        </p>
      ) : null}
      {actions ? (
        <div className="mt-5 flex flex-wrap justify-center gap-3">
          {actions}
        </div>
      ) : null}
    </div>
  );
}
