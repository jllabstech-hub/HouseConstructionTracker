import Link from "next/link";
import { requireUser } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { formatINR } from "@/lib/money";
import { getTypeTotals } from "@/lib/finance/aggregations";
import { loadProjectExpenses } from "@/lib/finance/queries";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function ProjectsPage() {
  const user = await requireUser();
  const projects = await prisma.project.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });

  const cards = await Promise.all(
    projects.map(async (project) => {
      const expenses = await loadProjectExpenses(project.id);
      return { project, totals: getTypeTotals(expenses) };
    }),
  );

  return (
    <div>
      <PageHeader
        title="Projects"
        subtitle="Each house is a project with its own budget, floors, stages and expenses."
        actions={
          <Link href="/projects/new" className="rounded-xl bg-clay-600 px-4 py-2 text-sm font-semibold text-white">
            New project
          </Link>
        }
      />
      <div className="grid gap-4 md:grid-cols-2">
        {cards.map(({ project, totals }) => (
          <Card key={project.id}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="font-display text-xl">{project.name}</h2>
                <p className="text-sm text-ink-500">{project.location}</p>
              </div>
              <Badge>{project.status.replaceAll("_", " ")}</Badge>
            </div>
            <dl className="mt-4 grid grid-cols-2 gap-2 text-sm">
              <div>
                <dt className="text-ink-500">Budget</dt>
                <dd>{formatINR(project.totalBudget)}</dd>
              </div>
              <div>
                <dt className="text-ink-500">Spent</dt>
                <dd>{formatINR(totals.total)}</dd>
              </div>
              <div>
                <dt className="text-ink-500">Material</dt>
                <dd>{formatINR(totals.MATERIAL)}</dd>
              </div>
              <div>
                <dt className="text-ink-500">Labour</dt>
                <dd>{formatINR(totals.LABOUR)}</dd>
              </div>
            </dl>
            <div className="mt-4 flex gap-3 text-sm font-semibold text-clay-700">
              <Link href={`/projects/${project.id}`}>Overview</Link>
              <Link href={`/projects/${project.id}/stages`}>Stages</Link>
              <Link href={`/projects/${project.id}/floors`}>Floors</Link>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
