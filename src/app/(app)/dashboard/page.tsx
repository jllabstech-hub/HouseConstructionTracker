import { Suspense } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { requireUser } from "@/lib/auth-guard";
import { getActiveProjectId } from "@/lib/project-context";
import { getCriticalFinancialSummary } from "@/lib/finance/financial-aggregates";
import { EmptyState } from "@/components/ui/page-header";
import { FinancialHero } from "@/components/dashboard/financial-hero";
import { FinancialSplit } from "@/components/dashboard/financial-split";
import {
  DashboardMonthlySection,
  DashboardTopCategoriesAndAlertsSection,
  DashboardConstructionProgressSection,
  DashboardRecentTransactionsSection,
} from "@/components/dashboard/dashboard-streaming-sections";
import {
  MonthlyChartSkeleton,
  TopCategoriesSkeleton,
  ConstructionProgressSkeleton,
  RecentTransactionsSkeleton,
} from "@/components/dashboard/dashboard-skeletons";

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

  // 1. Critical Financial Summary: Executes in 1-2ms via direct PostgreSQL aggregation
  const summary = await getCriticalFinancialSummary(projectId);

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
      <Suspense fallback={<MonthlyChartSkeleton />}>
        <DashboardMonthlySection projectId={projectId} />
      </Suspense>

      {/* 4. Top Expense Categories & Budget Alerts (What Needs My Attention?) */}
      <Suspense fallback={<TopCategoriesSkeleton />}>
        <DashboardTopCategoriesAndAlertsSection projectId={projectId} />
      </Suspense>

      {/* 5. Construction Progress (20 Milestone Timeline) */}
      <Suspense fallback={<ConstructionProgressSkeleton />}>
        <DashboardConstructionProgressSection projectId={projectId} />
      </Suspense>

      {/* 6. Recent Expenses (Latest 5 Transactions) */}
      <Suspense fallback={<RecentTransactionsSkeleton />}>
        <DashboardRecentTransactionsSection projectId={projectId} />
      </Suspense>
    </div>
  );
}
