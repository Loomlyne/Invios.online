import { Badge, type BadgeProps } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { ClientStatus } from "@/lib/billing";

const statusMap: Record<ClientStatus, { label: string; variant: BadgeProps["variant"] }> = {
  lead: { label: "Lead", variant: "warning" },
  in_review: { label: "In Review", variant: "info" },
  approved: { label: "Approved", variant: "accent" },
  active: { label: "Active", variant: "success" },
  rejected: { label: "Rejected", variant: "destructive" },
  canceled: { label: "Canceled", variant: "destructive" },
};

export function ClientStatusBadge({
  status,
  variantOverride,
  className,
}: {
  status: ClientStatus;
  variantOverride?: BadgeProps["variant"];
  className?: string;
}) {
  const { label, variant } = statusMap[status];
  return (
    <Badge variant={variantOverride ?? variant} className={cn(className)}>
      {label}
    </Badge>
  );
}
