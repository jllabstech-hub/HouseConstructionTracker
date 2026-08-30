"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireProject, requireUser } from "@/lib/auth-guard";
import { getActiveProjectId } from "@/lib/project-context";
import { invalidateProjectCache, invalidateUserCache } from "@/lib/cache-utils";
import { categorySchema, vendorSchema, workerSchema } from "@/lib/validations";

function emptyToNull(value?: string | null) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

export async function createMaterialCategory(input: unknown) {
  try {
    const user = await requireUser();
    const parsed = categorySchema.safeParse(input);
    if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid category" };
    
    const projectId = parsed.data.projectId || (await getActiveProjectId(user.id));
    if (!projectId) return { error: "Active house project not found" };
    await requireProject(projectId, user.id);

    const name = parsed.data.name.trim();
    const groupName = emptyToNull(parsed.data.groupName) ?? "Custom";

    const existing = await prisma.materialCategory.findFirst({
      where: {
        projectId,
        name: { equals: name, mode: "insensitive" },
      },
    });

    if (existing) {
      return { ok: true, category: { id: existing.id, name: existing.name, groupName: existing.groupName } };
    }

    const created = await prisma.materialCategory.create({
      data: {
        projectId,
        name,
        groupName,
      },
    });

    invalidateProjectCache(projectId);
    invalidateUserCache(user.id);
    revalidatePath("/phonedirectory");
    revalidatePath("/masters");
    revalidatePath("/expenses");
    revalidatePath("/expenses/new");
    revalidatePath("/budget");
    return { ok: true, category: { id: created.id, name: created.name, groupName: created.groupName } };
  } catch (err: unknown) {
    if (
      err &&
      typeof err === "object" &&
      "digest" in err &&
      typeof (err as { digest?: unknown }).digest === "string" &&
      ((err as { digest: string }).digest.startsWith("NEXT_REDIRECT"))
    ) {
      throw err;
    }
    console.error("Error creating material category:", err);
    return { error: err instanceof Error ? err.message : "Failed to create material category" };
  }
}

export async function createLabourCategory(input: unknown) {
  try {
    const user = await requireUser();
    const parsed = categorySchema.safeParse(input);
    if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid category" };
    
    const projectId = parsed.data.projectId || (await getActiveProjectId(user.id));
    if (!projectId) return { error: "Active house project not found" };
    await requireProject(projectId, user.id);

    const name = parsed.data.name.trim();
    const groupName = emptyToNull(parsed.data.groupName) ?? "Custom";

    const existing = await prisma.labourCategory.findFirst({
      where: {
        projectId,
        name: { equals: name, mode: "insensitive" },
      },
    });

    if (existing) {
      return { ok: true, category: { id: existing.id, name: existing.name, groupName: existing.groupName } };
    }

    const created = await prisma.labourCategory.create({
      data: {
        projectId,
        name,
        groupName,
      },
    });

    invalidateProjectCache(projectId);
    invalidateUserCache(user.id);
    revalidatePath("/phonedirectory");
    revalidatePath("/masters");
    revalidatePath("/expenses");
    revalidatePath("/expenses/new");
    revalidatePath("/budget");
    return { ok: true, category: { id: created.id, name: created.name, groupName: created.groupName } };
  } catch (err: unknown) {
    if (
      err &&
      typeof err === "object" &&
      "digest" in err &&
      typeof (err as { digest?: unknown }).digest === "string" &&
      ((err as { digest: string }).digest.startsWith("NEXT_REDIRECT"))
    ) {
      throw err;
    }
    console.error("Error creating labour category:", err);
    return { error: err instanceof Error ? err.message : "Failed to create labour category" };
  }
}

export async function updateMaterialCategory(id: string, input: unknown) {
  return updateCategory(id, input, "material");
}

export async function updateLabourCategory(id: string, input: unknown) {
  return updateCategory(id, input, "labour");
}

async function updateCategory(id: string, input: unknown, type: "material" | "labour") {
  const user = await requireUser();
  const parsed = categorySchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid category" };
  const projectId = parsed.data.projectId;
  if (!projectId) return { error: "Project is required" };
  await requireProject(projectId, user.id);
  const name = parsed.data.name.trim();
  const where = { id, projectId };
  const existing = type === "material"
    ? await prisma.materialCategory.findFirst({ where })
    : await prisma.labourCategory.findFirst({ where });
  if (!existing) return { error: "Category not found" };
  const duplicateWhere = { projectId, name: { equals: name, mode: "insensitive" as const }, NOT: { id } };
  const duplicate = type === "material"
    ? await prisma.materialCategory.findFirst({ where: duplicateWhere })
    : await prisma.labourCategory.findFirst({ where: duplicateWhere });
  if (duplicate) return { error: "A category with this name already exists" };
  const data = { name, groupName: emptyToNull(parsed.data.groupName) ?? "Custom" };
  if (type === "material") await prisma.materialCategory.update({ where: { id }, data });
  else await prisma.labourCategory.update({ where: { id }, data });
  invalidateProjectCache(projectId);
  revalidatePath("/masters");
  revalidatePath("/expenses");
  revalidatePath("/expenses/new");
  return { ok: true };
}

export async function createServiceCategory(input: unknown) {
  try {
    const user = await requireUser();
    const parsed = categorySchema.safeParse(input);
    if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid category" };

    const projectId = parsed.data.projectId || (await getActiveProjectId(user.id));
    if (!projectId) return { error: "Active house project not found" };
    await requireProject(projectId, user.id);

    const name = parsed.data.name.trim();

    const existing = await prisma.serviceCategory.findFirst({
      where: {
        projectId,
        name: { equals: name, mode: "insensitive" },
      },
    });

    if (existing) {
      return { ok: true, category: { id: existing.id, name: existing.name } };
    }

    const created = await prisma.serviceCategory.create({
      data: { projectId, name },
    });
    invalidateProjectCache(projectId);
    invalidateUserCache(user.id);
    revalidatePath("/phonedirectory");
    revalidatePath("/masters");
    revalidatePath("/expenses");
    revalidatePath("/expenses/new");
    revalidatePath("/budget");
    return { ok: true, category: { id: created.id, name: created.name } };
  } catch (err: unknown) {
    if (
      err &&
      typeof err === "object" &&
      "digest" in err &&
      typeof (err as { digest?: unknown }).digest === "string" &&
      ((err as { digest: string }).digest.startsWith("NEXT_REDIRECT"))
    ) {
      throw err;
    }
    console.error("Error creating service category:", err);
    return { error: err instanceof Error ? err.message : "Failed to create service category" };
  }
}

export async function createVendor(input: unknown) {
  try {
    const user = await requireUser();
    const parsed = vendorSchema.safeParse(input);
    if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid vendor" };
    const vendor = await prisma.vendor.create({
      data: {
        userId: user.id,
        name: parsed.data.name,
        company: emptyToNull(parsed.data.company),
        phone: emptyToNull(parsed.data.phone),
        address: emptyToNull(parsed.data.address),
        notes: emptyToNull(parsed.data.notes),
      },
    });
    invalidateUserCache(user.id);
    revalidatePath("/phonedirectory");
    revalidatePath("/masters");
    return { ok: true, id: vendor.id };
  } catch (err: unknown) {
    if (
      err &&
      typeof err === "object" &&
      "digest" in err &&
      typeof (err as { digest?: unknown }).digest === "string" &&
      ((err as { digest: string }).digest.startsWith("NEXT_REDIRECT"))
    ) {
      throw err;
    }
    console.error("Error creating vendor:", err);
    return { error: err instanceof Error ? err.message : "Failed to create vendor" };
  }
}

export async function createWorker(input: unknown) {
  try {
    const user = await requireUser();
    const parsed = workerSchema.safeParse(input);
    if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid worker" };
    const worker = await prisma.worker.create({
      data: {
        userId: user.id,
        name: parsed.data.name,
        type: parsed.data.type,
        phone: emptyToNull(parsed.data.phone),
        specialization: emptyToNull(parsed.data.specialization),
        notes: emptyToNull(parsed.data.notes),
      },
    });
    invalidateUserCache(user.id);
    revalidatePath("/phonedirectory");
    revalidatePath("/masters");
    return { ok: true, id: worker.id };
  } catch (err: unknown) {
    if (
      err &&
      typeof err === "object" &&
      "digest" in err &&
      typeof (err as { digest?: unknown }).digest === "string" &&
      ((err as { digest: string }).digest.startsWith("NEXT_REDIRECT"))
    ) {
      throw err;
    }
    console.error("Error creating worker:", err);
    return { error: err instanceof Error ? err.message : "Failed to create worker" };
  }
}

export async function updateVendor(id: string, input: unknown) {
  try {
    const user = await requireUser();
    const parsed = vendorSchema.safeParse(input);
    if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid vendor" };
    await prisma.vendor.updateMany({
      where: { id, userId: user.id },
      data: {
        name: parsed.data.name,
        company: emptyToNull(parsed.data.company),
        phone: emptyToNull(parsed.data.phone),
        address: emptyToNull(parsed.data.address),
        notes: emptyToNull(parsed.data.notes),
      },
    });
    invalidateUserCache(user.id);
    revalidatePath("/phonedirectory");
    revalidatePath("/masters");
    return { ok: true };
  } catch (err: unknown) {
    if (
      err &&
      typeof err === "object" &&
      "digest" in err &&
      typeof (err as { digest?: unknown }).digest === "string" &&
      ((err as { digest: string }).digest.startsWith("NEXT_REDIRECT"))
    ) {
      throw err;
    }
    console.error("Error updating vendor:", err);
    return { error: err instanceof Error ? err.message : "Failed to update vendor" };
  }
}

export async function updateWorker(id: string, input: unknown) {
  try {
    const user = await requireUser();
    const parsed = workerSchema.safeParse(input);
    if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid worker" };
    await prisma.worker.updateMany({
      where: { id, userId: user.id },
      data: {
        name: parsed.data.name,
        type: parsed.data.type,
        phone: emptyToNull(parsed.data.phone),
        specialization: emptyToNull(parsed.data.specialization),
        notes: emptyToNull(parsed.data.notes),
      },
    });
    invalidateUserCache(user.id);
    revalidatePath("/phonedirectory");
    revalidatePath("/masters");
    return { ok: true };
  } catch (err: unknown) {
    if (
      err &&
      typeof err === "object" &&
      "digest" in err &&
      typeof (err as { digest?: unknown }).digest === "string" &&
      ((err as { digest: string }).digest.startsWith("NEXT_REDIRECT"))
    ) {
      throw err;
    }
    console.error("Error updating worker:", err);
    return { error: err instanceof Error ? err.message : "Failed to update worker" };
  }
}

export async function deleteVendor(id: string) {
  try {
    const user = await requireUser();
    await prisma.$transaction([
      prisma.expense.updateMany({
        where: { vendorId: id },
        data: { vendorId: null },
      }),
      prisma.vendor.deleteMany({ where: { id, userId: user.id } }),
    ]);
    invalidateUserCache(user.id);
    revalidatePath("/phonedirectory");
    revalidatePath("/masters");
    return { ok: true };
  } catch (err: unknown) {
    if (
      err &&
      typeof err === "object" &&
      "digest" in err &&
      typeof (err as { digest?: unknown }).digest === "string" &&
      ((err as { digest: string }).digest.startsWith("NEXT_REDIRECT"))
    ) {
      throw err;
    }
    console.error("Error deleting vendor:", err);
    return { error: err instanceof Error ? err.message : "Failed to delete vendor" };
  }
}

export async function deleteWorker(id: string) {
  try {
    const user = await requireUser();
    await prisma.$transaction([
      prisma.expense.updateMany({
        where: { workerId: id },
        data: { workerId: null },
      }),
      prisma.worker.deleteMany({ where: { id, userId: user.id } }),
    ]);
    invalidateUserCache(user.id);
    revalidatePath("/phonedirectory");
    revalidatePath("/masters");
    return { ok: true };
  } catch (err: unknown) {
    if (
      err &&
      typeof err === "object" &&
      "digest" in err &&
      typeof (err as { digest?: unknown }).digest === "string" &&
      ((err as { digest: string }).digest.startsWith("NEXT_REDIRECT"))
    ) {
      throw err;
    }
    console.error("Error deleting worker:", err);
    return { error: err instanceof Error ? err.message : "Failed to delete worker" };
  }
}

export async function clearAllVendors() {
  try {
    const user = await requireUser();
    const userVendors = await prisma.vendor.findMany({
      where: { userId: user.id },
      select: { id: true },
    });
    const vendorIds = userVendors.map((v) => v.id);

    if (vendorIds.length > 0) {
      await prisma.$transaction([
        prisma.expense.updateMany({
          where: { vendorId: { in: vendorIds } },
          data: { vendorId: null },
        }),
        prisma.vendor.deleteMany({
          where: { userId: user.id },
        }),
      ]);
    }

    invalidateUserCache(user.id);
    revalidatePath("/phonedirectory");
    revalidatePath("/masters");
    return { ok: true };
  } catch (err: unknown) {
    if (
      err &&
      typeof err === "object" &&
      "digest" in err &&
      typeof (err as { digest?: unknown }).digest === "string" &&
      ((err as { digest: string }).digest.startsWith("NEXT_REDIRECT"))
    ) {
      throw err;
    }
    console.error("Error clearing vendors:", err);
    return { error: err instanceof Error ? err.message : "Failed to clear shops" };
  }
}

export async function clearAllWorkers() {
  try {
    const user = await requireUser();
    const userWorkers = await prisma.worker.findMany({
      where: { userId: user.id },
      select: { id: true },
    });
    const workerIds = userWorkers.map((w) => w.id);

    if (workerIds.length > 0) {
      await prisma.$transaction([
        prisma.expense.updateMany({
          where: { workerId: { in: workerIds } },
          data: { workerId: null },
        }),
        prisma.worker.deleteMany({
          where: { userId: user.id },
        }),
      ]);
    }

    invalidateUserCache(user.id);
    revalidatePath("/phonedirectory");
    revalidatePath("/masters");
    return { ok: true };
  } catch (err: unknown) {
    if (
      err &&
      typeof err === "object" &&
      "digest" in err &&
      typeof (err as { digest?: unknown }).digest === "string" &&
      ((err as { digest: string }).digest.startsWith("NEXT_REDIRECT"))
    ) {
      throw err;
    }
    console.error("Error clearing workers:", err);
    return { error: err instanceof Error ? err.message : "Failed to clear workers" };
  }
}

export async function clearAllPhoneDirectory() {
  try {
    const user = await requireUser();
    const [userVendors, userWorkers] = await Promise.all([
      prisma.vendor.findMany({ where: { userId: user.id }, select: { id: true } }),
      prisma.worker.findMany({ where: { userId: user.id }, select: { id: true } }),
    ]);
    const vendorIds = userVendors.map((v) => v.id);
    const workerIds = userWorkers.map((w) => w.id);

    await prisma.$transaction([
      ...(vendorIds.length > 0
        ? [
            prisma.expense.updateMany({
              where: { vendorId: { in: vendorIds } },
              data: { vendorId: null },
            }),
            prisma.vendor.deleteMany({ where: { userId: user.id } }),
          ]
        : []),
      ...(workerIds.length > 0
        ? [
            prisma.expense.updateMany({
              where: { workerId: { in: workerIds } },
              data: { workerId: null },
            }),
            prisma.worker.deleteMany({ where: { userId: user.id } }),
          ]
        : []),
    ]);

    invalidateUserCache(user.id);
    revalidatePath("/phonedirectory");
    revalidatePath("/masters");
    return { ok: true };
  } catch (err: unknown) {
    if (
      err &&
      typeof err === "object" &&
      "digest" in err &&
      typeof (err as { digest?: unknown }).digest === "string" &&
      ((err as { digest: string }).digest.startsWith("NEXT_REDIRECT"))
    ) {
      throw err;
    }
    console.error("Error clearing phone directory:", err);
    return { error: err instanceof Error ? err.message : "Failed to clear directory" };
  }
}

export async function deleteMaterialCategory(id: string) {
  try {
    const user = await requireUser();
    const cat = await prisma.materialCategory.findUnique({
      where: { id },
      include: { project: { select: { id: true, userId: true } } },
    });
    if (!cat || cat.project.userId !== user.id) {
      return { error: "Category not found or access denied" };
    }
    const projectId = cat.projectId;

    await prisma.$transaction([
      prisma.expense.updateMany({
        where: { materialCategoryId: id },
        data: { materialCategoryId: null },
      }),
      prisma.budgetCategory.deleteMany({
        where: { materialCategoryId: id },
      }),
      prisma.workAreaMaterial.deleteMany({
        where: { categoryId: id },
      }),
      prisma.materialCategory.delete({
        where: { id },
      }),
    ]);
    invalidateProjectCache(projectId);
    invalidateUserCache(user.id);
    revalidatePath("/phonedirectory");
    revalidatePath("/masters");
    revalidatePath("/expenses");
    return { ok: true };
  } catch (err: unknown) {
    if (
      err &&
      typeof err === "object" &&
      "digest" in err &&
      typeof (err as { digest?: unknown }).digest === "string" &&
      ((err as { digest: string }).digest.startsWith("NEXT_REDIRECT"))
    ) {
      throw err;
    }
    console.error("Error deleting material category:", err);
    return { error: err instanceof Error ? err.message : "Failed to delete material category" };
  }
}

export async function deleteLabourCategory(id: string) {
  try {
    const user = await requireUser();
    const cat = await prisma.labourCategory.findUnique({
      where: { id },
      include: { project: { select: { id: true, userId: true } } },
    });
    if (!cat || cat.project.userId !== user.id) {
      return { error: "Category not found or access denied" };
    }
    const projectId = cat.projectId;

    await prisma.$transaction([
      prisma.expense.updateMany({
        where: { labourCategoryId: id },
        data: { labourCategoryId: null },
      }),
      prisma.budgetCategory.deleteMany({
        where: { labourCategoryId: id },
      }),
      prisma.workAreaLabour.deleteMany({
        where: { categoryId: id },
      }),
      prisma.labourCategory.delete({
        where: { id },
      }),
    ]);
    invalidateProjectCache(projectId);
    invalidateUserCache(user.id);
    revalidatePath("/phonedirectory");
    revalidatePath("/masters");
    revalidatePath("/expenses");
    return { ok: true };
  } catch (err: unknown) {
    if (
      err &&
      typeof err === "object" &&
      "digest" in err &&
      typeof (err as { digest?: unknown }).digest === "string" &&
      ((err as { digest: string }).digest.startsWith("NEXT_REDIRECT"))
    ) {
      throw err;
    }
    console.error("Error deleting labour category:", err);
    return { error: err instanceof Error ? err.message : "Failed to delete labour category" };
  }
}

export async function deleteServiceCategory(id: string) {
  try {
    const user = await requireUser();
    const cat = await prisma.serviceCategory.findUnique({
      where: { id },
      include: { project: { select: { id: true, userId: true } } },
    });
    if (!cat || cat.project.userId !== user.id) {
      return { error: "Category not found or access denied" };
    }
    const projectId = cat.projectId;

    await prisma.$transaction([
      prisma.expense.updateMany({
        where: { serviceCategoryId: id },
        data: { serviceCategoryId: null },
      }),
      prisma.budgetCategory.deleteMany({
        where: { serviceCategoryId: id },
      }),
      prisma.serviceCategory.delete({
        where: { id },
      }),
    ]);
    invalidateProjectCache(projectId);
    invalidateUserCache(user.id);
    revalidatePath("/phonedirectory");
    revalidatePath("/masters");
    revalidatePath("/expenses");
    return { ok: true };
  } catch (err: unknown) {
    if (
      err &&
      typeof err === "object" &&
      "digest" in err &&
      typeof (err as { digest?: unknown }).digest === "string" &&
      ((err as { digest: string }).digest.startsWith("NEXT_REDIRECT"))
    ) {
      throw err;
    }
    console.error("Error deleting service category:", err);
    return { error: err instanceof Error ? err.message : "Failed to delete service category" };
  }
}

export async function clearAllCategories(projectId?: string) {
  try {
    const user = await requireUser();
    const activeProjectId = projectId || (await getActiveProjectId(user.id));
    if (!activeProjectId) return { error: "Active house project not found" };
    await requireProject(activeProjectId, user.id);

    await prisma.$transaction([
      prisma.workAreaMaterial.deleteMany({ where: { category: { projectId: activeProjectId } } }),
      prisma.workAreaLabour.deleteMany({ where: { category: { projectId: activeProjectId } } }),
      prisma.expense.updateMany({
        where: { projectId: activeProjectId },
        data: {
          materialCategoryId: null,
          labourCategoryId: null,
          serviceCategoryId: null,
          equipmentCategoryId: null,
          professionalCategoryId: null,
        },
      }),
      prisma.budgetCategory.deleteMany({ where: { projectId: activeProjectId } }),
      prisma.materialCategory.deleteMany({ where: { projectId: activeProjectId } }),
      prisma.labourCategory.deleteMany({ where: { projectId: activeProjectId } }),
      prisma.serviceCategory.deleteMany({ where: { projectId: activeProjectId } }),
      prisma.equipmentCategory.deleteMany({ where: { projectId: activeProjectId } }),
      prisma.professionalCategory.deleteMany({ where: { projectId: activeProjectId } }),
    ]);

    invalidateProjectCache(activeProjectId);
    invalidateUserCache(user.id);
    revalidatePath("/phonedirectory");
    revalidatePath("/masters");
    revalidatePath("/expenses");
    revalidatePath("/expenses/new");
    revalidatePath("/budget");
    revalidatePath("/reports");
    return { ok: true };
  } catch (err: unknown) {
    if (
      err &&
      typeof err === "object" &&
      "digest" in err &&
      typeof (err as { digest?: unknown }).digest === "string" &&
      ((err as { digest: string }).digest.startsWith("NEXT_REDIRECT"))
    ) {
      throw err;
    }
    console.error("Error clearing all categories:", err);
    return { error: err instanceof Error ? err.message : "Failed to clear all categories" };
  }
}

export async function createConstructionStageAction(input: { projectId: string; name: string }) {
  try {
    const user = await requireUser();
    const projectId = input.projectId || (await getActiveProjectId(user.id));
    if (!projectId) return { error: "Active house project not found" };
    await requireProject(projectId, user.id);

    const name = input.name.trim();
    if (!name) return { error: "Stage name cannot be empty" };

    const existing = await prisma.constructionStage.findFirst({
      where: {
        projectId,
        name: { equals: name, mode: "insensitive" },
      },
    });

    if (existing) {
      return { ok: true, stage: { id: existing.id, name: existing.name } };
    }

    const count = await prisma.constructionStage.count({ where: { projectId } });

    const created = await prisma.constructionStage.create({
      data: {
        projectId,
        name,
        sortOrder: count + 1,
        status: "NOT_STARTED",
      },
    });

    invalidateProjectCache(projectId);
    invalidateUserCache(user.id);
    revalidatePath("/stages");
    revalidatePath("/expenses");
    revalidatePath("/expenses/new");
    return { ok: true, stage: { id: created.id, name: created.name } };
  } catch (err: unknown) {
    console.error("Error creating construction stage:", err);
    return { error: err instanceof Error ? err.message : "Failed to create stage" };
  }
}


