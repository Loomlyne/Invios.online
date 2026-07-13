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
  healthy: { icon: TrendingUp, color: "text-green-600" },
  "at-risk": { icon: AlertTriangle, color: "text-amber-600" },
  critical: { icon: AlertTriangle, color: "text-red-600" },
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
    <Card>
      <CardHeader>
        <Badge variant="accent">Client intelligence</Badge>
        <CardTitle className="mt-3">Relationship health</CardTitle>
        <CardDescription>
          Computed from payment history and billing patterns.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="grid grid-cols-3 gap-3">
          <div>
            <p className="text-[11px] uppercase tracking-[0.18em] text-muted">
              LTV
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
          <div>
            <p className="text-[11px] uppercase tracking-[0.18em] text-muted">
              Health score
            </p>
            <p className={`mt-1 text-lg font-semibold ${config.color}`}>
              {health.score}
            </p>
          </div>
        </div>

        <div className="flex items-start gap-2 border-t border-black/7 pt-3">
          <Icon className={`mt-0.5 size-4 ${config.color}`} />
          <div>
            <p className="text-sm font-medium capitalize text-foreground">
              {health.label}
            </p>
            <p className="text-sm text-muted-strong">
              {health.suggestedAction}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
