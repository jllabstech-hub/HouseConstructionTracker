"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { formatINR } from "@/lib/money";
import { useLanguage } from "@/context/language-context";

export function FinancialHero({
  projectName,
  location,
  currentStageName,
  totalSpent,
  totalBudget,
  remainingBudget,
  usedPercent,
  billsCount,
}: {
  projectName: string;
  location?: string | null;
  currentStageName?: string | null;
  totalSpent: number;
  totalBudget: number;
  remainingBudget: number;
  usedPercent: number;
  billsCount: number;
}) {
  const { language, t, getStageName } = useLanguage();
  const isOverBudget = remainingBudget < 0;
  const clampedPercent = Math.min(100, Math.max(0, usedPercent));

  return (
    <div className="space-y-4">
      {/* Project Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-paper-200/80 pb-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-ink-900 tracking-tight">
              {projectName}
            </h1>
            {location && (
              <span className="rounded-md bg-paper-100 px-2 py-0.5 text-xs font-semibold text-ink-600">
                {location}
              </span>
            )}
          </div>

          <p className="text-xs sm:text-sm text-ink-500 mt-0.5">
            {language === "te" ? "ప్రస్తుత దశ:" : "Current Stage:"}{" "}
            <strong className="text-ink-800 font-semibold">
              {currentStageName ? getStageName(currentStageName) : (language === "te" ? "పునాది & నిర్మాణం" : "Foundation & Structure")}
            </strong>
          </p>
        </div>

        {/* Primary CTA */}
        <div className="shrink-0">
          <Link
            href="/expenses/new"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-clay-600 px-4 py-2.5 text-sm font-bold text-white shadow-xs hover:bg-clay-700 active:scale-98 transition w-full sm:w-auto"
          >
            <Plus className="h-4 w-4 stroke-[2.5]" />
            <span>{t.nav?.addExpense ?? "+ Add Expense"}</span>
          </Link>
        </div>
      </div>

      {/* Financial Summary Card Grid */}
      <div className="grid gap-3 sm:grid-cols-3">
        {/* Total Spent (Hero Visual Anchor) */}
        <div className="rounded-2xl border border-clay-200 bg-clay-50/40 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-clay-800">
              {language === "te" ? "మొత్తం ఖర్చు" : "Total Spent"}
            </span>
            <p className="font-display text-2xl sm:text-3xl font-bold text-ink-900 mt-1">
              {formatINR(totalSpent)}
            </p>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-ink-500 font-medium pt-2 border-t border-clay-100">
            <span>{billsCount} {language === "te" ? "లావాదేవీలు" : "transactions"}</span>
            <span className="font-semibold text-clay-700">{clampedPercent.toFixed(1)}% {language === "te" ? "వాడారు" : "used"}</span>
          </div>
        </div>

        {/* Planned Budget */}
        <div className="rounded-2xl border border-paper-200 bg-white p-5 shadow-xs flex flex-col justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-ink-500">
              {language === "te" ? "మొత్తం బడ్జెట్" : "Total Budget"}
            </span>
            <p className="font-display text-2xl sm:text-3xl font-bold text-ink-900 mt-1">
              {formatINR(totalBudget)}
            </p>
          </div>
          <div className="mt-3 text-xs text-ink-400 font-medium pt-2 border-t border-paper-100">
            {language === "te" ? "ప్రణాళికాబద్ధ అంచనా" : "Planned budget limit"}
          </div>
        </div>

        {/* Remaining Budget */}
        <div className="rounded-2xl border border-paper-200 bg-white p-5 shadow-xs flex flex-col justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-ink-500">
              {language === "te" ? "మిగిలిన బడ్జెట్" : "Budget Remaining"}
            </span>
            <p
              className={`font-display text-2xl sm:text-3xl font-bold mt-1 ${
                isOverBudget ? "text-red-600" : "text-emerald-700"
              }`}
            >
              {formatINR(remainingBudget)}
            </p>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs pt-2 border-t border-paper-100">
            <span className={isOverBudget ? "font-semibold text-red-600" : "text-ink-400"}>
              {isOverBudget
                ? (language === "te" ? "బడ్జెట్ దాటింది" : "Over budget")
                : (language === "te" ? "పరిధిలో ఉంది" : "Available cash")}
            </span>
            <span className="font-semibold text-ink-600">
              {(100 - clampedPercent).toFixed(1)}% {language === "te" ? "మిగిలింది" : "left"}
            </span>
          </div>
        </div>
      </div>

      {/* Clean Budget Consumed Progress Bar */}
      <div className="rounded-xl border border-paper-200 bg-white p-3 shadow-xs">
        <div className="flex items-center justify-between text-xs font-medium text-ink-600 mb-1.5">
          <span>{language === "te" ? "బడ్జెట్ వినియోగం" : "Budget Consumed"}</span>
          <span className="font-bold text-ink-900">{clampedPercent.toFixed(1)}%</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-paper-100">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              isOverBudget ? "bg-red-500" : clampedPercent > 85 ? "bg-amber-500" : "bg-clay-600"
            }`}
            style={{ width: `${clampedPercent}%` }}
          />
        </div>
      </div>
    </div>
  );
}
