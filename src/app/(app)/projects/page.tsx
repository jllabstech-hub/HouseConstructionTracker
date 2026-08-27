import Link from "next/link";
import { requireUser } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { formatINR } from "@/lib/money";
import { getProjectsSummaryBatch } from "@/lib/finance/financial-aggregates";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

export default async function ProjectsPage() {
  const user = await requireUser();
  const projects = await prisma.project.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });

  const projectIds = projects.map((p) => p.id);
  const summaryMap = await getProjectsSummaryBatch(projectIds);

  const cards = projects.map((project) => {
    const totals = summaryMap.get(project.id) ?? { total: 0, MATERIAL: 0, LABOUR: 0, OTHER: 0 };
    return { project, totals };
  });

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
      <div className="grid gap-4 md:grid-cols-2">
        {cards.map(({ project, totals }) => (
          <Card key={project.id}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="font-display text-xl font-bold">{project.name}</h2>
                <p className="text-sm text-ink-500">{project.location}</p>
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
            <div className="mt-4 flex gap-3 text-sm font-semibold text-clay-700">
              <Link href={`/projects/${project.id}`} className="hover:underline">Overview</Link>
              <Link href={`/projects/${project.id}/stages`} className="hover:underline">Stages</Link>
              <Link href={`/projects/${project.id}/floors`} className="hover:underline">Floors</Link>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
