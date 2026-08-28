import { notFound } from "next/navigation";
import Link from "next/link";
import { requireUser } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { loadProjectExpenses } from "@/lib/finance/queries";
import { getStageTotal } from "@/lib/finance/aggregations";
import { formatINR } from "@/lib/money";
import { PageHeader } from "@/components/ui/page-header";
import { StagesTable } from "@/components/projects/stages-table";
import { StageManager } from "@/components/projects/structure-managers";
import { ProjectNavTabs } from "@/components/projects/project-nav-tabs";
import { ArrowLeft } from "lucide-react";

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
        title={`${project.name} Stages`}
        subtitle="Manage construction sequence milestones and mark completion percentages."
      />
      <ProjectNavTabs projectId={project.id} />
      <StagesTable stages={stageRows} />
      <StageManager projectId={id} stages={stages} />
    </div>
  );
}
