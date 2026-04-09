"use client";

import { useRouter } from "next/navigation";
import type { Route } from "next";
import { dashboardRangeKeys, type DashboardMetricKey, type DashboardRangeKey } from "@/lib/billing";
import { cn } from "@/lib/utils";

const rangeLabels: Record<DashboardRangeKey, string> = {
  all: "All time",
  "30d": "30 days",
  "90d": "90 days",
  "12m": "12 months",
};

export function DashboardRangeToggle({
  currentRange,
  currentMetric,
}: {
  currentRange: DashboardRangeKey;
  currentMetric: DashboardMetricKey;
}) {
  const router = useRouter();

  function navigate(nextRange: DashboardRangeKey) {
    const params = new URLSearchParams();
    params.set("range", nextRange);
    params.set("metric", currentMetric);
    router.push((`/app?${params.toString()}` as Route), { scroll: false });
  }

  return (
    <div className="flex flex-wrap gap-2">
      {dashboardRangeKeys.map((range) => (
        <button
          key={range}
          type="button"
          onClick={() => navigate(range)}
          aria-pressed={range === currentRange}
          className={cn(
            "min-h-11 rounded-full border px-4 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#CA8A04]/45 focus-visible:ring-offset-2 focus-visible:ring-offset-[#FFFCF7]",
            range === currentRange
              ? "border-[#D7C4A7] bg-[#FFF4E3] text-foreground"
              : "border-border bg-white/80 text-muted-strong hover:border-[#D7C4A7] hover:bg-[#FFF8ED]",
          )}
        >
          {rangeLabels[range]}
        </button>
      ))}
    </div>
  );
}
