"use client";

import { useRouter } from "next/navigation";
import type { Route } from "next";
import { TrendingUp, TrendingDown } from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";

export function MetricCard({
  label,
  value,
  accent = false,
  interactive = false,
  active = false,
  href,
  momBadge,
  currency,
}: {
  label: string;
  value: string;
  accent?: boolean;
  interactive?: boolean;
  active?: boolean;
  href?: string;
  momBadge?: {
    delta: number | null;
    unit: "currency" | "percent" | "pp";
  };
  currency?: string;
}) {
  const router = useRouter();
  const classes = cn(
    "rounded-[var(--radius-inner)] border p-4 text-left transition sm:p-5",
    interactive
      ? "min-h-24 cursor-pointer border-black/7 bg-surface sm:min-h-28 hover:border-[#D7C4A7] hover:bg-surface-warm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/45 focus-visible:ring-offset-2 focus-visible:ring-offset-[#FFFCF7]"
      : "border-black/7 bg-surface",
    active && "border-[#D7C4A7] bg-surface-warm shadow-[0_18px_42px_rgba(202,138,4,0.12)]",
  );

  const content = (
    <>
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs text-muted uppercase tracking-[0.18em]">{label}</p>
        {interactive ? (
          <span
            aria-hidden
            className={cn(
              "mt-1 size-2.5 rounded-full transition",
              active ? "bg-accent" : "bg-black/10",
            )}
          />
        ) : null}
      </div>
      <p
        className={cn(
          "mt-1 truncate font-semibold tabular-nums tracking-tight text-[clamp(1.125rem,0.875rem+0.625vw,1.5rem)]",
          accent ? "text-success" : "text-foreground",
        )}
      >
        {value}
      </p>
      {momBadge && momBadge.delta !== null ? (
        <div
          className={cn(
            "mt-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium tabular-nums",
            momBadge.delta >= 0
              ? "bg-[rgba(36,88,58,0.10)] text-success"
              : "bg-[rgba(141,61,46,0.10)] text-danger",
          )}
        >
          {momBadge.delta >= 0 ? (
            <TrendingUp className="size-3" aria-hidden="true" />
          ) : (
            <TrendingDown className="size-3" aria-hidden="true" />
          )}
          {momBadge.delta >= 0 ? "+" : ""}
          {momBadge.unit === "pp"
            ? `${momBadge.delta.toFixed(1)}pp`
            : momBadge.unit === "percent"
              ? `${momBadge.delta.toFixed(1)}%`
              : formatCurrency(Math.abs(momBadge.delta), currency ?? "AED")}
        </div>
      ) : null}
      {interactive ? (
        <p className="mt-3 text-xs font-medium text-muted-strong">
          {active ? "Showing drilldown" : "Click to inspect"}
        </p>
      ) : null}
    </>
  );

  if (!interactive || !href) {
    return <div className={classes}>{content}</div>;
  }

  return (
    <button
      type="button"
      aria-pressed={active}
      className={classes}
      onClick={() => router.push(href as Route, { scroll: false })}
    >
      {content}
    </button>
  );
}
