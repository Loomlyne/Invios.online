import React from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function DocumentStatusBadge({
  status,
  className,
}: {
  status: string;
  className?: string;
}) {
  const variant =
    status === "paid" || status === "accepted"
      ? "success"
      : status === "overpaid"
        ? "info"
        : status === "rejected" || status === "overdue"
          ? "warning"
          : "default";

  return (
    <Badge variant={variant} className={cn(className)}>
      {status
        .split("_")
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ")}
    </Badge>
  );
}
