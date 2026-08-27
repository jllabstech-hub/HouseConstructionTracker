import { Card } from "@/components/ui/card";

export function FinancialSummarySkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="flex items-center justify-between pb-4 border-b border-paper-200/80">
        <div className="space-y-2">
          <div className="h-8 w-48 rounded-xl bg-paper-200" />
          <div className="h-4 w-32 rounded-lg bg-paper-100" />
        </div>
        <div className="flex gap-2">
          <div className="h-9 w-28 rounded-xl bg-paper-200" />
          <div className="h-9 w-32 rounded-xl bg-clay-200" />
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="h-28 rounded-2xl bg-clay-100/60 border border-clay-200" />
        <div className="h-28 rounded-2xl bg-paper-100 border border-paper-200" />
        <div className="h-28 rounded-2xl bg-paper-100 border border-paper-200" />
      </div>
      <div className="h-10 rounded-xl bg-paper-100 border border-paper-200" />
    </div>
  );
}

export function MonthlyChartSkeleton() {
  return (
    <div className="rounded-2xl border border-paper-200 bg-white p-5 shadow-xs space-y-3 animate-pulse">
      <div className="h-5 w-48 rounded-lg bg-paper-200" />
      <div className="h-3 w-64 rounded-md bg-paper-100" />
      <div className="h-64 rounded-xl bg-paper-50 mt-4 border border-paper-100" />
    </div>
  );
}

export function WorkWiseSkeleton() {
  return (
    <div className="rounded-2xl border border-paper-200 bg-white p-5 shadow-xs space-y-3 animate-pulse">
      <div className="h-5 w-44 rounded-lg bg-paper-200" />
      <div className="h-3 w-56 rounded-md bg-paper-100" />
      <div className="grid gap-3 sm:grid-cols-2 mt-4">
        <div className="h-24 rounded-xl bg-paper-50 border border-paper-100" />
        <div className="h-24 rounded-xl bg-paper-50 border border-paper-100" />
        <div className="h-24 rounded-xl bg-paper-50 border border-paper-100" />
        <div className="h-24 rounded-xl bg-paper-50 border border-paper-100" />
      </div>
    </div>
  );
}

export function TopCategoriesSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 animate-pulse">
      <div className="rounded-2xl border border-paper-200 bg-white p-5 shadow-xs space-y-3">
        <div className="h-5 w-40 rounded-lg bg-paper-200" />
        <div className="space-y-2 mt-4">
          <div className="h-10 rounded-xl bg-paper-50 border border-paper-100" />
          <div className="h-10 rounded-xl bg-paper-50 border border-paper-100" />
          <div className="h-10 rounded-xl bg-paper-50 border border-paper-100" />
        </div>
      </div>
      <div className="rounded-2xl border border-paper-200 bg-white p-5 shadow-xs space-y-3">
        <div className="h-5 w-32 rounded-lg bg-paper-200" />
        <div className="space-y-2 mt-4">
          <div className="h-10 rounded-xl bg-paper-50 border border-paper-100" />
          <div className="h-10 rounded-xl bg-paper-50 border border-paper-100" />
        </div>
      </div>
    </div>
  );
}

export function RecentTransactionsSkeleton() {
  return (
    <div className="rounded-2xl border border-paper-200 bg-white p-5 shadow-xs space-y-3 animate-pulse">
      <div className="flex justify-between items-center">
        <div className="h-5 w-44 rounded-lg bg-paper-200" />
        <div className="h-4 w-20 rounded-md bg-paper-100" />
      </div>
      <div className="divide-y divide-paper-100 mt-4 border border-paper-100 rounded-xl overflow-hidden">
        <div className="h-14 bg-paper-50" />
        <div className="h-14 bg-paper-50/60" />
        <div className="h-14 bg-paper-50" />
      </div>
    </div>
  );
}

export function FullDashboardSkeleton() {
  return (
    <div className="space-y-6">
      <FinancialSummarySkeleton />
      <div className="grid gap-3 sm:grid-cols-3 animate-pulse">
        <div className="h-24 rounded-2xl bg-paper-100 border border-paper-200" />
        <div className="h-24 rounded-2xl bg-paper-100 border border-paper-200" />
        <div className="h-24 rounded-2xl bg-paper-100 border border-paper-200" />
      </div>
      <MonthlyChartSkeleton />
      <WorkWiseSkeleton />
      <TopCategoriesSkeleton />
      <RecentTransactionsSkeleton />
    </div>
  );
}
