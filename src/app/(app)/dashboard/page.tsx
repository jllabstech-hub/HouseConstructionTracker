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
  DashboardWorkWiseSection,
  DashboardTopCategoriesSection,
  DashboardRecentTransactionsSection,
} from "@/components/dashboard/dashboard-streaming-sections";
import {
  MonthlyChartSkeleton,
  WorkWiseSkeleton,
  TopCategoriesSkeleton,
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
    <div className="space-y-6">
      {/* 1. Critical Financial KPIs (Immediate First Viewport Render) */}
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

      {/* 2. Where Money is Going (Material vs Labour vs Other) */}
      <FinancialSplit
        materialTotal={summary.materialTotal}
        labourTotal={summary.labourTotal}
        otherTotal={summary.otherTotal}
        grandTotal={summary.totalSpent}
      />

      {/* 3. Streaming Monthly Spending Chart */}
      <Suspense fallback={<MonthlyChartSkeleton />}>
        <DashboardMonthlySection projectId={projectId} />
      </Suspense>

      {/* 4. Streaming Work-wise Cost Breakdown */}
      <Suspense fallback={<WorkWiseSkeleton />}>
        <DashboardWorkWiseSection projectId={projectId} userId={user.id} />
      </Suspense>

      {/* 5. Streaming Top Expense Categories & Budget Alerts */}
      <Suspense fallback={<TopCategoriesSkeleton />}>
        <DashboardTopCategoriesSection projectId={projectId} />
      </Suspense>

      {/* 6. Streaming Recent 5 Transactions */}
      <Suspense fallback={<RecentTransactionsSkeleton />}>
        <DashboardRecentTransactionsSection projectId={projectId} />
      </Suspense>
    </div>
  );
}
