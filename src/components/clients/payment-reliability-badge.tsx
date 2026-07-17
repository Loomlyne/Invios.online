import { Badge, type BadgeProps } from "@/components/ui/badge";
import type { PaymentReliability } from "@/lib/client-intelligence";

const tierConfig: Record<PaymentReliability["tier"], { label: string; variant: BadgeProps["variant"] }> = {
  fast: { label: "Fast payer", variant: "success" },
  standard: { label: "On-time payer", variant: "accent" },
  slow: { label: "Slow payer", variant: "warning" },
  late: { label: "Late payer", variant: "destructive" },
};

export function PaymentReliabilityBadge({ reliability }: { reliability: PaymentReliability }) {
  const config = tierConfig[reliability.tier];
  return (
    <Badge variant={config.variant} className="gap-1.5">
      {config.label}
      <span className="text-muted-strong">·</span>
      <span className="font-normal">avg {Math.round(reliability.avgDaysToPay)}d</span>
    </Badge>
  );
}
