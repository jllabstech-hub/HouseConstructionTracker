import { requireUser } from "@/lib/auth-guard";
import { getActiveProjectId } from "@/lib/project-context";
import { prisma } from "@/lib/prisma";
import { getCached, setCached } from "@/lib/cache-utils";
import { EmptyState } from "@/components/ui/page-header";
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

  const cacheKey = `stages:${projectId}`;
  const cached = getCached<{
    projectId: string;
    projectName: string;
    stagesData: StageSummaryItem[];
    totalProjectSpent: number;
    totalProjectBudget: number;
  }>(cacheKey);

  if (cached) {
    return (
      <StageHubView
        projectId={cached.projectId}
        projectName={cached.projectName}
        stagesData={cached.stagesData}
        totalProjectSpent={cached.totalProjectSpent}
        totalProjectBudget={cached.totalProjectBudget}
      />
    );
  }

  try {
    const [project, dbStages, rawExpenses] = await Promise.all([
      prisma.project.findFirst({ where: { id: projectId, userId: user.id } }),
      prisma.constructionStage.findMany({ where: { projectId }, orderBy: { sortOrder: "asc" } }),
      prisma.expense.findMany({
        where: { projectId },
        select: {
          amount: true,
          expenseType: true,
          constructionStageId: true,
          constructionStage: { select: { name: true } },
        },
      }),
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
        if (e.constructionStage?.name) {
          const cName = e.constructionStage.name.toLowerCase();
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
        const amt = Number(exp.amount ?? 0);
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

    const payload = {
      projectId: project.id,
      projectName: project.name,
      stagesData,
      totalProjectSpent,
      totalProjectBudget: Number(project.totalBudget ?? 0),
    };

    setCached(cacheKey, payload);

    return (
      <StageHubView
        projectId={payload.projectId}
        projectName={payload.projectName}
        stagesData={payload.stagesData}
        totalProjectSpent={payload.totalProjectSpent}
        totalProjectBudget={payload.totalProjectBudget}
      />
    );
  } catch (err) {
    console.error("StagesOverviewPage load error:", err);
    return (
      <EmptyState
        title="Construction Stages"
        body="Unable to load construction stages at this moment. Please refresh."
      />
    );
  }
}

