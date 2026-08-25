import Link from "next/link";
import { format } from "date-fns";
import {
  AlertTriangle,
  ArrowRight,
  ChevronRight,
  IndianRupee,
  Plus,
  Receipt,
  Sparkles,
  Wallet,
} from "lucide-react";
import { requireUser } from "@/lib/auth-guard";
import { getActiveProjectId } from "@/lib/project-context";
import { getDashboardData } from "@/lib/finance/queries";
import { getMonthlySeries, getBudgetVariance } from "@/lib/finance/aggregations";
import { formatINR, toChartNumber } from "@/lib/money";
import { EmptyState } from "@/components/ui/page-header";
import { MonthlyChart, WorkWiseBars } from "@/components/charts/finance-charts";
import { ConstructionGallery } from "@/components/dashboard/construction-gallery";
import { cn } from "@/lib/utils";

export default async function DashboardPage() {
  const user = await requireUser();
  const projectId = await getActiveProjectId(user.id);
  if (!projectId) {
    return (
      <EmptyState
        title="Start your house project"
        body="Track every rupee spent on cement, steel, bricks, and mason wages with zero confusion."
        action={
          <Link href="/projects" className="rounded-xl bg-clay-600 px-5 py-2.5 font-bold text-white shadow-xs">
            ➕ Add Your House
          </Link>
        }
      />
    );
  }

  const data = await getDashboardData(projectId, user.id);
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthExpenses = data.expenses.filter((row) => new Date(row.date) >= monthStart);
  const monthTotal = monthExpenses.reduce((sum, row) => sum + toChartNumber(row.amount), 0);
  const overall = getBudgetVariance(data.project.totalBudget, data.totals.total);

  const monthly = getMonthlySeries(data.expenses).map((row) => ({
    label: row.label,
    material: toChartNumber(row.totals.MATERIAL),
    labour: toChartNumber(row.totals.LABOUR),
    total: toChartNumber(row.totals.total),
  }));

  const usedPercentage = Math.min(100, Math.max(0, Number(overall.usedPercent.toString())));

  return (
    <div className="space-y-6">
      {/* 1. Visual Hero Spotlight & Stage Photo Gallery */}
      <ConstructionGallery
        projectId={data.project.id}
        projectName={data.project.name}
        location={data.project.location}
        totalBudget={Number(data.project.totalBudget ?? 0)}
        totalSpent={Number(data.totals.total)}
      />

      {/* 2. Top 3 Big Overview Numbers */}
      <div className="grid gap-3 sm:grid-cols-3">
        {/* Planned Budget */}
        <div className="rounded-3xl border border-paper-200 bg-white p-5 sm:p-6 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-ink-400">Total Budget</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
              <Wallet className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4">
            <p className="font-display text-2xl sm:text-3xl font-bold text-ink-900">
              {formatINR(data.project.totalBudget)}
            </p>
            <p className="text-xs text-ink-400 mt-1 font-medium">Planned total estimate</p>
          </div>
        </div>

        {/* Total Spent */}
        <div className="rounded-3xl border border-clay-200 bg-clay-50/50 p-5 sm:p-6 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-clay-800">Spent So Far</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-clay-600 text-white">
              <Receipt className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4">
            <p className="font-display text-2xl sm:text-3xl font-bold text-clay-700">
              {formatINR(data.totals.total)}
            </p>
            <p className="text-xs text-clay-800 mt-1 font-semibold">
              {data.expenses.length} bills & payments logged
            </p>
          </div>
        </div>

        {/* Remaining Money */}
        <div className="rounded-3xl border border-paper-200 bg-white p-5 sm:p-6 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-ink-400">Cash Remaining</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
              <IndianRupee className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4">
            <p className={cn(
              "font-display text-2xl sm:text-3xl font-bold",
              overall.isOver ? "text-red-600" : "text-emerald-700",
            )}>
              {formatINR(overall.remaining)}
            </p>
            <p className="text-xs text-ink-400 mt-1 font-medium">
              {overall.isOver ? "⚠️ Over budget" : `${overall.usedPercent.toString()}% consumed`}
            </p>
          </div>
        </div>
      </div>

      {/* 3. Budget Consumption Progress Bar */}
      <div className="rounded-3xl border border-paper-200 bg-white p-5 shadow-xs space-y-2.5">
        <div className="flex items-center justify-between text-xs font-bold">
          <span className="text-ink-700">Budget Consumed ({overall.usedPercent.toString()}%)</span>
          <span className="text-ink-500">{formatINR(data.totals.total)} of {formatINR(data.project.totalBudget)}</span>
        </div>
        <div className="h-4 w-full overflow-hidden rounded-full bg-paper-100 p-0.5">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-500",
              usedPercentage >= 95 ? "bg-red-500" : usedPercentage >= 80 ? "bg-amber-500" : "bg-clay-600",
            )}
            style={{ width: `${usedPercentage}%` }}
          />
        </div>
      </div>

      {/* 4. Three Big Categories Breakdown (Material vs Labour vs Machines) */}
      <div className="rounded-3xl border border-paper-200 bg-white p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-paper-100 pb-3">
          <div>
            <p className="font-display text-lg font-bold text-ink-900">Where did your money go?</p>
            <p className="text-xs text-ink-500">Materials are kept strictly separate from worker wages</p>
          </div>
          <Link href="/reports" className="text-xs font-bold text-clay-700 hover:underline flex items-center gap-1">
            Full report <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          {/* Material */}
          <Link
            href="/expenses?type=MATERIAL"
            className="rounded-2xl border border-paper-200 bg-paper-50 p-4 hover:border-clay-300 hover:bg-clay-50/40 transition group"
          >
            <div className="flex items-center gap-2">
              <span className="text-2xl">🧱</span>
              <div>
                <p className="text-xs font-bold uppercase text-ink-500">Material Purchases</p>
                <p className="font-display text-xl font-bold text-ink-900 group-hover:text-clay-700">
                  {formatINR(data.totals.MATERIAL)}
                </p>
              </div>
            </div>
            <p className="text-[11px] text-ink-400 mt-2">Cement, Steel, Bricks, Sand, Tiles</p>
          </Link>

          {/* Labour */}
          <Link
            href="/expenses?type=LABOUR"
            className="rounded-2xl border border-paper-200 bg-paper-50 p-4 hover:border-clay-300 hover:bg-clay-50/40 transition group"
          >
            <div className="flex items-center gap-2">
              <span className="text-2xl">👷</span>
              <div>
                <p className="text-xs font-bold uppercase text-ink-500">Worker Wages</p>
                <p className="font-display text-xl font-bold text-ink-900 group-hover:text-clay-700">
                  {formatINR(data.totals.LABOUR)}
                </p>
              </div>
            </div>
            <p className="text-[11px] text-ink-400 mt-2">Masonry, Tile laying, Painting labour</p>
          </Link>

          {/* Others */}
          <Link
            href="/expenses"
            className="rounded-2xl border border-paper-200 bg-paper-50 p-4 hover:border-clay-300 hover:bg-clay-50/40 transition group"
          >
            <div className="flex items-center gap-2">
              <span className="text-2xl">🚜</span>
              <div>
                <p className="text-xs font-bold uppercase text-ink-500">Machinery & Others</p>
                <p className="font-display text-xl font-bold text-ink-900 group-hover:text-clay-700">
                  {formatINR(data.totals.SERVICE.plus(data.totals.EQUIPMENT).plus(data.totals.PROFESSIONAL).plus(data.totals.OTHER))}
                </p>
              </div>
            </div>
            <p className="text-[11px] text-ink-400 mt-2">JCB, Scaffolding, Architect, Tea/Pooja</p>
          </Link>
        </div>
      </div>

      {/* 5. Plain English Smart Summary */}
      <div className="rounded-3xl border border-clay-200 bg-gradient-to-br from-white to-clay-50/40 p-5 sm:p-6 shadow-xs space-y-2">
        <div className="flex items-center gap-2 text-clay-800">
          <Sparkles className="h-5 w-5" />
          <p className="font-display text-base font-bold">House Summary at a Glance</p>
        </div>
        <p className="text-sm leading-relaxed text-ink-700 font-medium">
          {data.summary}
        </p>
      </div>

      {/* 6. Friendly Budget Warnings (If Any) */}
      {data.overBudget.length > 0 && (
        <div className="rounded-3xl border border-amber-300 bg-amber-50/80 p-5 shadow-xs space-y-3">
          <div className="flex items-center gap-2 text-amber-900">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
            <p className="font-display text-base font-bold">Items Crossing Planned Budget</p>
          </div>
          <div className="grid gap-2 sm:grid-cols-3">
            {data.overBudget.map((item) => (
              <div key={item.name} className="rounded-xl bg-white p-3 border border-amber-200 text-xs">
                <p className="font-bold text-ink-900">{item.name}</p>
                <p className="text-amber-800 font-semibold mt-0.5">Over by +{formatINR(item.variance)}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 7. Visual Charts Grid */}
      <div className="grid gap-4 xl:grid-cols-2">
        <div className="rounded-3xl border border-paper-200 bg-white p-5 shadow-xs space-y-3">
          <p className="font-display text-base font-bold text-ink-900">Monthly Spending Curve</p>
          <MonthlyChart data={monthly} />
          <p className="text-xs text-ink-500">
            {formatINR(monthTotal)} spent this month
          </p>
        </div>

        <div className="rounded-3xl border border-paper-200 bg-white p-5 shadow-xs space-y-3">
          <p className="font-display text-base font-bold text-ink-900">Trade-wise: Material vs Labour</p>
          <WorkWiseBars
            data={data.workWise.map((row) => ({
              name: row.name,
              material: toChartNumber(row.material),
              labour: toChartNumber(row.labour),
            }))}
          />
          <p className="text-xs text-ink-500">Side-by-side cost for each work area</p>
        </div>
      </div>

      {/* 8. Recent Transactions Passbook */}
      <div className="rounded-3xl border border-paper-200 bg-white p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-paper-100 pb-3">
          <div>
            <p className="font-display text-base font-bold text-ink-900">Recent Transactions</p>
            <p className="text-xs text-ink-500">Latest expenses logged at the site</p>
          </div>
          <Link
            href="/expenses"
            className="text-xs font-bold text-clay-700 hover:underline flex items-center gap-1"
          >
            View All ({data.expenses.length}) <ChevronRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="divide-y divide-paper-100">
          {data.expenses.slice(0, 6).map((row) => (
            <div key={row.id} className="py-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="text-2xl">
                  {row.expenseType === "MATERIAL" ? "🧱" : row.expenseType === "LABOUR" ? "👷" : "🚜"}
                </span>
                <div>
                  <p className="text-sm font-bold text-ink-900 leading-tight">{row.description}</p>
                  <p className="text-xs text-ink-500 mt-0.5">
                    {format(new Date(row.date), "dd MMM yyyy")} · {row.vendorName ?? row.workerName ?? row.expenseType}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm sm:text-base font-bold text-ink-900">{formatINR(row.amount)}</p>
                <span className="text-[10px] font-semibold text-ink-400">
                  {row.paymentMethod?.replaceAll("_", " ")}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
