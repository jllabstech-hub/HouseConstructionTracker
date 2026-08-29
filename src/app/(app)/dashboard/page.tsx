import { Suspense } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { requireUser } from "@/lib/auth-guard";
import { getActiveProjectId } from "@/lib/project-context";
import { getCriticalFinancialSummary } from "@/lib/finance/financial-aggregates";
import { EmptyState } from "@/components/ui/page-header";
import { FinancialHero } from "@/components/dashboard/financial-hero";
import { FinancialSplit } from "@/components/dashboard/financial-split";

export const dynamic = "force-dynamic";

// ----------- Skeleton placeholders for streamed sections -----------

function ChartSkeleton() {
  return (
    <div className="rounded-2xl border border-paper-200 bg-white p-5 sm:p-6 shadow-xs space-y-3 animate-pulse">
      <div className="flex items-center justify-between border-b border-paper-100 pb-3">
        <div>
          <div className="h-5 w-36 rounded bg-paper-200" />
          <div className="h-3 w-56 rounded bg-paper-100 mt-2" />
        </div>
      </div>
      <div className="h-[200px] w-full rounded-xl bg-paper-50" />
    </div>
  );
}

function CardsSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Top expenses */}
      <div className="rounded-2xl border border-paper-200 bg-white p-5 shadow-xs">
        <div className="h-5 w-40 rounded bg-paper-200 mb-4" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex justify-between">
              <div className="h-4 w-24 rounded bg-paper-100" />
              <div className="h-4 w-16 rounded bg-paper-100" />
            </div>
          ))}
        </div>
      </div>
      {/* Progress */}
      <div className="rounded-xl border border-paper-200 bg-white p-5 shadow-xs">
        <div className="h-5 w-44 rounded bg-paper-200 mb-3" />
        <div className="h-2.5 w-full rounded-full bg-paper-100" />
      </div>
      {/* Recent transactions */}
      <div className="rounded-2xl border border-paper-200 bg-white p-5 shadow-xs">
        <div className="h-5 w-40 rounded bg-paper-200 mb-4" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex justify-between">
              <div className="h-4 w-32 rounded bg-paper-100" />
              <div className="h-4 w-20 rounded bg-paper-100" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ----------- Async streamed components -----------

async function SpendingChart({ projectId }: { projectId: string }) {
  const { getDashboardSecondaryData } = await import("@/lib/finance/financial-aggregates");
  const data = await getDashboardSecondaryData(projectId);
  if (!data || data.monthly.length === 0) return null;

  // Lazy-load the recharts-based component to avoid blocking initial bundle
  const { MonthlyChart } = await import("@/components/charts/finance-charts");

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
        <MonthlyChart data={data.monthly} />
      </div>
    </div>
  );
}

async function BottomCards({ projectId }: { projectId: string }) {
  const { getDashboardSecondaryData } = await import("@/lib/finance/financial-aggregates");
  const { TopExpensesAndAlerts } = await import("@/components/dashboard/top-expenses");
  const { ConstructionProgressCard } = await import("@/components/dashboard/construction-progress-card");
  const { RecentTransactions } = await import("@/components/dashboard/recent-transactions");

  const data = await getDashboardSecondaryData(projectId);
  if (!data) return null;

  return (
    <>
      <TopExpensesAndAlerts topCategories={data.topCategories} budgetAlerts={data.budgetAlerts} />
      <ConstructionProgressCard progress={data.progress} />
      <RecentTransactions expenses={data.recentExpenses} />
    </>
  );
}

// ----------- Main page -----------

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

  // Fast query — only summary numbers (1-2ms via DB aggregates)
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
      {/* 1. Instant: Project Header & Key Financials */}
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

      {/* 2. Instant: Material vs Labour vs Other split */}
      <FinancialSplit
        materialTotal={summary.materialTotal}
        labourTotal={summary.labourTotal}
        otherTotal={summary.otherTotal}
        grandTotal={summary.totalSpent}
      />

      {/* 3. Streamed: Monthly spending chart (heavy recharts) */}
      <Suspense fallback={<ChartSkeleton />}>
        <SpendingChart projectId={projectId} />
      </Suspense>

      {/* 4. Streamed: Top expenses, progress, recent transactions */}
      <Suspense fallback={<CardsSkeleton />}>
        <BottomCards projectId={projectId} />
      </Suspense>
    </div>
  );
}
