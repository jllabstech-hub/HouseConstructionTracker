import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { loadProjectExpenses } from "@/lib/finance/queries";
import { getStageTotal } from "@/lib/finance/aggregations";
import { formatINR } from "@/lib/money";
import { PageHeader } from "@/components/ui/page-header";
import { StagesTable } from "@/components/projects/stages-table";
import { StageManager } from "@/components/projects/structure-managers";
import { ProjectNavTabs } from "@/components/projects/project-nav-tabs";

export default async function StagesPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const project = await prisma.project.findFirst({ where: { id, userId: user.id } });
  if (!project) notFound();
  const [stages, expenses] = await Promise.all([
    prisma.constructionStage.findMany({ where: { projectId: id }, orderBy: { sortOrder: "asc" } }),
    loadProjectExpenses(id),
  ]);

  const stageRows = stages.map((stage) => ({
    id: stage.id,
    name: stage.name,
    status: stage.status,
    percentageComplete: stage.percentageComplete,
    spend: formatINR(getStageTotal(expenses, stage.id)),
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${project.name} stages`}
        subtitle="Track construction progress independently from financial expense types."
      />
      <ProjectNavTabs projectId={project.id} />
      <StagesTable stages={stageRows} />
      <StageManager projectId={id} stages={stages} />
    </div>
  );
}
