import { requireUser } from "@/lib/auth-guard";
import { getActiveProjectId } from "@/lib/project-context";
import { prisma } from "@/lib/prisma";
import { EmptyState } from "@/components/ui/page-header";
import { loadProjectExpenses } from "@/lib/finance/queries";
import { CHRONOLOGICAL_CONSTRUCTION_STAGES } from "@/lib/catalog/stage-ordering";
import { StageHubView, type StageSummaryItem } from "@/components/stages/stage-hub-view";

export const dynamic = "force-dynamic";

export default async function StagesOverviewPage() {
  const user = await requireUser();
  const projectId = await getActiveProjectId(user.id);
  if (!projectId) {
    return (
      <EmptyState
        title="No active project"
        body="Create or select a house project to view the construction stages."
      />
    );
  }

  const [project, dbStages, rawExpenses] = await Promise.all([
    prisma.project.findFirst({ where: { id: projectId, userId: user.id } }),
    prisma.constructionStage.findMany({ where: { projectId }, orderBy: { sortOrder: "asc" } }),
    loadProjectExpenses(projectId),
  ]);

  if (!project) {
    return (
      <EmptyState
        title="No active project"
        body="Create or select a house project to view the construction stages."
      />
    );
  }

  let totalProjectSpent = 0;

  const stagesData: StageSummaryItem[] = CHRONOLOGICAL_CONSTRUCTION_STAGES.map((conf) => {
    // Find matching stage in db by name or keywords
    const matchedDbStage = dbStages.find(
      (s) =>
        s.name.toLowerCase() === conf.name.toLowerCase() ||
        s.name.toLowerCase() === conf.shortName.toLowerCase() ||
        conf.keywords.some((k) => s.name.toLowerCase().includes(k))
    );

    const stageId = matchedDbStage?.id;

    // Filter expenses matching this stage
    const matchingExpenses = rawExpenses.filter((e) => {
      if (stageId && e.constructionStageId === stageId) return true;
      if (e.constructionStageName) {
        const cName = e.constructionStageName.toLowerCase();
        return (
          cName === conf.name.toLowerCase() ||
          cName === conf.shortName.toLowerCase() ||
          conf.keywords.some((k) => cName.includes(k))
        );
      }
      return false;
    });

    let totalSpent = 0;
    let materialSpent = 0;
    let labourSpent = 0;
    let serviceSpent = 0;

    for (const exp of matchingExpenses) {
      const amt = Number(exp.amount);
      totalSpent += amt;
      if (exp.expenseType === "MATERIAL") materialSpent += amt;
      else if (exp.expenseType === "LABOUR") labourSpent += amt;
      else serviceSpent += amt;
    }

    totalProjectSpent += totalSpent;

    return {
      step: conf.step,
      id: stageId,
      name: conf.name,
      shortName: conf.shortName,
      icon: conf.icon,
      phase: conf.phase,
      totalSpent,
      materialSpent,
      labourSpent,
      serviceSpent,
      billsCount: matchingExpenses.length,
      status: matchedDbStage?.status ?? "NOT_STARTED",
      percentageComplete: matchedDbStage?.percentageComplete ?? 0,
    };
  });

  return (
    <StageHubView
      projectId={project.id}
      projectName={project.name}
      stagesData={stagesData}
      totalProjectSpent={totalProjectSpent}
      totalProjectBudget={Number(project.totalBudget)}
    />
  );
}
