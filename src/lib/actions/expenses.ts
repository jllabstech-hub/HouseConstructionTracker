"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireProject, requireUser } from "@/lib/auth-guard";
import { expenseSchema } from "@/lib/validations";
import { computeLabourAmount, computeMaterialAmount } from "@/lib/finance/aggregations";
import { parseMoneyInput, roundMoney } from "@/lib/money";

function emptyToNull(value?: string | null) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

export async function saveExpense(input: unknown, expenseId?: string) {
  const user = await requireUser();
  const parsed = expenseSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Please check the expense details" };
  }

  const data = parsed.data;
  await requireProject(data.projectId, user.id);

  const amount = resolveAmount(data);
  if (!amount.greaterThan(0)) {
    return { error: "Amount must be positive" };
  }

  // Verify relational integrity
  const stageId = emptyToNull(data.constructionStageId);
  const floorId = emptyToNull(data.floorId);
  const vendorId = data.expenseType === "MATERIAL" || data.expenseType === "SERVICE" ? emptyToNull(data.vendorId) : null;
  const workerId = data.expenseType === "LABOUR" ? emptyToNull(data.workerId) : null;

  if (stageId) {
    const validStage = await prisma.constructionStage.findFirst({ where: { id: stageId, projectId: data.projectId } });
    if (!validStage) return { error: "Selected construction stage not found in this project" };
  }

  if (floorId) {
    const validFloor = await prisma.floor.findFirst({ where: { id: floorId, projectId: data.projectId } });
    if (!validFloor) return { error: "Selected floor not found in this project" };
  }

  if (vendorId) {
    const validVendor = await prisma.vendor.findFirst({ where: { id: vendorId, userId: user.id } });
    if (!validVendor) return { error: "Selected vendor not found in your account" };
  }

  if (workerId) {
    const validWorker = await prisma.worker.findFirst({ where: { id: workerId, userId: user.id } });
    if (!validWorker) return { error: "Selected worker not found in your account" };
  }

  const payload = {
    projectId: data.projectId,
    date: new Date(data.date),
    expenseType: data.expenseType,
    description: data.description,
    quantity: decimalOrNull(data.quantity),
    unit: emptyToNull(data.unit),
    rate: decimalOrNull(data.rate),
    amount: new Prisma.Decimal(amount.toFixed(2)),
    vendorId,
    workerId,
    constructionStageId: stageId,
    floorId,
    paymentMethod: data.paymentMethod,
    invoiceNumber: emptyToNull(data.invoiceNumber),
    notes: emptyToNull(data.notes),
    materialCategoryId: data.expenseType === "MATERIAL" ? emptyToNull(data.materialCategoryId) : null,
    materialSubcategoryId: data.expenseType === "MATERIAL" ? emptyToNull(data.materialSubcategoryId) : null,
    labourCategoryId: data.expenseType === "LABOUR" ? emptyToNull(data.labourCategoryId) : null,
    labourSubcategoryId: data.expenseType === "LABOUR" ? emptyToNull(data.labourSubcategoryId) : null,
    serviceCategoryId: data.expenseType === "SERVICE" ? emptyToNull(data.serviceCategoryId) : null,
    equipmentCategoryId: data.expenseType === "EQUIPMENT" ? emptyToNull(data.equipmentCategoryId) : null,
    professionalCategoryId: data.expenseType === "PROFESSIONAL" ? emptyToNull(data.professionalCategoryId) : null,
    labourCalcMethod: data.expenseType === "LABOUR" ? data.labourCalcMethod ?? "FIXED_CONTRACT" : null,
    numberOfWorkers: data.numberOfWorkers ? Number(data.numberOfWorkers) : null,
    numberOfDays: decimalOrNull(data.numberOfDays),
  };

  try {
    if (expenseId) {
      const existing = await prisma.expense.findFirst({
        where: { id: expenseId, projectId: data.projectId },
      });
      if (!existing) {
        return { error: "Expense not found or unauthorized" };
      }
    }

    const saved = expenseId
      ? await prisma.expense.update({ where: { id: expenseId }, data: payload })
      : await prisma.expense.create({ data: payload });

    revalidatePath("/");
    revalidatePath(`/expenses`);
    revalidatePath(`/expenses/${saved.id}`);
    revalidatePath(`/projects/${data.projectId}`);
    return { ok: true, id: saved.id };
  } catch (error) {
    console.error("saveExpense error:", error);
    return { error: error instanceof Error ? error.message : "Failed to save expense" };
  }
}

export async function deleteExpense(projectId: string, expenseId: string) {
  const user = await requireUser();
  await requireProject(projectId, user.id);
  const expense = await prisma.expense.findFirst({ where: { id: expenseId, projectId } });
  if (!expense) return { error: "Expense not found or unauthorized" };
  await prisma.expense.deleteMany({ where: { id: expenseId, projectId } });
  revalidatePath("/");
  revalidatePath("/expenses");
  return { ok: true };
}

function resolveAmount(data: ReturnType<typeof expenseSchema.parse>) {
  if (data.expenseType === "LABOUR") {
    return computeLabourAmount({
      method: data.labourCalcMethod ?? "FIXED_CONTRACT",
      numberOfWorkers: parseMoneyInput(data.numberOfWorkers ?? ""),
      numberOfDays: parseMoneyInput(data.numberOfDays ?? ""),
      rate: parseMoneyInput(data.rate ?? ""),
      amount: parseMoneyInput(data.amount ?? ""),
    });
  }
  if (data.expenseType === "MATERIAL") {
    return computeMaterialAmount({
      quantity: parseMoneyInput(data.quantity ?? ""),
      rate: parseMoneyInput(data.rate ?? ""),
      amount: parseMoneyInput(data.amount ?? ""),
    });
  }
  return roundMoney(parseMoneyInput(data.amount ?? "") ?? 0);
}

function decimalOrNull(value?: string | null) {
  const parsed = parseMoneyInput(value ?? "");
  return parsed ? new Prisma.Decimal(parsed.toString()) : null;
}
