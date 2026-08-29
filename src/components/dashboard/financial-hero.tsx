"use client";

import Link from "next/link";
import { Building2, Wallet, PiggyBank, Landmark } from "lucide-react";
import { AnimatedNumber } from "@/components/ui/animated-number";

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
  const isOverBudget = remainingBudget < 0;
  const clampedPercent = Math.min(100, Math.max(0, usedPercent));

  return (
    <div className="space-y-5">
      {/* 1. Project Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-paper-200/80 pb-4">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <Link
              href="/projects"
              className="font-display text-2xl sm:text-3xl font-bold text-ink-900 tracking-tight hover:text-clay-800 transition"
              title="View all projects"
            >
              {projectName}
            </Link>
            {location && (
              <span className="rounded-md bg-paper-100 px-2.5 py-0.5 text-xs font-semibold text-ink-600">
                {location}
              </span>
            )}
            <span className="rounded-md bg-clay-50 border border-clay-200/60 px-2.5 py-0.5 text-xs font-semibold text-clay-800">
              {currentStageName || "Foundation & Structure"}
            </span>
          </div>
          <p className="text-xs text-ink-500 mt-1">
            Live home construction financial dashboard
          </p>
        </div>

        {/* Secondary Action (+ New House) */}
        <div className="flex items-center gap-2.5 flex-wrap shrink-0">
          <Link
            href="/projects/new"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-paper-300 bg-white hover:bg-paper-50 px-4 py-2.5 text-sm font-bold text-ink-800 shadow-2xs transition active:scale-95 whitespace-nowrap min-h-[42px]"
            title="Create a new house project"
          >
            <Building2 className="h-4 w-4 text-clay-600 shrink-0" />
            <span className="whitespace-nowrap">New House</span>
          </Link>
        </div>
      </div>

      {/* 2. Key Financial Questions: Total Spent | Budget | Remaining */}
      <div className="grid gap-3.5 sm:grid-cols-3">
        {/* Question 1: How much have I spent? */}
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

        {/* Question 2: How much budget remains? */}
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
