"use client";

import { useRouter } from "next/navigation";
import type { Route } from "next";
import { dashboardRangeKeys, type DashboardRangeKey } from "@/lib/billing";
import { cn } from "@/lib/utils";

const rangeLabels: Record<DashboardRangeKey, string> = {
  all: "All time",
  "30d": "30 days",
  "90d": "90 days",
  "12m": "12 months",
};

export function DashboardRangeToggle({
  currentRange,
}: {
  currentRange: DashboardRangeKey;
}) {
  const router = useRouter();

  function navigate(nextRange: DashboardRangeKey) {
    const params = new URLSearchParams();
    params.set("range", nextRange);
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
            "min-h-11 rounded-full border px-4 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/45 focus-visible:ring-offset-2",
            range === currentRange
              ? "border-border-brand bg-surface-subtle text-foreground"
              : "border-border bg-white/80 text-muted-strong hover:border-border-brand hover:bg-surface-subtle",
          )}
        >
          {rangeLabels[range]}
        </button>
      ))}
    </div>
  );
}
