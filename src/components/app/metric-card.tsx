import { cn } from "@/lib/utils";

export function MetricCard({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="rounded-[1.1rem] border border-black/7 bg-surface p-4 sm:p-5">
      <p className="text-xs text-muted uppercase tracking-[0.18em]">{label}</p>
      <p
        className={cn(
          "mt-1 text-2xl font-semibold tracking-tight",
          accent ? "text-success" : "text-foreground",
        )}
      >
        {value}
      </p>
    </div>
  );
}
