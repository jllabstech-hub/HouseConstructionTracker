import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth-guard";
import { getActiveProjectId } from "@/lib/project-context";
import { prisma } from "@/lib/prisma";
import { getCached, setCached } from "@/lib/cache-utils";
import { EmptyState } from "@/components/ui/page-header";
import {
  CHRONOLOGICAL_CONSTRUCTION_STAGES,
} from "@/lib/catalog/stage-ordering";
import {
  StageDetailView,
  type StageDetailExpense,
  type StageDetailDocument,
} from "@/components/stages/stage-detail-view";

export const dynamic = "force-dynamic";

export default async function StageDetailPage({
  params,
}: {
  params: Promise<{ step: string }>;
}) {
  const user = await requireUser();
  const projectId = await getActiveProjectId(user.id);
  if (!projectId) {
    return (
      <EmptyState
        title="No active project"
        body="Create or select a house project to view stage details."
      />
    );
  }

  const { step: stepParam } = await params;
  const stepNum = parseInt(stepParam, 10);

  if (isNaN(stepNum) || stepNum < 1 || stepNum > 20) {
    notFound();
  }

  const stageConfig = CHRONOLOGICAL_CONSTRUCTION_STAGES[stepNum - 1];
  if (!stageConfig) {
    notFound();
  }

  const prevStage = stepNum > 1 ? CHRONOLOGICAL_CONSTRUCTION_STAGES[stepNum - 2] : null;
  const nextStage = stepNum < 20 ? CHRONOLOGICAL_CONSTRUCTION_STAGES[stepNum] : null;

  const cacheKey = `stage-detail:${projectId}:${stepNum}`;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cached = getCached<any>(cacheKey);

  if (cached) {
    return (
      <StageDetailView
        projectId={cached.projectId}
        projectName={cached.projectName}
        step={stepNum}
        stageConfig={stageConfig}
        prevStage={prevStage}
        nextStage={nextStage}
        stageName={cached.stageName}
        stageId={cached.stageId}
        status={cached.status}
        percentageComplete={cached.percentageComplete}
        expenses={cached.expenses}
        documents={cached.documents}
        totalSpent={cached.totalSpent}
        materialSpent={cached.materialSpent}
        labourSpent={cached.labourSpent}
        serviceSpent={cached.serviceSpent}
      />
    );
  }

  const [project, dbStages, allExpenses, rawDocuments] = await Promise.all([
    prisma.project.findFirst({ where: { id: projectId, userId: user.id } }),
    prisma.constructionStage.findMany({ where: { projectId }, orderBy: { sortOrder: "asc" } }),
    prisma.expense.findMany({
      where: { projectId },
      select: {
        id: true,
        date: true,
        expenseType: true,
        amount: true,
        description: true,
        paymentMethod: true,
        quantity: true,
        unit: true,
        rate: true,
        materialCategoryId: true,
        materialCategory: { select: { name: true } },
        labourCategoryId: true,
        labourCategory: { select: { name: true } },
        serviceCategoryId: true,
        serviceCategory: { select: { name: true } },
        equipmentCategoryId: true,
        equipmentCategory: { select: { name: true } },
        professionalCategoryId: true,
        professionalCategory: { select: { name: true } },
        vendor: { select: { name: true } },
        worker: { select: { name: true } },
        constructionStageId: true,
        constructionStage: { select: { name: true } },
        receipts: { select: { id: true } },
      },
      orderBy: { date: "desc" },
    }),
    prisma.projectDocument.findMany({
      where: { projectId },
      orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
    }),
  ]);

  if (!project) {
    notFound();
  }

  // Find matching stage in database
  const matchedDbStage = dbStages.find(
    (s) =>
      s.name.toLowerCase() === stageConfig.name.toLowerCase() ||
      s.name.toLowerCase() === stageConfig.shortName.toLowerCase() ||
      stageConfig.keywords.some((k) => s.name.toLowerCase().includes(k))
  );

  const stageId = matchedDbStage?.id;

  // Filter expenses belonging to this stage
  const stageExpenses = allExpenses.filter((e) => {
    if (stageId && e.constructionStageId === stageId) return true;
    if (e.constructionStage) {
      const cName = e.constructionStage.name.toLowerCase();
      return (
        cName === stageConfig.name.toLowerCase() ||
        cName === stageConfig.shortName.toLowerCase() ||
        stageConfig.keywords.some((k) => cName.includes(k))
      );
    }
    return false;
  });

  // Calculate totals
  let total = 0;
  let material = 0;
  let labour = 0;
  let machinery = 0;

  for (const e of stageExpenses) {
    const amt = Number(e.amount);
    total += amt;
    if (e.expenseType === "MATERIAL") material += amt;
    else if (e.expenseType === "LABOUR") labour += amt;
    else machinery += amt;
  }

  // Format expenses for client component
  const serializedExpenses: StageDetailExpense[] = stageExpenses.map((e) => {
    const categoryName =
      e.materialCategory?.name ||
      e.labourCategory?.name ||
      e.serviceCategory?.name ||
      e.equipmentCategory?.name ||
      e.professionalCategory?.name ||
      "General";

    const categoryId =
      e.materialCategoryId ||
      e.labourCategoryId ||
      e.serviceCategoryId ||
      e.equipmentCategoryId ||
      e.professionalCategoryId ||
      "";

    const vendorOrWorker = e.vendor?.name || e.worker?.name || null;

    return {
      id: e.id,
      date: e.date.toISOString().slice(0, 10),
      type: e.expenseType,
      category: { id: categoryId, name: categoryName },
      amount: e.amount.toString(),
      description: e.description,
      vendorName: vendorOrWorker,
      paymentMethod: e.paymentMethod,
      quantity: e.quantity ? e.quantity.toString() : null,
      unit: e.unit,
      rate: e.rate ? e.rate.toString() : null,
      receiptCount: e.receipts.length,
    };
  });

  // Filter documents matching this stage
  const stageDocuments: StageDetailDocument[] = rawDocuments
    .filter((d) => {
      if (stageId && d.constructionStageId === stageId) return true;
      const titleLower = d.title.toLowerCase();
      const descLower = (d.description || "").toLowerCase();
      return (
        titleLower.includes(stageConfig.name.toLowerCase()) ||
        titleLower.includes(stageConfig.shortName.toLowerCase()) ||
        descLower.includes(stageConfig.name.toLowerCase()) ||
        stageConfig.keywords.some((k) => titleLower.includes(k) || descLower.includes(k))
      );
    })
    .map((d) => ({
      id: d.id,
      title: d.title,
      category: d.category,
      fileUrl: d.storagePath ? `/api/documents/${d.id}` : "",
      fileType: d.mimeType,
      version: d.version,
      description: d.description,
    }));

  const payload = {
    projectId: project.id,
    projectName: project.name,
    step: stepNum,
    stageName: matchedDbStage?.name || stageConfig.name,
    stageId,
    status: matchedDbStage?.status ?? "NOT_STARTED",
    percentageComplete: matchedDbStage?.percentageComplete ?? 0,
    expenses: serializedExpenses,
    documents: stageDocuments,
    totalSpent: total,
    materialSpent: material,
    labourSpent: labour,
    serviceSpent: machinery,
  };

  setCached(cacheKey, payload);

  return (
    <StageDetailView
      projectId={payload.projectId}
      projectName={payload.projectName}
      step={payload.step}
      stageConfig={stageConfig}
      prevStage={prevStage}
      nextStage={nextStage}
      stageName={payload.stageName}
      stageId={payload.stageId}
      status={payload.status}
      percentageComplete={payload.percentageComplete}
      expenses={payload.expenses}
      documents={payload.documents}
      totalSpent={payload.totalSpent}
      materialSpent={payload.materialSpent}
      labourSpent={payload.labourSpent}
      serviceSpent={payload.serviceSpent}
    />
  );
}
