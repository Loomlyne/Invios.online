export default function DashboardLoading() {
  return (
    <div className="grid gap-[var(--space-section)]">
      {/* Page header skeleton */}
      <div className="space-y-2">
        <div className="h-9 w-48 rounded-[1rem] animate-pulse bg-black/6" />
        <div className="h-5 w-72 rounded-[1rem] animate-pulse bg-black/6" />
      </div>

      {/* Metric strip skeleton — 4 cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-[var(--space-grid)]">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-[76px] rounded-[var(--radius-inner)] animate-pulse bg-black/6" />
        ))}
      </div>

      {/* Quick actions skeleton */}
      <div className="flex gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-9 w-32 rounded-full animate-pulse bg-black/6" />
        ))}
      </div>

      {/* Recent documents skeleton — 2 columns */}
      <div className="grid gap-[var(--space-grid)] md:grid-cols-2">
        {Array.from({ length: 2 }).map((_, col) => (
          <div key={col} className="rounded-[var(--radius-card)] border border-black/7 p-[var(--space-card)] space-y-3">
            <div className="h-6 w-40 rounded-[1rem] animate-pulse bg-black/6" />
            {Array.from({ length: 3 }).map((__, row) => (
              <div key={row} className="h-12 rounded-[1rem] animate-pulse bg-black/6" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
