export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="h-4 w-40 rounded bg-slate-800 animate-pulse mb-3" />
          <div className="h-8 w-64 rounded bg-slate-800 animate-pulse" />
        </div>
        <div className="h-10 w-36 rounded-md bg-slate-800 animate-pulse" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="h-28 rounded-xl border border-slate-800 bg-slate-900/70 animate-pulse"
          />
        ))}
      </div>

      <div className="h-80 rounded-xl border border-slate-800 bg-slate-900/70 animate-pulse" />
    </div>
  );
}
