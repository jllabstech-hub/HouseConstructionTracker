import { requireUser } from "@/lib/auth-guard";
import { getActiveProjectId } from "@/lib/project-context";
import { loadProjectExpenses, loadWorkAreas } from "@/lib/finance/queries";
import { getWorkWiseCost } from "@/lib/finance/aggregations";
import { prisma } from "@/lib/prisma";
import { EmptyState } from "@/components/ui/page-header";
import { ReportsTabs } from "@/components/reports/reports-tabs";

export default async function ReportsPage() {
  const user = await requireUser();
  const projectId = await getActiveProjectId(user.id);
  if (!projectId) return <EmptyState title="No project" body="Create a project to generate reports." />;

  const [expenses, workAreas, materials, labours, vendors, workers, stages] = await Promise.all([
    loadProjectExpenses(projectId),
    loadWorkAreas(user.id),
    prisma.materialCategory.findMany({ where: { userId: user.id }, orderBy: [{ groupName: "asc" }, { name: "asc" }] }),
    prisma.labourCategory.findMany({ where: { userId: user.id }, orderBy: [{ groupName: "asc" }, { name: "asc" }] }),
    prisma.vendor.findMany({ where: { userId: user.id }, orderBy: { name: "asc" } }),
    prisma.worker.findMany({ where: { userId: user.id }, orderBy: { name: "asc" } }),
    prisma.constructionStage.findMany({ where: { projectId }, orderBy: { sortOrder: "asc" } }),
  ]);

  const workWise = getWorkWiseCost(expenses, workAreas);

  const serializedExpenses = expenses.map((row, idx) => ({
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
    materialCategoryName: row.materialCategoryName ?? null,
    labourCategoryId: row.labourCategoryId ?? null,
    labourCategoryName: row.labourCategoryName ?? null,
    serviceCategoryId: row.serviceCategoryId ?? null,
    serviceCategoryName: row.serviceCategoryName ?? null,
    vendorId: row.vendorId ?? null,
    vendorName: row.vendorName ?? null,
    workerId: row.workerId ?? null,
    workerName: row.workerName ?? null,
    stageId: row.stageId ?? row.constructionStageId ?? null,
    stageName: row.stageName ?? row.constructionStageName ?? null,
    receiptCount: 0,
  }));

  return (
    <div className="space-y-6">
      <ReportsTabs
        projectId={projectId}
        expenses={serializedExpenses}
        materials={materials.map((m) => ({ id: m.id, name: m.name, groupName: m.groupName }))}
        labours={labours.map((l) => ({ id: l.id, name: l.name, groupName: l.groupName }))}
        vendors={vendors.map((v) => ({ id: v.id, name: v.name, phone: v.phone }))}
        workers={workers.map((w) => ({ id: w.id, name: w.name, phone: w.phone, role: w.specialization }))}
        stages={stages.map((s) => ({ id: s.id, name: s.name, sortOrder: s.sortOrder }))}
        workWise={workWise.map((w) => ({
          id: w.id,
          name: w.name,
          material: w.material.toString(),
          labour: w.labour.toString(),
          total: w.total.toString(),
        }))}
      />
    </div>
  );
}
