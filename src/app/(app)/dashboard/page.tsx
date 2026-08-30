import { Suspense } from "react";
import Link from "next/link";
import { Plus, Users, FileText, Milestone, ArrowRight } from "lucide-react";
import { getActiveProject } from "@/lib/project-context";
import { getCriticalFinancialSummary, getDashboardSecondaryData } from "@/lib/finance/financial-aggregates";
import { NoProjectState } from "@/components/projects/no-project-state";
import { FinancialHero } from "@/components/dashboard/financial-hero";
import { FinancialSplit } from "@/components/dashboard/financial-split";
import { MonthlyChart } from "@/components/charts/finance-charts";
import { TopExpensesAndAlerts } from "@/components/dashboard/top-expenses";
import { ConstructionProgressCard } from "@/components/dashboard/construction-progress-card";
import { RecentTransactions } from "@/components/dashboard/recent-transactions";

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

function RightPanelSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="rounded-2xl border border-paper-200 bg-white p-5 shadow-xs">
        <div className="h-5 w-44 rounded bg-paper-200 mb-3" />
        <div className="h-2.5 w-full rounded-full bg-paper-100" />
      </div>
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
    </div>
  );
}

// ----------- Async streamed components -----------

async function SpendingChart({ projectId }: { projectId: string }) {
  try {
    const data = await getDashboardSecondaryData(projectId);
    if (!data || data.monthly.length === 0) return null;

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
  } catch (err) {
    console.error("SpendingChart stream error:", err);
    return null;
  }
}

async function RecentExpensesStream({ projectId }: { projectId: string }) {
  try {
    const data = await getDashboardSecondaryData(projectId);
    if (!data || data.recentExpenses.length === 0) return null;

    return <RecentTransactions expenses={data.recentExpenses} />;
  } catch (err) {
    console.error("RecentExpensesStream error:", err);
    return null;
  }
}

async function RightPanelStream({ projectId }: { projectId: string }) {
  try {
    const data = await getDashboardSecondaryData(projectId);
    if (!data) return null;

    return (
      <>
        <ConstructionProgressCard progress={data.progress} />
        <TopExpensesAndAlerts topCategories={data.topCategories} budgetAlerts={data.budgetAlerts} />
      </>
    );
  } catch (err) {
    console.error("RightPanelStream error:", err);
    return null;
  }
}

function QuickActionsCard() {
  return (
    <div className="rounded-2xl border border-paper-200 bg-white p-5 shadow-xs space-y-3">
      <h3 className="font-display text-sm font-bold text-ink-900">Quick Shortcuts</h3>
      <div className="grid grid-cols-2 gap-2">
        <Link
          href="/expenses/new"
          className="flex items-center gap-2 rounded-xl bg-clay-50 hover:bg-clay-100 border border-clay-200 p-2.5 text-xs font-bold text-clay-800 transition"
        >
          <Plus className="h-4 w-4 text-clay-600 shrink-0" />
          <span className="truncate">Add Expense</span>
        </Link>
        <Link
          href="/phonedirectory"
          className="flex items-center gap-2 rounded-xl bg-paper-50 hover:bg-paper-100 border border-paper-200 p-2.5 text-xs font-bold text-ink-800 transition"
        >
          <Users className="h-4 w-4 text-ink-600 shrink-0" />
          <span className="truncate">Contacts</span>
        </Link>
        <Link
          href="/stages"
          className="flex items-center gap-2 rounded-xl bg-paper-50 hover:bg-paper-100 border border-paper-200 p-2.5 text-xs font-bold text-ink-800 transition"
        >
          <Milestone className="h-4 w-4 text-ink-600 shrink-0" />
          <span className="truncate">20 Stages</span>
        </Link>
        <Link
          href="/reports"
          className="flex items-center gap-2 rounded-xl bg-paper-50 hover:bg-paper-100 border border-paper-200 p-2.5 text-xs font-bold text-ink-800 transition"
        >
          <FileText className="h-4 w-4 text-ink-600 shrink-0" />
          <span className="truncate">PDF Report</span>
        </Link>
      </div>
    </div>
  );
}

// ----------- Main page -----------

export default async function DashboardPage() {
  const ctx = await getActiveProject();

  if (!ctx?.project) {
    return (
      <NoProjectState
        title="Start your house project"
        description="Track every rupee spent on cement, steel, bricks, and mason wages with zero confusion."
      />
    );
  }

  const projectId = ctx.project.id;

  // Fast query — only summary numbers (1-2ms via DB aggregates)
  const summary = await getCriticalFinancialSummary(projectId);

  if (!summary) {
    return (
      <NoProjectState
        title="Start your house project"
        description="Track every rupee spent on cement, steel, bricks, and mason wages with zero confusion."
      />
    );
  }

  return (
    <div className="space-y-6 w-full pb-10">
      {/* 1. Executive Key Financials (Top 3 Cards Row across full desktop width) */}
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

      {/* 2. Responsive 2-Column Desktop Grid Layout (Fills wide screen effectively) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (Primary Financial Breakdown & Spending Graphs) */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-6">
          <FinancialSplit
            materialTotal={summary.materialTotal}
            labourTotal={summary.labourTotal}
            otherTotal={summary.otherTotal}
            grandTotal={summary.totalSpent}
          />

          <Suspense fallback={<ChartSkeleton />}>
            <SpendingChart projectId={projectId} />
          </Suspense>

          <Suspense fallback={<ChartSkeleton />}>
            <RecentExpensesStream projectId={projectId} />
          </Suspense>
        </div>

        {/* Right Column (Milestone Progress, Top Categories Ranking, Budget Alerts, Shortcuts) */}
        <div className="lg:col-span-5 xl:col-span-4 space-y-6">
          <Suspense fallback={<RightPanelSkeleton />}>
            <RightPanelStream projectId={projectId} />
          </Suspense>

          <QuickActionsCard />
        </div>
      </div>
    </div>
  );
}
