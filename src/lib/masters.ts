import { prisma } from "@/lib/prisma";
import { getCached, setCached } from "@/lib/cache-utils";

export async function loadMasters(userId: string, projectId: string) {
  const cacheKey = `masters:${userId}:${projectId}`;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cached = getCached<any>(cacheKey);
  if (cached) return cached;

  const [materials, labours, services, equipment, professionals, vendors, workers, stages, floors] =
    await Promise.all([
      prisma.materialCategory.findMany({ where: { projectId }, orderBy: [{ groupName: "asc" }, { name: "asc" }] }),
      prisma.labourCategory.findMany({ where: { projectId }, orderBy: [{ groupName: "asc" }, { name: "asc" }] }),
      prisma.serviceCategory.findMany({ where: { projectId }, orderBy: { name: "asc" } }),
      prisma.equipmentCategory.findMany({ where: { projectId }, orderBy: { name: "asc" } }),
      prisma.professionalCategory.findMany({ where: { projectId }, orderBy: { name: "asc" } }),
      prisma.vendor.findMany({ where: { userId }, orderBy: { name: "asc" } }),
      prisma.worker.findMany({ where: { userId }, orderBy: { name: "asc" } }),
      prisma.constructionStage.findMany({ where: { projectId }, orderBy: { sortOrder: "asc" } }),
      prisma.floor.findMany({ where: { projectId }, orderBy: { sortOrder: "asc" } }),
    ]);

  const result = { materials, labours, services, equipment, professionals, vendors, workers, stages, floors };
  setCached(cacheKey, result);
  return result;
}

