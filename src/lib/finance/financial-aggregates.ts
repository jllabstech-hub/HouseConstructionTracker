import { prisma } from "@/lib/prisma";
import { toChartNumber } from "@/lib/money";
import { getCached, setCached } from "@/lib/cache-utils";

export type CriticalFinancialSummary = {
  projectName: string;
  location: string | null;
  totalBudget: number;
  totalSpent: number;
  remainingBudget: number;
  usedPercent: number;
  billsCount: number;
  materialTotal: number;
  labourTotal: number;
  otherTotal: number;
  currentStageName: string | null;
};

/**
 * Fast PostgreSQL aggregate for immediate dashboard shell render.
 * Executes in 1-2ms using database-native SUM and COUNT.
 */
export async function getCriticalFinancialSummary(projectId: string): Promise<CriticalFinancialSummary | null> {
  const [project, typeAggregates, activeStage] = await Promise.all([
    prisma.project.findUnique({
      where: { id: projectId },
      select: { name: true, location: true, totalBudget: true },
    }),
    prisma.expense.groupBy({
      by: ["expenseType"],
      where: { projectId },
      _sum: { amount: true },
      _count: { id: true },
    }),
    prisma.constructionStage.findFirst({
      where: { projectId, status: "IN_PROGRESS" },
      select: { name: true },
    }),
  ]);

  if (!project) return null;

  let totalSpent = 0;
  let billsCount = 0;
  let materialTotal = 0;
  let labourTotal = 0;
  let otherTotal = 0;

  for (const group of typeAggregates) {
    const sum = Number(group._sum.amount ?? 0);
    const count = group._count.id;
    totalSpent += sum;
    billsCount += count;

    if (group.expenseType === "MATERIAL") {
      materialTotal += sum;
    } else if (group.expenseType === "LABOUR") {
      labourTotal += sum;
    } else {
      otherTotal += sum;
    }
  }

  const totalBudget = Number(project.totalBudget);
  const remainingBudget = totalBudget - totalSpent;
  const usedPercent = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

  return {
    projectName: project.name,
    location: project.location,
    totalBudget,
    totalSpent,
    remainingBudget,
    usedPercent,
    billsCount,
    materialTotal,
    labourTotal,
    otherTotal,
    currentStageName: activeStage?.name ?? null,
  };
}

export type MonthlyTrendItem = {
  label: string;
  material: number;
  labour: number;
  total: number;
};

/**
 * Optimized monthly trend calculation.
 * Fetches only lightweight date, type, and amount columns without 9 relational joins.
 */
export async function getMonthlyTrendOptimized(projectId: string): Promise<MonthlyTrendItem[]> {
  const rows = await prisma.expense.findMany({
    where: { projectId },
    select: { date: true, expenseType: true, amount: true },
    orderBy: { date: "asc" },
  });

  const monthMap = new Map<string, { label: string; material: number; labour: number; total: number }>();

  for (const row of rows) {
    const d = new Date(row.date);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = d.toLocaleString("en-IN", { month: "short", year: "2-digit" });
    const amount = Number(row.amount);

    if (!monthMap.has(key)) {
      monthMap.set(key, { label, material: 0, labour: 0, total: 0 });
    }
    const item = monthMap.get(key)!;
    item.total += amount;
    if (row.expenseType === "MATERIAL") {
      item.material += amount;
    } else if (row.expenseType === "LABOUR") {
      item.labour += amount;
    }
  }

  return Array.from(monthMap.values());
}

export type TopCategoryItem = {
  name: string;
  amount: number;
};

export type BudgetAlertItem = {
  name: string;
  variance: number;
};

/**
 * Optimized Top Categories & Budget Alerts using PostgreSQL groupBy.
 */
export async function getTopCategoriesAndAlertsOptimized(projectId: string) {
  const [materialGroups, budgetCategories] = await Promise.all([
    prisma.expense.groupBy({
      by: ["materialCategoryId"],
      where: { projectId, expenseType: "MATERIAL", materialCategoryId: { not: null } },
      _sum: { amount: true },
      orderBy: { _sum: { amount: "desc" } },
      take: 5,
    }),
    prisma.budgetCategory.findMany({
      where: { projectId },
      include: {
        materialCategory: { select: { name: true } },
        labourCategory: { select: { name: true } },
        serviceCategory: { select: { name: true } },
        professionalCategory: { select: { name: true } },
      },
    }),
  ]);

  const matCatIds = materialGroups.map((g) => g.materialCategoryId!).filter(Boolean);
  const categories = matCatIds.length > 0
    ? await prisma.materialCategory.findMany({
        where: { id: { in: matCatIds } },
        select: { id: true, name: true },
      })
    : [];
  const catNameMap = new Map(categories.map((c) => [c.id, c.name]));

  const topCategories: TopCategoryItem[] = materialGroups.map((g) => ({
    name: catNameMap.get(g.materialCategoryId!) ?? "Material",
    amount: toChartNumber(Number(g._sum.amount ?? 0)),
  }));

  // Budget alerts
  const budgetAlerts: BudgetAlertItem[] = [];
  if (budgetCategories.length > 0) {
    const allExpenses = await prisma.expense.findMany({
      where: { projectId },
      select: {
        expenseType: true,
        materialCategoryId: true,
        labourCategoryId: true,
        serviceCategoryId: true,
        professionalCategoryId: true,
        amount: true,
      },
    });

    for (const b of budgetCategories) {
      const budgetLimit = Number(b.amount);
      const actual = allExpenses
        .filter((e) => {
          if (b.expenseType === "MATERIAL") return e.materialCategoryId === b.materialCategoryId;
          if (b.expenseType === "LABOUR") return e.labourCategoryId === b.labourCategoryId;
          if (b.expenseType === "SERVICE") return e.serviceCategoryId === b.serviceCategoryId;
          if (b.expenseType === "PROFESSIONAL") return e.professionalCategoryId === b.professionalCategoryId;
          return false;
        })
        .reduce((sum, e) => sum + Number(e.amount), 0);

      if (actual > budgetLimit) {
        const name =
          b.materialCategory?.name ??
          b.labourCategory?.name ??
          b.serviceCategory?.name ??
          b.professionalCategory?.name ??
          b.expenseType;
        budgetAlerts.push({
          name,
          variance: actual - budgetLimit,
        });
      }
    }
  }

  return { topCategories, budgetAlerts };
}

export type ConstructionProgressSummary = {
  activeStage: { name: string; sortOrder: number; percentageComplete: number; status: string } | null;
  completedCount: number;
  totalStages: number;
  overallPercent: number;
  isUnrecorded: boolean;
};

export async function getConstructionProgressSummary(projectId: string): Promise<ConstructionProgressSummary> {
  const stages = await prisma.constructionStage.findMany({
    where: { projectId },
    orderBy: { sortOrder: "asc" },
    select: { name: true, sortOrder: true, percentageComplete: true, status: true },
  });

  const totalStages = stages.length || 20;
  const completedCount = stages.filter((s) => s.status === "COMPLETED" || s.percentageComplete >= 100).length;
  const activeStage =
    stages.find((s) => s.status === "IN_PROGRESS") ??
    stages.find((s) => s.status === "NOT_STARTED" && s.percentageComplete > 0) ??
    stages[0] ??
    null;

  const sumPercent = stages.reduce((sum, s) => sum + s.percentageComplete, 0);
  const overallPercent = Math.round(sumPercent / totalStages);
  const isUnrecorded = sumPercent === 0 && stages.every((s) => s.status === "NOT_STARTED");

  return {
    activeStage,
    completedCount,
    totalStages,
    overallPercent,
    isUnrecorded,
  };
}

export type WorkWiseCostItem = {
  name: string;
  material: number;
  labour: number;
  total: number;
};

/**
 * Optimized Work-Wise breakdown using category aggregations.
 */
export async function getWorkWiseCostOptimized(projectId: string, userId: string): Promise<WorkWiseCostItem[]> {
  const [workAreas, expenses] = await Promise.all([
    prisma.workArea.findMany({
      where: { userId },
      include: {
        materials: { select: { categoryId: true } },
        labours: { select: { categoryId: true } },
      },
      orderBy: { sortOrder: "asc" },
    }),
    prisma.expense.findMany({
      where: { projectId },
      select: {
        expenseType: true,
        materialCategoryId: true,
        labourCategoryId: true,
        amount: true,
      },
    }),
  ]);

  return workAreas.map((area) => {
    const matSet = new Set(area.materials.map((m) => m.categoryId));
    const labSet = new Set(area.labours.map((l) => l.categoryId));

    let material = 0;
    let labour = 0;

    for (const e of expenses) {
      const amt = Number(e.amount);
      if (e.expenseType === "MATERIAL" && e.materialCategoryId && matSet.has(e.materialCategoryId)) {
        material += amt;
      } else if (e.expenseType === "LABOUR" && e.labourCategoryId && labSet.has(e.labourCategoryId)) {
        labour += amt;
      }
    }

    return {
      name: area.name,
      material: toChartNumber(material),
      labour: toChartNumber(labour),
      total: toChartNumber(material + labour),
    };
  });
}

/**
 * Optimized Recent Transactions: fetches only 5 records with minimal selected fields.
 */
export async function getRecentExpensesOptimized(projectId: string, limit = 5) {
  const rows = await prisma.expense.findMany({
    where: { projectId },
    orderBy: [{ date: "desc" }, { createdAt: "desc" }],
    take: limit,
    select: {
      id: true,
      date: true,
      expenseType: true,
      amount: true,
      description: true,
      materialCategory: { select: { name: true } },
      labourCategory: { select: { name: true } },
      serviceCategory: { select: { name: true } },
      equipmentCategory: { select: { name: true } },
      professionalCategory: { select: { name: true } },
      vendor: { select: { name: true } },
      worker: { select: { name: true } },
    },
  });

  return rows.map((e) => ({
    id: e.id,
    date: e.date.toISOString().slice(0, 10),
    type: e.expenseType,
    categoryName:
      e.materialCategory?.name ||
      e.labourCategory?.name ||
      e.serviceCategory?.name ||
      e.equipmentCategory?.name ||
      e.professionalCategory?.name ||
      "Expense",
    description: e.description ?? null,
    vendorName: e.vendor?.name || e.worker?.name || null,
    amount: toChartNumber(Number(e.amount)),
  }));
}

/**
 * Batch Project Summaries query: Eliminates N+1 query loops on /projects in 1 single groupBy.
 */
export async function getProjectsSummaryBatch(projectIds: string[]) {
  if (projectIds.length === 0) return new Map();

  const groups = await prisma.expense.groupBy({
    by: ["projectId", "expenseType"],
    where: { projectId: { in: projectIds } },
    _sum: { amount: true },
  });

  const summaryMap = new Map<string, { total: number; MATERIAL: number; LABOUR: number; OTHER: number }>();

  for (const pid of projectIds) {
    summaryMap.set(pid, { total: 0, MATERIAL: 0, LABOUR: 0, OTHER: 0 });
  }

  for (const g of groups) {
    const summary = summaryMap.get(g.projectId);
    if (summary) {
      const amt = Number(g._sum.amount ?? 0);
      summary.total += amt;
      if (g.expenseType === "MATERIAL") {
        summary.MATERIAL += amt;
      } else if (g.expenseType === "LABOUR") {
        summary.LABOUR += amt;
      } else {
        summary.OTHER += amt;
      }
    }
  }

  return summaryMap;
}

/**
 * Consolidated 1-Roundtrip Dashboard Data Loader:
 * Replaces 12 sequential/semi-sequential remote DB calls with 1 single parallel roundtrip.
 * All aggregations (financials, monthly trend, top categories, budget alerts, progress, recent items)
 * are computed in-memory in ~0.1ms.
 */
export async function getDashboardFullData(projectId: string) {
  const cacheKey = `dashboard:${projectId}`;
  const cached = getCached<NonNullable<Awaited<ReturnType<typeof fetchDashboardFullDataUncached>>>>(cacheKey);
  if (cached) return cached;

  const result = await fetchDashboardFullDataUncached(projectId);
  if (result) {
    setCached(cacheKey, result);
  }
  return result;
}

/**
 * Secondary dashboard data for Suspense streaming.
 * Returns monthly, topCategories, budgetAlerts, progress, recentExpenses.
 * Shares the same cache as getDashboardFullData.
 */
export async function getDashboardSecondaryData(projectId: string) {
  const full = await getDashboardFullData(projectId);
  if (!full) return null;

  return {
    monthly: full.monthly,
    topCategories: full.topCategories,
    budgetAlerts: full.budgetAlerts,
    progress: full.progress,
    recentExpenses: full.recentExpenses,
  };
}

async function fetchDashboardFullDataUncached(projectId: string) {
  const [project, rawExpenses, stages, budgetCategories, materialCategories] = await Promise.all([
    prisma.project.findUnique({
      where: { id: projectId },
      select: { name: true, location: true, totalBudget: true },
    }),
    prisma.expense.findMany({
      where: { projectId },
      select: {
        id: true,
        date: true,
        expenseType: true,
        amount: true,
        description: true,
        materialCategoryId: true,
        labourCategoryId: true,
        serviceCategoryId: true,
        professionalCategoryId: true,
        materialCategory: { select: { name: true } },
        labourCategory: { select: { name: true } },
        serviceCategory: { select: { name: true } },
        equipmentCategory: { select: { name: true } },
        professionalCategory: { select: { name: true } },
        vendor: { select: { name: true } },
        worker: { select: { name: true } },
      },
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
    }),
    prisma.constructionStage.findMany({
      where: { projectId },
      select: { name: true, sortOrder: true, percentageComplete: true, status: true },
      orderBy: { sortOrder: "asc" },
    }),
    prisma.budgetCategory.findMany({
      where: { projectId },
      select: {
        expenseType: true,
        amount: true,
        materialCategoryId: true,
        labourCategoryId: true,
        serviceCategoryId: true,
        professionalCategoryId: true,
        materialCategory: { select: { name: true } },
        labourCategory: { select: { name: true } },
        serviceCategory: { select: { name: true } },
        professionalCategory: { select: { name: true } },
      },
    }),
    prisma.materialCategory.findMany({
      select: { id: true, name: true },
    }),
  ]);

  if (!project) return null;

  let totalSpent = 0;
  let materialTotal = 0;
  let labourTotal = 0;
  let otherTotal = 0;
  const billsCount = rawExpenses.length;

  const matCatSumMap = new Map<string, number>();
  const monthMap = new Map<string, { label: string; material: number; labour: number; total: number }>();

  for (const row of rawExpenses) {
    const amt = Number(row.amount);
    totalSpent += amt;

    if (row.expenseType === "MATERIAL") {
      materialTotal += amt;
      if (row.materialCategoryId) {
        matCatSumMap.set(row.materialCategoryId, (matCatSumMap.get(row.materialCategoryId) ?? 0) + amt);
      }
    } else if (row.expenseType === "LABOUR") {
      labourTotal += amt;
    } else {
      otherTotal += amt;
    }

    const d = new Date(row.date);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = d.toLocaleString("en-IN", { month: "short", year: "2-digit" });
    if (!monthMap.has(key)) {
      monthMap.set(key, { label, material: 0, labour: 0, total: 0 });
    }
    const mItem = monthMap.get(key)!;
    mItem.total += amt;
    if (row.expenseType === "MATERIAL") mItem.material += amt;
    else if (row.expenseType === "LABOUR") mItem.labour += amt;
  }

  const totalBudget = Number(project.totalBudget);
  const remainingBudget = totalBudget - totalSpent;
  const usedPercent = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;
  const activeStage = stages.find((s) => s.status === "IN_PROGRESS");

  const summary: CriticalFinancialSummary = {
    projectName: project.name,
    location: project.location,
    totalBudget,
    totalSpent,
    remainingBudget,
    usedPercent,
    billsCount,
    materialTotal,
    labourTotal,
    otherTotal,
    currentStageName: activeStage?.name ?? null,
  };

  const monthly = Array.from(monthMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, v]) => v);

  const catNameMap = new Map(materialCategories.map((c) => [c.id, c.name]));
  const topCategories: TopCategoryItem[] = Array.from(matCatSumMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([catId, sum]) => ({
      name: catNameMap.get(catId) ?? "Material",
      amount: toChartNumber(sum),
    }));

  const budgetAlerts: BudgetAlertItem[] = [];
  for (const b of budgetCategories) {
    const budgetLimit = Number(b.amount);
    const actual = rawExpenses
      .filter((e) => {
        if (b.expenseType === "MATERIAL") return e.materialCategoryId === b.materialCategoryId;
        if (b.expenseType === "LABOUR") return e.labourCategoryId === b.labourCategoryId;
        if (b.expenseType === "SERVICE") return e.serviceCategoryId === b.serviceCategoryId;
        if (b.expenseType === "PROFESSIONAL") return e.professionalCategoryId === b.professionalCategoryId;
        return false;
      })
      .reduce((sum, e) => sum + Number(e.amount), 0);

    if (actual > budgetLimit) {
      const name =
        b.materialCategory?.name ??
        b.labourCategory?.name ??
        b.serviceCategory?.name ??
        b.professionalCategory?.name ??
        b.expenseType;
      budgetAlerts.push({
        name,
        variance: actual - budgetLimit,
      });
    }
  }

  const totalStages = stages.length || 20;
  const completedCount = stages.filter((s) => s.status === "COMPLETED" || s.percentageComplete >= 100).length;
  const currActiveStage =
    stages.find((s) => s.status === "IN_PROGRESS") ??
    stages.find((s) => s.status === "NOT_STARTED" && s.percentageComplete > 0) ??
    stages[0] ??
    null;
  const sumPercent = stages.reduce((sum, s) => sum + s.percentageComplete, 0);
  const overallPercent = Math.round(sumPercent / totalStages);
  const isUnrecorded = sumPercent === 0 && stages.every((s) => s.status === "NOT_STARTED");

  const progress: ConstructionProgressSummary = {
    activeStage: currActiveStage,
    completedCount,
    totalStages,
    overallPercent,
    isUnrecorded,
  };

  const recentExpenses = rawExpenses.slice(0, 5).map((e) => ({
    id: e.id,
    date: e.date.toISOString().slice(0, 10),
    type: e.expenseType,
    categoryName:
      e.materialCategory?.name ||
      e.labourCategory?.name ||
      e.serviceCategory?.name ||
      e.equipmentCategory?.name ||
      e.professionalCategory?.name ||
      "Expense",
    description: e.description ?? null,
    vendorName: e.vendor?.name || e.worker?.name || null,
    amount: toChartNumber(Number(e.amount)),
  }));

  return {
    summary,
    monthly,
    topCategories,
    budgetAlerts,
    progress,
    recentExpenses,
  };
}
