import { Decimal } from "decimal.js";
import {
  addMoney,
  formatINR,
  formatINRCompact,
  percentOf,
  roundMoney,
  toDecimal,
  variance,
  zero,
  type MoneyInput,
} from "@/lib/money";

export type ExpenseTypeValue =
  | "MATERIAL"
  | "LABOUR"
  | "SERVICE"
  | "EQUIPMENT"
  | "PROFESSIONAL"
  | "OTHER";

export type ExpenseRecord = {
  id?: string;
  date: Date | string;
  expenseType: ExpenseTypeValue;
  amount: MoneyInput;
  materialCategoryId?: string | null;
  materialCategoryName?: string | null;
  labourCategoryId?: string | null;
  labourCategoryName?: string | null;
  serviceCategoryId?: string | null;
  serviceCategoryName?: string | null;
  professionalCategoryId?: string | null;
  professionalCategoryName?: string | null;
  equipmentCategoryId?: string | null;
  equipmentCategoryName?: string | null;
  vendorId?: string | null;
  vendorName?: string | null;
  workerId?: string | null;
  workerName?: string | null;
  constructionStageId?: string | null;
  constructionStageName?: string | null;
  floorId?: string | null;
  floorName?: string | null;
  paymentMethod?: string | null;
  description?: string | null;
  quantity?: string | number | null;
  rate?: MoneyInput | null;
  unit?: string | null;
  invoiceNumber?: string | null;
  notes?: string | null;
};

export type WorkAreaDefinition = {
  id: string;
  name: string;
  materialCategoryIds: string[];
  labourCategoryIds: string[];
};

export type TypeTotals = {
  MATERIAL: Decimal;
  LABOUR: Decimal;
  SERVICE: Decimal;
  EQUIPMENT: Decimal;
  PROFESSIONAL: Decimal;
  OTHER: Decimal;
  total: Decimal;
};

export function getProjectTotal(expenses: ExpenseRecord[]): Decimal {
  return roundMoney(addMoney(...expenses.map((expense) => expense.amount)));
}

export function getTotalByType(expenses: ExpenseRecord[], type: ExpenseTypeValue): Decimal {
  return roundMoney(
    addMoney(
      ...expenses.filter((expense) => expense.expenseType === type).map((expense) => expense.amount),
    ),
  );
}

export function getMaterialTotal(expenses: ExpenseRecord[]): Decimal {
  return getTotalByType(expenses, "MATERIAL");
}

export function getLabourTotal(expenses: ExpenseRecord[]): Decimal {
  return getTotalByType(expenses, "LABOUR");
}

export function getServiceTotal(expenses: ExpenseRecord[]): Decimal {
  return getTotalByType(expenses, "SERVICE");
}

export function getEquipmentTotal(expenses: ExpenseRecord[]): Decimal {
  return getTotalByType(expenses, "EQUIPMENT");
}

export function getProfessionalTotal(expenses: ExpenseRecord[]): Decimal {
  return getTotalByType(expenses, "PROFESSIONAL");
}

export function getOtherTotal(expenses: ExpenseRecord[]): Decimal {
  return getTotalByType(expenses, "OTHER");
}

export function getTypeTotals(expenses: ExpenseRecord[]): TypeTotals {
  return {
    MATERIAL: getMaterialTotal(expenses),
    LABOUR: getLabourTotal(expenses),
    SERVICE: getServiceTotal(expenses),
    EQUIPMENT: getEquipmentTotal(expenses),
    PROFESSIONAL: getProfessionalTotal(expenses),
    OTHER: getOtherTotal(expenses),
    total: getProjectTotal(expenses),
  };
}

export function getCategoryTotal(
  expenses: ExpenseRecord[],
  categoryId: string,
  expenseType: ExpenseTypeValue = "MATERIAL",
): Decimal {
  const field =
    expenseType === "LABOUR"
      ? "labourCategoryId"
      : expenseType === "SERVICE"
        ? "serviceCategoryId"
        : expenseType === "PROFESSIONAL"
          ? "professionalCategoryId"
          : expenseType === "EQUIPMENT"
            ? "equipmentCategoryId"
            : "materialCategoryId";

  return roundMoney(
    addMoney(
      ...expenses
        .filter((expense) => expense.expenseType === expenseType && expense[field] === categoryId)
        .map((expense) => expense.amount),
    ),
  );
}

export function getLabourCategoryTotal(expenses: ExpenseRecord[], labourCategoryId: string): Decimal {
  return getCategoryTotal(expenses, labourCategoryId, "LABOUR");
}

export function getMonthlyTotal(expenses: ExpenseRecord[], year: number, month: number): Decimal {
  return roundMoney(
    addMoney(
      ...expenses
        .filter((expense) => {
          const date = toDate(expense.date);
          return date.getFullYear() === year && date.getMonth() + 1 === month;
        })
        .map((expense) => expense.amount),
    ),
  );
}

export function getMonthlySeries(expenses: ExpenseRecord[]) {
  const buckets = new Map<string, { key: string; label: string; year: number; month: number; totals: TypeTotals }>();

  for (const expense of expenses) {
    const date = toDate(expense.date);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const key = `${year}-${String(month).padStart(2, "0")}`;
    const existing = buckets.get(key);
    const current = existing ?? {
      key,
      label: monthLabel(year, month),
      year,
      month,
      totals: emptyTypeTotals(),
    };
    current.totals[expense.expenseType] = current.totals[expense.expenseType].plus(toDecimal(expense.amount));
    current.totals.total = current.totals.total.plus(toDecimal(expense.amount));
    buckets.set(key, current);
  }

  return [...buckets.values()]
    .sort((a, b) => a.key.localeCompare(b.key))
    .map((bucket) => ({
      ...bucket,
      totals: {
        MATERIAL: roundMoney(bucket.totals.MATERIAL),
        LABOUR: roundMoney(bucket.totals.LABOUR),
        SERVICE: roundMoney(bucket.totals.SERVICE),
        EQUIPMENT: roundMoney(bucket.totals.EQUIPMENT),
        PROFESSIONAL: roundMoney(bucket.totals.PROFESSIONAL),
        OTHER: roundMoney(bucket.totals.OTHER),
        total: roundMoney(bucket.totals.total),
      },
    }));
}

export function getMonthComparison(expenses: ExpenseRecord[], year: number, month: number) {
  const current = getMonthlyTypeTotals(expenses, year, month);
  const previousDate = new Date(year, month - 2, 1);
  const previous = getMonthlyTypeTotals(expenses, previousDate.getFullYear(), previousDate.getMonth() + 1);
  const difference = current.total.minus(previous.total);
  const changePercent = previous.total.isZero()
    ? current.total.isZero()
      ? zero()
      : new Decimal(100)
    : percentOf(difference, previous.total, 1);

  return { current, previous, difference, changePercent };
}

export function getBudgetVariance(budget: MoneyInput, actual: MoneyInput) {
  return variance(budget, actual);
}

export function getRemainingBudget(budget: MoneyInput, actual: MoneyInput): Decimal {
  return variance(budget, actual).remaining;
}

export function getBudgetPercentage(budget: MoneyInput, actual: MoneyInput): Decimal {
  return variance(budget, actual).usedPercent;
}

export type WorkWiseRow = {
  id: string;
  name: string;
  material: Decimal;
  labour: Decimal;
  total: Decimal;
};

export function getWorkWiseCost(expenses: ExpenseRecord[], workAreas: WorkAreaDefinition[]): WorkWiseRow[] {
  const materialIdsUsed = new Set<string>();
  const labourIdsUsed = new Set<string>();

  const rows = workAreas.map((area) => {
    const materialIdSet = new Set(area.materialCategoryIds);
    const labourIdSet = new Set(area.labourCategoryIds);
    area.materialCategoryIds.forEach((id) => materialIdsUsed.add(id));
    area.labourCategoryIds.forEach((id) => labourIdsUsed.add(id));

    const material = roundMoney(
      addMoney(
        ...expenses
          .filter(
            (expense) =>
              expense.expenseType === "MATERIAL" &&
              expense.materialCategoryId &&
              materialIdSet.has(expense.materialCategoryId),
          )
          .map((expense) => expense.amount),
      ),
    );
    const labour = roundMoney(
      addMoney(
        ...expenses
          .filter(
            (expense) =>
              expense.expenseType === "LABOUR" &&
              expense.labourCategoryId &&
              labourIdSet.has(expense.labourCategoryId),
          )
          .map((expense) => expense.amount),
      ),
    );

    return {
      id: area.id,
      name: area.name,
      material,
      labour,
      total: roundMoney(material.plus(labour)),
    };
  });

  const unassignedMaterial = roundMoney(
    addMoney(
      ...expenses
        .filter(
          (expense) =>
            expense.expenseType === "MATERIAL" &&
            expense.materialCategoryId &&
            !materialIdsUsed.has(expense.materialCategoryId),
        )
        .map((expense) => expense.amount),
    ),
  );
  const unassignedLabour = roundMoney(
    addMoney(
      ...expenses
        .filter(
          (expense) =>
            expense.expenseType === "LABOUR" &&
            expense.labourCategoryId &&
            !labourIdsUsed.has(expense.labourCategoryId),
        )
        .map((expense) => expense.amount),
    ),
  );

  if (!unassignedMaterial.isZero() || !unassignedLabour.isZero()) {
    rows.push({
      id: "unassigned",
      name: "Unassigned",
      material: unassignedMaterial,
      labour: unassignedLabour,
      total: roundMoney(unassignedMaterial.plus(unassignedLabour)),
    });
  }

  return rows;
}

export function getVendorTotal(expenses: ExpenseRecord[], vendorId: string): Decimal {
  return roundMoney(
    addMoney(
      ...expenses.filter((expense) => expense.vendorId === vendorId).map((expense) => expense.amount),
    ),
  );
}

export function getWorkerTotal(expenses: ExpenseRecord[], workerId: string): Decimal {
  return roundMoney(
    addMoney(
      ...expenses.filter((expense) => expense.workerId === workerId).map((expense) => expense.amount),
    ),
  );
}

export function getFloorTotal(expenses: ExpenseRecord[], floorId: string): Decimal {
  return roundMoney(
    addMoney(
      ...expenses.filter((expense) => expense.floorId === floorId).map((expense) => expense.amount),
    ),
  );
}

export function getStageTotal(expenses: ExpenseRecord[], stageId: string): Decimal {
  return roundMoney(
    addMoney(
      ...expenses
        .filter((expense) => expense.constructionStageId === stageId)
        .map((expense) => expense.amount),
    ),
  );
}

export type NamedTotal = { id: string; name: string; amount: Decimal; expenseType?: ExpenseTypeValue };

export function getNamedCategoryTotals(expenses: ExpenseRecord[]): NamedTotal[] {
  const buckets = new Map<string, NamedTotal>();

  for (const expense of expenses) {
    const info = categoryInfo(expense);
    if (!info) continue;
    const key = `${expense.expenseType}:${info.id}`;
    const existing = buckets.get(key);
    if (existing) {
      existing.amount = existing.amount.plus(toDecimal(expense.amount));
    } else {
      buckets.set(key, {
        id: info.id,
        name: info.name,
        amount: toDecimal(expense.amount),
        expenseType: expense.expenseType,
      });
    }
  }

  return [...buckets.values()]
    .map((row) => ({ ...row, amount: roundMoney(row.amount) }))
    .sort((a, b) => b.amount.comparedTo(a.amount));
}

export function getTopCategories(expenses: ExpenseRecord[], limit = 10): NamedTotal[] {
  return getNamedCategoryTotals(expenses).slice(0, limit);
}

export function getPaymentMethodTotals(expenses: ExpenseRecord[]): NamedTotal[] {
  const buckets = new Map<string, Decimal>();
  for (const expense of expenses) {
    const method = expense.paymentMethod ?? "OTHER";
    buckets.set(method, (buckets.get(method) ?? zero()).plus(toDecimal(expense.amount)));
  }
  return [...buckets.entries()]
    .map(([name, amount]) => ({ id: name, name, amount: roundMoney(amount) }))
    .sort((a, b) => b.amount.comparedTo(a.amount));
}

export function computeLabourAmount(input: {
  method: "DAILY_WAGE" | "FIXED_CONTRACT" | "WORK_BASED";
  numberOfWorkers?: MoneyInput | null;
  numberOfDays?: MoneyInput | null;
  rate?: MoneyInput | null;
  amount?: MoneyInput | null;
}): Decimal {
  if (input.method === "DAILY_WAGE") {
    return roundMoney(
      toDecimal(input.numberOfWorkers).times(toDecimal(input.numberOfDays)).times(toDecimal(input.rate)),
    );
  }
  return roundMoney(input.amount);
}

export function computeMaterialAmount(input: {
  quantity?: MoneyInput | null;
  rate?: MoneyInput | null;
  amount?: MoneyInput | null;
}): Decimal {
  const quantity = input.quantity == null ? null : toDecimal(input.quantity);
  const rate = input.rate == null ? null : toDecimal(input.rate);
  if (quantity && rate && !quantity.isZero() && !rate.isZero()) {
    return roundMoney(quantity.times(rate));
  }
  return roundMoney(input.amount);
}

export type SmartSummaryInput = {
  projectName: string;
  totalBudget: MoneyInput;
  totals: TypeTotals;
  topMaterial?: NamedTotal | null;
  overBudgetCategories?: { name: string; variance: Decimal }[];
  monthComparison?: ReturnType<typeof getMonthComparison> | null;
  currentMonthLabel?: string;
  previousMonthLabel?: string;
};

export function generateSmartSummary(input: SmartSummaryInput): string {
  const spent = input.totals.total;
  const budget = toDecimal(input.totalBudget);
  const used = getBudgetPercentage(budget, spent);
  const remaining = getRemainingBudget(budget, spent);
  const sentences: string[] = [];

  sentences.push(
    `Total construction expenditure is ${formatINRCompact(spent)} against a ${formatINRCompact(budget)} budget.`,
  );

  if (!budget.isZero()) {
    sentences.push(`${used.toString()}% of the budget has been consumed, with ${formatINRCompact(remaining)} remaining.`);
  }

  sentences.push(
    `Material purchases account for ${formatINRCompact(input.totals.MATERIAL)} while labour accounts for ${formatINRCompact(input.totals.LABOUR)}.`,
  );

  const serviceAndOther = addMoney(input.totals.SERVICE, input.totals.EQUIPMENT, input.totals.PROFESSIONAL, input.totals.OTHER);
  if (!serviceAndOther.isZero()) {
    sentences.push(
      `Services, equipment, professional fees and other costs together add ${formatINRCompact(serviceAndOther)}.`,
    );
  }

  if (input.topMaterial && !input.topMaterial.amount.isZero()) {
    sentences.push(`${input.topMaterial.name} is currently the largest material expense at ${formatINR(input.topMaterial.amount)}.`);
  }

  if (input.overBudgetCategories?.length) {
    const first = input.overBudgetCategories[0];
    sentences.push(`${first.name} has exceeded its allocated budget by ${formatINR(first.variance)}.`);
  }

  if (input.monthComparison && input.currentMonthLabel && input.previousMonthLabel) {
    const { difference, changePercent, current, previous } = input.monthComparison;
    if (!current.total.isZero() || !previous.total.isZero()) {
      const direction = difference.isNegative() ? "decreased" : "increased";
      sentences.push(
        `${input.currentMonthLabel} spending ${direction} by ${changePercent.abs().toString()}% compared with ${input.previousMonthLabel}.`,
      );
    }
  }

  return sentences.join(" ");
}

export type PdfKpi = { label: string; value: string };
export type PdfTable = { title: string; headers: string[]; rows: string[][] };

export type PdfReportData = {
  projectName: string;
  reportTitle: string;
  periodLabel: string;
  generatedAt: string;
  filename: string;
  kpis: PdfKpi[];
  typeBreakdown: { label: string; value: string }[];
  tables: PdfTable[];
  totalLabel: string;
  totalValue: string;
};

export function buildPdfFilename(parts: string[], from?: Date, to?: Date): string {
  const slug = parts
    .map((part) =>
      part
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, ""),
    )
    .filter(Boolean)
    .join("-");
  const month = (to ?? from ?? new Date()).toLocaleString("en-IN", { month: "short", year: "numeric" });
  const monthSlug = month.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  return `${slug}-${monthSlug}.pdf`;
}

function emptyTypeTotals(): TypeTotals {
  return {
    MATERIAL: zero(),
    LABOUR: zero(),
    SERVICE: zero(),
    EQUIPMENT: zero(),
    PROFESSIONAL: zero(),
    OTHER: zero(),
    total: zero(),
  };
}

function getMonthlyTypeTotals(expenses: ExpenseRecord[], year: number, month: number): TypeTotals {
  return getTypeTotals(
    expenses.filter((expense) => {
      const date = toDate(expense.date);
      return date.getFullYear() === year && date.getMonth() + 1 === month;
    }),
  );
}

function categoryInfo(expense: ExpenseRecord): { id: string; name: string } | null {
  if (expense.expenseType === "MATERIAL" && expense.materialCategoryId) {
    return { id: expense.materialCategoryId, name: expense.materialCategoryName ?? "Material" };
  }
  if (expense.expenseType === "LABOUR" && expense.labourCategoryId) {
    return { id: expense.labourCategoryId, name: expense.labourCategoryName ?? "Labour" };
  }
  if (expense.expenseType === "SERVICE" && expense.serviceCategoryId) {
    return { id: expense.serviceCategoryId, name: expense.serviceCategoryName ?? "Service" };
  }
  if (expense.expenseType === "EQUIPMENT" && expense.equipmentCategoryId) {
    return { id: expense.equipmentCategoryId, name: expense.equipmentCategoryName ?? "Equipment" };
  }
  if (expense.expenseType === "PROFESSIONAL" && expense.professionalCategoryId) {
    return { id: expense.professionalCategoryId, name: expense.professionalCategoryName ?? "Professional" };
  }
  return { id: expense.expenseType, name: expense.description || expense.expenseType };
}

function toDate(value: Date | string): Date {
  return value instanceof Date ? value : new Date(value);
}

function monthLabel(year: number, month: number): string {
  return new Date(year, month - 1, 1).toLocaleString("en-IN", { month: "short", year: "numeric" });
}

export { formatINR, formatINRCompact };
