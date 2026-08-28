import { Decimal } from "decimal.js";
import { describe, expect, it } from "vitest";
import {
  computeLabourAmount,
  computeMaterialAmount,
  generateSmartSummary,
  getBudgetPercentage,
  getBudgetVariance,
  getCategoryTotal,
  getLabourTotal,
  getMaterialTotal,
  getMonthlyTotal,
  getProjectTotal,
  getRemainingBudget,
  getTypeTotals,
  getWorkWiseCost,
  type ExpenseRecord,
} from "@/lib/finance/aggregations";
import { formatINR, formatINRCompact, formatPdfINR } from "@/lib/money";
import { buildReportData } from "@/lib/finance/report-data";

const expenses: ExpenseRecord[] = [
  {
    date: "2026-07-10",
    expenseType: "MATERIAL",
    amount: 280000,
    materialCategoryId: "cement",
    materialCategoryName: "Cement",
  },
  {
    date: "2026-07-12",
    expenseType: "LABOUR",
    amount: 120000,
    labourCategoryId: "masonry",
    labourCategoryName: "Cement Work",
  },
  {
    date: "2026-08-04",
    expenseType: "MATERIAL",
    amount: 195000,
    materialCategoryId: "tiles",
    materialCategoryName: "Floor Tiles",
  },
  {
    date: "2026-08-06",
    expenseType: "LABOUR",
    amount: 55000,
    labourCategoryId: "tile-lab",
    labourCategoryName: "Floor Tile Laying",
  },
  {
    date: "2026-08-08",
    expenseType: "SERVICE",
    amount: 18000,
    serviceCategoryId: "jcb",
    serviceCategoryName: "JCB",
  },
];

describe("money formatting", () => {
  it("uses Indian grouping", () => {
    expect(formatINR(420)).toBe("₹420");
    expect(formatINR(21000)).toBe("₹21,000");
    expect(formatINR(125000)).toBe("₹1,25,000");
    expect(formatINR(1842650)).toBe("₹18,42,650");
  });

  it("compacts lakh values", () => {
    expect(formatINRCompact(1620000)).toBe("₹16.2L");
  });
});

describe("financial aggregations", () => {
  it("keeps material and labour totals separate", () => {
    expect(getMaterialTotal(expenses).toNumber()).toBe(475000);
    expect(getLabourTotal(expenses).toNumber()).toBe(175000);
    expect(getProjectTotal(expenses).toNumber()).toBe(668000);
    const totals = getTypeTotals(expenses);
    expect(totals.MATERIAL.plus(totals.LABOUR).plus(totals.SERVICE).toNumber()).toBe(totals.total.toNumber());
  });

  it("aggregates a single category without mixing types", () => {
    expect(getCategoryTotal(expenses, "cement", "MATERIAL").toNumber()).toBe(280000);
    expect(getCategoryTotal(expenses, "masonry", "LABOUR").toNumber()).toBe(120000);
  });

  it("aggregates monthly totals", () => {
    expect(getMonthlyTotal(expenses, 2026, 7).toNumber()).toBe(400000);
    expect(getMonthlyTotal(expenses, 2026, 8).toNumber()).toBe(268000);
  });

  it("computes budget variance and remaining", () => {
    const result = getBudgetVariance(150000, 210000);
    expect(result.variance.toNumber()).toBe(60000);
    expect(result.isOver).toBe(true);
    expect(getRemainingBudget(3500000, 1842650).toNumber()).toBe(1657350);
    expect(getBudgetPercentage(3500000, 1842650).toString()).toBe("52.6");
  });

  it("builds work-wise material vs labour totals", () => {
    const rows = getWorkWiseCost(expenses, [
      {
        id: "masonry",
        name: "Cement / Masonry",
        materialCategoryIds: ["cement"],
        labourCategoryIds: ["masonry"],
      },
      {
        id: "tiles",
        name: "Tiles",
        materialCategoryIds: ["tiles"],
        labourCategoryIds: ["tile-lab"],
      },
    ]);

    expect(rows[0]).toMatchObject({
      name: "Cement / Masonry",
    });
    expect(rows[0].material.toNumber()).toBe(280000);
    expect(rows[0].labour.toNumber()).toBe(120000);
    expect(rows[0].total.toNumber()).toBe(400000);
    expect(rows[1].total.toNumber()).toBe(250000);
  });

  it("computes labour and material amounts without floats", () => {
    expect(
      computeLabourAmount({
        method: "DAILY_WAGE",
        numberOfWorkers: 5,
        numberOfDays: 4,
        rate: 900,
      }).toNumber(),
    ).toBe(18000);
    expect(computeMaterialAmount({ quantity: 50, rate: 420 }).toNumber()).toBe(21000);
    expect(computeLabourAmount({ method: "FIXED_CONTRACT", amount: 75000 }).toNumber()).toBe(75000);
    expect(computeMaterialAmount({ quantity: 50, rate: 420 }).toDecimalPlaces(2)).toBeInstanceOf(Decimal);
  });
});

describe("smart summary and PDF data", () => {
  it("generates a summary from calculated values", () => {
    const summary = generateSmartSummary({
      projectName: "My House",
      totalBudget: 3500000,
      totals: getTypeTotals(expenses),
      topMaterial: { id: "cement", name: "Cement", amount: new Decimal(280000) },
      overBudgetCategories: [{ name: "Tile work", variance: new Decimal(60000) }],
    });

    expect(summary).toContain("₹6.68L");
    expect(summary).toContain("₹35L");
    expect(summary).toContain("Cement");
    expect(summary).toContain("₹60,000");
    expect(summary).not.toContain("18.42 lakh");
  });

  it("builds PDF report payloads from aggregated data", () => {
    const data = buildReportData({
      kind: "work-wise",
      projectName: "My House",
      totalBudget: 3500000,
      expenses,
      workAreas: [
        {
          id: "masonry",
          name: "Cement / Masonry",
          materialCategoryIds: ["cement"],
          labourCategoryIds: ["masonry"],
        },
      ],
    });

    expect(data.reportTitle).toContain("Work-wise");
    expect(data.tables[0].rows[0][0]).toBe("Cement / Masonry");
    expect(data.totalValue).toBe(formatPdfINR(668000));
    expect(data.filename).toMatch(/house-work-wise-expenses/);
    expect(data.filename).toMatch(/\.pdf$/);
  });
});
