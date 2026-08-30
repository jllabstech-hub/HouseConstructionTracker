import { requireUser } from "@/lib/auth-guard";
import { getActiveProjectId } from "@/lib/project-context";
import { loadWorkAreas } from "@/lib/finance/queries";
import { getWorkWiseCost } from "@/lib/finance/aggregations";
import { prisma } from "@/lib/prisma";
import { getCached, setCached } from "@/lib/cache-utils";
import { NoProjectState } from "@/components/projects/no-project-state";
import { ReportsTabs } from "@/components/reports/reports-tabs";

export default async function ReportsPage() {
  const user = await requireUser();
  const projectId = await getActiveProjectId(user.id);
  if (!projectId) {
    return (
      <NoProjectState
        title="No House Project Selected"
        description="Please create or select a house project to generate comprehensive financial, material, and labour reports."
      />
    );
  }

  const cacheKey = `reports:${projectId}`;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cached = getCached<any>(cacheKey);

  if (cached) {
    return (
      <div className="space-y-6">
        <ReportsTabs
          projectId={projectId}
          expenses={cached.expenses}
          materials={cached.materials}
          labours={cached.labours}
          vendors={cached.vendors}
          workers={cached.workers}
          stages={cached.stages}
          workWise={cached.workWise}
        />
      </div>
    );
  }

  try {
    const [rawExpenses, workAreas, materials, labours, vendors, workers, stages] = await Promise.all([
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
          vendorId: true,
          vendor: { select: { name: true } },
          workerId: true,
          worker: { select: { name: true } },
          constructionStageId: true,
          constructionStage: { select: { name: true } },
        },
        orderBy: [{ date: "desc" }, { createdAt: "desc" }],
      }),
      loadWorkAreas(projectId),
      prisma.materialCategory.findMany({ where: { projectId }, orderBy: [{ groupName: "asc" }, { name: "asc" }] }),
      prisma.labourCategory.findMany({ where: { projectId }, orderBy: [{ groupName: "asc" }, { name: "asc" }] }),
      prisma.vendor.findMany({ where: { userId: user.id }, orderBy: { name: "asc" } }),
      prisma.worker.findMany({ where: { userId: user.id }, orderBy: { name: "asc" } }),
      prisma.constructionStage.findMany({ where: { projectId }, orderBy: { sortOrder: "asc" } }),
    ]);

    const expenses = rawExpenses.map((r) => ({
      date: r.date,
      expenseType: r.expenseType,
      amount: r.amount,
      materialCategoryId: r.materialCategoryId,
      labourCategoryId: r.labourCategoryId,
    }));
    const workWise = getWorkWiseCost(expenses, workAreas);

    const serializedExpenses = rawExpenses.map((row, idx) => ({
      id: row.id ?? `exp-${idx}`,
      date: row.date instanceof Date ? row.date.toISOString() : String(row.date),
      expenseType: row.expenseType,
      amount: (row.amount ?? 0).toString(),
      description: row.description ?? null,
      paymentMethod: row.paymentMethod ?? "CASH",
      quantity: row.quantity ? row.quantity.toString() : null,
      unit: row.unit ?? null,
      rate: row.rate ? row.rate.toString() : null,
      materialCategoryId: row.materialCategoryId ?? null,
      materialCategoryName: row.materialCategory?.name ?? null,
      labourCategoryId: row.labourCategoryId ?? null,
      labourCategoryName: row.labourCategory?.name ?? null,
      serviceCategoryId: row.serviceCategoryId ?? null,
      serviceCategoryName: row.serviceCategory?.name ?? null,
      vendorId: row.vendorId ?? null,
      vendorName: row.vendor?.name ?? null,
      workerId: row.workerId ?? null,
      workerName: row.worker?.name ?? null,
      stageId: row.constructionStageId ?? null,
      stageName: row.constructionStage?.name ?? null,
      receiptCount: 0,
    }));

    const payload = {
      expenses: serializedExpenses,
      materials: materials.map((m) => ({ id: m.id, name: m.name, groupName: m.groupName })),
      labours: labours.map((l) => ({ id: l.id, name: l.name, groupName: l.groupName })),
      vendors: vendors.map((v) => ({ id: v.id, name: v.name, phone: v.phone })),
      workers: workers.map((w) => ({ id: w.id, name: w.name, phone: w.phone, role: w.type })),
      stages: stages.map((s) => ({ id: s.id, name: s.name, sortOrder: s.sortOrder })),
      workWise: workWise.map((w) => ({
        id: w.id,
        name: w.name,
        material: w.material.toString(),
        labour: w.labour.toString(),
        total: w.total.toString(),
      })),
    };

    setCached(cacheKey, payload);

    return (
      <div className="space-y-6">
        <ReportsTabs
          projectId={projectId}
          expenses={payload.expenses}
          materials={payload.materials}
          labours={payload.labours}
          vendors={payload.vendors}
          workers={payload.workers}
          stages={payload.stages}
          workWise={payload.workWise}
        />
      </div>
    );
  } catch (err) {
    console.error("ReportsPage load error:", err);
    return (
      <div className="space-y-6">
        <ReportsTabs
          projectId={projectId}
          expenses={[]}
          materials={[]}
          labours={[]}
          vendors={[]}
          workers={[]}
          stages={[]}
          workWise={[]}
        />
      </div>
    );
  }
}
