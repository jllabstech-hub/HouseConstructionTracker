import dynamic from "next/dynamic";
import {
  getMonthlyTrendOptimized,
  getTopCategoriesAndAlertsOptimized,
  getConstructionProgressSummary,
  getRecentExpensesOptimized,
} from "@/lib/finance/financial-aggregates";
import { TopExpensesAndAlerts } from "@/components/dashboard/top-expenses";
import { ConstructionProgressCard } from "@/components/dashboard/construction-progress-card";
import { RecentTransactions } from "@/components/dashboard/recent-transactions";

// Lazy-load recharts chunk asynchronously into a separate bundle chunk
const MonthlyChart = dynamic(
  () => import("@/components/charts/finance-charts").then((mod) => mod.MonthlyChart),
  {
    loading: () => (
      <div className="h-[280px] w-full animate-pulse bg-paper-100/60 rounded-xl flex items-center justify-center text-xs text-ink-400 font-medium">
        Loading chart...
      </div>
    ),
  }
);

export async function DashboardMonthlySection({ projectId }: { projectId: string }) {
  const monthly = await getMonthlyTrendOptimized(projectId);
  if (monthly.length === 0) return null;

  return (
    <div className="rounded-2xl border border-paper-200 bg-white p-5 sm:p-6 shadow-xs space-y-3">
      <div className="flex items-center justify-between border-b border-paper-100 pb-3">
        <div>
          <h2 className="font-display text-base sm:text-lg font-bold text-ink-900 leading-tight">
            Spending Trend
          </h2>
          <p className="text-xs text-ink-500 mt-0.5">
            Month-over-month construction expenditure breakdown (Material vs Labour vs Total)
          </p>
        </div>
      </div>
      <div className="pt-2">
        <MonthlyChart data={monthly} />
      </div>
    </div>
  );
}

export async function DashboardConstructionProgressSection({ projectId }: { projectId: string }) {
  const progress = await getConstructionProgressSummary(projectId);
  return <ConstructionProgressCard progress={progress} />;
}

export async function DashboardTopCategoriesAndAlertsSection({ projectId }: { projectId: string }) {
  const { topCategories, budgetAlerts } = await getTopCategoriesAndAlertsOptimized(projectId);
  return <TopExpensesAndAlerts topCategories={topCategories} budgetAlerts={budgetAlerts} />;
}

export async function DashboardRecentTransactionsSection({ projectId }: { projectId: string }) {
  const recentExpenses = await getRecentExpensesOptimized(projectId, 5);
  return <RecentTransactions expenses={recentExpenses} />;
}
