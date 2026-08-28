export default function DashboardLoading() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10 animate-pulse">
      {/* Header skeleton */}
      <div className="border-b border-paper-200/80 pb-4 space-y-2">
        <div className="h-8 w-48 rounded-lg bg-paper-200" />
        <div className="h-4 w-72 rounded-lg bg-paper-100" />
      </div>

      {/* Financial Hero Cards skeleton */}
      <div className="grid gap-3.5 sm:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-2xl border border-paper-200 bg-white p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="h-3 w-20 rounded bg-paper-200" />
              <div className="h-4 w-4 rounded bg-paper-100" />
            </div>
            <div className="h-8 w-32 rounded-lg bg-paper-200" />
            <div className="h-3 w-24 rounded bg-paper-100 mt-4 pt-2.5 border-t border-paper-100" />
          </div>
        ))}
      </div>

      {/* Progress bar skeleton */}
      <div className="rounded-xl border border-paper-200 bg-white p-3.5 shadow-xs">
        <div className="h-2 w-full rounded-full bg-paper-100" />
      </div>

      {/* Financial Split skeleton */}
      <div className="grid gap-3 sm:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-xl border border-paper-200 bg-white p-4 shadow-xs space-y-2">
            <div className="h-3 w-24 rounded bg-paper-200" />
            <div className="h-6 w-28 rounded bg-paper-100" />
          </div>
        ))}
      </div>

      {/* Chart skeleton */}
      <div className="rounded-2xl border border-paper-200 bg-white p-5 sm:p-6 shadow-xs">
        <div className="h-5 w-36 rounded bg-paper-200 mb-4" />
        <div className="h-[200px] w-full rounded-xl bg-paper-50" />
      </div>
    </div>
  );
}
