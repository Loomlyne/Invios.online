"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { EmptyState } from "@/components/app/empty-state";
import type { AgingBucket } from "@/lib/dashboard";
import { formatCurrency } from "@/lib/utils";

const AGING_FILLS = [
  "#f1e9dc",               // 0-30d: surface-strong
  "rgba(202,138,4,0.28)",  // 31-60d: accent-glow
  "rgba(202,138,4,0.55)",  // 61-90d: denser amber
  "#8d3d2e",               // 90+d: danger
] as const;

export function AgingChart({
  buckets,
  currency,
}: {
  buckets: AgingBucket[];
  currency: string;
}) {
  const hasData = buckets.some((b) => b.amount > 0);

  if (!hasData) {
    return (
      <EmptyState
        title="No outstanding receivables."
        description="All invoices are either paid or in draft."
      />
    );
  }

  const chartData = [
    {
      name: "aging",
      ...Object.fromEntries(buckets.map((b) => [b.label, b.amount])),
    },
  ];

  return (
    <div>
      <div
        role="img"
        aria-label="Receivables aging breakdown by days outstanding"
      >
        <ResponsiveContainer width="100%" height={120}>
          <BarChart data={chartData} layout="vertical" barSize={32}>
            <XAxis type="number" hide />
            <YAxis type="category" dataKey="name" hide />
            <Tooltip
              formatter={(value: number, name: string) => {
                const bucket = buckets.find((b) => b.label === name);
                return [
                  `${formatCurrency(value, currency)} (${bucket?.count ?? 0} inv)`,
                  name,
                ];
              }}
              contentStyle={{
                borderRadius: 8,
                border: "1px solid rgba(28,25,23,0.12)",
                background: "#fffdf9",
              }}
            />
            {buckets.map((bucket, idx) => (
              <Bar
                key={bucket.label}
                dataKey={bucket.label}
                stackId="aging"
                fill={AGING_FILLS[idx]}
                radius={
                  idx === 0
                    ? [3, 0, 0, 3]
                    : idx === buckets.length - 1
                      ? [0, 3, 3, 0]
                      : [0, 0, 0, 0]
                }
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-x-3 gap-y-3 sm:grid-cols-4">
        {buckets.map((bucket, idx) => (
          <div key={bucket.label} className="min-w-0 text-xs">
            <div className="flex items-center gap-1.5">
              <span
                aria-hidden="true"
                className="inline-block size-2.5 shrink-0 rounded-sm"
                style={{ backgroundColor: AGING_FILLS[idx] }}
              />
              <span className="truncate text-muted">{bucket.label}</span>
            </div>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="truncate font-semibold tabular-nums text-foreground">
                {formatCurrency(bucket.amount, currency)}
              </span>
              <span className="shrink-0 text-muted">({bucket.count})</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
