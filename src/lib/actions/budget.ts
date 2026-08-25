"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireProject, requireUser } from "@/lib/auth-guard";
import { budgetCategorySchema, budgetTypeSchema } from "@/lib/validations";
import { parseMoneyInput } from "@/lib/money";

export async function saveTypeBudget(projectId: string, input: unknown) {
  const user = await requireUser();
  await requireProject(projectId, user.id);
  const parsed = budgetTypeSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid budget" };
  const amount = parseMoneyInput(parsed.data.amount);
  if (!amount) return { error: "Budget amount is required" };

  await prisma.budget.upsert({
    where: { projectId_expenseType: { projectId, expenseType: parsed.data.expenseType } },
    update: { amount: new Prisma.Decimal(amount.toFixed(2)) },
    create: {
      projectId,
      expenseType: parsed.data.expenseType,
      amount: new Prisma.Decimal(amount.toFixed(2)),
    },
  });
  revalidatePath("/budget");
  return { ok: true };
}

export async function saveCategoryBudget(projectId: string, input: unknown) {
  const user = await requireUser();
  await requireProject(projectId, user.id);
  const parsed = budgetCategorySchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid budget" };
  const amount = parseMoneyInput(parsed.data.amount);
  if (!amount) return { error: "Budget amount is required" };

  const materialCategoryId = parsed.data.expenseType === "MATERIAL" ? parsed.data.categoryId : null;
  const labourCategoryId = parsed.data.expenseType === "LABOUR" ? parsed.data.categoryId : null;
  const serviceCategoryId = parsed.data.expenseType === "SERVICE" ? parsed.data.categoryId : null;
  const professionalCategoryId = parsed.data.expenseType === "PROFESSIONAL" ? parsed.data.categoryId : null;

  const existing = await prisma.budgetCategory.findFirst({
    where: {
      projectId,
      expenseType: parsed.data.expenseType,
      materialCategoryId,
      labourCategoryId,
      serviceCategoryId,
      professionalCategoryId,
    },
  });

  if (existing) {
    await prisma.budgetCategory.update({
      where: { id: existing.id },
      data: { amount: new Prisma.Decimal(amount.toFixed(2)) },
    });
  } else {
    await prisma.budgetCategory.create({
      data: {
        projectId,
        expenseType: parsed.data.expenseType,
        materialCategoryId,
        labourCategoryId,
        serviceCategoryId,
        professionalCategoryId,
        amount: new Prisma.Decimal(amount.toFixed(2)),
      },
    });
  }
  revalidatePath("/budget");
  return { ok: true };
}

export async function updateProjectBudget(projectId: string, amountRaw: string) {
  const user = await requireUser();
  await requireProject(projectId, user.id);
  const amount = parseMoneyInput(amountRaw);
  if (!amount || amount.isNegative()) return { error: "Enter a valid budget" };
  await prisma.project.update({
    where: { id: projectId },
    data: { totalBudget: new Prisma.Decimal(amount.toFixed(2)) },
  });
  revalidatePath("/budget");
  return { ok: true };
}

export async function deleteCategoryBudget(projectId: string, id: string) {
  const user = await requireUser();
  await requireProject(projectId, user.id);
  await prisma.budgetCategory.delete({ where: { id } });
  revalidatePath("/budget");
  return { ok: true };
}
