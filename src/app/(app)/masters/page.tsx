import { requireUser } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { loadProjectExpenses } from "@/lib/finance/queries";
import { getActiveProjectId } from "@/lib/project-context";
import { MasterForms } from "@/components/masters/master-forms";

export default async function MastersPage() {
  const user = await requireUser();
  const projectId = await getActiveProjectId(user.id);
  const [materials, labours, vendors, workers, services] = await Promise.all([
    prisma.materialCategory.findMany({ where: { userId: user.id }, orderBy: [{ groupName: "asc" }, { name: "asc" }] }),
    prisma.labourCategory.findMany({ where: { userId: user.id }, orderBy: [{ groupName: "asc" }, { name: "asc" }] }),
    prisma.vendor.findMany({ where: { userId: user.id }, orderBy: { name: "asc" } }),
    prisma.worker.findMany({ where: { userId: user.id }, orderBy: { name: "asc" } }),
    prisma.serviceCategory.findMany({ where: { userId: user.id }, orderBy: { name: "asc" } }),
  ]);
  const expenses = projectId ? await loadProjectExpenses(projectId) : [];

  const serializedExpenses = expenses.map((row) => ({
    ...row,
    amount: row.amount?.toString() ?? "0",
    date: row.date instanceof Date ? row.date.toISOString() : row.date,
    rate: row.rate ? row.rate.toString() : null,
  }));

  return (
    <div className="space-y-6">
      <MasterForms
        materials={materials}
        labours={labours}
        vendors={vendors}
        workers={workers}
        services={services}
        expenses={serializedExpenses}
      />
    </div>
  );
}

