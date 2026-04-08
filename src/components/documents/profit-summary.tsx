import { computeProfit } from "@/lib/billing-utils";
import { cn, formatCurrency } from "@/lib/utils";

interface ProfitSummaryProps {
  total: number;
  expensesTotal: number;
  currency: string;
}

export function ProfitSummary({ total, expensesTotal, currency }: ProfitSummaryProps) {
  const { profit, margin } = computeProfit({ total, expensesTotal });

  return (
    <div className="rounded-[1rem] border border-border bg-surface px-4 py-3 flex flex-wrap items-baseline gap-x-6 gap-y-1">
      <span className="text-sm text-muted">Profit</span>
      <span
        className={cn(
          "text-sm font-semibold",
          profit > 0 ? "text-success" : "text-danger",
        )}
      >
        {profit < 0 ? "\u2212" : ""}
        {formatCurrency(Math.abs(profit), currency)}
      </span>
      <span className="text-sm text-muted ml-auto">Margin</span>
      <span className="text-sm font-semibold text-foreground">{margin}%</span>
    </div>
  );
}
