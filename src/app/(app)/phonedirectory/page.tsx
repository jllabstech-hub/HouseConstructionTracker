import { requireUser } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { loadProjectExpenses } from "@/lib/finance/queries";
import { getActiveProjectId } from "@/lib/project-context";
import { MasterForms } from "@/components/masters/master-forms";

export default async function PhoneDirectoryPage() {
  const user = await requireUser();
  const projectId = await getActiveProjectId(user.id);

  try {
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

    const serializedMaterials = materials.map((m) => ({
      id: m.id,
      name: m.name,
      groupName: m.groupName ?? null,
    }));
    const serializedLabours = labours.map((l) => ({
      id: l.id,
      name: l.name,
      groupName: l.groupName ?? null,
    }));
    const serializedVendors = vendors.map((v) => ({
      id: v.id,
      name: v.name,
      company: v.company ?? null,
      phone: v.phone ?? null,
      address: v.address ?? null,
      notes: v.notes ?? null,
    }));
    const serializedWorkers = workers.map((w) => ({
      id: w.id,
      name: w.name,
      type: w.type,
      specialization: w.specialization ?? w.type,
      phone: w.phone ?? null,
      notes: w.notes ?? null,
    }));
    const serializedServices = services.map((s) => ({
      id: s.id,
      name: s.name,
    }));

    const payload = {
      materials: serializedMaterials,
      labours: serializedLabours,
      vendors: serializedVendors,
      workers: serializedWorkers,
      services: serializedServices,
      serializedExpenses,
    };

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
  } catch (err) {
    console.error("PhoneDirectoryPage load error:", err);
    return (
      <div className="space-y-6 min-w-0 max-w-full">
        <MasterForms
          projectId={projectId ?? undefined}
          materials={[]}
          labours={[]}
          vendors={[]}
          workers={[]}
          services={[]}
          expenses={[]}
        />
      </div>
    );
  }
}

