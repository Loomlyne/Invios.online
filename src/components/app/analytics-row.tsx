"use client";

import dynamic from "next/dynamic";
import { EmptyState } from "@/components/app/empty-state";
import type { RevenueTrendMonth, AgingBucket } from "@/lib/dashboard";

const RevenueChart = dynamic(
  () => import("@/components/app/revenue-chart").then((m) => m.RevenueChart),
  {
    ssr: false,
    loading: () => (
      <div className="h-[260px] animate-pulse rounded-[var(--radius-inner)] bg-surface-strong" />
    ),
  },
);

const AgingChart = dynamic(
  () => import("@/components/app/aging-chart").then((m) => m.AgingChart),
  {
    ssr: false,
    loading: () => (
      <div className="h-[120px] animate-pulse rounded-[var(--radius-inner)] bg-surface-strong" />
    ),
  },
);

export function RevenueChartCard({
  data,
  currency,
  hasChartData,
}: {
  data: RevenueTrendMonth[];
  currency: string;
  hasChartData: boolean;
}) {
  if (!hasChartData) {
    return (
      <EmptyState
        title="No revenue data yet."
        description="Issue your first invoice to start tracking trends."
      />
    );
  }
  return <RevenueChart data={data} currency={currency} />;
}

export function AgingChartCard({
  buckets,
  currency,
  hasChartData,
}: {
  buckets: AgingBucket[];
  currency: string;
  hasChartData: boolean;
}) {
  if (!hasChartData) {
    return (
      <EmptyState
        title="No outstanding receivables."
        description="All invoices are either paid or in draft."
      />
    );
  }
  return <AgingChart buckets={buckets} currency={currency} />;
}
