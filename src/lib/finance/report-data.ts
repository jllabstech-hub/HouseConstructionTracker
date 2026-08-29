import { format } from "date-fns";
import {
  buildPdfFilename,
  getMonthlySeries,
  getNamedCategoryTotals,
  getPaymentMethodTotals,
  getTopCategories,
  getTypeTotals,
  getWorkWiseCost,
  type ExpenseRecord,
  type PdfReportData,
  type WorkAreaDefinition,
} from "@/lib/finance/aggregations";
import { formatPdfINR, formatPdfINRCompact, toDecimal, variance as getBudgetVariance } from "@/lib/money";

export type ReportKind =
  | "total"
  | "material"
  | "labour"
  | "category"
  | "work-wise"
  | "monthly"
  | "budget"
  | "stage"
  | "vendor"
  | "worker"
  | "payment"
  | "floor";

const TITLES: Record<ReportKind, string> = {
  total: "House Construction Expenditure Report",
  material: "Material Expenditure Report",
  labour: "Labour Expenditure Report",
  category: "Category-wise Expenditure Report",
  "work-wise": "Work-wise Construction Cost",
  monthly: "Monthly Expenditure Report",
  budget: "Budget vs Actual Report",
  stage: "Construction Stage Expenditure Report",
  vendor: "Vendor Purchase Report",
  worker: "Worker / Contractor Payment Report",
  payment: "Payment Method Report",
  floor: "Floor-wise Expenditure Report",
};

export function periodLabel(from?: Date, to?: Date) {
  if (from && to) return `${format(from, "dd-MMM-yyyy")} – ${format(to, "dd-MMM-yyyy")}`;
  if (from) return `From ${format(from, "dd-MMM-yyyy")}`;
  if (to) return `Until ${format(to, "dd-MMM-yyyy")}`;
  return "All dates";
}

export function buildReportData(input: {
  kind: ReportKind;
  projectName: string;
  totalBudget: string | number | { toString(): string };
  expenses: ExpenseRecord[];
  workAreas?: WorkAreaDefinition[];
  from?: Date;
  to?: Date;
  categoryId?: string;
  categoryName?: string;
  vendorId?: string;
  vendorName?: string;
  workerId?: string;
  workerName?: string;
  stageId?: string;
  stageName?: string;
  budgets?: { expenseType: string; amount: { toString(): string } }[];
  categoryBudgets?: { name: string; budget: { toString(): string }; actual: { toString(): string } }[];
  stages?: { name: string; status: string; percentageComplete: number; amount: { toString(): string } }[];
}): PdfReportData {
  const scoped = scopeExpenses(input.kind, input.expenses, input);
  const totals = getTypeTotals(scoped);
  const generatedAt = format(new Date(), "dd-MMM-yyyy HH:mm");
  const remaining = getBudgetVariance(input.totalBudget, totals.total);

  let dynamicTitle = TITLES[input.kind];
  if (input.categoryName) {
    dynamicTitle = `${input.categoryName} Material Purchases & Usage Statement`;
  } else if (input.vendorName) {
    dynamicTitle = `${input.vendorName} - Vendor Purchase Ledger`;
  } else if (input.workerName) {
    dynamicTitle = `${input.workerName} - Wages & Payment Statement`;
  } else if (input.stageName) {
    dynamicTitle = `${input.stageName} Construction Cost Report`;
  }

  const kpis = [
    { label: "Total Budget", value: formatPdfINR(input.totalBudget) },
    { label: "Report Total Spent", value: formatPdfINR(totals.total) },
    { label: "Remaining", value: formatPdfINR(remaining.remaining) },
    { label: "Budget Used", value: `${remaining.usedPercent.toString()}%` },
  ];

  if (input.kind === "material" && !input.categoryName) {
    kpis.splice(1, 2, { label: "Material Spent", value: formatPdfINR(totals.MATERIAL) });
  }
  if (input.kind === "labour" && !input.workerName) {
    kpis.splice(1, 2, { label: "Labour Spent", value: formatPdfINR(totals.LABOUR) });
  }

  const tables = buildTables(input.kind, scoped, input);
  const nameSlug = input.categoryName ?? input.vendorName ?? input.workerName ?? input.stageName ?? "";
  const filename = buildPdfFilename(
    ["house", input.kind === "total" ? "total-expenses" : `${input.kind}-expenses`, nameSlug],
    input.from,
    input.to,
  );

  return {
    projectName: input.projectName,
    reportTitle: dynamicTitle,
    periodLabel: periodLabel(input.from, input.to),
    generatedAt,
    filename,
    kpis,
    typeBreakdown: [
      { label: "Material", value: formatPdfINR(totals.MATERIAL) },
      { label: "Labour", value: formatPdfINR(totals.LABOUR) },
      { label: "Services", value: formatPdfINR(totals.SERVICE) },
      { label: "Equipment", value: formatPdfINR(totals.EQUIPMENT) },
      { label: "Professional", value: formatPdfINR(totals.PROFESSIONAL) },
      { label: "Other", value: formatPdfINR(totals.OTHER) },
    ],
    tables,
    totalLabel: "Grand Total",
    totalValue: formatPdfINR(totals.total),
  };
}

function scopeExpenses(
  kind: ReportKind,
  expenses: ExpenseRecord[],
  input?: {
    categoryId?: string;
    vendorId?: string;
    workerId?: string;
    stageId?: string;
  }
) {
  let list = expenses;
  if (input?.categoryId) {
    list = list.filter(
      (row) =>
        row.materialCategoryId === input.categoryId ||
        row.labourCategoryId === input.categoryId ||
        row.serviceCategoryId === input.categoryId ||
        row.equipmentCategoryId === input.categoryId ||
        row.professionalCategoryId === input.categoryId
    );
  }
  if (input?.vendorId) {
    list = list.filter((row) => row.vendorId === input.vendorId);
  }
  if (input?.workerId) {
    list = list.filter((row) => row.workerId === input.workerId);
  }
  if (input?.stageId) {
    list = list.filter((row) => row.stageId === input.stageId || row.constructionStageId === input.stageId);
  }

  if (kind === "material") return list.filter((row) => row.expenseType === "MATERIAL");
  if (kind === "labour") return list.filter((row) => row.expenseType === "LABOUR");
  if (kind === "vendor") return list.filter((row) => row.vendorId);
  if (kind === "worker") return list.filter((row) => row.workerId);
  return list;
}

function buildTables(
  kind: ReportKind,
  expenses: ExpenseRecord[],
  input: Parameters<typeof buildReportData>[0],
) {
  const tables = [];

  if (kind === "work-wise" && input.workAreas) {
    const rows = getWorkWiseCost(expenses, input.workAreas);
    tables.push({
      title: "Work-wise material vs labour",
      headers: ["Work", "Material", "Labour", "Total"],
      rows: rows.map((row) => [
        row.name,
        formatPdfINRCompact(row.material),
        formatPdfINRCompact(row.labour),
        formatPdfINRCompact(row.total),
      ]),
    });
  }

  if (kind === "monthly") {
    tables.push({
      title: "Monthly expenditure",
      headers: ["Month", "Material", "Labour", "Other", "Total"],
      rows: getMonthlySeries(expenses).map((row) => [
        row.label,
        formatPdfINR(row.totals.MATERIAL),
        formatPdfINR(row.totals.LABOUR),
        formatPdfINR(row.totals.SERVICE.plus(row.totals.EQUIPMENT).plus(row.totals.PROFESSIONAL).plus(row.totals.OTHER)),
        formatPdfINR(row.totals.total),
      ]),
    });
  }

  if (kind === "category") {
    tables.push({
      title: "Category summary",
      headers: ["Category", "Type", "Amount"],
      rows: getNamedCategoryTotals(expenses).map((row) => [
        row.name,
        row.expenseType ?? "",
        formatPdfINR(row.amount),
      ]),
    });
  }

  if (kind === "budget" && input.categoryBudgets) {
    tables.push({
      title: "Budget vs actual",
      headers: ["Category", "Budget", "Actual", "Variance", "Status"],
      rows: input.categoryBudgets.map((row) => {
        const result = getBudgetVariance(row.budget, row.actual);
        return [
          row.name,
          formatPdfINR(row.budget),
          formatPdfINR(row.actual),
          formatPdfINR(result.variance),
          result.isOver ? "OVER BUDGET" : "WITHIN BUDGET",
        ];
      }),
    });
  }

  if (kind === "stage" && input.stages) {
    tables.push({
      title: "Stage expenditure",
      headers: ["Stage", "Status", "% Complete", "Amount"],
      rows: input.stages.map((row) => [
        row.name,
        row.status,
        `${row.percentageComplete}%`,
        formatPdfINR(row.amount),
      ]),
    });
  }

  if (kind === "vendor" && !input.vendorId) {
    const vendors = new Map<string, { name: string; amount: ReturnType<typeof toDecimal>; count: number }>();
    for (const expense of expenses) {
      if (!expense.vendorId) continue;
      const current = vendors.get(expense.vendorId) ?? {
        name: expense.vendorName ?? "Vendor",
        amount: toDecimal(0),
        count: 0,
      };
      current.amount = current.amount.plus(toDecimal(expense.amount));
      current.count += 1;
      vendors.set(expense.vendorId, current);
    }
    tables.push({
      title: "Vendor purchases",
      headers: ["Vendor", "Transactions", "Amount"],
      rows: [...vendors.values()]
        .sort((a, b) => b.amount.comparedTo(a.amount))
        .map((row) => [row.name, String(row.count), formatPdfINR(row.amount)]),
    });
  }

  if (kind === "worker" && !input.workerId) {
    const workers = new Map<string, { name: string; amount: ReturnType<typeof toDecimal> }>();
    for (const expense of expenses) {
      if (!expense.workerId) continue;
      const current = workers.get(expense.workerId) ?? {
        name: expense.workerName ?? "Worker",
        amount: toDecimal(0),
      };
      current.amount = current.amount.plus(toDecimal(expense.amount));
      workers.set(expense.workerId, current);
    }
    tables.push({
      title: "Worker / contractor payments",
      headers: ["Worker", "Amount"],
      rows: [...workers.values()]
        .sort((a, b) => b.amount.comparedTo(a.amount))
        .map((row) => [row.name, formatPdfINR(row.amount)]),
    });
  }

  if (kind === "payment") {
    tables.push({
      title: "Payment methods",
      headers: ["Method", "Amount"],
      rows: getPaymentMethodTotals(expenses).map((row) => [row.name.replaceAll("_", " "), formatPdfINR(row.amount)]),
    });
  }

  if (kind === "floor") {
    const floors = new Map<string, ReturnType<typeof toDecimal>>();
    for (const expense of expenses) {
      const name = expense.floorName ?? "Unassigned";
      floors.set(name, (floors.get(name) ?? toDecimal(0)).plus(toDecimal(expense.amount)));
    }
    tables.push({
      title: "Floor-wise expenditure",
      headers: ["Floor", "Amount"],
      rows: [...floors.entries()].map(([name, amount]) => [name, formatPdfINR(amount)]),
    });
  }

  if ((kind === "total" || kind === "material" || kind === "labour") && !input.categoryName && !input.vendorName && !input.workerName) {
    tables.push({
      title: "Top expenses",
      headers: ["Category", "Type", "Amount"],
      rows: getTopCategories(expenses, 10).map((row) => [row.name, row.expenseType ?? "", formatPdfINR(row.amount)]),
    });
  }

  // Detailed Transaction Table with Contextual Columns
  let detailedHeaders = ["Date", "Type", "Category", "Description", "Amount"];
  if (input.categoryName) {
    detailedHeaders = ["Date", "Description", "Qty & Rate", "Vendor / Source", "Amount"];
  } else if (input.workerName) {
    detailedHeaders = ["Date", "Stage / Work", "Description", "Payment Mode", "Amount"];
  } else if (input.vendorName) {
    detailedHeaders = ["Date", "Category", "Description", "Qty & Rate", "Amount"];
  } else if (kind === "labour") {
    detailedHeaders = ["Date", "Category", "Work Description", "Worker / Mistri", "Amount"];
  } else if (kind === "material") {
    detailedHeaders = ["Date", "Material Category", "Description", "Vendor / Store", "Amount"];
  }

  tables.push({
    title: "Detailed transactions",
    headers: detailedHeaders,
    rows: expenses.slice(0, 200).map((row) => {
      const category =
        row.materialCategoryName ??
        row.labourCategoryName ??
        row.serviceCategoryName ??
        row.equipmentCategoryName ??
        row.professionalCategoryName ??
        row.expenseType;
      const date = format(row.date instanceof Date ? row.date : new Date(row.date), "dd-MMM-yyyy");
      const qtyRate = [
        row.quantity ? `${row.quantity} ${row.unit || ""}`.trim() : "",
        row.rate ? `@ ₹${row.rate}` : "",
      ].filter(Boolean).join(" ");

      if (input.categoryName) {
        return [date, row.description || category, qtyRate || "—", row.vendorName || "—", formatPdfINR(row.amount)];
      }
      if (input.workerName) {
        return [date, row.stageName || "General", row.description || "Labour Wages", row.paymentMethod || "CASH", formatPdfINR(row.amount)];
      }
      if (input.vendorName) {
        return [date, category, row.description || "Material Purchase", qtyRate || "—", formatPdfINR(row.amount)];
      }
      if (kind === "labour") {
        return [date, category, row.description ?? "", row.workerName ?? "—", formatPdfINR(row.amount)];
      }
      if (kind === "material") {
        return [date, category, row.description ?? "", row.vendorName ?? "—", formatPdfINR(row.amount)];
      }
      return [date, row.expenseType, category, row.description ?? "", formatPdfINR(row.amount)];
    }),
  });

  return tables;
}
