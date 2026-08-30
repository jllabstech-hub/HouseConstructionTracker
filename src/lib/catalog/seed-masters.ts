import { prisma } from "@/lib/prisma";
import {
  DEFAULT_FLOORS,
  DEFAULT_STAGES,
  LABOUR_CATALOG,
  MATERIAL_CATALOG,
  SERVICE_CATALOG,
  WORK_AREA_TEMPLATES,
} from "@/lib/catalog/defaults";

export const MATERIAL_CONSOLIDATION_MAP: Record<string, { targetName: string; groupName: string }> = {
  "m-sand": { targetName: "Sand", groupName: "Structure & Civil" },
  "river sand": { targetName: "Sand", groupName: "Structure & Civil" },
  "sand / m-sand / aggregates": { targetName: "Sand", groupName: "Structure & Civil" },
  "sand": { targetName: "Sand", groupName: "Structure & Civil" },
  "steel / tmt": { targetName: "Steel / TMT / Binding Wire", groupName: "Structure & Civil" },
  "binding wire": { targetName: "Steel / TMT / Binding Wire", groupName: "Structure & Civil" },
  "steel": { targetName: "Steel / TMT / Binding Wire", groupName: "Structure & Civil" },
  "steel / tmt / binding wire": { targetName: "Steel / TMT / Binding Wire", groupName: "Structure & Civil" },
  "bricks": { targetName: "Red Bricks", groupName: "Structure & Civil" },
  "bricks & blocks": { targetName: "Red Bricks", groupName: "Structure & Civil" },
  "red bricks": { targetName: "Red Bricks", groupName: "Structure & Civil" },
  "aac blocks": { targetName: "Cement & AAC Blocks", groupName: "Structure & Civil" },
  "solid cement blocks": { targetName: "Cement & AAC Blocks", groupName: "Structure & Civil" },
  "blocks": { targetName: "Cement & AAC Blocks", groupName: "Structure & Civil" },
  "cement & aac blocks": { targetName: "Cement & AAC Blocks", groupName: "Structure & Civil" },
  "aggregate": { targetName: "Aggregates / Jelly", groupName: "Structure & Civil" },
  "aggregates": { targetName: "Aggregates / Jelly", groupName: "Structure & Civil" },
  "aggregates / jelly": { targetName: "Aggregates / Jelly", groupName: "Structure & Civil" },
  "shuttering material": { targetName: "Shuttering & Scaffolding", groupName: "Structure & Civil" },
  "shuttering & scaffolding": { targetName: "Shuttering & Scaffolding", groupName: "Structure & Civil" },
  "tiles & flooring": { targetName: "Tiles, Granite & Marble", groupName: "Finishes & Carpentry" },
  "tiles, granite & marble": { targetName: "Tiles, Granite & Marble", groupName: "Finishes & Carpentry" },
  "paint & wall care": { targetName: "Paint, Primer & Wall Care", groupName: "Finishes & Carpentry" },
  "paint, primer & wall care": { targetName: "Paint, Primer & Wall Care", groupName: "Finishes & Carpentry" },
  "wood, doors & windows": { targetName: "Doors, Windows & Woodwork", groupName: "Finishes & Carpentry" },
  "doors, windows & woodwork": { targetName: "Doors, Windows & Woodwork", groupName: "Finishes & Carpentry" },
  "hardware & metal / grills": { targetName: "Hardware, Metal & Grills", groupName: "Finishes & Carpentry" },
  "hardware, metal & grills": { targetName: "Hardware, Metal & Grills", groupName: "Finishes & Carpentry" },
  "construction chemicals": { targetName: "Waterproofing & Chemicals", groupName: "Specialized & Other" },
  "waterproofing & chemicals": { targetName: "Waterproofing & Chemicals", groupName: "Specialized & Other" },
};

export async function consolidateLegacyCategories(projectId: string) {
  try {
    const existingMaterials = await prisma.materialCategory.findMany({ where: { projectId } });
    if (existingMaterials.length === 0) return;

    for (const cat of existingMaterials) {
      const key = cat.name.trim().toLowerCase();
      const mapping = MATERIAL_CONSOLIDATION_MAP[key];
      if (mapping && (cat.name !== mapping.targetName || cat.groupName !== mapping.groupName)) {
        const targetCat = await prisma.materialCategory.findFirst({
          where: { projectId, name: mapping.targetName },
        });

        if (targetCat && targetCat.id !== cat.id) {
          await prisma.expense.updateMany({
            where: { materialCategoryId: cat.id },
            data: { materialCategoryId: targetCat.id },
          });
          await prisma.budgetCategory.updateMany({
            where: { materialCategoryId: cat.id },
            data: { materialCategoryId: targetCat.id },
          });
          await prisma.materialCategory.delete({ where: { id: cat.id } });
        } else {
          await prisma.materialCategory.update({
            where: { id: cat.id },
            data: { name: mapping.targetName, groupName: mapping.groupName },
          });
        }
      }
    }
  } catch (err) {
    console.error("Error consolidating categories:", err);
  }
}

export async function seedProjectMasters(projectId: string) {
  // Keep categories empty by default so user can fill as desired
  await seedProjectStructure(projectId);
}

export async function populateDefaultCatalogs(projectId: string) {
  const materialsCount = await prisma.materialCategory.count({ where: { projectId } });
  if (materialsCount === 0) {
    const materialsData: { projectId: string; name: string; groupName: string; sortOrder: number; isDefault: boolean }[] = [];
    for (const [groupIndex, group] of MATERIAL_CATALOG.entries()) {
      for (const [itemIndex, name] of group.items.entries()) {
        materialsData.push({
          projectId,
          name,
          groupName: group.group,
          sortOrder: groupIndex * 100 + itemIndex,
          isDefault: true,
        });
      }
    }
    await prisma.materialCategory.createMany({ data: materialsData, skipDuplicates: true });
  }

  const laboursCount = await prisma.labourCategory.count({ where: { projectId } });
  if (laboursCount === 0) {
    const laboursData: { projectId: string; name: string; groupName: string; sortOrder: number; isDefault: boolean }[] = [];
    for (const [groupIndex, group] of LABOUR_CATALOG.entries()) {
      for (const [itemIndex, name] of group.items.entries()) {
        laboursData.push({
          projectId,
          name,
          groupName: group.group,
          sortOrder: groupIndex * 100 + itemIndex,
          isDefault: true,
        });
      }
    }
    await prisma.labourCategory.createMany({ data: laboursData, skipDuplicates: true });
  }

  const servicesCount = await prisma.serviceCategory.count({ where: { projectId } });
  if (servicesCount === 0) {
    await prisma.serviceCategory.createMany({
      data: SERVICE_CATALOG.map((name, index) => ({ projectId, name, sortOrder: index, isDefault: true })),
      skipDuplicates: true,
    });
  }

  await seedWorkAreas(projectId);
}

// Backwards-compatible alias if needed during transition
export const seedUserMasters = seedProjectMasters;

export async function seedWorkAreas(projectId: string) {
  const existingCount = await prisma.workArea.count({ where: { projectId } });
  if (existingCount > 0) return;

  const materials = await prisma.materialCategory.findMany({ where: { projectId } });
  const labours = await prisma.labourCategory.findMany({ where: { projectId } });

  for (const [index, template] of WORK_AREA_TEMPLATES.entries()) {
    const workArea = await prisma.workArea.create({
      data: { projectId, name: template.name, sortOrder: index },
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
