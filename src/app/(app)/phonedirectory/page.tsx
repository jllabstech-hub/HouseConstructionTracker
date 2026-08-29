import { requireUser } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { loadProjectExpenses } from "@/lib/finance/queries";
import { getActiveProjectId } from "@/lib/project-context";
import { getCached, setCached } from "@/lib/cache-utils";
import { MasterForms } from "@/components/masters/master-forms";

export default async function PhoneDirectoryPage() {
  const user = await requireUser();
  const projectId = await getActiveProjectId(user.id);

  const cacheKey = `phone-directory:${user.id}:${projectId ?? "none"}`;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cached = getCached<any>(cacheKey);

  if (cached) {
    return (
      <div className="space-y-6 min-w-0 max-w-full">
        <MasterForms
          projectId={projectId ?? undefined}
          materials={cached.materials}
          labours={cached.labours}
          vendors={cached.vendors}
          workers={cached.workers}
          services={cached.services}
          expenses={cached.serializedExpenses}
        />
      </div>
    );
  }

  const [materials, labours, vendors, workers, services] = await Promise.all([
    projectId ? prisma.materialCategory.findMany({ where: { projectId }, orderBy: [{ groupName: "asc" }, { name: "asc" }] }) : [],
    projectId ? prisma.labourCategory.findMany({ where: { projectId }, orderBy: [{ groupName: "asc" }, { name: "asc" }] }) : [],
    prisma.vendor.findMany({ where: { userId: user.id }, orderBy: { name: "asc" } }),
    prisma.worker.findMany({ where: { userId: user.id }, orderBy: { name: "asc" } }),
    projectId ? prisma.serviceCategory.findMany({ where: { projectId }, orderBy: { name: "asc" } }) : [],
  ]);
  const expenses = projectId ? await loadProjectExpenses(projectId) : [];

  const serializedExpenses = expenses.map((row) => ({
    ...row,
    amount: row.amount?.toString() ?? "0",
    date: row.date instanceof Date ? row.date.toISOString() : row.date,
    rate: row.rate ? row.rate.toString() : null,
  }));

  const payload = {
    materials,
    labours,
    vendors,
    workers,
    services,
    serializedExpenses,
  };

  setCached(cacheKey, payload);

  return (
    <div className="space-y-6 min-w-0 max-w-full">
      <MasterForms
        projectId={projectId ?? undefined}
        materials={payload.materials}
        labours={payload.labours}
        vendors={payload.vendors}
        workers={payload.workers}
        services={payload.services}
        expenses={payload.serializedExpenses}
      />
    </div>
  );
}
