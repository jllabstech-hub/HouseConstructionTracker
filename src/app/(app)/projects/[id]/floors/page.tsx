import { notFound } from "next/navigation";
import Link from "next/link";
import { requireUser } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { loadProjectExpenses } from "@/lib/finance/queries";
import { getFloorTotal, getTypeTotals } from "@/lib/finance/aggregations";
import { getCached, setCached } from "@/lib/cache-utils";
import { formatINR } from "@/lib/money";
import { PageHeader } from "@/components/ui/page-header";
import { FloorManager } from "@/components/projects/structure-managers";
import { ProjectNavTabs } from "@/components/projects/project-nav-tabs";
import { ArrowLeft, Layers } from "lucide-react";
import type { Floor, Project } from "@prisma/client";
import type { ExpenseRecord } from "@/lib/finance/aggregations";

export default async function FloorsPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;

  const cacheKey = `floors-page:${id}:${user.id}`;
  const cached = getCached<{
    project: Project;
    floors: Floor[];
    expenses: ExpenseRecord[];
  }>(cacheKey);

  const project = cached?.project ?? (await prisma.project.findFirst({ where: { id, userId: user.id } }));
  if (!project) notFound();

  const floors = cached?.floors ?? (await prisma.floor.findMany({ where: { projectId: id }, orderBy: { sortOrder: "asc" } }));
  const expenses = cached?.expenses ?? (await loadProjectExpenses(id));

  if (!cached) {
    setCached(cacheKey, { project, floors, expenses });
  }

  const totals = getTypeTotals(expenses);
  const totalSpent = totals.total.toNumber();

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Back Link */}
      <div>
        <Link
          href={`/projects/${project.id}`}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-ink-600 hover:text-ink-900 transition"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Project Overview</span>
        </Link>
      </div>

      <PageHeader
        title={`${project.name} Floors`}
        subtitle="Manage building levels: basement, ground floor, first floor, terrace, or external works."
      />
      <ProjectNavTabs projectId={project.id} />

      {/* Floor Spend Cards */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {floors.map((floor) => {
          const spend = getFloorTotal(expenses, floor.id).toNumber();
          const pct = totalSpent > 0 ? Math.round((spend / totalSpent) * 100) : 0;
          return (
            <div key={floor.id} className="rounded-2xl border border-paper-200 bg-white p-4 shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-ink-900 flex items-center gap-1.5">
                  <Layers className="h-4 w-4 text-clay-600" />
                  <span>{floor.name}</span>
                </span>
                <span className="text-[11px] font-bold text-clay-700">{pct}% of total</span>
              </div>
              <p className="font-display text-lg font-bold text-ink-900">{formatINR(spend)}</p>
              <div className="h-1.5 w-full rounded-full bg-paper-100 overflow-hidden">
                <div className="h-full bg-clay-600 rounded-full" style={{ width: `${pct}%` }} />
              </div>
            </div>
          );
        })}
      </div>

      <FloorManager projectId={id} floors={floors} />
    </div>
  );
}
