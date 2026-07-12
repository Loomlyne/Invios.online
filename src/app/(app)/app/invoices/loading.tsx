export default function InvoicesLoading() {
  return (
    <div className="grid gap-6 animate-pulse">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-3">
          <div className="h-9 w-28 rounded-full bg-surface-strong" />
          <div className="h-4 w-72 rounded-full bg-surface-strong" />
          <div className="mt-2 flex gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-6 w-16 rounded-full bg-surface-strong" />
            ))}
          </div>
        </div>
        <div className="h-11 w-32 shrink-0 rounded-full bg-surface-strong" />
      </div>

      <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-4">
        {/* Toolbar */}
        <div className="mb-4 flex gap-3">
          <div className="h-11 flex-1 rounded-[1rem] bg-surface-strong" />
          <div className="h-11 w-44 rounded-[1rem] bg-surface-strong" />
          <div className="h-11 w-24 rounded-full bg-surface-strong" />
        </div>

        {/* Kanban columns — stacked on mobile, side-by-side on desktop */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, col) => (
            <div key={col} className="flex flex-col gap-2">
              {/* Column header */}
              <div className="flex items-center justify-between px-1 py-1.5">
                <div className="flex items-center gap-2">
                  <div className="size-2.5 rounded-full bg-surface-strong" />
                  <div className="h-3 w-20 rounded-full bg-surface-strong" />
                </div>
                <div className="h-3 w-5 rounded-full bg-surface-strong" />
              </div>

              {/* Cards container */}
              <div className="min-h-[120px] rounded-[1.25rem] border border-border bg-surface-subtle p-2 flex flex-col gap-2">
                {[...Array(2 + ((col + 1) % 3))].map((_, card) => (
                  <div
                    key={card}
                    className="rounded-[1rem] border border-border bg-surface px-4 py-3 space-y-2"
                  >
                    <div className="h-4 w-24 rounded-full bg-surface-strong" />
                    <div className="h-3 w-32 rounded-full bg-surface-strong" />
                    <div className="flex items-center justify-between pt-1">
                      <div className="h-3 w-16 rounded-full bg-surface-strong" />
                      <div className="h-4 w-14 rounded-full bg-surface-strong" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
