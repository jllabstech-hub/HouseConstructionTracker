"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireProject, requireUser } from "@/lib/auth-guard";
import { seedProjectStructure } from "@/lib/catalog/seed-masters";
import { setActiveProjectId } from "@/lib/project-context";
import { projectSchema, floorSchema, stageSchema } from "@/lib/validations";
import { parseMoneyInput } from "@/lib/money";

function emptyToNull(value?: string | null) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function decimalOrNull(value?: string | null) {
  const parsed = parseMoneyInput(value ?? "");
  return parsed ? new Prisma.Decimal(parsed.toFixed(2)) : null;
}

function dateOrNull(value?: string | null) {
  return emptyToNull(value) ? new Date(value as string) : null;
}

export async function createProject(input: unknown) {
  try {
    const user = await requireUser();
    const parsed = projectSchema.safeParse(input);
    if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid project" };

    const project = await prisma.project.create({
      data: {
        userId: user.id,
        name: parsed.data.name,
        location: emptyToNull(parsed.data.location),
        plotArea: decimalOrNull(parsed.data.plotArea),
        builtUpArea: decimalOrNull(parsed.data.builtUpArea),
        numberOfFloors: parsed.data.numberOfFloors ? Number(parsed.data.numberOfFloors) : null,
        startDate: dateOrNull(parsed.data.startDate),
        expectedCompletionDate: dateOrNull(parsed.data.expectedCompletionDate),
        actualCompletionDate: dateOrNull(parsed.data.actualCompletionDate),
        totalBudget: decimalOrNull(parsed.data.totalBudget) ?? new Prisma.Decimal(0),
        status: parsed.data.status,
        notes: emptyToNull(parsed.data.notes),
      },
    });
    await seedProjectStructure(project.id);
    await setActiveProjectId(project.id);
    revalidatePath("/");
    return { ok: true, id: project.id };
  } catch (error: unknown) {
    console.error("createProject error:", error);
    return { error: error instanceof Error ? error.message : "Failed to create project" };
  }
}

export async function updateProject(projectId: string, input: unknown) {
  try {
    const user = await requireUser();
    await requireProject(projectId, user.id);
    const parsed = projectSchema.safeParse(input);
    if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid project" };

    await prisma.project.update({
      where: { id: projectId },
      data: {
        name: parsed.data.name,
        location: emptyToNull(parsed.data.location),
        plotArea: decimalOrNull(parsed.data.plotArea),
        builtUpArea: decimalOrNull(parsed.data.builtUpArea),
        numberOfFloors: parsed.data.numberOfFloors ? Number(parsed.data.numberOfFloors) : null,
        startDate: dateOrNull(parsed.data.startDate),
        expectedCompletionDate: dateOrNull(parsed.data.expectedCompletionDate),
        actualCompletionDate: dateOrNull(parsed.data.actualCompletionDate),
        totalBudget: decimalOrNull(parsed.data.totalBudget) ?? new Prisma.Decimal(0),
        status: parsed.data.status,
        notes: emptyToNull(parsed.data.notes),
      },
    });
    revalidatePath("/");
    return { ok: true };
  } catch (error: unknown) {
    console.error("updateProject error:", error);
    return { error: error instanceof Error ? error.message : "Failed to update project" };
  }
}

export async function updateProjectName(
  projectId: string,
  name: string,
  location?: string | null
) {
  const user = await requireUser();
  await requireProject(projectId, user.id);
  const trimmed = name.trim();
  if (!trimmed) return { error: "House name cannot be empty" };

  await prisma.project.update({
    where: { id: projectId },
    data: {
      name: trimmed,
      ...(location !== undefined ? { location: emptyToNull(location) } : {}),
    },
  });

  revalidatePath("/");
  revalidatePath("/dashboard");
  revalidatePath("/projects");
  revalidatePath("/documents");
  revalidatePath("/expenses");
  revalidatePath("/reports");
  revalidatePath("/budget");
  return { ok: true };
}

export async function switchProject(projectId: string) {
  const user = await requireUser();
  await requireProject(projectId, user.id);
  await setActiveProjectId(projectId);
  revalidatePath("/");
  return { ok: true };
}

export async function createFloor(projectId: string, input: unknown) {
  const user = await requireUser();
  await requireProject(projectId, user.id);
  const parsed = floorSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid floor" };
  const last = await prisma.floor.findFirst({ where: { projectId }, orderBy: { sortOrder: "desc" } });
  await prisma.floor.create({
    data: {
      projectId,
      name: parsed.data.name,
      notes: emptyToNull(parsed.data.notes),
      sortOrder: (last?.sortOrder ?? -1) + 1,
    },
  });
  revalidatePath("/projects");
  return { ok: true };
}

export async function deleteFloor(projectId: string, floorId: string) {
  const user = await requireUser();
  await requireProject(projectId, user.id);
  await prisma.floor.delete({ where: { id: floorId } });
  revalidatePath("/projects");
  return { ok: true };
}

export async function updateStage(projectId: string, stageId: string, input: unknown) {
  const user = await requireUser();
  await requireProject(projectId, user.id);
  const parsed = stageSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid stage" };
  await prisma.constructionStage.update({
    where: { id: stageId },
    data: {
      name: parsed.data.name,
      status: parsed.data.status,
      percentageComplete: parsed.data.percentageComplete,
      startDate: dateOrNull(parsed.data.startDate),
      expectedEndDate: dateOrNull(parsed.data.expectedEndDate),
      actualEndDate: dateOrNull(parsed.data.actualEndDate),
      notes: emptyToNull(parsed.data.notes),
    },
  });
  revalidatePath("/projects");
  return { ok: true };
}

export async function createStage(projectId: string, input: unknown) {
  const user = await requireUser();
  await requireProject(projectId, user.id);
  const parsed = stageSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid stage" };
  const last = await prisma.constructionStage.findFirst({
    where: { projectId },
    orderBy: { sortOrder: "desc" },
  });
  await prisma.constructionStage.create({
    data: {
      projectId,
      name: parsed.data.name,
      status: parsed.data.status,
      percentageComplete: parsed.data.percentageComplete,
      startDate: dateOrNull(parsed.data.startDate),
      expectedEndDate: dateOrNull(parsed.data.expectedEndDate),
      actualEndDate: dateOrNull(parsed.data.actualEndDate),
      notes: emptyToNull(parsed.data.notes),
      sortOrder: (last?.sortOrder ?? -1) + 1,
    },
  });
  revalidatePath("/projects");
  return { ok: true };
}
