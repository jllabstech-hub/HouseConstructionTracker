import Link from "next/link";
import { requireUser } from "@/lib/auth-guard";
import { getActiveProjectId } from "@/lib/project-context";
import { prisma } from "@/lib/prisma";
import { formatINR } from "@/lib/money";
import { getProjectsSummaryBatch } from "@/lib/finance/financial-aggregates";
import { getCached, setCached } from "@/lib/cache-utils";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
      <PageHeader
        title="Projects"
        subtitle="Each house is a project with its own budget, floors, stages and expenses."
        actions={
          <Link href="/projects/new" className="rounded-xl bg-clay-600 px-4 py-2 text-sm font-semibold text-white hover:bg-clay-700 transition">
            + New project
          </Link>
        }
      />
      {cards.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-paper-300 bg-white p-12 text-center">
          <h3 className="font-display text-lg font-bold text-ink-900">No projects yet</h3>
          <p className="text-xs text-ink-500 mt-1 max-w-sm mx-auto">
            Create your first house construction project to begin tracking stages, material purchases, labour wages, and budgets.
          </p>
          <div className="mt-4">
            <Link
              href="/projects/new"
              className="inline-flex items-center gap-1.5 rounded-xl bg-clay-600 px-4 py-2 text-xs font-bold text-white hover:bg-clay-700 shadow-xs transition"
            >
              + Create First Project
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {cards.map(({ project, totals, isActive }) => (
            <Card key={project.id} className={isActive ? "border-clay-400 bg-clay-50/10" : ""}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="font-display text-xl font-bold">{project.name}</h2>
                    {isActive && (
                      <span className="rounded-full bg-clay-600 px-2 py-0.5 text-[10px] font-extrabold text-white uppercase tracking-wider">
                        Active House
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-ink-500">{project.location || "No location set"}</p>
                </div>
                <Badge>{project.status.replaceAll("_", " ")}</Badge>
              </div>
              <dl className="mt-4 grid grid-cols-2 gap-2 text-sm">
                <div>
                  <dt className="text-ink-500">Budget</dt>
                  <dd className="font-semibold text-ink-900">{formatINR(project.totalBudget)}</dd>
                </div>
                <div>
                  <dt className="text-ink-500">Spent</dt>
                  <dd className="font-semibold text-ink-900">{formatINR(totals.total)}</dd>
                </div>
                <div>
                  <dt className="text-ink-500">Material</dt>
                  <dd className="font-semibold text-ink-900">{formatINR(totals.MATERIAL)}</dd>
                </div>
                <div>
                  <dt className="text-ink-500">Labour</dt>
                  <dd className="font-semibold text-ink-900">{formatINR(totals.LABOUR)}</dd>
                </div>
              </dl>
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
