import Link from "next/link";
import { Plus } from "lucide-react";
import { requireUser } from "@/lib/auth-guard";
import { getActiveProjectId } from "@/lib/project-context";
import {
  getCriticalFinancialSummary,
  getMonthlyTrendOptimized,
  getTopCategoriesAndAlertsOptimized,
  getConstructionProgressSummary,
  getRecentExpensesOptimized,
} from "@/lib/finance/financial-aggregates";
import { EmptyState } from "@/components/ui/page-header";
import { FinancialHero } from "@/components/dashboard/financial-hero";
import { FinancialSplit } from "@/components/dashboard/financial-split";
import { MonthlyChart } from "@/components/charts/finance-charts";
import { TopExpensesAndAlerts } from "@/components/dashboard/top-expenses";
import { ConstructionProgressCard } from "@/components/dashboard/construction-progress-card";
import { RecentTransactions } from "@/components/dashboard/recent-transactions";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await requireUser();
  const projectId = await getActiveProjectId(user.id);

  if (!projectId) {
    return (
      <EmptyState
        title="Start your house project"
        body="Track every rupee spent on cement, steel, bricks, and mason wages with zero confusion."
        action={
          <Link
            href="/projects"
            className="inline-flex items-center gap-1.5 rounded-xl bg-clay-600 px-5 py-2.5 font-bold text-white shadow-xs hover:bg-clay-700 transition"
          >
            <Plus className="h-4 w-4" />
            <span>Add Your House</span>
          </Link>
        }
      />
    );
  }

  // Load all dashboard components in parallel - executes in ~5-15ms
  const [summary, monthly, { topCategories, budgetAlerts }, progress, recentExpenses] = await Promise.all([
    getCriticalFinancialSummary(projectId),
    getMonthlyTrendOptimized(projectId),
    getTopCategoriesAndAlertsOptimized(projectId),
    getConstructionProgressSummary(projectId),
    getRecentExpensesOptimized(projectId, 5),
  ]);

  if (!summary) {
    return (
      <EmptyState
        title="Start your house project"
        body="Track every rupee spent on cement, steel, bricks, and mason wages with zero confusion."
        action={
          <Link
            href="/projects"
            className="inline-flex items-center gap-1.5 rounded-xl bg-clay-600 px-5 py-2.5 font-bold text-white shadow-xs hover:bg-clay-700 transition"
          >
            <Plus className="h-4 w-4" />
            <span>Add Your House</span>
          </Link>
        }
      />
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      {/* 1. Project Header & Key Financial Questions: Total Spent | Budget | Remaining + Primary CTA */}
      <FinancialHero
        projectName={summary.projectName}
        location={summary.location}
        currentStageName={summary.currentStageName}
        totalSpent={summary.totalSpent}
        totalBudget={summary.totalBudget}
        remainingBudget={summary.remainingBudget}
        usedPercent={summary.usedPercent}
        billsCount={summary.billsCount}
      />

      {/* 2. Where is the Money Going? (Material vs Labour vs Other) */}
      <FinancialSplit
        materialTotal={summary.materialTotal}
        labourTotal={summary.labourTotal}
        otherTotal={summary.otherTotal}
        grandTotal={summary.totalSpent}
      />

      {/* 3. Spending Trend (Monthly Timeline Chart) */}
      {monthly.length > 0 && (
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
      )}

      {/* 4. Top Expense Categories & Budget Alerts (What Needs My Attention?) */}
      <TopExpensesAndAlerts topCategories={topCategories} budgetAlerts={budgetAlerts} />

      {/* 5. Construction Progress (20 Milestone Timeline) */}
      <ConstructionProgressCard progress={progress} />

      {/* 6. Recent Expenses (Latest 5 Transactions) */}
      <RecentTransactions expenses={recentExpenses} />
    </div>
  );
}
