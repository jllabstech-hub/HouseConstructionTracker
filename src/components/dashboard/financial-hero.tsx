"use client";

import { Wallet, PiggyBank, Landmark } from "lucide-react";
import { AnimatedNumber } from "@/components/ui/animated-number";

export function FinancialHero({
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
  const isOverBudget = remainingBudget < 0;
  const clampedPercent = Math.min(100, Math.max(0, usedPercent));

  return (
    <div className="space-y-4">
      {/* Current stage pill */}
      {currentStageName && (
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-clay-50 border border-clay-200/60 px-3 py-1 text-xs font-semibold text-clay-800">
            🏗️ {currentStageName}
          </span>
        </div>
      )}

      {/* Key Financial Cards: Total Spent | Budget | Remaining */}
      <div className="grid gap-3.5 sm:grid-cols-3">
        {/* How much have I spent? */}
        <div className="rounded-2xl border border-clay-200 bg-clay-50/40 p-5 sm:p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-clay-800">
                Total Spent
              </span>
              <Wallet className="h-4 w-4 text-clay-600" />
            </div>
            <p className="font-display text-2xl sm:text-3xl font-bold text-ink-900 mt-2">
              <AnimatedNumber value={totalSpent} />
            </p>
          </div>
          <div className="mt-4 flex items-center justify-between text-xs text-ink-500 font-medium pt-2.5 border-t border-clay-100">
            <span>
              {billsCount} transactions
            </span>
            <span className="font-semibold text-clay-700">
              {clampedPercent.toFixed(1)}% used
            </span>
          </div>
        </div>

        {/* Planned Budget */}
        <div className="rounded-2xl border border-paper-200 bg-white p-5 sm:p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-ink-500">
                Total Budget
              </span>
              <PiggyBank className="h-4 w-4 text-ink-400" />
            </div>
            <p className="font-display text-2xl sm:text-3xl font-bold text-ink-900 mt-2">
              <AnimatedNumber value={totalBudget} />
            </p>
          </div>
          <div className="mt-4 text-xs text-ink-400 font-medium pt-2.5 border-t border-paper-100">
            Planned budget target
          </div>
        </div>

        {/* How much budget remains? */}
        <div className="rounded-2xl border border-paper-200 bg-white p-5 sm:p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-ink-500">
                Budget Remaining
              </span>
              <Landmark className={`h-4 w-4 ${isOverBudget ? "text-red-500" : "text-emerald-600"}`} />
            </div>
            <p
              className={`font-display text-2xl sm:text-3xl font-bold mt-2 ${
                isOverBudget ? "text-red-600" : "text-emerald-700"
              }`}
            >
              <AnimatedNumber value={remainingBudget} />
            </p>
          </div>
          <div className="mt-4 flex items-center justify-between text-xs pt-2.5 border-t border-paper-100">
            <span className={isOverBudget ? "font-semibold text-red-600" : "text-ink-500"}>
              {isOverBudget ? "Over budget" : "Available cash"}
            </span>
            <span className="font-semibold text-ink-700">
              {(100 - clampedPercent).toFixed(1)}% left
            </span>
          </div>
        </div>
      </div>

      {/* Budget Pacing Progress Bar */}
      <div className="rounded-xl border border-paper-200 bg-white p-3.5 shadow-xs">
        <div className="flex items-center justify-between text-xs font-medium text-ink-600 mb-1.5">
          <span>Budget Consumed</span>
          <span className="font-bold text-ink-900">{clampedPercent.toFixed(1)}%</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-paper-100">
          <div
            className={`h-full rounded-full transition-all duration-700 ${
              isOverBudget ? "bg-red-500" : clampedPercent > 85 ? "bg-amber-500" : "bg-clay-600"
            }`}
            style={{ width: `${clampedPercent}%` }}
          />
        </div>
      </div>
    </div>
  );
}
