import { prisma } from "@/lib/prisma";
import {
  DEFAULT_FLOORS,
  DEFAULT_STAGES,
  EQUIPMENT_CATALOG,
  LABOUR_CATALOG,
  MATERIAL_CATALOG,
  PROFESSIONAL_CATALOG,
  SERVICE_CATALOG,
  WORK_AREA_TEMPLATES,
} from "@/lib/catalog/defaults";

export async function seedUserMasters(userId: string) {
  const materialsCount = await prisma.materialCategory.count({ where: { userId } });
  if (materialsCount === 0) {
    const materialsData: { userId: string; name: string; groupName: string; sortOrder: number; isDefault: boolean }[] = [];
    for (const [groupIndex, group] of MATERIAL_CATALOG.entries()) {
      for (const [itemIndex, name] of group.items.entries()) {
        materialsData.push({
          userId,
          name,
          groupName: group.group,
          sortOrder: groupIndex * 100 + itemIndex,
          isDefault: true,
        });
      }
    }
    await prisma.materialCategory.createMany({ data: materialsData, skipDuplicates: true });
  }

  const laboursCount = await prisma.labourCategory.count({ where: { userId } });
  if (laboursCount === 0) {
    const laboursData: { userId: string; name: string; groupName: string; sortOrder: number; isDefault: boolean }[] = [];
    for (const [groupIndex, group] of LABOUR_CATALOG.entries()) {
      for (const [itemIndex, name] of group.items.entries()) {
        laboursData.push({
          userId,
          name,
          groupName: group.group,
          sortOrder: groupIndex * 100 + itemIndex,
          isDefault: true,
        });
      }
    }
    await prisma.labourCategory.createMany({ data: laboursData, skipDuplicates: true });
  }

  const servicesCount = await prisma.serviceCategory.count({ where: { userId } });
  if (servicesCount === 0) {
    await prisma.serviceCategory.createMany({
      data: SERVICE_CATALOG.map((name, index) => ({ userId, name, sortOrder: index, isDefault: true })),
      skipDuplicates: true,
    });
  }

  const equipmentsCount = await prisma.equipmentCategory.count({ where: { userId } });
  if (equipmentsCount === 0) {
    await prisma.equipmentCategory.createMany({
      data: EQUIPMENT_CATALOG.map((name, index) => ({ userId, name, sortOrder: index, isDefault: true })),
      skipDuplicates: true,
    });
  }

  const professionalsCount = await prisma.professionalCategory.count({ where: { userId } });
  if (professionalsCount === 0) {
    await prisma.professionalCategory.createMany({
      data: PROFESSIONAL_CATALOG.map((name, index) => ({ userId, name, sortOrder: index, isDefault: true })),
      skipDuplicates: true,
    });
  }

  await seedWorkAreas(userId);
}

export async function seedWorkAreas(userId: string) {
  const existingCount = await prisma.workArea.count({ where: { userId } });
  if (existingCount > 0) return;

  const materials = await prisma.materialCategory.findMany({ where: { userId } });
  const labours = await prisma.labourCategory.findMany({ where: { userId } });

  for (const [index, template] of WORK_AREA_TEMPLATES.entries()) {
    const workArea = await prisma.workArea.create({
      data: { userId, name: template.name, sortOrder: index },
    });

    const materialIds = materials
      .filter((category) => template.materialNames.includes(category.name))
      .map((category) => category.id);
    const labourIds = labours
      .filter((category) => template.labourNames.includes(category.name))
      .map((category) => category.id);

    if (materialIds.length) {
      await prisma.workAreaMaterial.createMany({
        data: materialIds.map((categoryId) => ({ workAreaId: workArea.id, categoryId })),
        skipDuplicates: true,
      });
    }
    if (labourIds.length) {
      await prisma.workAreaLabour.createMany({
        data: labourIds.map((categoryId) => ({ workAreaId: workArea.id, categoryId })),
        skipDuplicates: true,
      });
    }
  }
}

export async function seedProjectStructure(projectId: string, options?: { demoProgress?: boolean }) {
  const existingFloors = await prisma.floor.count({ where: { projectId } });
  if (existingFloors === 0) {
    await prisma.floor.createMany({
      data: DEFAULT_FLOORS.map((name, sortOrder) => ({ projectId, name, sortOrder })),
    });
  }

  const existingStages = await prisma.constructionStage.count({ where: { projectId } });
  if (existingStages === 0) {
    await prisma.constructionStage.createMany({
      data: DEFAULT_STAGES.map((name, sortOrder) => {
        const demo = options?.demoProgress;
        const status = demo
          ? sortOrder < 12
            ? "COMPLETED"
            : sortOrder < 16
              ? "IN_PROGRESS"
              : "NOT_STARTED"
          : "NOT_STARTED";
        const percentageComplete = demo ? (sortOrder < 12 ? 100 : sortOrder < 16 ? 45 : 0) : 0;
        return { projectId, name, sortOrder, status, percentageComplete };
      }),
    });
  }
}
