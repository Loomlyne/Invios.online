export default function DashboardLoading() {
  return (
    <div className="grid gap-6 animate-pulse">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-3">
          <div className="h-9 w-36 rounded-full bg-black/8" />
          <div className="h-4 w-64 rounded-full bg-black/6" />
          <div className="mt-2 flex gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-6 w-16 rounded-full bg-black/6" />
            ))}
          </div>
        </div>
        <div className="h-11 w-36 shrink-0 rounded-full bg-black/8" />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="rounded-[1.1rem] border border-black/7 bg-surface px-4 py-5">
            <div className="h-4 w-24 rounded-full bg-black/8" />
            <div className="mt-2 h-3 w-48 rounded-full bg-black/5" />
          </div>
        ))}
      </div>
    </div>
  );
}
