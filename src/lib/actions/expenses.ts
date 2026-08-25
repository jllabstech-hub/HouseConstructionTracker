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

  const payload = {
    projectId: data.projectId,
    date: new Date(data.date),
    expenseType: data.expenseType,
    description: data.description,
    quantity: decimalOrNull(data.quantity),
    unit: emptyToNull(data.unit),
    rate: decimalOrNull(data.rate),
    amount: new Prisma.Decimal(amount.toFixed(2)),
    vendorId: data.expenseType === "MATERIAL" || data.expenseType === "SERVICE" ? emptyToNull(data.vendorId) : null,
    workerId: data.expenseType === "LABOUR" ? emptyToNull(data.workerId) : null,
    constructionStageId: emptyToNull(data.constructionStageId),
    floorId: emptyToNull(data.floorId),
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

  const saved = expenseId
    ? await prisma.expense.update({ where: { id: expenseId }, data: payload })
    : await prisma.expense.create({ data: payload });

  revalidatePath("/");
  return { ok: true, id: saved.id };
}

export async function deleteExpense(projectId: string, expenseId: string) {
  const user = await requireUser();
  await requireProject(projectId, user.id);
  const expense = await prisma.expense.findFirst({ where: { id: expenseId, projectId } });
  if (!expense) return { error: "Expense not found" };
  await prisma.expense.delete({ where: { id: expenseId } });
  revalidatePath("/");
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
