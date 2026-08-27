import { getMonthlyTrendOptimized, getTopCategoriesAndAlertsOptimized, getWorkWiseCostOptimized, getRecentExpensesOptimized } from "@/lib/finance/financial-aggregates";
import { MonthlyChart } from "@/components/charts/finance-charts";
import { WorkWiseCost } from "@/components/dashboard/work-wise-cost";
import { TopExpensesAndAlerts } from "@/components/dashboard/top-expenses";
import { RecentTransactions } from "@/components/dashboard/recent-transactions";

export async function DashboardMonthlySection({ projectId }: { projectId: string }) {
  const monthly = await getMonthlyTrendOptimized(projectId);
  if (monthly.length === 0) return null;

  return (
    <div className="rounded-2xl border border-paper-200 bg-white p-5 shadow-xs space-y-3">
      <div>
        <h2 className="font-display text-base sm:text-lg font-bold text-ink-900 leading-tight">
          Monthly Spending Trend
        </h2>
        <p className="text-xs text-ink-500 mt-0.5">
          Month-over-month construction expenditure breakdown
        </p>
      </div>
      <div className="pt-2">
        <MonthlyChart data={monthly} />
      </div>
    </div>
  );
}

export async function DashboardWorkWiseSection({ projectId, userId }: { projectId: string; userId: string }) {
  const workWiseRows = await getWorkWiseCostOptimized(projectId, userId);
  return <WorkWiseCost rows={workWiseRows} />;
}

export async function DashboardTopCategoriesSection({ projectId }: { projectId: string }) {
  const { topCategories, budgetAlerts } = await getTopCategoriesAndAlertsOptimized(projectId);
  return <TopExpensesAndAlerts topCategories={topCategories} budgetAlerts={budgetAlerts} />;
}

export async function DashboardRecentTransactionsSection({ projectId }: { projectId: string }) {
  const recentExpenses = await getRecentExpensesOptimized(projectId, 5);
  return <RecentTransactions expenses={recentExpenses} />;
}
