import Link from "next/link";
import { Plus } from "lucide-react";
import { requireUser } from "@/lib/auth-guard";
import { getActiveProjectId } from "@/lib/project-context";
import { prisma } from "@/lib/prisma";
import { formatINR } from "@/lib/money";
import { getProjectsSummaryBatch } from "@/lib/finance/financial-aggregates";
import { getCached, setCached } from "@/lib/cache-utils";
import { Card } from "@/components/ui/card";
import { ProjectCardActions } from "@/components/projects/project-card-actions";
import type { Project } from "@prisma/client";

export const dynamic = "force-dynamic";

export default async function ProjectsPage() {
  const user = await requireUser();
  const cacheKey = `projects-list:${user.id}`;
  const cached = getCached<{
    cards: {
      project: Project;
      totals: { total: number; MATERIAL: number; LABOUR: number; OTHER: number };
      isActive: boolean;
    }[];
  }>(cacheKey);

  let cards = cached?.cards;

  if (!cards) {
    const [projects, activeProjectId] = await Promise.all([
      prisma.project.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
      }),
      getActiveProjectId(user.id),
    ]);

    const projectIds = projects.map((p) => p.id);
    const summaryMap = await getProjectsSummaryBatch(projectIds);

    cards = projects.map((project) => {
      const totals = summaryMap.get(project.id) ?? { total: 0, MATERIAL: 0, LABOUR: 0, OTHER: 0 };
      return { project, totals, isActive: project.id === activeProjectId };
    });

    setCached(cacheKey, { cards });
  }

  return (
    <div>
      {/* Compact header with inline button */}
      <div className="flex items-center justify-between gap-3 mb-5">
        <h1 className="font-display text-xl sm:text-2xl font-bold text-ink-900">
          My Houses
        </h1>
        <Link
          href="/projects/new"
          className="inline-flex items-center gap-1.5 rounded-xl bg-clay-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-clay-700 transition whitespace-nowrap shadow-xs shrink-0"
        >
          <Plus className="h-3.5 w-3.5" />
          Add House
        </Link>
      </div>

      {cards.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-paper-300 bg-white p-12 text-center">
          <h3 className="font-display text-lg font-bold text-ink-900">No houses yet</h3>
          <p className="text-xs text-ink-500 mt-1 max-w-sm mx-auto">
            Create your first house construction project to begin tracking stages, material purchases, labour wages, and budgets.
          </p>
          <div className="mt-4">
            <Link
              href="/projects/new"
              className="inline-flex items-center gap-1.5 rounded-xl bg-clay-600 px-4 py-2 text-xs font-bold text-white hover:bg-clay-700 shadow-xs transition"
            >
              <Plus className="h-3.5 w-3.5" />
              Create First House
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {cards.map(({ project, totals, isActive }) => (
            <Card key={project.id} className={isActive ? "border-clay-400 bg-clay-50/10" : ""}>
              {/* Row 1: Name + Status */}
              <div className="flex items-center justify-between gap-2 mb-1">
                <h2 className="font-display text-lg font-bold text-ink-900 truncate min-w-0">
                  {project.name}
                </h2>
                <div className="flex items-center gap-1.5 shrink-0">
                  {isActive && (
                    <span className="rounded-full bg-clay-600 px-2 py-0.5 text-[9px] font-extrabold text-white uppercase tracking-wider whitespace-nowrap">
                      Active
                    </span>
                  )}
                  <span className="rounded-full border border-paper-300 bg-paper-50 px-2 py-0.5 text-[9px] font-bold text-ink-600 uppercase tracking-wider whitespace-nowrap">
                    {project.status.replaceAll("_", " ")}
                  </span>
                </div>
              </div>

              {/* Row 2: Location */}
              {project.location && (
                <p className="text-xs text-ink-500 mb-3">{project.location}</p>
              )}
              {!project.location && <div className="mb-3" />}

              {/* Row 3: Financial summary - 2x2 grid */}
              <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                <div>
                  <dt className="text-[11px] text-ink-400 font-medium">Budget</dt>
                  <dd className="font-bold text-ink-900">{formatINR(project.totalBudget)}</dd>
                </div>
                <div>
                  <dt className="text-[11px] text-ink-400 font-medium">Spent</dt>
                  <dd className="font-bold text-ink-900">{formatINR(totals.total)}</dd>
                </div>
                <div>
                  <dt className="text-[11px] text-ink-400 font-medium">Material</dt>
                  <dd className="font-semibold text-ink-800">{formatINR(totals.MATERIAL)}</dd>
                </div>
                <div>
                  <dt className="text-[11px] text-ink-400 font-medium">Labour</dt>
                  <dd className="font-semibold text-ink-800">{formatINR(totals.LABOUR)}</dd>
                </div>
              </dl>

              {/* Row 4: Actions */}
              <ProjectCardActions
                projectId={project.id}
                projectName={project.name}
                isActive={isActive}
              />
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
