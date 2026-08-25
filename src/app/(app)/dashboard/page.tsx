import Link from "next/link";
import { Plus } from "lucide-react";
import { requireUser } from "@/lib/auth-guard";
import { getActiveProjectId } from "@/lib/project-context";
import { prisma } from "@/lib/prisma";
import { getDashboardData } from "@/lib/finance/queries";
import { getMonthlySeries, getBudgetVariance } from "@/lib/finance/aggregations";
import { toChartNumber } from "@/lib/money";
import { EmptyState } from "@/components/ui/page-header";
import { MonthlyChart } from "@/components/charts/finance-charts";
import { FinancialHero } from "@/components/dashboard/financial-hero";
import { FinancialSplit } from "@/components/dashboard/financial-split";
import { WorkWiseCost, type WorkWiseRow } from "@/components/dashboard/work-wise-cost";
import { TopExpensesAndAlerts } from "@/components/dashboard/top-expenses";
import { RecentTransactions, type RecentExpenseItem } from "@/components/dashboard/recent-transactions";

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

  const [data, stages] = await Promise.all([
    getDashboardData(projectId, user.id),
    prisma.constructionStage.findMany({
      where: { projectId },
      orderBy: { sortOrder: "asc" },
    }),
  ]);

  const overall = getBudgetVariance(data.project.totalBudget, data.totals.total);

  // Monthly Spending Trend
  const monthly = getMonthlySeries(data.expenses).map((row) => ({
    label: row.label,
    material: toChartNumber(row.totals.MATERIAL),
    labour: toChartNumber(row.totals.LABOUR),
    total: toChartNumber(row.totals.total),
  }));

  // Work-wise costs
  const workWiseRows: WorkWiseRow[] = data.workWise.map((w) => ({
    name: w.name,
    material: toChartNumber(w.material),
    labour: toChartNumber(w.labour),
    total: toChartNumber(w.total),
  }));

  // Top 5 Categories
  const topCategories = data.topCategories.slice(0, 5).map((c) => ({
    name: c.name,
    amount: toChartNumber(c.amount),
  }));

  // Budget Alerts (Over-budget categories)
  const budgetAlerts = data.overBudget.map((c) => ({
    name: c.name,
    variance: toChartNumber(c.variance),
  }));

  // Recent 5 Transactions
  const recentExpenses: RecentExpenseItem[] = data.expenses.slice(0, 5).map((e) => ({
    id: e.id ?? "",
    date: typeof e.date === "string" ? e.date : e.date.toISOString().slice(0, 10),
    type: e.expenseType,
    categoryName:
      e.materialCategoryName ||
      e.labourCategoryName ||
      e.serviceCategoryName ||
      e.equipmentCategoryName ||
      e.professionalCategoryName ||
      "Expense",
    description: e.description ?? null,
    vendorName: e.vendorName || e.workerName || null,
    amount: toChartNumber(e.amount),
  }));

  // Find active stage
  const activeStage = stages.find((s) => s.status === "IN_PROGRESS") ?? stages[0];

  return (
    <div className="space-y-6">
      {/* 1. Compact Project Header & Financial KPIs (First Viewport) */}
      <FinancialHero
        projectName={data.project.name}
        location={data.project.location}
        currentStageName={activeStage?.name ?? null}
        totalSpent={toChartNumber(data.totals.total)}
        totalBudget={toChartNumber(data.project.totalBudget)}
        remainingBudget={toChartNumber(overall.remaining)}
        usedPercent={toChartNumber(overall.usedPercent)}
        billsCount={data.expenses.length}
      />

      {/* 2. Where Money is Going (Material vs Labour vs Other) */}
      <FinancialSplit
        materialTotal={toChartNumber(data.totals.MATERIAL)}
        labourTotal={toChartNumber(data.totals.LABOUR)}
        otherTotal={
          toChartNumber(data.totals.SERVICE) +
          toChartNumber(data.totals.EQUIPMENT) +
          toChartNumber(data.totals.PROFESSIONAL) +
          toChartNumber(data.totals.OTHER)
        }
        grandTotal={toChartNumber(data.totals.total)}
      />

      {/* 3. Spending Overview Chart */}
      {monthly.length > 0 && (
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
      )}

      {/* 4. What did each type of work cost? (Work-wise Cost) */}
      <WorkWiseCost rows={workWiseRows} />

      {/* 5. Top Expense Categories & Budget Alerts */}
      <TopExpensesAndAlerts
        topCategories={topCategories}
        budgetAlerts={budgetAlerts}
      />

      {/* 6. Recent Transactions */}
      <RecentTransactions expenses={recentExpenses} />
    </div>
  );
}
