import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { loadProjectExpenses } from "@/lib/finance/queries";
import { getFloorTotal, getStageTotal, getTypeTotals } from "@/lib/finance/aggregations";
import { formatINR } from "@/lib/money";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardTitle } from "@/components/ui/card";
import { ProjectForm } from "@/components/projects/project-form";

import { ProjectNavTabs } from "@/components/projects/project-nav-tabs";

export default async function ProjectOverviewPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const project = await prisma.project.findFirst({ where: { id, userId: user.id } });
  if (!project) notFound();

  const [expenses, floors, stages] = await Promise.all([
    loadProjectExpenses(project.id),
    prisma.floor.findMany({ where: { projectId: project.id }, orderBy: { sortOrder: "asc" } }),
    prisma.constructionStage.findMany({ where: { projectId: project.id }, orderBy: { sortOrder: "asc" } }),
  ]);
  const totals = getTypeTotals(expenses);

  return (
    <div className="space-y-6">
      <PageHeader
        title={project.name}
        subtitle={project.location ?? "Project overview"}
      />
      <ProjectNavTabs projectId={project.id} />
      <div className="grid gap-3 sm:grid-cols-4">
        <Card><p className="text-xs text-ink-500">Budget</p><p className="font-display text-xl">{formatINR(project.totalBudget)}</p></Card>
        <Card><p className="text-xs text-ink-500">Spent</p><p className="font-display text-xl">{formatINR(totals.total)}</p></Card>
        <Card><p className="text-xs text-ink-500">Material</p><p className="font-display text-xl">{formatINR(totals.MATERIAL)}</p></Card>
        <Card><p className="text-xs text-ink-500">Labour</p><p className="font-display text-xl">{formatINR(totals.LABOUR)}</p></Card>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardTitle>Floor spend</CardTitle>
          <ul className="mt-3 space-y-2 text-sm">
            {floors.map((floor) => (
              <li key={floor.id} className="flex justify-between">
                <span>{floor.name}</span>
                <span>{formatINR(getFloorTotal(expenses, floor.id))}</span>
              </li>
            ))}
          </ul>
        </Card>
        <Card>
          <CardTitle>Stage spend</CardTitle>
          <ul className="mt-3 space-y-2 text-sm">
            {stages.slice(0, 10).map((stage) => (
              <li key={stage.id} className="flex justify-between">
                <span>{stage.name}</span>
                <span>{formatINR(getStageTotal(expenses, stage.id))}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>
      <Card>
        <CardTitle>Edit project</CardTitle>
        <div className="mt-4">
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
