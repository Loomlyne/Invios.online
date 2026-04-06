export default function ClientsLoading() {
  return (
    <div className="grid gap-6 animate-pulse">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-3">
          <div className="h-9 w-24 rounded-full bg-black/8" />
          <div className="h-4 w-64 rounded-full bg-black/6" />
        </div>
        <div className="h-11 w-32 shrink-0 rounded-full bg-black/8" />
      </div>

      <div className="rounded-[1.75rem] border border-black/8 bg-surface p-4">
        <div className="mb-4 flex gap-3">
          <div className="h-11 flex-1 rounded-[1rem] bg-black/6" />
          <div className="h-11 w-24 rounded-full bg-black/8" />
        </div>
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="rounded-[1.25rem] border border-black/7 bg-[#FFF8EE] px-5 py-5">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <div className="h-5 w-36 rounded-full bg-black/8" />
                  <div className="h-3 w-52 rounded-full bg-black/5" />
                </div>
                <div className="h-4 w-4 rounded-full bg-black/6" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
