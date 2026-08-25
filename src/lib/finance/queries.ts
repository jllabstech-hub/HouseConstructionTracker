import { Prisma, type Expense, type ExpenseType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  type ExpenseRecord,
  type WorkAreaDefinition,
  getBudgetVariance,
  getMonthComparison,
  getNamedCategoryTotals,
  getTopCategories,
  getTypeTotals,
  getWorkWiseCost,
  generateSmartSummary,
} from "@/lib/finance/aggregations";
import { toDecimal } from "@/lib/money";

const expenseInclude = {
  materialCategory: true,
  labourCategory: true,
  serviceCategory: true,
  equipmentCategory: true,
  professionalCategory: true,
  vendor: true,
  worker: true,
  constructionStage: true,
  floor: true,
} as const;

export type LoadedExpense = Prisma.ExpenseGetPayload<{ include: typeof expenseInclude }>;

export type DateRange = { from?: Date; to?: Date };

export function expenseWhere(projectId: string, range?: DateRange, extra?: Prisma.ExpenseWhereInput) {
  return {
    projectId,
    ...(range?.from || range?.to
      ? {
          date: {
            ...(range.from ? { gte: range.from } : {}),
            ...(range.to ? { lte: range.to } : {}),
          },
        }
      : {}),
    ...extra,
  } satisfies Prisma.ExpenseWhereInput;
}

export function mapExpense(expense: LoadedExpense | Expense): ExpenseRecord {
  const loaded = expense as LoadedExpense;
  return {
    id: expense.id,
    date: expense.date,
    expenseType: expense.expenseType,
    amount: expense.amount,
    materialCategoryId: expense.materialCategoryId,
    materialCategoryName: loaded.materialCategory?.name ?? null,
    labourCategoryId: expense.labourCategoryId,
    labourCategoryName: loaded.labourCategory?.name ?? null,
    serviceCategoryId: expense.serviceCategoryId,
    serviceCategoryName: loaded.serviceCategory?.name ?? null,
    equipmentCategoryId: expense.equipmentCategoryId,
    equipmentCategoryName: loaded.equipmentCategory?.name ?? null,
    professionalCategoryId: expense.professionalCategoryId,
    professionalCategoryName: loaded.professionalCategory?.name ?? null,
    vendorId: expense.vendorId,
    vendorName: loaded.vendor?.name ?? null,
    workerId: expense.workerId,
    workerName: loaded.worker?.name ?? null,
    constructionStageId: expense.constructionStageId,
    constructionStageName: loaded.constructionStage?.name ?? null,
    floorId: expense.floorId,
    floorName: loaded.floor?.name ?? null,
    paymentMethod: expense.paymentMethod,
    description: expense.description,
    quantity: expense.quantity?.toString() ?? null,
    rate: expense.rate,
    unit: expense.unit,
  };
}

export async function loadProjectExpenses(projectId: string, range?: DateRange, extra?: Prisma.ExpenseWhereInput) {
  const rows = await prisma.expense.findMany({
    where: expenseWhere(projectId, range, extra),
    include: expenseInclude,
    orderBy: [{ date: "desc" }, { createdAt: "desc" }],
  });
  return rows.map(mapExpense);
}

export async function loadWorkAreas(userId: string): Promise<WorkAreaDefinition[]> {
  const areas = await prisma.workArea.findMany({
    where: { userId },
    include: { materials: true, labours: true },
    orderBy: { sortOrder: "asc" },
  });
  return areas.map((area) => ({
    id: area.id,
    name: area.name,
    materialCategoryIds: area.materials.map((link) => link.categoryId),
    labourCategoryIds: area.labours.map((link) => link.categoryId),
  }));
}

export async function getDashboardData(projectId: string, userId: string, range?: DateRange) {
  const [project, expenses, workAreas, budgets, budgetCategories] = await Promise.all([
    prisma.project.findFirstOrThrow({ where: { id: projectId, userId } }),
    loadProjectExpenses(projectId, range),
    loadWorkAreas(userId),
    prisma.budget.findMany({ where: { projectId } }),
    prisma.budgetCategory.findMany({
      where: { projectId },
      include: { materialCategory: true, labourCategory: true, serviceCategory: true, professionalCategory: true },
    }),
  ]);

  const totals = getTypeTotals(expenses);
  const now = new Date();
  const monthComparison = getMonthComparison(expenses, now.getFullYear(), now.getMonth() + 1);
  const workWise = getWorkWiseCost(expenses, workAreas);
  const topCategories = getTopCategories(expenses, 10);
  const materialCategories = getNamedCategoryTotals(expenses.filter((row) => row.expenseType === "MATERIAL"));
  const overBudget = budgetCategories
    .map((item) => {
      const actual = expenses
        .filter((row) => {
          if (item.expenseType === "MATERIAL") return row.materialCategoryId === item.materialCategoryId;
          if (item.expenseType === "LABOUR") return row.labourCategoryId === item.labourCategoryId;
          if (item.expenseType === "SERVICE") return row.serviceCategoryId === item.serviceCategoryId;
          if (item.expenseType === "PROFESSIONAL") return row.professionalCategoryId === item.professionalCategoryId;
          return false;
        })
        .reduce((sum, row) => sum.plus(toDecimal(row.amount)), toDecimal(0));
      const result = getBudgetVariance(item.amount, actual);
      const name =
        item.materialCategory?.name ??
        item.labourCategory?.name ??
        item.serviceCategory?.name ??
        item.professionalCategory?.name ??
        item.expenseType;
      return { name, ...result };
    })
    .filter((item) => item.isOver)
    .map((item) => ({ name: item.name, variance: item.variance }));

  const summary = generateSmartSummary({
    projectName: project.name,
    totalBudget: project.totalBudget,
    totals,
    topMaterial: materialCategories[0] ?? null,
    overBudgetCategories: overBudget,
    monthComparison,
    currentMonthLabel: now.toLocaleString("en-IN", { month: "long" }),
    previousMonthLabel: new Date(now.getFullYear(), now.getMonth() - 1, 1).toLocaleString("en-IN", {
      month: "long",
    }),
  });

  return {
    project,
    expenses,
    totals,
    workWise,
    topCategories,
    monthComparison,
    budgets,
    budgetCategories,
    overBudget,
    summary,
  };
}

export { expenseInclude };
export type { ExpenseType };
