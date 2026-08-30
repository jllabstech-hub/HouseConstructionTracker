import { notFound } from "next/navigation";
import Link from "next/link";
import { requireUser } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { loadProjectExpenses } from "@/lib/finance/queries";
import { getFloorTotal, getStageTotal, getTypeTotals } from "@/lib/finance/aggregations";
import { getCached, setCached } from "@/lib/cache-utils";
import { formatINR } from "@/lib/money";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardTitle } from "@/components/ui/card";
import { ProjectForm } from "@/components/projects/project-form";
import { ProjectNavTabs } from "@/components/projects/project-nav-tabs";
import { ArrowLeft, Receipt, Package, HardHat, Layers, Milestone, Building2 } from "lucide-react";
import type { ConstructionStage, Floor, Project } from "@prisma/client";
import type { ExpenseRecord } from "@/lib/finance/aggregations";

export default async function ProjectOverviewPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;

  const cacheKey = `project-overview:${id}:${user.id}`;
  const cached = getCached<{
    project: Project;
    expenses: ExpenseRecord[];
    floors: Floor[];
    stages: ConstructionStage[];
  }>(cacheKey);

  const project = cached?.project ?? (await prisma.project.findFirst({ where: { id, userId: user.id } }));
  if (!project) notFound();

  const expenses = cached?.expenses ?? (await loadProjectExpenses(project.id));
  const floors = cached?.floors ?? (await prisma.floor.findMany({ where: { projectId: project.id }, orderBy: { sortOrder: "asc" } }));
  const stages = cached?.stages ?? (await prisma.constructionStage.findMany({ where: { projectId: project.id }, orderBy: { sortOrder: "asc" } }));

  if (!cached) {
    setCached(cacheKey, { project, expenses, floors, stages });
  }
  const totals = getTypeTotals(expenses);
  const totalBudgetNum = Number(project.totalBudget);
  const totalSpentNum = totals.total.toNumber();
  const materialSpentNum = totals.MATERIAL.toNumber();
  const labourSpentNum = totals.LABOUR.toNumber();
  const usedPercent = totalBudgetNum > 0 ? Math.min(100, Math.round((totalSpentNum / totalBudgetNum) * 100)) : 0;
  const remainingBudget = Math.max(0, totalBudgetNum - totalSpentNum);

  return (
    <div className="space-y-6 w-full pb-12">
      {/* Back Link */}
      <div>
        <Link
          href="/projects"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-ink-600 hover:text-ink-900 transition"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to All Projects</span>
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <PageHeader
          title={project.name}
          subtitle={
            project.location
              ? `${project.location} • Status: ${project.status.replaceAll("_", " ")}`
              : `Status: ${project.status.replaceAll("_", " ")}`
          }
        />
        <div className="flex items-center gap-2">
          <Link
            href={`/projects/${project.id}/stages`}
            className="inline-flex items-center gap-1.5 rounded-xl border border-paper-300 bg-white px-3.5 py-2 text-xs font-bold text-ink-800 shadow-2xs hover:bg-paper-50 transition"
          >
            <Milestone className="h-4 w-4 text-clay-600" />
            <span>Stages</span>
          </Link>
          <Link
            href={`/projects/${project.id}/floors`}
            className="inline-flex items-center gap-1.5 rounded-xl border border-paper-300 bg-white px-3.5 py-2 text-xs font-bold text-ink-800 shadow-2xs hover:bg-paper-50 transition"
          >
            <Layers className="h-4 w-4 text-clay-600" />
            <span>Floors</span>
          </Link>
        </div>
      </div>

      <ProjectNavTabs projectId={project.id} />

      {/* 1. Four Financial KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-paper-200 bg-white p-4 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-ink-500 flex items-center gap-1.5">
              <Building2 className="h-4 w-4 text-clay-600" /> Total Budget
            </span>
          </div>
          <p className="font-display text-2xl font-bold text-ink-900">{formatINR(project.totalBudget)}</p>
          <p className="text-[11px] text-ink-500">Allocated construction target</p>
        </div>

        <div className="rounded-2xl border border-paper-200 bg-white p-4 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-ink-500 flex items-center gap-1.5">
              <Receipt className="h-4 w-4 text-clay-600" /> Total Spent
            </span>
            <span className="text-[10px] font-bold text-clay-700">{usedPercent}% used</span>
          </div>
          <p className="font-display text-2xl font-bold text-ink-900">{formatINR(totalSpentNum)}</p>
          <div className="space-y-1">
            <div className="h-1.5 w-full rounded-full bg-paper-100 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  usedPercent > 100 ? "bg-red-500" : usedPercent > 85 ? "bg-amber-500" : "bg-clay-600"
                }`}
                style={{ width: `${Math.min(100, usedPercent)}%` }}
              />
            </div>
            <p className="text-[10px] text-ink-500">Remaining: {formatINR(remainingBudget)}</p>
          </div>
        </div>

        <div className="rounded-2xl border border-paper-200 bg-white p-4 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-800 flex items-center gap-1.5">
              <Package className="h-4 w-4 text-blue-600" /> Material Spend
            </span>
            <span className="text-[10px] font-bold text-blue-700">
              {totalSpentNum > 0 ? Math.round((materialSpentNum / totalSpentNum) * 100) : 0}% of spent
            </span>
          </div>
          <p className="font-display text-2xl font-bold text-ink-900">{formatINR(materialSpentNum)}</p>
          <p className="text-[11px] text-ink-500">Cement, steel, sand, tiles & fittings</p>
        </div>

        <div className="rounded-2xl border border-paper-200 bg-white p-4 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 flex items-center gap-1.5">
              <HardHat className="h-4 w-4 text-emerald-600" /> Labour Spend
            </span>
            <span className="text-[10px] font-bold text-emerald-700">
              {totalSpentNum > 0 ? Math.round((labourSpentNum / totalSpentNum) * 100) : 0}% of spent
            </span>
          </div>
          <p className="font-display text-2xl font-bold text-ink-900">{formatINR(labourSpentNum)}</p>
          <p className="text-[11px] text-ink-500">Masons, bar benders, daily wages</p>
        </div>
      </div>

      {/* 2. Floor & Stage Spend Breakdown */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="rounded-3xl border border-paper-200 bg-white p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-paper-100 pb-3">
            <div className="flex items-center gap-2">
              <Layers className="h-5 w-5 text-clay-600" />
              <CardTitle className="text-base font-bold text-ink-900">Floor Spend Distribution</CardTitle>
            </div>
            <Link href={`/projects/${project.id}/floors`} className="text-xs font-bold text-clay-700 hover:underline">
              Manage Floors &rarr;
            </Link>
          </div>

          {floors.length === 0 ? (
            <p className="text-xs text-ink-500 py-4 text-center">No floors configured yet.</p>
          ) : (
            <ul className="space-y-3 text-xs">
              {floors.map((floor) => {
                const floorSpendNum = getFloorTotal(expenses, floor.id).toNumber();
                const pct = totalSpentNum > 0 ? Math.round((floorSpendNum / totalSpentNum) * 100) : 0;
                return (
                  <li key={floor.id} className="space-y-1">
                    <div className="flex justify-between font-semibold">
                      <span className="text-ink-800">{floor.name}</span>
                      <span className="font-bold text-ink-900">{formatINR(floorSpendNum)} ({pct}%)</span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-paper-100 overflow-hidden">
                      <div className="h-full bg-clay-600 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        <Card className="rounded-3xl border border-paper-200 bg-white p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-paper-100 pb-3">
            <div className="flex items-center gap-2">
              <Milestone className="h-5 w-5 text-clay-600" />
              <CardTitle className="text-base font-bold text-ink-900">Top Stage Spend</CardTitle>
            </div>
            <Link href={`/projects/${project.id}/stages`} className="text-xs font-bold text-clay-700 hover:underline">
              View All Stages &rarr;
            </Link>
          </div>

          {stages.length === 0 ? (
            <p className="text-xs text-ink-500 py-4 text-center">No stages configured yet.</p>
          ) : (
            <ul className="space-y-3 text-xs">
              {stages.slice(0, 6).map((stage) => {
                const stageSpendNum = getStageTotal(expenses, stage.id).toNumber();
                const pct = totalSpentNum > 0 ? Math.round((stageSpendNum / totalSpentNum) * 100) : 0;
                return (
                  <li key={stage.id} className="space-y-1">
                    <div className="flex justify-between font-semibold">
                      <span className="text-ink-800">{stage.name}</span>
                      <span className="font-bold text-ink-900">{formatINR(stageSpendNum)}</span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-paper-100 overflow-hidden">
                      <div className="h-full bg-emerald-600 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      </div>

      {/* 3. Edit Project Details Form */}
      <Card className="rounded-3xl border border-paper-200 bg-white p-6 sm:p-8 shadow-xs space-y-4">
        <h2 className="font-serif text-lg font-bold text-ink-900 border-b border-paper-100 pb-3">
          Edit House Project Details
        </h2>
        <div className="mt-2">
          <ProjectForm
            projectId={project.id}
            initial={{
              name: project.name,
              location: project.location ?? "",
              plotArea: project.plotArea?.toString() ?? "",
              builtUpArea: project.builtUpArea?.toString() ?? "",
              numberOfFloors: project.numberOfFloors?.toString() ?? "",
              totalBudget: project.totalBudget.toString(),
              startDate: project.startDate?.toISOString().slice(0, 10) ?? "",
              expectedCompletionDate: project.expectedCompletionDate?.toISOString().slice(0, 10) ?? "",
              status: project.status,
              notes: project.notes ?? "",
            }}
          />
        </div>
      </Card>
    </div>
  );
}
