export default function AppGlobalLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header skeleton */}
      <div className="flex items-center justify-between pb-4 border-b border-paper-200/80">
        <div className="space-y-2">
          <div className="h-7 w-48 rounded-xl bg-paper-200" />
          <div className="h-4 w-64 rounded-lg bg-paper-100" />
        </div>
        <div className="h-9 w-32 rounded-xl bg-paper-200" />
      </div>

      {/* Card grid skeleton */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="h-28 rounded-2xl bg-paper-100 border border-paper-200" />
        <div className="h-28 rounded-2xl bg-paper-100 border border-paper-200" />
        <div className="h-28 rounded-2xl bg-paper-100 border border-paper-200" />
      </div>

      {/* Table / list skeleton */}
      <div className="rounded-2xl border border-paper-200 bg-white p-5 shadow-xs space-y-3">
        <div className="h-5 w-40 rounded-lg bg-paper-200" />
        <div className="divide-y divide-paper-100 rounded-xl border border-paper-100 overflow-hidden">
          <div className="h-12 bg-paper-50" />
          <div className="h-12 bg-paper-50/60" />
          <div className="h-12 bg-paper-50" />
          <div className="h-12 bg-paper-50/60" />
        </div>
      </div>
    </div>
  );
}
