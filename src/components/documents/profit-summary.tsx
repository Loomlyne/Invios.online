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
    <div className="rounded-[1.1rem] border border-border bg-[#FFFCF7] p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-muted">Profit snapshot</p>
          <p className="mt-1 text-sm text-muted">Income, expenses, and net profit for this invoice.</p>
        </div>
        <div className="rounded-full border border-black/8 bg-white px-3 py-1 text-xs font-medium uppercase tracking-[0.16em] text-foreground">
          Margin {margin}%
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <MetricCard label="Income" value={formatCurrency(total, currency)} tone="default" />
        <MetricCard label="Expenses" value={formatCurrency(expensesTotal, currency)} tone="warning" />
        <MetricCard
          label="Net profit"
          value={`${profit < 0 ? "\u2212" : ""}${formatCurrency(Math.abs(profit), currency)}`}
          tone={profit > 0 ? "success" : "danger"}
        />
      </div>
    </div>
  );
}

function MetricCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "default" | "warning" | "success" | "danger";
}) {
  return (
    <div
      className={cn(
        "rounded-[1rem] border px-4 py-4",
        tone === "default" && "border-black/7 bg-white",
        tone === "warning" && "border-[#E9D7B8] bg-[#FFF8EE]",
        tone === "success" && "border-emerald-200 bg-emerald-50/80",
        tone === "danger" && "border-rose-200 bg-rose-50/80",
      )}
    >
      <p className="text-xs uppercase tracking-[0.18em] text-muted">{label}</p>
      <p className="mt-2 text-sm font-semibold text-foreground">{value}</p>
    </div>
  );
}
