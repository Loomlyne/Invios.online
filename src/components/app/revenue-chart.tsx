"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { EmptyState } from "@/components/app/empty-state";
import type { RevenueTrendMonth } from "@/lib/dashboard";
import { formatCurrency } from "@/lib/utils";

const BILLED_FILL = "rgba(58,50,44,0.60)";
const COLLECTED_FILL = "#ca8a04";

export function RevenueChart({
  data,
  currency,
}: {
  data: RevenueTrendMonth[];
  currency: string;
}) {
  const hasData = data.some((m) => m.billed > 0 || m.collected > 0);

  if (!hasData) {
    return (
      <EmptyState
        title="No revenue data yet."
        description="Issue your first invoice to start tracking trends."
      />
    );
  }

  return (
    <div role="img" aria-label="Revenue trend: billed vs collected over 12 months">
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={data} barGap={2} barCategoryGap="30%">
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="rgba(28,25,23,0.12)"
            vertical={false}
          />
          <XAxis
            dataKey="month"
            tick={{ fontSize: 12, fill: "#6b6359" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tickFormatter={(v: number) =>
              v >= 1000 ? `${Math.round(v / 1000)}K` : String(v)
            }
            tick={{ fontSize: 12, fill: "#6b6359" }}
            axisLine={false}
            tickLine={false}
            width={45}
          />
          <Tooltip
            formatter={(value: number) =>
              formatCurrency(value, currency)
            }
            contentStyle={{
              borderRadius: 8,
              border: "1px solid rgba(28,25,23,0.12)",
              background: "#fffdf9",
            }}
          />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Bar
            dataKey="billed"
            name="Billed"
            fill={BILLED_FILL}
            radius={[3, 3, 0, 0]}
          />
          <Bar
            dataKey="collected"
            name="Collected"
            fill={COLLECTED_FILL}
            radius={[3, 3, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
