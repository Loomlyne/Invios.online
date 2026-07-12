import React from "react";
import { Badge, type BadgeProps } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// Semantic status -> badge variant. Keep colors consistent with the kanban/list
// dot colors in each config file (e.g. invoice-config.tsx `kanbanColumns`).
const STATUS_VARIANT: Record<string, NonNullable<BadgeProps["variant"]>> = {
  paid: "success",
  accepted: "success",
  overpaid: "info",
  sent: "info",
  partial_paid: "warning",
  // Rejected stays amber (distinct from the red "overdue" danger state).
  rejected: "warning",
  overdue: "danger",
};

export function DocumentStatusBadge({
  status,
  className,
}: {
  status: string;
  className?: string;
}) {
  const variant = STATUS_VARIANT[status] ?? "default";

  return (
    <Badge variant={variant} className={cn(className)}>
      {status
        .split("_")
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ")}
    </Badge>
  );
}
