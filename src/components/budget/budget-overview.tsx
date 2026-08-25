"use client";

import { Wallet } from "lucide-react";
import { formatINR } from "@/lib/money";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/context/language-context";

type TypeRow = {
  type: "MATERIAL" | "LABOUR" | "SERVICE" | "EQUIPMENT" | "PROFESSIONAL" | "OTHER";
  budget: number | string | { toString(): string };
  actual: number | string | { toString(): string };
  remaining: number | string | { toString(): string };
  variance: number | string | { toString(): string };
  isOver: boolean;
};

export function BudgetOverview({
  totalBudget,
  actualSpent,
  remainingCash,
  usedPercent,
  isOverallOver,
  typeRows,
}: {
  totalBudget: number | string | { toString(): string };
  actualSpent: number | string | { toString(): string };
  remainingCash: number | string | { toString(): string };
  usedPercent: string;
  isOverallOver: boolean;
  typeRows: TypeRow[];
}) {
  const { language, t } = useLanguage();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-3xl bg-white p-6 sm:p-7 border border-paper-200 shadow-xs space-y-2">
        <div className="flex items-center gap-2 text-clay-700">
          <Wallet className="h-6 w-6" />
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-ink-900">
            {t.budget.title}
          </h1>
        </div>
        <p className="text-xs sm:text-sm text-ink-500 max-w-2xl font-medium">
          {t.budget.subtitle}
        </p>
      </div>

      {/* 4 Summary Cards */}
      <div className="grid gap-3 sm:grid-cols-4">
        <div className="rounded-2xl border border-paper-200 bg-white p-4 shadow-xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-ink-400">{t.budget.totalPlannedBudget}</p>
          <p className="font-display text-2xl font-bold text-ink-900 mt-1">{formatINR(totalBudget)}</p>
        </div>
        <div className="rounded-2xl border border-paper-200 bg-clay-50/50 p-4 shadow-xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-clay-800">{t.budget.actualSpent}</p>
          <p className="font-display text-2xl font-bold text-clay-700 mt-1">{formatINR(actualSpent)}</p>
        </div>
        <div className="rounded-2xl border border-paper-200 bg-white p-4 shadow-xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-ink-400">{t.budget.cashRemaining}</p>
          <p className={cn("font-display text-2xl font-bold mt-1", isOverallOver ? "text-red-600" : "text-emerald-700")}>
            {formatINR(remainingCash)}
          </p>
        </div>
        <div className="rounded-2xl border border-paper-200 bg-white p-4 shadow-xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-ink-400">{t.budget.budgetConsumed}</p>
          <p className="font-display text-2xl font-bold text-ink-900 mt-1">{usedPercent}%</p>
        </div>
      </div>

      {/* Expense-type budgets */}
      <div className="rounded-3xl border border-paper-200 bg-white p-5 sm:p-6 shadow-xs space-y-4">
        <div>
          <h2 className="font-display text-lg font-bold text-ink-900">{t.budget.plannedVsActual}</h2>
          <p className="text-xs text-ink-500">
            {language === "te" ? "ప్రధాన వర్గాల వారీగా ప్లాన్ చేసిన బడ్జెట్ మరియు వాస్తవ ఖర్చుల పోలిక" : "Planned vs actual comparison by broad category"}
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-paper-100 text-[11px] font-bold uppercase tracking-wider text-ink-500 border-b border-paper-200">
              <tr>
                <th className="px-4 py-3">{t.budget.expenseType}</th>
                <th className="px-4 py-3">{t.budget.plannedBudget}</th>
                <th className="px-4 py-3">{t.budget.actualSpent}</th>
                <th className="px-4 py-3">{t.budget.remaining}</th>
                <th className="px-4 py-3">{t.budget.difference}</th>
                <th className="px-4 py-3 text-right">{t.budget.status}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-paper-100">
              {typeRows.map((row) => {
                const icon = row.type === "MATERIAL" ? "🧱" : row.type === "LABOUR" ? "👷" : "🚜";
                const typeLabel =
                  row.type === "MATERIAL"
                    ? (language === "te" ? "సామాగ్రి (Material)" : "MATERIAL")
                    : row.type === "LABOUR"
                    ? (language === "te" ? "కూలీలు (Labour)" : "LABOUR")
                    : row.type === "SERVICE"
                    ? (language === "te" ? "సర్వీసులు (Service)" : "SERVICE")
                    : row.type === "EQUIPMENT"
                    ? (language === "te" ? "మిషన్లు (Equipment)" : "EQUIPMENT")
                    : row.type === "PROFESSIONAL"
                    ? (language === "te" ? "ఫీజులు (Professional)" : "PROFESSIONAL")
                    : (language === "te" ? "ఇతరాలు (Other)" : "OTHER");

                return (
                  <tr key={row.type} className="hover:bg-paper-50 transition">
                    <td className="px-4 py-3 font-bold text-ink-900 text-xs">
                      <span className="mr-1.5">{icon}</span>
                      {typeLabel}
                    </td>
                    <td className="px-4 py-3 text-xs text-ink-700">{formatINR(row.budget)}</td>
                    <td className="px-4 py-3 text-xs font-semibold text-ink-900">{formatINR(row.actual)}</td>
                    <td className="px-4 py-3 text-xs text-ink-700">{formatINR(row.remaining)}</td>
                    <td className="px-4 py-3 text-xs text-ink-700">{formatINR(row.variance)}</td>
                    <td className="px-4 py-3 text-right text-xs">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 font-bold text-[11px]",
                          row.isOver
                            ? "bg-red-50 text-red-700 border border-red-200"
                            : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        )}
                      >
                        {row.isOver ? `⚠️ ${t.budget.overBudget}` : `✓ ${t.budget.withinBudget}`}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
