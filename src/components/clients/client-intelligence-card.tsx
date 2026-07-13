import { TrendingUp, Heart, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import type { ClientHealth, PaymentReliability } from "@/lib/client-intelligence";

const healthConfig: Record<
  ClientHealth["label"],
  { icon: typeof Heart; color: string }
> = {
  new: { icon: Heart, color: "text-muted" },
  healthy: { icon: TrendingUp, color: "text-success" },
  "at-risk": { icon: AlertTriangle, color: "text-accent-strong" },
  critical: { icon: AlertTriangle, color: "text-danger" },
};

export function ClientIntelligenceCard({
  ltv,
  reliability,
  health,
  currency = "AED",
}: {
  ltv: number;
  reliability: PaymentReliability | null;
  health: ClientHealth;
  currency?: string;
}) {
  const config = healthConfig[health.label];
  const Icon = config.icon;

  return (
    <Card className="h-full overflow-hidden">
      <CardHeader className="gap-4">
        <div className="flex items-center justify-between gap-3">
          <Badge variant="accent">Client intelligence</Badge>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted">
            Health score
          </p>
        </div>
        <div className="flex items-start gap-3">
          <div className={`flex size-11 shrink-0 items-center justify-center rounded-full bg-accent-soft ${config.color}`}>
            <Icon className="size-5" />
          </div>
          <div className="min-w-0 flex-1">
            <CardTitle>Relationship health</CardTitle>
            <CardDescription className="mt-1">
              {health.suggestedAction}
            </CardDescription>
          </div>
          <div className="shrink-0 text-right">
            <p className={`display-text text-4xl font-semibold leading-none ${config.color}`}>
              {health.score}
            </p>
            <p className="mt-1 text-[11px] font-medium uppercase tracking-[0.14em] text-muted">{health.label}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="mt-5 grid gap-4 border-t border-black/7 pt-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-[11px] uppercase tracking-[0.18em] text-muted">
              Lifetime value
            </p>
            <p className="mt-1 text-lg font-semibold text-foreground">
              {formatCurrency(ltv, currency)}
            </p>
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-[0.18em] text-muted">
              Avg days to pay
            </p>
            <p className="mt-1 text-lg font-semibold text-foreground">
              {reliability ? Math.round(reliability.avgDaysToPay) : "—"}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
