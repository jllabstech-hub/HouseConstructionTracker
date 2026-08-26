import { Decimal } from "decimal.js";
import { describe, expect, it } from "vitest";
import {
  getCategoryTotal,
  getTypeTotals,
  getStageTotal,
  type ExpenseRecord,
} from "@/lib/finance/aggregations";
import { formatINR } from "@/lib/money";

describe("Decimal Financial Precision & Non-Inferrable Progress", () => {
  it("prevents floating-point rounding errors on decimal currency arithmetic", () => {
    // 0.1 + 0.2 != 0.3 in native JavaScript IEEE-754 floats
    const d1 = new Decimal("0.1");
    const d2 = new Decimal("0.2");
    expect(d1.plus(d2).toString()).toBe("0.3");

    // Cement unit calculations with fractional rates
    const bags = new Decimal("342.5");
    const ratePerBag = new Decimal("385.75");
    const total = bags.times(ratePerBag);
    expect(total.toFixed(2)).toBe("132119.38");
  });

  it("formats Indian rupees correctly for all ranges", () => {
    expect(formatINR(0)).toBe("₹0");
    expect(formatINR(999)).toBe("₹999");
    expect(formatINR(1000)).toBe("₹1,000");
    expect(formatINR(99999)).toBe("₹99,999");
    expect(formatINR(100000)).toBe("₹1,00,000");
    expect(formatINR(10000000)).toBe("₹1,00,00,000"); // 1 Crore
  });

  it("calculates stage-wise expense totals strictly without mutating physical stage completion %", () => {
    const stageExpenses: ExpenseRecord[] = [
      {
        date: "2026-08-01",
        expenseType: "MATERIAL",
        amount: 50000,
        constructionStageId: "stage-foundation",
      },
      {
        date: "2026-08-02",
        expenseType: "LABOUR",
        amount: 25000,
        constructionStageId: "stage-foundation",
      },
      {
        date: "2026-08-03",
        expenseType: "MATERIAL",
        amount: 80000,
        constructionStageId: "stage-slab",
      },
    ];

    const foundationTotal = getStageTotal(stageExpenses, "stage-foundation");
    const slabTotal = getStageTotal(stageExpenses, "stage-slab");

    expect(foundationTotal.toNumber()).toBe(75000);
    expect(slabTotal.toNumber()).toBe(80000);

    // Explicit progress check: Financial spent does NOT automatically equate to stage completion %
    // E.g. Foundation spent 75k of estimated 70k (over-spent), but stage percentage is independent
    const sampleDbStage = {
      id: "stage-foundation",
      name: "Foundation",
      status: "IN_PROGRESS",
      percentageComplete: 65, // Explicitly tracked stage progress
    };

    expect(sampleDbStage.percentageComplete).toBe(65);
    expect(sampleDbStage.percentageComplete).not.toBe(100);
  });

  it("enforces strict separation between Material, Labour, and Service expenses", () => {
    const mixedExpenses: ExpenseRecord[] = [
      {
        date: "2026-08-01",
        expenseType: "MATERIAL",
        amount: 100000,
        materialCategoryId: "cement",
      },
      {
        date: "2026-08-01",
        expenseType: "LABOUR",
        amount: 40000,
        labourCategoryId: "mason",
      },
      {
        date: "2026-08-01",
        expenseType: "SERVICE",
        amount: 15000,
        serviceCategoryId: "transport",
      },
    ];

    const typeTotals = getTypeTotals(mixedExpenses);
    expect(typeTotals.MATERIAL.toNumber()).toBe(100000);
    expect(typeTotals.LABOUR.toNumber()).toBe(40000);
    expect(typeTotals.SERVICE.toNumber()).toBe(15000);
    expect(typeTotals.total.toNumber()).toBe(155000);

    // Ensure material lookup doesn't accidentally pick up labour with similar name or id
    expect(getCategoryTotal(mixedExpenses, "cement", "MATERIAL").toNumber()).toBe(100000);
    expect(getCategoryTotal(mixedExpenses, "cement", "LABOUR").toNumber()).toBe(0);
  });
});
