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
  for (const [groupIndex, group] of MATERIAL_CATALOG.entries()) {
    for (const [itemIndex, name] of group.items.entries()) {
      await prisma.materialCategory.upsert({
        where: {
          userId_groupName_name: { userId, groupName: group.group, name },
        },
        update: {},
        create: {
          userId,
          name,
          groupName: group.group,
          sortOrder: groupIndex * 100 + itemIndex,
          isDefault: true,
        },
      });
    }
  }

  for (const [groupIndex, group] of LABOUR_CATALOG.entries()) {
    for (const [itemIndex, name] of group.items.entries()) {
      await prisma.labourCategory.upsert({
        where: {
          userId_groupName_name: { userId, groupName: group.group, name },
        },
        update: {},
        create: {
          userId,
          name,
          groupName: group.group,
          sortOrder: groupIndex * 100 + itemIndex,
          isDefault: true,
        },
      });
    }
  }

  for (const [index, name] of SERVICE_CATALOG.entries()) {
    await prisma.serviceCategory.upsert({
      where: { userId_name: { userId, name } },
      update: {},
      create: { userId, name, sortOrder: index, isDefault: true },
    });
  }

  for (const [index, name] of EQUIPMENT_CATALOG.entries()) {
    await prisma.equipmentCategory.upsert({
      where: { userId_name: { userId, name } },
      update: {},
      create: { userId, name, sortOrder: index, isDefault: true },
    });
  }

  for (const [index, name] of PROFESSIONAL_CATALOG.entries()) {
    await prisma.professionalCategory.upsert({
      where: { userId_name: { userId, name } },
      update: {},
      create: { userId, name, sortOrder: index, isDefault: true },
    });
  }

  await seedWorkAreas(userId);
}

export async function seedWorkAreas(userId: string) {
  const materials = await prisma.materialCategory.findMany({ where: { userId } });
  const labours = await prisma.labourCategory.findMany({ where: { userId } });

  for (const [index, template] of WORK_AREA_TEMPLATES.entries()) {
    const workArea = await prisma.workArea.upsert({
      where: { userId_name: { userId, name: template.name } },
      update: { sortOrder: index },
      create: { userId, name: template.name, sortOrder: index },
    });

    const materialIds = materials
      .filter((category) => template.materialNames.includes(category.name))
      .map((category) => category.id);
    const labourIds = labours
      .filter((category) => template.labourNames.includes(category.name))
      .map((category) => category.id);

    await prisma.workAreaMaterial.deleteMany({ where: { workAreaId: workArea.id } });
    await prisma.workAreaLabour.deleteMany({ where: { workAreaId: workArea.id } });

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
