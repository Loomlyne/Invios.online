import { Badge, type BadgeProps } from "@/components/ui/badge";
import type { ClientStatus } from "@/lib/billing";

const statusMap: Record<ClientStatus, { label: string; variant: BadgeProps["variant"] }> = {
  lead: { label: "Lead", variant: "warning" },
  in_review: { label: "In Review", variant: "info" },
  approved: { label: "Approved", variant: "accent" },
  active: { label: "Active", variant: "success" },
  rejected: { label: "Rejected", variant: "destructive" },
  canceled: { label: "Canceled", variant: "destructive" },
};

export function ClientStatusBadge({ status }: { status: ClientStatus }) {
  const { label, variant } = statusMap[status];
  return <Badge variant={variant}>{label}</Badge>;
}
