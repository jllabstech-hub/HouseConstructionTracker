import { prisma } from "@/lib/prisma";

export async function loadMasters(userId: string, projectId: string) {
  const [materials, labours, services, equipment, professionals, vendors, workers, stages, floors] =
    await Promise.all([
      prisma.materialCategory.findMany({ where: { userId }, orderBy: [{ groupName: "asc" }, { sortOrder: "asc" }] }),
      prisma.labourCategory.findMany({ where: { userId }, orderBy: [{ groupName: "asc" }, { sortOrder: "asc" }] }),
      prisma.serviceCategory.findMany({ where: { userId }, orderBy: { sortOrder: "asc" } }),
      prisma.equipmentCategory.findMany({ where: { userId }, orderBy: { sortOrder: "asc" } }),
      prisma.professionalCategory.findMany({ where: { userId }, orderBy: { sortOrder: "asc" } }),
      prisma.vendor.findMany({ where: { userId }, orderBy: { name: "asc" } }),
      prisma.worker.findMany({ where: { userId }, orderBy: { name: "asc" } }),
      prisma.constructionStage.findMany({ where: { projectId }, orderBy: { sortOrder: "asc" } }),
      prisma.floor.findMany({ where: { projectId }, orderBy: { sortOrder: "asc" } }),
    ]);

  return { materials, labours, services, equipment, professionals, vendors, workers, stages, floors };
}
